import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { ChatResponse } from '@/types';
import OpenAI from 'openai';
import { z } from 'zod';
import { checkDomainRateLimit } from '@/lib/rate-limit';
import { searchSimilarContent } from '@/lib/embeddings';

// Lazy load OpenAI client to avoid build-time errors
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    openai = new OpenAI({ apiKey });
  }
  return openai;
}

// Request validation
const ChatRequestSchema = z.object({
  message: z.string().min(1).max(1000),
  conversation_id: z.string().uuid().optional(),
  session_id: z.string().min(1),
  domain: z.string().optional(), // Domain of the website using the widget
  demoId: z.string().optional(), // Demo session ID
  config: z.object({
    features: z.object({
      woocommerce: z.object({ enabled: z.boolean() }).optional(),
      websiteScraping: z.object({ enabled: z.boolean() }).optional(),
    }).optional(),
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
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

    // Get or create conversation
    let conversationId = conversation_id;
    
    if (!conversationId) {
      // Create new conversation
      const { data: newConversation, error: convError } = await adminSupabase
        .from('conversations')
        .insert({
          session_id,
        })
        .select()
        .single();
      
      if (convError) throw convError;
      conversationId = newConversation.id;
    }

    // Start saving user message immediately after we have conversation ID
    const saveUserMessagePromise = adminSupabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'user',
        content: message,
      });

    // Prepare parallel context gathering operations
    const contextPromises: Promise<unknown>[] = [];
    let embeddingSearchPromise: Promise<Array<{content: string; url: string; title: string; similarity: number}>> | null = null;
    let wooCommerceSearchPromise: Promise<any[]> | null = null;
    // Start fetching conversation history immediately
    const historyPromise = (async () => {
      return await adminSupabase
        .from('messages')
        .select('role, content')
        .eq('conversation_id', conversationId!)
        .order('created_at', { ascending: true })
        .limit(10);
    })();

    // 1. Demo mode - disabled after removing Firecrawl
    if (demoId) {
      console.log('Demo mode is currently disabled');
    }
    // 2. Website content context (if enabled and not demo)
    else if (config?.features?.websiteScraping?.enabled !== false && domain) {
      embeddingSearchPromise = searchSimilarContent(
        message,
        domain,
        3, // Get top 3 from embeddings
        0.3  // Lower threshold to get more results
      ).catch(async (searchError) => {
        console.error('Search error:', searchError);
        // Fall back to old method if new search fails
        try {
          const embeddingResponse = await getOpenAIClient().embeddings.create({
            model: 'text-embedding-3-small',
            input: message,
          });
          const embedding = embeddingResponse.data[0]?.embedding;

          if (embedding) {
            const { data: relevantChunks, error } = await adminSupabase.rpc('search_embeddings', {
              query_embedding: embedding,
              match_threshold: 0.7,
              match_count: 5,
            });
            
            if (error) {
              console.error('RPC search_embeddings error:', error);
              return [];
            }
            
            // Transform to match expected format
            if (relevantChunks && relevantChunks.length > 0) {
              return relevantChunks.map((chunk: {content: string; url?: string; title?: string; similarity?: number}) => ({
                content: chunk.content,
                url: chunk.url || '',
                title: chunk.title || 'Untitled',
                similarity: chunk.similarity || 0.7
              }));
            }
          }
        } catch (fallbackError) {
          console.error('Fallback search error:', fallbackError);
        }
        return [];
      });
      contextPromises.push(embeddingSearchPromise);
    }

    // 3. Customer query detection and simple verification
    const isCustomerQuery = /order|tracking|delivery|account|email|invoice|receipt|refund|return|my purchase|my order|where is|when will|status/i.test(message);
    let customerVerificationPromise: Promise<{context: string; prompt?: string; level?: string} | null> | null = null;
    let customerContext = '';
    let verificationPrompt = '';
    
    // Use simple verification for customer queries
    if (isCustomerQuery && conversationId) {
      customerVerificationPromise = (async () => {
        try {
          // Try the simple verification first
          const { SimpleCustomerVerification } = await import('@/lib/customer-verification-simple');
          
          // Extract potential customer info from the message
          const emailMatch = message.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
          const orderMatch = message.match(/#?\d{4,}/);
          const nameMatch = message.match(/(?:my name is|i'm|i am)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i);
          
          // Verify with whatever info we can extract
          const verificationLevel = await SimpleCustomerVerification.verifyCustomer({
            conversationId,
            email: emailMatch?.[0],
            orderNumber: orderMatch?.[0]?.replace('#', ''),
            name: nameMatch?.[1],
          }, domain);
          
          // Get context based on verification level
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
          console.error('Customer verification check failed:', error);
          // Fall back to old verification if simple fails
          try {
            const { CustomerVerification } = await import('@/lib/customer-verification');
            const status = await CustomerVerification.checkVerificationStatus(conversationId);
            
            if (status.isVerified && status.customerEmail) {
              const { WooCommerceCustomer } = await import('@/lib/woocommerce-customer');
              const wcCustomer = domain 
                ? await WooCommerceCustomer.forDomain(domain)
                : WooCommerceCustomer.fromEnvironment();
              
              if (wcCustomer) {
                return { context: await wcCustomer.getCustomerContext(status.customerEmail, conversationId) };
              }
            }
          } catch (fallbackError) {
            console.error('Fallback verification also failed:', fallbackError);
          }
          return null;
        }
      })();
      
      if (customerVerificationPromise) {
        contextPromises.push(customerVerificationPromise);
      }
    }
    
    // 4. WooCommerce for ORDER/DELIVERY queries only (not products)
    // Products and prices should come from scraped website data
    const isOrderDeliveryQuery = /order|tracking|delivery|shipping|return|refund|invoice|receipt|my purchase|where is|when will|status|order #|dispatch/i.test(message);
    
    if (domain && isOrderDeliveryQuery && isCustomerQuery) {
      console.log(`WooCommerce Order Query: domain ${domain}, isOrderDeliveryQuery: ${isOrderDeliveryQuery}`);
      // WooCommerce is ONLY for order/customer data, not product search
      wooCommerceSearchPromise = (async () => {
        try {
          const { data: customerConfig } = await adminSupabase
            .from('customer_configs')
            .select('woocommerce_url')
            .eq('domain', domain)
            .single();
          
          if (customerConfig?.woocommerce_url) {
            // This would fetch order/delivery data after customer verification
            // Not product data - that comes from scraping
            console.log('WooCommerce: Ready for order/delivery queries after verification');
            return [];
          }
          return [];
        } catch (error) {
          console.error('WooCommerce config check failed:', error);
          return [];
        }
      })();
      if (wooCommerceSearchPromise) {
        contextPromises.push(wooCommerceSearchPromise);
      }
    }
    
    // 5. Check if we need real-time stock levels (separate from product info)
    const isStockQuery = /stock|in stock|availability|available|out of stock/i.test(message);
    if (domain && isStockQuery) {
      // This could be a separate API call for real-time stock
      // For now, rely on scraped data which should include stock status
      console.log('Stock query detected - using scraped data');
    }

    // Wait for user message to be saved and all context gathering to complete
    const [saveMessageResult, ...contextResults] = await Promise.allSettled([
      saveUserMessagePromise,
      ...contextPromises,
      historyPromise
    ]);

    // Check if message save failed
    if (saveMessageResult.status === 'rejected') {
      throw new Error('Failed to save user message: ' + saveMessageResult.reason);
    }
    const { error: msgError } = saveMessageResult.value;
    if (msgError) throw msgError;

    // Process context results
    let context = '';
    const sources: { url: string; title: string; relevance: number }[] = [];
    let needsCustomerVerification = false;
    let contextIndex = 0;

    // Process embedding search results
    if (embeddingSearchPromise) {
      const embeddingResult = contextResults[contextIndex++];
      if (embeddingResult && embeddingResult.status === 'fulfilled' && 'value' in embeddingResult && embeddingResult.value) {
        const embeddingResults = embeddingResult.value as Array<{content: string; url: string; title: string; similarity: number}>;
        if (embeddingResults.length > 0) {
          context += '\n\nRelevant website content:\n';
          for (const result of embeddingResults) {
            context += `- ${result.content}\n`;
            sources.push({
              url: result.url,
              title: result.title || 'Untitled',
              relevance: result.similarity,
            });
          }
        }
      }
    }

    // Process customer verification results
    if (customerVerificationPromise) {
      const customerResult = contextResults[contextIndex++];
      if (customerResult && customerResult.status === 'fulfilled' && customerResult.value) {
        const verificationData = customerResult.value as {context: string; prompt?: string; level?: string} | null;
        if (verificationData?.context) {
          // Customer context retrieved
          customerContext = verificationData.context;
          context += customerContext;
          
          // Add verification prompt if needed
          if (verificationData.prompt) {
            verificationPrompt = verificationData.prompt;
          }
        } else if (typeof verificationData === 'string') {
          // Old-style context (fallback)
          customerContext = verificationData;
          context += customerContext;
        } else if ((customerResult.value as any)?.needsVerification) {
          // Customer needs verification (old style)
          needsCustomerVerification = true;
        }
      }
    }

    // Process WooCommerce product search results
    if (wooCommerceSearchPromise) {
      const wooResult = contextResults[contextIndex++];
      if (wooResult && wooResult.status === 'fulfilled' && wooResult.value) {
        const products = wooResult.value as any[];
        if (products.length > 0) {
          context += '\n\nRelevant products:\n';
          products.forEach((product: {name: string; price: string; stock_status: string}) => {
            context += `- ${product.name}: $${product.price} (${product.stock_status})\n`;
          });
        }
      }
    }

    // Process conversation history
    const historyResult = contextResults[contextResults.length - 1];
    const history = historyResult && historyResult.status === 'fulfilled' ? (historyResult.value as any)?.data : null;

    // Prepare messages for AI
    // Determine if we have domain-specific content
    const hasContent = sources.length > 0 || context.trim().length > 0;
    
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: `You are a helpful customer service assistant. Be friendly, professional, and concise.
        ${context ? `Use this context to answer questions:\n${context}` : ''}
        
        Important guidelines:
        ${hasContent ? 
        `- For PRODUCT information, prices, and descriptions: Use the website content provided
        - For ORDER status, delivery tracking, and customer data: This requires verification first
        - Only provide information based on the context provided
        - If stock levels are mentioned on the website, use that information
        - Be helpful and suggest alternatives when possible
        - Keep responses concise and to the point
        - When you reference specific information from a webpage, include the link in your response
        - Format links naturally in your text, for example: "You can find our shipping rates at [example.com/shipping]" or "View our full product catalog here: example.com/products"`
        :
        `- No specific information about this website is available yet
        - The website content hasn't been indexed for ${domain || 'this domain'}
        - Inform the user that you don't have access to specific product or service information
        - Suggest they visit the website directly or contact support for specific details
        - Be apologetic but helpful about the limitation
        - Do NOT make up or guess information about products, services, or policies`
        }
        
        ${needsCustomerVerification ? `
        Customer Verification Required:
        - The user is asking about personal account or order information
        - To protect privacy, ask them to verify their identity first
        - Request their email address to send a verification code
        - Explain this is for security to protect their personal information
        - Be polite and helpful about the verification process
        ` : ''}
        
        ${verificationPrompt ? `
        Additional Information Needed:
        ${verificationPrompt}
        ` : ''}
        
        ${customerContext ? `
        Customer Service Context:
        - You have access to verified customer information
        - Only share information relevant to their question
        - Be helpful with order status, shipping, and account inquiries
        - If they ask about specific orders, provide the details you have
        - Maintain professional boundaries and protect sensitive data
        ` : ''}
        
        ${sources.length > 0 ? `\nRelevant pages for this query:\n${sources.map(s => `- ${s.title}: ${s.url}`).join('\n')}` : ''}`,
      },
    ];

    // Add conversation history
    if (history && history.length > 0) {
      history.forEach((msg: {role: string; content: string}) => {
        messages.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        });
      });
    }

    // Add current message
    messages.push({ role: 'user', content: message });

    // Get AI response
    const completion = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    const aiResponse = completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';

    // Save assistant message
    await adminSupabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: aiResponse,
        metadata: sources.length > 0 ? { sources: sources.map(s => s.url) } : undefined,
      });

    // Prepare response
    const response: ChatResponse = {
      message: aiResponse,
      conversation_id: conversationId!,
      sources: sources.length > 0 ? sources : undefined,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Chat API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}