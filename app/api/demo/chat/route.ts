import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getRedisClient } from '@/lib/redis';
import OpenAI from 'openai';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getDemoSession, saveDemoSession } from '@/lib/demo-session-store';

const chatSchema = z.object({
  session_id: z.string(),
  message: z.string().min(1).max(500)
});

// Lazy initialization - only create OpenAI client when needed (avoids build-time env var requirement)
function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || ''
  });
}

// Message rate limiting: 1 per 2 seconds
async function checkMessageRateLimit(sessionId: string) {
  if (!process.env.REDIS_URL) {
    return;
  }

  const redis = await getRedisClient();
  const key = `demo:${sessionId}:msg_ratelimit`;

  const exists = await redis.exists(key);
  if (exists) {
    throw new Error('Please wait 2 seconds between messages');
  }

  await redis.setex(key, 2, '1');
}

export async function POST(req: NextRequest) {
  try {
    console.log('[DemoChat] Starting chat request');

    // Parse and validate request
    const body = await req.json();
    console.log('[DemoChat] Request body parsed:', { session_id: body.session_id, messageLength: body.message?.length });

    const { session_id, message } = chatSchema.parse(body);
    console.log('[DemoChat] Request validated');

    // Retrieve session data from storage
    console.log('[DemoChat] Retrieving session:', session_id);
    const sessionData = await getDemoSession(session_id);

    console.log('[DemoChat] Session retrieval result:', {
      found: sessionData !== null,
      domain: sessionData?.domain,
      messageCount: sessionData?.message_count
    });

    if (!sessionData) {
      console.warn('[DemoChat] Session not found:', session_id);
      return NextResponse.json(
        { error: 'Demo session expired. Please start a new demo.' },
        { status: 404 }
      );
    }

    console.log('[DemoChat] Session found, proceeding with chat');

    // Check message count
    if (sessionData.message_count >= sessionData.max_messages) {
      return NextResponse.json(
        { error: 'Message limit reached for this demo session.' },
        { status: 429 }
      );
    }

    // Message rate limiting
    await checkMessageRateLimit(session_id);

    // Find relevant chunks using simple similarity
    const relevantChunks = await findRelevantChunks(
      message,
      sessionData.chunks,
      sessionData.embeddings
    );

    // Generate response using OpenAI
    const response = await generateDemoResponse(
      message,
      relevantChunks,
      sessionData.domain
    );

    // Update message count
    sessionData.message_count += 1;
    await saveDemoSession(session_id, sessionData);

    // Update message count in Supabase
    try {
      const supabase = await createServiceRoleClient();

      if (supabase) {
        await supabase
          .from('demo_attempts')
          .update({
            messages_sent: sessionData.message_count,
            last_message_at: new Date().toISOString()
          })
          .eq('domain', sessionData.domain)
          .order('created_at', { ascending: false })
          .limit(1);
      }
    } catch (logError) {
      console.error('Failed to update message count:', logError);
    }

    return NextResponse.json({
      response,
      message_count: sessionData.message_count,
      messages_remaining: sessionData.max_messages - sessionData.message_count
    });

  } catch (error) {
    console.error('[DemoChat] Error occurred:', {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });

    if (error instanceof Error) {
      if (error.message.includes('wait 2 seconds')) {
        return NextResponse.json(
          { error: error.message },
          { status: 429 }
        );
      }
      if (error.message.includes('expired')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }

      // Check for specific error types
      if (error.message.includes('OpenAI') || error.message.includes('API key')) {
        console.error('[DemoChat] OpenAI error detected');
        return NextResponse.json(
          { error: 'AI service temporarily unavailable. Please try again.' },
          { status: 503 }
        );
      }

      if (error.message.includes('session') || error.message.includes('storage')) {
        console.error('[DemoChat] Storage error detected');
        return NextResponse.json(
          { error: 'Session storage error. Please start a new demo.' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        error: 'Failed to generate response. Please try again.',
        details: process.env.NODE_ENV === 'development'
          ? (error instanceof Error ? error.message : String(error))
          : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * Find relevant chunks using embedding similarity
 */
async function findRelevantChunks(
  query: string,
  chunks: string[],
  embeddings: number[][]
): Promise<string[]> {
  // Generate query embedding
  const openai = getOpenAIClient();
  const queryEmbedding = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query
  });

  const queryVector = queryEmbedding.data[0]?.embedding;

  if (!queryVector) {
    return chunks.slice(0, 3); // Fallback to first 3 chunks
  }

  // Calculate cosine similarity
  const similarities = embeddings.map((embedding, index) => ({
    chunk: chunks[index] || '',
    similarity: cosineSimilarity(queryVector, embedding)
  })).filter(item => item.chunk);

  // Sort by similarity and take top 3
  similarities.sort((a, b) => b.similarity - a.similarity);

  return similarities.slice(0, 3).map(s => s.chunk);
}

/**
 * Calculates cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    const aVal = a[i] ?? 0;
    const bVal = b[i] ?? 0;
    dotProduct += aVal * bVal;
    normA += aVal * aVal;
    normB += bVal * bVal;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Generates AI response using relevant chunks
 */
async function generateDemoResponse(
  query: string,
  relevantChunks: string[],
  domain: string
): Promise<string> {
  const context = relevantChunks.join('\n\n');

  const openai = getOpenAIClient();
  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: `You are a helpful AI assistant for ${domain}. Answer questions based on the provided website content.

IMPORTANT RULES:
- Only use information from the provided context
- If you don't know the answer, say "I don't have that information in the content I was trained on"
- Be concise and friendly
- Never make up information
- Keep responses under 150 words

Context from ${domain}:
${context}`
      },
      {
        role: 'user',
        content: query
      }
    ],
    temperature: 0.7,
    max_tokens: 200
  });

  return completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";
}
