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
import { WooCommerceAIInstructions } from '@/lib/woocommerce-ai-instructions';

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
    
    // Get domain ID for caching - check domains table first for scraping data
    let domainId: string | null = null;
    let customerConfigId: string | null = null;
    if (domain) {
      // First check domains table (for scraped content)
      const { data: domainData } = await adminSupabase
        .from('domains')
        .select('id')
        .eq('domain', domain.replace('www.', ''))
        .single();
      
      if (domainData) {
        domainId = domainData.id;
      }
      
      // Also get customer_configs ID if needed for other purposes
      const { data: configData } = await adminSupabase
        .from('customer_configs')
        .select('id')
        .eq('domain', domain.replace('www.', ''))
        .single();
      
      if (configData) {
        customerConfigId = configData.id;
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

    // 2. Check for contact information requests FIRST
    const contactPattern = /\b(contact|phone|call|telephone|email|mail|reach|support|help|customer\s+service|get\s+in\s+touch|speak|talk\s+to\s+someone|talk\s+to|need\s+to\s+speak|want\s+to\s+talk)\b/i;
    const isContactRequest = contactPattern.test(message);
    
    let contactInfo: any = null;
    if (isContactRequest && domainId) {
      // Try to get contact info from structured_extractions
      const contactPromise = QueryCache.execute(
        {
          key: `contact_info_${domainId}`,
          domainId,
          ttlSeconds: 3600, // 1 hour cache
          useMemoryCache: true,
          useDbCache: true,
          supabase: adminSupabase
        },
        async () => {
          try {
            // First try structured_extractions table for contact info
            const { data: extractions } = await adminSupabase
              .from('structured_extractions')
              .select('data')
              .eq('domain_id', domainId)
              .eq('extract_type', 'contact')
              .single();
            
            if (extractions?.data) {
              return extractions.data;
            }
            
            // Fallback: Search for contact info in scraped content
            const { data: pages } = await adminSupabase
              .from('scraped_pages')
              .select('content, url')
              .eq('domain_id', domainId)
              .or('url.ilike.%contact%,url.ilike.%about%,url.ilike.%help%,url.ilike.%support%')
              .limit(5);
            
            if (pages && pages.length > 0) {
              // Extract contact details from content
              const contactDetails: any = {
                phones: [],
                emails: [],
                addresses: [],
                urls: []
              };
              
              pages.forEach(page => {
                // Extract phone numbers
                const phoneRegex = /(?:\+?44\s?|0)(?:\d{4,5}\s?\d{6}|\d{3}\s?\d{3}\s?\d{4}|\d{2}\s?\d{4}\s?\d{4})/g;
                const phones = page.content.match(phoneRegex);
                if (phones) {
                  contactDetails.phones.push(...phones.map((p: string) => p.trim()));
                }
                
                // Extract emails
                const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
                const emails = page.content.match(emailRegex);
                if (emails) {
                  contactDetails.emails.push(...emails);
                }
                
                // Add URL where contact info was found
                if (page.url && (phones || emails)) {
                  contactDetails.urls.push(page.url);
                }
              });
              
              // Deduplicate
              contactDetails.phones = [...new Set(contactDetails.phones)];
              contactDetails.emails = [...new Set(contactDetails.emails)];
              contactDetails.urls = [...new Set(contactDetails.urls)];
              
              return contactDetails;
            }
            
            return null;
          } catch (error) {
            console.error('Error fetching contact info:', error);
            return null;
          }
        }
      );
      
      contextPromises.push(contactPromise);
      contactInfo = await contactPromise;
    }
    
    // 3. Cached website content search (if enabled)
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

    // 4. Customer verification (cached per conversation)
    // More specific pattern to avoid false positives
    // Pattern focuses on: personal references (my), past actions (ordered/bought), specific order numbers
    const personalOrderPattern = /\b(my\s+(order|delivery|purchase|invoice|receipt|refund|return|package|stuff|account)|i\s+(ordered|bought|purchased)|order\s*#?\d{3,}|where('s|\s+is)\s+my|when\s+will\s+my|track\s+my|cancel\s+my|find\s+my|check\s+my|show\s+(me\s+)?my)\b/i;
    
    // Pattern for checking existing orders (not future/general)
    const existingOrderPattern = /\b(recent\s+(orders?|purchases?)|order\s+(status|history)|purchase\s+history|delivery\s+(status|question)|hasn't\s+arrived|is\s+late|went\s+through)\b/i;
    
    // Exclusion pattern for general/future queries
    const generalQueryPattern = /\b(how\s+(to|do|does|can)\s+(i\s+)?(order|ordering|place|return)|order\s+process|ordering\s+work|want\s+to\s+(order|buy|purchase)|what\s+(brands?|products?|payment)|business\s+hours?|shipping\s+(cost|rates?)|return\s+policy|delivery\s+options?|can\s+i\s+order)\b/i;
    
    // Final decision: trigger verification only for personal/existing orders, NOT for general queries
    const isCustomerQuery = !generalQueryPattern.test(message) && 
                           (personalOrderPattern.test(message) || existingOrderPattern.test(message));
    
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

    // Build context for OpenAI with enhanced WooCommerce support
    let systemContext = '';
    
    // Use enhanced instructions if this is a customer query
    if (verificationResult && typeof verificationResult === 'object') {
      const result = verificationResult as any;
      systemContext = WooCommerceAIInstructions.buildCompleteContext(
        result.level || 'none',
        result.context || '',
        result.prompt || '',
        message
      );
    } else {
      // Default context for non-customer queries
      systemContext = `You are a helpful customer service assistant.
      
      Important instructions:
      - When you reference specific products, pages, or information, include relevant links
      - Format links as markdown: [link text](url) or just include the URL directly
      - If you mention a product that has a URL in the context, include that URL
      - Make links descriptive and natural in your responses`;
    }
    
    // Add contact information if this is a contact request
    if (isContactRequest && contactInfo) {
      systemContext += `\n\nIMPORTANT - The customer is asking for contact information. Please provide these details immediately:\n`;
      
      if (contactInfo.phones && contactInfo.phones.length > 0) {
        systemContext += `Phone numbers: ${contactInfo.phones.join(', ')}\n`;
      }
      if (contactInfo.emails && contactInfo.emails.length > 0) {
        systemContext += `Email addresses: ${contactInfo.emails.join(', ')}\n`;
      }
      if (contactInfo.addresses && contactInfo.addresses.length > 0) {
        systemContext += `Addresses: ${contactInfo.addresses.join('; ')}\n`;
      }
      if (contactInfo.urls && contactInfo.urls.length > 0) {
        systemContext += `For more information, visit: ${contactInfo.urls.join(', ')}\n`;
      }
      
      systemContext += `\nProvide these contact details directly in your response, formatted clearly and professionally.`;
    }
    
    // Add website information if available
    if (embeddingResults && embeddingResults.length > 0) {
      systemContext += `\n\nRelevant website information:\n${
        embeddingResults.map((r: any) => 
          `- ${r.title} (${r.url}): ${r.content.substring(0, 500)}...`
        ).join('\n')
      }`;
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
      conversation_id: conversationId!,
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