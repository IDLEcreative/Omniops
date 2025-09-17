/**
 * Optimized Chat API with streaming support for faster responses
 * Reduces perceived latency by streaming responses as they're generated
 */

import { NextRequest } from 'next/server';
import { createServiceRoleClient, validateSupabaseEnv } from '@/lib/supabase-server';
import OpenAI from 'openai';
import { z } from 'zod';
import { checkDomainRateLimit } from '@/lib/rate-limit';
import { getEnhancedContext } from '@/lib/chat-context-enhancer';
import { CustomerServiceAgent } from '@/lib/agents/customer-service-agent';
import { SimpleResponseProcessor } from '@/lib/response-post-processor-simple';
import { getResponseCache } from '@/lib/response-cache';

// Request validation schema
const ChatRequestSchema = z.object({
  message: z.string(),
  conversation_id: z.string().optional(),
  session_id: z.string(),
  domain: z.string().optional(),
  demoId: z.string().optional(),
  stream: z.boolean().optional().default(true), // Enable streaming by default
  config: z.object({
    features: z.object({
      woocommerce: z.object({ enabled: z.boolean() }).optional(),
      websiteScraping: z.object({ enabled: z.boolean() }).optional(),
    }).optional(),
    ai: z.object({
      trustAIPresentation: z.boolean().optional(),
      postProcessing: z.object({
        enabled: z.boolean().optional(),
        forceProducts: z.boolean().optional(),
      }).optional(),
    }).optional(),
  }).optional(),
});

// Lazy load OpenAI client
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

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Check environment
    if (!validateSupabaseEnv() || !process.env.OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({
          error: 'Service temporarily unavailable',
          message: 'The chat service is currently undergoing maintenance.'
        }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const validatedData = ChatRequestSchema.parse(body);
    const { message, conversation_id, session_id, domain, config, stream } = validatedData;

    // Check rate limit
    const rateLimitDomain = domain || request.headers.get('host') || 'unknown';
    const { allowed, resetTime } = checkDomainRateLimit(rateLimitDomain);
    
    if (!allowed) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          resetTime
        }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = await createServiceRoleClient();
    if (!supabase) {
      return new Response(
        JSON.stringify({
          error: 'Service temporarily unavailable',
          message: 'Database connection unavailable.'
        }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Get domain configuration with minimal queries
    let domainData = null;
    let domainId = null;
    
    if (domain && domain !== 'test.example.com') {
      const { data } = await supabase
        .from('customer_configs')
        .select('id, domain, woocommerce_enabled')
        .eq('domain', domain)
        .maybeSingle();
      
      domainData = data;
      domainId = data?.id;
    }

    console.log(`[Chat Optimized] Request received in ${Date.now() - startTime}ms`);

    // Check cache for common queries
    const cache = getResponseCache();
    const cachedResponse = cache.get(message, domain);
    
    if (cachedResponse) {
      console.log(`[Chat Optimized] Cache hit! Returning cached response in ${Date.now() - startTime}ms`);
      
      // Return cached response immediately
      if (stream) {
        const encoder = new TextEncoder();
        const streamResponse = new ReadableStream({
          start(controller) {
            const data = JSON.stringify({ content: cachedResponse, done: true, cached: true }) + '\n';
            controller.enqueue(encoder.encode(data));
            controller.close();
          }
        });
        
        return new Response(streamResponse, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        });
      }
      
      return new Response(
        JSON.stringify({
          content: cachedResponse,
          conversation_id,
          cached: true,
          processingTime: Date.now() - startTime
        }),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Start parallel operations for better performance
    const contextPromise = domainId ? getEnhancedContext(
      message,
      domain!,
      domainId,
      { 
        enableSmartSearch: config?.features?.websiteScraping?.enabled ?? true,
        maxChunks: 8, // Reduced for faster processing
        minChunks: 3
      }
    ) : Promise.resolve(null);

    // Get conversation history (limit to last 3 messages for speed)
    const historyPromise: Promise<Array<{role: string, content: string}>> = conversation_id ? 
      Promise.resolve(supabase
        .from('messages')
        .select('role, content')
        .eq('conversation_id', conversation_id)
        .order('created_at', { ascending: false })
        .limit(3)
        .then(res => res.data?.reverse() || []))
      : Promise.resolve([]);

    // Wait for both operations
    const [enhancedContext, historyData] = await Promise.all([
      contextPromise,
      historyPromise
    ]);

    console.log(`[Chat Optimized] Context fetched in ${Date.now() - startTime}ms`);

    // Build system prompt
    const agent = new CustomerServiceAgent();
    let systemContext = agent.getEnhancedSystemPrompt('none', false);
    
    if (enhancedContext?.chunks && enhancedContext.chunks.length > 0) {
      const contextStr = enhancedContext.chunks
        .slice(0, 5) // Use top 5 chunks only for speed
        .map(chunk => chunk.content)
        .join('\n\n');
      
      systemContext += `\n\nRelevant Information:\n${contextStr}`;
    }

    // Prepare messages for OpenAI
    const openAIMessages = [
      { role: 'system' as const, content: systemContext },
      ...historyData.map((msg: {role: string, content: string}) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      { role: 'user' as const, content: message }
    ];

    console.log(`[Chat Optimized] Calling OpenAI at ${Date.now() - startTime}ms`);

    // Get OpenAI client
    const openaiClient = getOpenAIClient();
    if (!openaiClient) {
      throw new Error('OpenAI client not available');
    }

    // If streaming is enabled, return a streaming response
    if (stream) {
      const encoder = new TextEncoder();
      const streamResponse = new ReadableStream({
        async start(controller) {
          try {
            const stream = await openaiClient.chat.completions.create({
              model: 'gpt-4o-mini', // Faster model
              messages: openAIMessages,
              temperature: 0.7,
              max_tokens: 500,
              stream: true,
            });

            let fullContent = '';
            
            for await (const chunk of stream) {
              const content = chunk.choices[0]?.delta?.content || '';
              if (content) {
                fullContent += content;
                // Send each chunk as JSON
                const data = JSON.stringify({ content, done: false }) + '\n';
                controller.enqueue(encoder.encode(data));
              }
            }

            // Send final message
            const finalData = JSON.stringify({ 
              content: fullContent, 
              done: true,
              processingTime: Date.now() - startTime
            }) + '\n';
            controller.enqueue(encoder.encode(finalData));

            // Cache the response for common queries
            cache.set(message, fullContent, domain);

            // Save message to database (non-blocking)
            if (conversation_id) {
              void Promise.resolve(supabase
                .from('messages')
                .insert([
                  {
                    conversation_id,
                    role: 'user',
                    content: message,
                    session_id
                  },
                  {
                    conversation_id,
                    role: 'assistant',
                    content: fullContent,
                    session_id
                  }
                ]))
                .then(() => console.log('[Chat Optimized] Messages saved'))
                .catch((err: Error) => console.error('[Chat Optimized] Failed to save messages:', err));
            }

            controller.close();
          } catch (error) {
            console.error('[Chat Optimized] Stream error:', error);
            const errorData = JSON.stringify({ 
              error: 'Stream generation failed',
              done: true 
            }) + '\n';
            controller.enqueue(encoder.encode(errorData));
            controller.close();
          }
        },
      });

      return new Response(streamResponse, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Non-streaming response (fallback)
    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: openAIMessages,
      temperature: 0.7,
      max_tokens: 500,
    });

    const assistantMessage = completion.choices[0]?.message?.content || 
      'I apologize, but I was unable to generate a response.';

    console.log(`[Chat Optimized] Total processing time: ${Date.now() - startTime}ms`);

    // Cache the response
    cache.set(message, assistantMessage, domain);

    // Save messages (non-blocking)
    if (conversation_id) {
      void Promise.resolve(supabase
        .from('messages')
        .insert([
          {
            conversation_id,
            role: 'user',
            content: message,
            session_id
          },
          {
            conversation_id,
            role: 'assistant',
            content: assistantMessage,
            session_id
          }
        ]))
        .then(() => console.log('[Chat Optimized] Messages saved'))
        .catch((err: Error) => console.error('[Chat Optimized] Failed to save messages:', err));
    }

    return new Response(
      JSON.stringify({
        content: assistantMessage,
        conversation_id,
        processingTime: Date.now() - startTime
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('[Chat Optimized] Error:', error);
    return new Response(
      JSON.stringify({
        error: 'An error occurred processing your request',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}