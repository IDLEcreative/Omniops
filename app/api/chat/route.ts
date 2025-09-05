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
import { CustomerServiceAgent } from '@/lib/agents/customer-service-agent';
import { WooCommerceAgent } from '@/lib/agents/woocommerce-agent';
import { selectProviderAgent } from '@/lib/agents/router';
import { ProductRecommendationContext } from '@/lib/product-recommendation-context';
import { sanitizeOutboundLinks } from '@/lib/link-sanitizer';

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

// sanitizer imported from lib/link-sanitizer

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
      // No conversation ID provided, create a new one
      const { data: newConversation, error: convError } = await adminSupabase
        .from('conversations')
        .insert({ session_id })
        .select()
        .single();
      
      if (convError) throw convError;
      conversationId = newConversation.id;
    } else {
      // Conversation ID provided, ensure it exists
      const { data: existingConv } = await adminSupabase
        .from('conversations')
        .select('id')
        .eq('id', conversationId)
        .single();
      
      if (!existingConv) {
        // Conversation doesn't exist, create it with the provided ID
        const { error: createError } = await adminSupabase
          .from('conversations')
          .insert({ 
            id: conversationId,
            session_id 
          });
        
        if (createError) {
          console.error('[Chat] Failed to create conversation:', createError);
        }
      }
    }

    // Start saving user message immediately
    const saveUserMessagePromise = adminSupabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'user',
        content: message,
      })
      .select();

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

    // 1. Conversation history - NO CACHING as it changes with every message
    const historyPromise = (async () => {
      const { data, error } = await adminSupabase
        .from('messages')
        .select('role, content')
        .eq('conversation_id', conversationId!)
        .order('created_at', { ascending: true })
        .limit(10);
      
      if (error) {
        console.error('[Chat] Failed to fetch history:', error);
        return [];
      }
      
      console.log('[Chat] Fetched history for', conversationId, ':', data?.length || 0, 'messages');
      return data || [];
    })();

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
    
    // Check if message contains an email address
    const hasEmailInMessage = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(message);
    
    // Check if message is or contains a potential order number (5-6 digits, possibly with #)
    const hasPotentialOrderNumber = /^#?\d{5,6}$/.test(message.trim()) || /\border\s*#?\d{5,6}\b/i.test(message);
    
    // Exclusion pattern for general/future queries
    const generalQueryPattern = /\b(how\s+(to|do|does|can)\s+(i\s+)?(order|ordering|place|return)|order\s+process|ordering\s+work|want\s+to\s+(order|buy|purchase)|what\s+(brands?|products?|payment)|business\s+hours?|shipping\s+(cost|rates?)|return\s+policy|delivery\s+options?|can\s+i\s+order)\b/i;
    
    // For follow-up detection, we need to wait for history
    // Initial check without history
    const isCustomerQueryInitial = hasEmailInMessage || hasPotentialOrderNumber ||
                           (!generalQueryPattern.test(message) && 
                            (personalOrderPattern.test(message) || existingOrderPattern.test(message)));
    
    // We'll refine this after getting history data
    let isCustomerQuery = isCustomerQueryInitial;
    
    if (isCustomerQuery && conversationId) {
      // Include message hash in cache key to detect new verification info
      const messageHash = Buffer.from(message).toString('base64').substring(0, 20);
      const verificationCacheKey = `verification_${conversationId}_${messageHash}`;
      
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
            
            // Check current message for verification info
            const emailMatch = message.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
            const orderMatch = message.match(/#?\d{4,}/);
            const nameMatch = message.match(/(?:my name is|i'm|i am)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i);
            
            // Also check conversation history for previously provided info
            let historicalEmail: string | undefined;
            let historicalOrder: string | undefined;
            let historicalName: string | undefined;
            
            // Get conversation history to check for previous verification
            const history = await historyPromise;
            if (history && Array.isArray(history)) {
              // Search through previous user messages for verification info
              for (const msg of history) {
                if (msg.role === 'user') {
                  // Check for email in previous messages
                  if (!historicalEmail) {
                    const histEmailMatch = msg.content.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
                    if (histEmailMatch) historicalEmail = histEmailMatch[0];
                  }
                  // Check for order number in previous messages
                  if (!historicalOrder) {
                    const histOrderMatch = msg.content.match(/#?\d{4,}/);
                    if (histOrderMatch) historicalOrder = histOrderMatch[0]?.replace('#', '');
                  }
                  // Check for name in previous messages
                  if (!historicalName) {
                    const histNameMatch = msg.content.match(/(?:my name is|i'm|i am)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i);
                    if (histNameMatch) historicalName = histNameMatch[1];
                  }
                }
              }
            }
            
            // Use current message info first, fall back to historical
            const finalEmail = emailMatch?.[0] || historicalEmail;
            const finalOrder = orderMatch?.[0]?.replace('#', '') || historicalOrder;
            const finalName = nameMatch?.[1] || historicalName;
            
            // Log what we found for debugging
            console.log('[Customer Verification] Found:', {
              currentEmail: emailMatch?.[0],
              historicalEmail,
              finalEmail,
              currentOrder: orderMatch?.[0],
              historicalOrder,
              finalOrder
            });
            
            const verificationLevel = await SimpleCustomerVerification.verifyCustomer({
              conversationId,
              email: finalEmail,
              orderNumber: finalOrder,
              name: finalName,
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
              level: verificationLevel.level,
              verifiedEmail: finalEmail,
              verifiedOrder: finalOrder
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
    const [historyData, embeddingResults, ...contextResults] = await Promise.all([
      historyPromise,
      embeddingSearchPromise,
      ...contextPromises
    ]);

    console.log('[Chat] Processing message:', {
      message,
      isCustomerQuery,
      hasHistory: !!(historyData && historyData.length > 0),
      historyLength: historyData?.length || 0,
      conversationId
    });

    // Check if this is a follow-up question about orders (now that we have history)
    // Run this check even if initial customer query detection didn't trigger
    if (historyData && historyData.length > 0 && conversationId) {
      const recentMessages = historyData.slice(-3); // Check last 3 messages
      const hasRecentOrderDiscussion = recentMessages.some((msg: any) => 
        msg.content && (msg.content.includes('Order #') || msg.content.includes('on-hold') || msg.content.includes('order'))
      );
      
      // Short questions after order discussion are likely follow-ups
      const isShortQuestion = message.length < 50 && message.includes('?');
      // Common follow-up patterns - be more liberal with matching
      const followUpPattern = /\b(why|what|when|how|on\s*hold|status|delivered|cancelled|refunded|shipped|explain|means?)\b/i;
      const isFollowUpAboutOrder = hasRecentOrderDiscussion && (isShortQuestion || followUpPattern.test(message));
      
      console.log('[Chat] Follow-up check:', {
        message,
        isCustomerQuery,
        hasRecentOrderDiscussion,
        isShortQuestion,
        matchesPattern: followUpPattern.test(message),
        isFollowUpAboutOrder
      });
      
      // If it's a follow-up and we haven't already processed customer verification
      if (isFollowUpAboutOrder && !isCustomerQuery) {
        console.log('[Chat] Detected follow-up question about order:', message);
        try {
          const { SimpleCustomerVerification } = await import('@/lib/customer-verification-simple');
          
          // Check history for previously provided verification info
          let historicalEmail: string | undefined;
          let historicalOrder: string | undefined;
          
          for (const msg of historyData) {
            if (msg.role === 'user') {
              if (!historicalEmail) {
                const histEmailMatch = msg.content.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
                if (histEmailMatch) historicalEmail = histEmailMatch[0];
              }
              if (!historicalOrder) {
                const histOrderMatch = msg.content.match(/#?\d{4,}/);
                if (histOrderMatch) historicalOrder = histOrderMatch[0]?.replace('#', '');
              }
            }
          }
          
          if (historicalEmail || historicalOrder) {
            const verificationLevel = await SimpleCustomerVerification.verifyCustomer({
              conversationId,
              email: historicalEmail,
              orderNumber: historicalOrder,
            }, domain);
            
            const context = await SimpleCustomerVerification.getCustomerContext(
              verificationLevel,
              conversationId,
              domain
            );
            
            const prompt = SimpleCustomerVerification.getVerificationPrompt(verificationLevel);
            
            // Add this as the verification result
            contextResults.push({
              context,
              prompt,
              level: verificationLevel.level,
              verifiedEmail: historicalEmail,
              verifiedOrder: historicalOrder,
              isFollowUp: true
            });
            isCustomerQuery = true; // Mark as customer query for context building
          }
        } catch (error) {
          console.error('[Chat] Follow-up verification failed:', error);
        }
      }
    }

    // Find the verification result (it's the last item in contextResults if customer verification was triggered)
    const verificationResult = isCustomerQuery ? contextResults[contextResults.length - 1] : null;

    // Build context for OpenAI with enhanced WooCommerce support
    let systemContext = '';
    
    // Use enhanced instructions if this is a customer query
    if (verificationResult && typeof verificationResult === 'object') {
      const result = verificationResult as any;
      
      // Add conversation context hint if we're discussing orders
      let contextualMessage = message;
      if (historyData && historyData.length > 0) {
        // Check if the last assistant message mentioned an order
        const lastAssistantMsg = [...historyData].reverse().find((m: any) => m.role === 'assistant');
        if (lastAssistantMsg && lastAssistantMsg.content.includes('Order #')) {
          // Add context that we're discussing the previously mentioned order
          contextualMessage = `[Context: User is following up about the order just discussed] ${message}`;
        }
      }
      
      // Decide which provider agent to use (modular routing)
      const provider = selectProviderAgent(config as any, process.env);
      const ProviderAgent = provider === 'woocommerce' ? WooCommerceAgent : CustomerServiceAgent;

      systemContext = ProviderAgent.buildCompleteContext(
        result.level || 'none',
        result.context || '',
        result.prompt || '',
        contextualMessage
      );
      
      // Add explicit instruction about conversation context
      systemContext += `\n\nIMPORTANT: Pay attention to the conversation history. If the user asks follow-up questions about orders or information you just provided, respond in that context. For example:
      - If you just showed an order and they ask "on hold?" they're asking about the order status, not products.
      - If they say "why" after seeing an order status, explain the status.
      - Use the conversation history to understand ambiguous questions.`;
    } else {
      // Default context for non-customer queries
      systemContext = `You are a helpful customer service assistant.
      
      CRITICAL:
      - Never recommend or link to external shops, competitors, manufacturer websites, community blogs/forums, or third‑party documentation.
      - Only reference and link to our own website/domain. All links in responses MUST be same‑domain.
      - If a link is needed but an in‑house page is not available, direct the customer to contact us instead (do not link externally).
      
      If a customer asks about products that aren't available or that you don't have information about, suggest they:
      - Contact customer service directly for assistance
      - Check back later as inventory is regularly updated
      - Consider similar products from our current selection
      - Inquire about special ordering options
      - Ask about product availability timelines
      
      Brevity:
      - Keep responses concise and scannable (2–4 short sentences or up to 4 brief bullets)
      
      Important instructions:
      - When you reference specific products, pages, or information, include links ONLY to our own domain
      - Format links as markdown: [link text](url) or just include the URL directly
      - If you mention a product that has a URL in the context, include that URL
      - Make links descriptive and natural in your responses
      - Pay attention to conversation history for context`;
      
      // Add product recommendation guidelines only for product-related queries
      const productGuidelines = ProductRecommendationContext.buildProductContext(message);
      if (productGuidelines) {
        systemContext += productGuidelines;
      }
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

    // Log what we're sending to OpenAI
    const openAIMessages = [
      { role: 'system' as const, content: systemContext },
      ...historyData.map((msg: any) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      { role: 'user' as const, content: message }
    ];
    
    console.log('[Chat] Sending to OpenAI:', {
      messageCount: openAIMessages.length,
      systemPromptLength: systemContext.length,
      historyMessages: historyData.length,
      currentMessage: message,
      lastAssistantMessage: historyData.filter((m: any) => m.role === 'assistant').slice(-1)[0]?.content?.substring(0, 100)
    });

    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: openAIMessages,
      temperature: 0.7,
      max_tokens: 500,
    });

    let assistantMessage = completion.choices[0]?.message?.content || 
      'I apologize, but I was unable to generate a response. Please try again.';

    // Enforce in-house linking policy by stripping any external links from the AI output
    const allowedDomain = (domain && !/localhost|127\.0\.0\.1|vercel/i.test(domain))
      ? domain
      : 'thompsonseparts.co.uk';
    assistantMessage = sanitizeOutboundLinks(assistantMessage, allowedDomain);

    // Save assistant response
    const { error: assistantSaveError } = await adminSupabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: assistantMessage,
      });
    
    if (assistantSaveError) {
      console.error('[Chat] Failed to save assistant message:', JSON.stringify(assistantSaveError, null, 2));
    }

    // Wait for user message to be saved
    const userSaveResult = await saveUserMessagePromise;
    if (userSaveResult?.error) {
      console.error('[Chat] Failed to save user message:', JSON.stringify(userSaveResult.error, null, 2));
    }

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
