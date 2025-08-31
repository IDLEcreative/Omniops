import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { createServiceRoleClient, validateSupabaseEnv } from '@/lib/supabase-server';
import { ChatResponse } from '@/types';
import OpenAI from 'openai';
import { z } from 'zod';
import { checkDomainRateLimit } from '@/lib/rate-limit';
import { searchSimilarContent } from '@/lib/embeddings';
import { CustomerVerification } from '@/lib/customer-verification';
import { SimpleCustomerVerification } from '@/lib/customer-verification-simple';
import { QueryCache } from '@/lib/query-cache';

// Lazy load OpenAI client to avoid build-time errors
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('[Chat API] OpenAI API key is not configured');
      return null;
    }
    try {
      openai = new OpenAI({ apiKey });
    } catch (error) {
      console.error('[Chat API] Failed to initialize OpenAI client:', error);
      return null;
    }
  }
  return openai;
}

// Request validation
const ChatRequestSchema = z.object({
  message: z.string().min(1).max(1000),
  conversation_id: z.string().uuid().optional(),
  session_id: z.string().min(1),
  domain: z.string().optional(),
  demoId: z.string().optional(),
  config: z.object({
    features: z.object({
      woocommerce: z.object({ enabled: z.boolean() }).optional(),
      websiteScraping: z.object({ enabled: z.boolean() }).optional(),
    }).optional(),
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Check critical environment variables
    if (!validateSupabaseEnv() || !process.env.OPENAI_API_KEY) {
      console.error('[Chat API] Service configuration incomplete');
      return NextResponse.json(
        { 
          error: 'Service temporarily unavailable',
          message: 'The chat service is currently undergoing maintenance. Please try again later.'
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const validatedData = ChatRequestSchema.parse(body);
    const { message, conversation_id, session_id, domain, config, demoId } = validatedData;

    // Check rate limit
    const rateLimitDomain = domain || request.headers.get('host') || 'unknown';
    const { allowed, resetTime } = checkDomainRateLimit(rateLimitDomain);
    
    if (!allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '100',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': resetTime.toString(),
          }
        }
      );
    }

    // Initialize Supabase clients
    const adminSupabase = await createServiceRoleClient();
    if (!adminSupabase) {
      return NextResponse.json(
        { 
          error: 'Database connection failed',
          message: 'Unable to process your request. Please try again later.'
        },
        { status: 503 }
      );
    }

    // Get or create conversation
    let conversationId = conversation_id;
    
    if (!conversationId) {
      const { data: newConversation, error: convError } = await adminSupabase
        .from('conversations')
        .insert({ session_id })
        .select()
        .single();
      
      if (convError) throw convError;
      conversationId = newConversation.id;
    }

    // Start saving user message immediately
    const saveUserMessagePromise = adminSupabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'user',
        content: message,
      });

    // Prepare parallel context gathering with caching
    const contextPromises: Promise<unknown>[] = [];
    let embeddingSearchPromise: Promise<any> | null = null;
    
    // Get domain ID for caching
    let domainId: string | null = null;
    if (domain) {
      const { data: domainData } = await adminSupabase
        .from('customer_configs')
        .select('id')
        .eq('domain', domain.replace('www.', ''))
        .single();
      
      if (domainData) {
        domainId = domainData.id;
      }
    }

    // 1. Cached conversation history
    const historyPromise = QueryCache.execute(
      {
        key: `history_${conversationId}`,
        domainId: domainId || undefined,
        ttlSeconds: 300, // 5 minutes
        useMemoryCache: true,
        useDbCache: false,
        supabase: adminSupabase
      },
      async () => {
        const { data } = await adminSupabase
          .from('messages')
          .select('role, content')
          .eq('conversation_id', conversationId!)
          .order('created_at', { ascending: true })
          .limit(10);
        return data || [];
      }
    );

    // 2. Cached website content search (if enabled)
    if (config?.features?.websiteScraping?.enabled !== false && domain && domainId) {
      const searchDomain = domain === 'localhost' || domain?.includes('127.0.0.1')
        ? 'thompsonseparts.co.uk' 
        : domain;
      
      // Generate cache key from message + domain
      const searchCacheKey = QueryCache.generateKey({
        type: 'embedding_search',
        message: message.toLowerCase(),
        domain: searchDomain
      });
      
      embeddingSearchPromise = QueryCache.execute(
        {
          key: searchCacheKey,
          domainId,
          queryText: message,
          ttlSeconds: 1800, // 30 minutes
          useMemoryCache: true,
          useDbCache: true,
          supabase: adminSupabase
        },
        async () => {
          try {
            // Try optimized search first
            const { data: results, error } = await adminSupabase.rpc('search_content_optimized', {
              query_text: message,
              query_embedding: null, // Will be generated in function if needed
              p_domain_id: domainId,
              match_count: 5,
              use_hybrid: true
            });
            
            if (!error && results && results.length > 0) {
              return results.map((r: any) => ({
                content: r.content,
                url: r.url || '',
                title: r.title || 'Untitled',
                similarity: r.similarity || 0.7
              }));
            }
            
            // Fallback to original search
            return await searchSimilarContent(
              message,
              searchDomain,
              3,
              0.3
            );
          } catch (error) {
            console.error('Search error:', error);
            return [];
          }
        }
      );
      
      contextPromises.push(embeddingSearchPromise);
    }

    // 3. Customer verification (cached per conversation)
    const isCustomerQuery = /order|tracking|delivery|account|email|invoice|receipt|refund|return|my purchase|my order|where is|when will|status|cancel|change.*address|update.*address|modify/i.test(message);
    
    if (isCustomerQuery && conversationId) {
      const verificationCacheKey = `verification_${conversationId}`;
      
      const customerVerificationPromise = QueryCache.execute(
        {
          key: verificationCacheKey,
          ttlSeconds: 600, // 10 minutes
          useMemoryCache: true,
          useDbCache: false
        },
        async () => {
          try {
            const { SimpleCustomerVerification } = await import('@/lib/customer-verification-simple');
            
            const emailMatch = message.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
            const orderMatch = message.match(/#?\d{4,}/);
            const nameMatch = message.match(/(?:my name is|i'm|i am)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i);
            
            const verificationLevel = await SimpleCustomerVerification.verifyCustomer({
              conversationId,
              email: emailMatch?.[0],
              orderNumber: orderMatch?.[0]?.replace('#', ''),
              name: nameMatch?.[1],
            }, domain);
            
            const context = await SimpleCustomerVerification.getCustomerContext(
              verificationLevel,
              conversationId,
              domain
            );
            
            const prompt = SimpleCustomerVerification.getVerificationPrompt(verificationLevel);
            
            return {
              context,
              prompt,
              level: verificationLevel.level
            };
          } catch (error) {
            console.error('Customer verification failed:', error);
            return null;
          }
        }
      );
      
      contextPromises.push(customerVerificationPromise);
    }

    // Wait for all context gathering
    const [historyData, embeddingResults, verificationResult] = await Promise.all([
      historyPromise,
      embeddingSearchPromise,
      ...contextPromises
    ]);

    // Build context for OpenAI
    let systemContext = `You are a helpful customer service assistant.`;
    
    if (embeddingResults && embeddingResults.length > 0) {
      systemContext += `\n\nRelevant website information:\n${
        embeddingResults.map((r: any) => 
          `- ${r.title}: ${r.content.substring(0, 500)}...`
        ).join('\n')
      }`;
    }
    
    if (verificationResult?.context) {
      systemContext += `\n\n${verificationResult.context}`;
    }

    // Generate response using OpenAI
    const openaiClient = getOpenAIClient();
    if (!openaiClient) {
      throw new Error('OpenAI client not available');
    }

    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemContext },
        ...historyData.map((msg: any) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        })),
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const assistantMessage = completion.choices[0]?.message?.content || 
      'I apologize, but I was unable to generate a response. Please try again.';

    // Save assistant response
    await adminSupabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: assistantMessage,
      });

    // Wait for user message to be saved
    await saveUserMessagePromise;

    // Log cache statistics periodically
    if (Math.random() < 0.1) { // 10% of requests
      console.log('[Cache Stats]', QueryCache.getStats());
    }

    return NextResponse.json<ChatResponse>({
      message: assistantMessage,
      conversation_id: conversationId,
      sources: embeddingResults?.map((r: any) => ({
        url: r.url,
        title: r.title,
        relevance: r.similarity
      })) || []
    });

  } catch (error) {
    console.error('[Chat API] Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request format', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to process chat message',
        message: 'An unexpected error occurred. Please try again.'
      },
      { status: 500 }
    );
  }
}