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
          // First, look up the domain_id for fallback search
          let domainId: string | null = null;
          if (domain) {
            const { data: domainData } = await adminSupabase
              .from('domains')
              .select('id')
              .eq('domain', domain.replace('www.', ''))
              .single();
            
            if (domainData) {
              domainId = domainData.id;
            }
          }
          
          const openaiClient = getOpenAIClient();
          if (!openaiClient) {
            console.error('[Chat API] OpenAI client not available for embeddings');
            return [];
          }
          const embeddingResponse = await openaiClient.embeddings.create({
            model: 'text-embedding-3-small',
            input: message,
          });
          const embedding = embeddingResponse.data[0]?.embedding;

          if (embedding) {
            const { data: relevantChunks, error } = await adminSupabase.rpc('search_embeddings', {
              query_embedding: embedding,
              p_domain_id: domainId,  // Use proper domain_id
              match_threshold: 0.7,
              match_count: 5
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
    const isCustomerQuery = /order|tracking|delivery|account|email|invoice|receipt|refund|return|my purchase|my order|where is|when will|status|cancel|change.*address|update.*address|modify/i.test(message);
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
    const isOrderDeliveryQuery = /order|tracking|delivery|shipping|return|refund|invoice|receipt|my purchase|where is|when will|status|order #|dispatch|cancel|change.*address|update.*address|modify/i.test(message);
    
    // Check for order modification intent early
    let orderModificationIntent: { type?: string; confidence: number } | null = null;
    let orderModificationContext = '';
    
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
            // Check if customer is verified for this conversation
            const verificationStatus = await CustomerVerification.checkVerificationStatus(conversationId);
            
            // Extract potential order number, email, and customer name from message
            const orderNumberMatch = message.match(/#?(\d{4,})/);
            const emailMatch = message.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
            const orderNumber = orderNumberMatch?.[1];
            const extractedEmail = emailMatch?.[0];
            
            // Enhanced name extraction patterns
            const namePatterns = [
              /orders?\s+(?:for|of)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,  // "orders for John Smith"
              /(?:show\s+me\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)[''']s?\s+orders?/i,  // "John Smith's orders" or "Show me John Smith's orders"
              /(?:my name is|i'm|i am|this is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,  // "my name is John Smith"
              /customer\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)(?:\s|$)/i       // "customer John Smith"
            ];
            
            let extractedName = null;
            for (const pattern of namePatterns) {
              const match = message.match(pattern);
              if (match) {
                extractedName = match[1];
                break;
              }
            }
            
            // Determine if we need verification based on query type
            const isSpecificOrderQuery = !!orderNumber;
            const isGeneralOrderQuery = !orderNumber && /my order|my purchase|my delivery|my shipping|my return/i.test(message);
            
            // For specific order queries or queries about "my" orders, require verification
            if ((isSpecificOrderQuery || isGeneralOrderQuery) && !verificationStatus.isVerified) {
              console.log('Customer verification required for order access');
              
              // Check if user provided email with their query
              if (extractedEmail) {
                // Try simple verification first if order number is provided
                if (orderNumber) {
                  const simpleVerification = await SimpleCustomerVerification.verifyCustomer({
                    conversationId,
                    email: extractedEmail,
                    orderNumber: orderNumber
                  }, domain);
                  
                  if (simpleVerification.level === 'full' || simpleVerification.level === 'basic') {
                    console.log('Simple verification successful, proceeding with order fetch');
                    // Update conversation with verified email
                    if (simpleVerification.customerEmail) {
                      await adminSupabase
                        .from('conversations')
                        .update({ 
                          verified_customer_email: simpleVerification.customerEmail,
                          verification_status: 'verified'
                        })
                        .eq('id', conversationId);
                    }
                    // Continue with order fetching below
                  } else {
                    // Return verification prompt
                    return [{
                      type: 'verification_required',
                      data: {
                        message: 'To access order information, please verify your identity.',
                        method: 'email',
                        hasOrderNumber: !!orderNumber
                      },
                      summary: 'Customer verification required for order access'
                    }];
                  }
                } else {
                  // For general queries without order number, require OTP verification
                  return [{
                    type: 'verification_required',
                    data: {
                      message: 'To access your order information, please provide your email address for verification.',
                      method: 'email_otp',
                      requiresEmail: true
                    },
                    summary: 'Email verification required for order access'
                  }];
                }
              } else {
                // No email provided, prompt for verification
                if (orderNumber) {
                  return [{
                    type: 'verification_required',
                    data: {
                      message: `To access order #${orderNumber}, please provide your email address associated with this order.`,
                      method: 'order_email',
                      orderNumber: orderNumber
                    },
                    summary: 'Email verification required for specific order'
                  }];
                } else {
                  return [{
                    type: 'verification_required',
                    data: {
                      message: 'To access your order information, please provide your email address.',
                      method: 'email',
                      requiresEmail: true
                    },
                    summary: 'Email verification required'
                  }];
                }
              }
            }
            
            // Import and use dynamic WooCommerce client
            const { getDynamicWooCommerceClient } = await import('@/lib/woocommerce-dynamic');
            const wc = await getDynamicWooCommerceClient(domain);
            
            if (wc) {
              console.log('WooCommerce: Fetching order data for domain', domain);
              
              // If verified, we can show full order details
              // If not verified but asking general questions, show limited info
              const isVerified = verificationStatus.isVerified;
              
              if (orderNumber) {
                try {
                  // Fetch specific order
                  const order = await wc.getOrder(parseInt(orderNumber));
                  console.log('Found order:', orderNumber);
                  
                  // Log access if verified
                  if (isVerified && verificationStatus.customerEmail) {
                    await CustomerVerification.logAccess(
                      conversationId,
                      verificationStatus.customerEmail,
                      order.customer_id || null,
                      [`order_${orderNumber}`],
                      'Customer requested specific order details',
                      'email_verification'
                    );
                  }
                  
                  // Return full or limited data based on verification
                  if (isVerified) {
                    return [{
                      type: 'order',
                      data: order,
                      summary: `Order #${orderNumber}: ${order.status}, Total: ${order.currency_symbol}${order.total}`
                    }];
                  } else {
                    // Limited info for unverified users (only public info)
                    return [{
                      type: 'order_limited',
                      data: {
                        id: order.id,
                        status: order.status,
                        date_created: order.date_created
                      },
                      summary: `Order #${orderNumber} exists. Please verify your email to see full details.`
                    }];
                  }
                } catch (err) {
                  console.log('Order not found:', orderNumber);
                  // For unverified users, don't reveal if order exists or not
                  if (!isVerified) {
                    return [{
                      type: 'verification_required',
                      data: {
                        message: 'Please verify your email to access order information.',
                        method: 'email'
                      },
                      summary: 'Verification required'
                    }];
                  }
                  // For verified users, show recent orders
                  const recentOrders = await wc.getOrders({ per_page: 5, orderby: 'date', order: 'desc' });
                  return recentOrders.map((order: any) => ({
                    type: 'order',
                    data: order,
                    summary: `Order #${order.id}: ${order.status}`
                  }));
                }
              } else if (extractedEmail && !orderNumber) {
                // User provided email - search for orders by email
                console.log('Searching for orders by email:', extractedEmail);
                
                // Require verification for email searches (sensitive data)
                if (!isVerified || verificationStatus.customerEmail !== extractedEmail.toLowerCase()) {
                  return [{
                    type: 'verification_required',
                    data: {
                      message: `To access orders for ${extractedEmail}, please verify this email address.`,
                      method: 'email_verification',
                      email: extractedEmail
                    },
                    summary: 'Email verification required for customer search'
                  }];
                }
                
                try {
                  // First find the customer by email
                  const customers = await wc.getCustomers({ email: extractedEmail.toLowerCase() });
                  
                  if (customers && customers.length > 0) {
                    const customer = customers[0];
                    console.log('Found customer by email:', customer.email);
                    
                    // Get orders for this customer
                    const orders = await wc.getOrders({ 
                      customer: customer.id,
                      per_page: 10,
                      orderby: 'date',
                      order: 'desc'
                    });
                    
                    // Log access
                    await CustomerVerification.logAccess(
                      conversationId,
                      extractedEmail,
                      customer.id,
                      ['customer_orders_by_email'],
                      `Retrieved orders for email: ${extractedEmail}`,
                      'email_verification'
                    );
                    
                    if (orders.length > 0) {
                      return orders.slice(0, 5).map((order: any) => ({
                        type: 'order',
                        data: order,
                        summary: `Order #${order.id}: ${order.status}, Date: ${order.date_created}, Total: ${order.currency_symbol || '$'}${order.total}`
                      }));
                    } else {
                      return [{
                        type: 'message',
                        data: null,
                        summary: `No orders found for customer with email: ${extractedEmail}`
                      }];
                    }
                  } else {
                    return [{
                      type: 'message',
                      data: null,
                      summary: `No customer found with email: ${extractedEmail}`
                    }];
                  }
                } catch (err) {
                  console.error('Error searching by email:', err);
                  return [{
                    type: 'error',
                    data: null,
                    summary: `Unable to search for orders by email. Please try with an order number instead.`
                  }];
                }
              } else if (extractedName && !orderNumber && !extractedEmail) {
                // User provided name - search for customers by name
                console.log('Searching for orders by customer name:', extractedName);
                
                // Require verification for name searches (can return multiple customers)
                if (!isVerified) {
                  return [{
                    type: 'verification_required',
                    data: {
                      message: `To search for customer "${extractedName}", please verify your email address first.`,
                      method: 'email_verification',
                      requiresEmail: true
                    },
                    summary: 'Verification required for customer name search'
                  }];
                }
                
                try {
                  // Search for customers with this name
                  const customers = await wc.getCustomers({ 
                    search: extractedName,
                    per_page: 5
                  });
                  
                  if (customers && customers.length > 0) {
                    if (customers.length === 1) {
                      // Single customer found
                      const customer = customers[0];
                      console.log('Found single customer by name:', customer.email);
                      
                      // Additional check: verify this is the right customer
                      const fullName = `${customer.first_name} ${customer.last_name}`.trim();
                      if (verificationStatus.customerEmail && 
                          customer.email.toLowerCase() !== verificationStatus.customerEmail.toLowerCase()) {
                        return [{
                          type: 'verification_required',
                          data: {
                            message: `Found customer "${fullName}" with email ${customer.email}. Please verify this email to access their orders.`,
                            method: 'email_verification',
                            email: customer.email
                          },
                          summary: 'Email verification required for found customer'
                        }];
                      }
                      
                      // Get orders for this customer
                      const orders = await wc.getOrders({ 
                        customer: customer.id,
                        per_page: 10,
                        orderby: 'date',
                        order: 'desc'
                      });
                      
                      // Log access
                      await CustomerVerification.logAccess(
                        conversationId,
                        customer.email,
                        customer.id,
                        ['customer_orders_by_name'],
                        `Retrieved orders for customer name: ${extractedName}`,
                        'name_search'
                      );
                      
                      if (orders.length > 0) {
                        return orders.slice(0, 5).map((order: any) => ({
                          type: 'order',
                          data: order,
                          summary: `Order #${order.id}: ${order.status}, Date: ${order.date_created}, Total: ${order.currency_symbol || '$'}${order.total}`,
                          customerInfo: {
                            email: customer.email,
                            name: fullName
                          }
                        }));
                      } else {
                        return [{
                          type: 'message',
                          data: null,
                          summary: `No orders found for ${fullName} (${customer.email})`
                        }];
                      }
                    } else {
                      // Multiple customers found
                      console.log(`Found ${customers.length} customers matching name: ${extractedName}`);
                      const customerList = customers.map((c: any) => ({
                        email: c.email,
                        name: `${c.first_name} ${c.last_name}`.trim(),
                        id: c.id
                      }));
                      
                      return [{
                        type: 'multiple_customers',
                        data: {
                          customers: customerList,
                          searchTerm: extractedName
                        },
                        summary: `Found ${customers.length} customers matching "${extractedName}". Please provide an email address or order number for accurate results.`,
                        message: `Multiple customers found:\n${customerList.map(c => `- ${c.name} (${c.email})`).join('\n')}\n\nPlease specify which customer you're looking for by providing their email address or order number.`
                      }];
                    }
                  } else {
                    return [{
                      type: 'message',
                      data: null,
                      summary: `No customer found with name: ${extractedName}`
                    }];
                  }
                } catch (err) {
                  console.error('Error searching by name:', err);
                  return [{
                    type: 'error',
                    data: null,
                    summary: `Unable to search for customers by name. Please try with an email address or order number instead.`
                  }];
                }
              } else if (isVerified && verificationStatus.customerEmail) {
                // Verified user asking about their orders - fetch by email
                console.log('Fetching orders for verified customer:', verificationStatus.customerEmail);
                const customerOrders = await wc.getOrders({ 
                  email: verificationStatus.customerEmail,
                  per_page: 5, 
                  orderby: 'date', 
                  order: 'desc' 
                });
                
                // Log access
                await CustomerVerification.logAccess(
                  conversationId,
                  verificationStatus.customerEmail,
                  null,
                  ['recent_orders'],
                  'Customer requested order history',
                  'email_verification'
                );
                
                return customerOrders.map((order: any) => ({
                  type: 'order',
                  data: order,
                  summary: `Order #${order.id}: ${order.status}, Date: ${order.date_created}`
                }));
              } else {
                // General query, no verification - return generic info only
                console.log('Returning generic order info for unverified user');
                return [{
                  type: 'general_info',
                  data: {
                    message: 'For order inquiries, you can track your order using your order number and email address.'
                  },
                  summary: 'General order information'
                }];
              }
            }
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
    const isStockQuery = /stock|in stock|availability|available|out of stock|inventory|how many/i.test(message);
    let stockCheckPromise: Promise<any[]> | null = null;
    
    if (domain && isStockQuery) {
      console.log(`Real-time stock check: domain ${domain}`);
      stockCheckPromise = (async () => {
        try {
          const { data: customerConfig } = await adminSupabase
            .from('customer_configs')
            .select('woocommerce_url')
            .eq('domain', domain)
            .single();
          
          if (customerConfig?.woocommerce_url) {
            const { getDynamicWooCommerceClient } = await import('@/lib/woocommerce-dynamic');
            const wc = await getDynamicWooCommerceClient(domain);
            
            if (wc) {
              console.log('WooCommerce: Fetching real-time stock data for domain', domain);
              
              // Extract product identifiers from the message
              // Look for SKUs (usually alphanumeric codes)
              const skuPattern = /\b[A-Z0-9]{3,}[-_]?[A-Z0-9]*\b/gi;
              const skuMatches = message.match(skuPattern) || [];
              
              // Look for product names (quoted text or specific product mentions)
              const quotedPattern = /"([^"]+)"|'([^']+)'/g;
              const quotedMatches = [...message.matchAll(quotedPattern)].map(m => m[1] || m[2]);
              
              // Also extract general product terms for broader searches
              const productTerms = message
                .toLowerCase()
                .replace(/stock|availability|available|in stock|out of stock|inventory|how many/gi, '')
                .trim()
                .split(/\s+/)
                .filter(term => term.length > 2);
              
              const stockResults: any[] = [];
              
              // First, try to find products by SKU (most accurate)
              for (const sku of skuMatches) {
                try {
                  const products = await wc.getProducts({ 
                    sku: sku,
                    per_page: 1,
                    status: 'publish'
                  });
                  if (products && products.length > 0) {
                    console.log(`Found product by SKU ${sku}:`, products[0].name);
                    stockResults.push({
                      type: 'stock',
                      method: 'sku',
                      data: products[0],
                      summary: `${products[0].name} (SKU: ${products[0].sku}): ${
                        products[0].manage_stock 
                          ? `${products[0].stock_quantity || 0} in stock`
                          : products[0].stock_status === 'instock' ? 'In stock' : 
                            products[0].stock_status === 'outofstock' ? 'Out of stock' :
                            'On backorder'
                      }`
                    });
                  }
                } catch (err) {
                  console.log(`SKU ${sku} not found`);
                }
              }
              
              // Then, search by quoted product names
              for (const quotedName of quotedMatches) {
                if (!stockResults.some(r => r.data.name?.toLowerCase().includes(quotedName.toLowerCase()))) {
                  try {
                    const products = await wc.getProducts({
                      search: quotedName,
                      per_page: 3,
                      status: 'publish'
                    });
                    for (const product of products) {
                      if (!stockResults.some(r => r.data.id === product.id)) {
                        console.log(`Found product by name search "${quotedName}":`, product.name);
                        stockResults.push({
                          type: 'stock',
                          method: 'name_search',
                          data: product,
                          summary: `${product.name}: ${
                            product.manage_stock 
                              ? `${product.stock_quantity || 0} in stock`
                              : product.stock_status === 'instock' ? 'In stock' : 
                                product.stock_status === 'outofstock' ? 'Out of stock' :
                                'On backorder'
                          }`
                        });
                      }
                    }
                  } catch (err) {
                    console.log(`Search for "${quotedName}" failed:`, err);
                  }
                }
              }
              
              // If no specific products found, do a general search with the cleaned message
              if (stockResults.length === 0 && productTerms.length > 0) {
                const searchQuery = productTerms.join(' ');
                try {
                  const products = await wc.getProducts({
                    search: searchQuery,
                    per_page: 5,
                    status: 'publish',
                    orderby: 'popularity',
                    order: 'desc'
                  });
                  for (const product of products) {
                    console.log(`Found product by general search "${searchQuery}":`, product.name);
                    stockResults.push({
                      type: 'stock',
                      method: 'general_search',
                      data: product,
                      summary: `${product.name}: ${
                        product.manage_stock 
                          ? `${product.stock_quantity || 0} in stock`
                          : product.stock_status === 'instock' ? 'In stock' : 
                            product.stock_status === 'outofstock' ? 'Out of stock' :
                            'On backorder'
                      }`
                    });
                  }
                } catch (err) {
                  console.log(`General search for "${searchQuery}" failed:`, err);
                }
              }
              
              // If still no results, get low stock items as these might be of interest
              if (stockResults.length === 0) {
                try {
                  console.log('No specific products found, fetching low stock items');
                  const products = await wc.getProducts({
                    stock_status: 'outofstock',
                    per_page: 5,
                    status: 'publish'
                  });
                  for (const product of products) {
                    stockResults.push({
                      type: 'stock',
                      method: 'out_of_stock',
                      data: product,
                      summary: `${product.name}: Out of stock`
                    });
                  }
                } catch (err) {
                  console.log('Failed to fetch out of stock items:', err);
                }
              }
              
              return stockResults;
            }
          }
          return [];
        } catch (error) {
          console.error('Stock check failed:', error);
          return [];
        }
      })();
      
      if (stockCheckPromise) {
        contextPromises.push(stockCheckPromise);
      }
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

    // Process WooCommerce results (orders or products)
    if (wooCommerceSearchPromise) {
      const wooResult = contextResults[contextIndex++];
      if (wooResult && wooResult.status === 'fulfilled' && wooResult.value) {
        const wooData = wooResult.value as any[];
        if (wooData.length > 0) {
          // Check if verification is required
          if (wooData[0].type === 'verification_required') {
            needsCustomerVerification = true;
            const verificationData = wooData[0].data;
            context += '\n\n[CUSTOMER VERIFICATION REQUIRED]\n';
            context += `The customer is asking about order information but has not been verified.\n`;
            context += `Verification message: ${verificationData.message}\n`;
            context += `Verification method: ${verificationData.method}\n`;
            if (verificationData.orderNumber) {
              context += `Order number mentioned: ${verificationData.orderNumber}\n`;
            }
            context += '\nIMPORTANT: Ask the customer to provide their email address to verify their identity before showing any sensitive order details.\n';
            context += 'For order inquiries, explain that you need to verify their identity for security purposes.\n';
            context += 'Be helpful and reassuring about the verification process.\n';
          } else if (wooData[0].type === 'order_limited') {
            // Limited order info for unverified users
            context += '\n\n[LIMITED ORDER INFORMATION - USER NOT VERIFIED]\n';
            const limitedOrder = wooData[0].data;
            context += `Order #${limitedOrder.id} exists with status: ${limitedOrder.status}\n`;
            context += `Created on: ${limitedOrder.date_created}\n`;
            context += 'Note: Full order details are not shown because customer verification is required.\n';
            context += 'Ask the customer to verify their email to see complete order information.\n';
          } else if (wooData[0].type === 'general_info') {
            // General information only
            context += '\n\n[GENERAL ORDER INFORMATION]\n';
            context += wooData[0].data.message + '\n';
            context += 'Provide general help about order tracking without showing specific order details.\n';
          } else if (wooData[0].type === 'multiple_customers') {
            // Multiple customers found - need clarification
            context += '\n\n[MULTIPLE CUSTOMERS FOUND]\n';
            const multipleData = wooData[0].data;
            context += `Found ${multipleData.customers.length} customers matching "${multipleData.searchTerm}":\n`;
            multipleData.customers.forEach((c: any) => {
              context += `- ${c.name} (${c.email})\n`;
            });
            context += '\nAsk the customer to provide an email address or order number to identify the correct account.\n';
            context += 'Be helpful about narrowing down the search.\n';
          } else if (wooData[0].type === 'message') {
            // Informational message (no customer found, no orders found, etc.)
            context += '\n\n[SEARCH RESULT]\n';
            context += wooData[0].summary + '\n';
            if (wooData[0].message) {
              context += wooData[0].message + '\n';
            }
            context += 'Provide helpful suggestions for the customer to find their order information.\n';
          } else if (wooData[0].type === 'error') {
            // Error occurred during search
            context += '\n\n[SEARCH ERROR]\n';
            context += wooData[0].summary + '\n';
            context += 'Apologize for the technical issue and suggest alternative ways to help.\n';
          } else if (wooData[0].type === 'order') {
            // Full order data (verified customer)
            context += '\n\nOrder Information (Verified Customer):\n';
            
            // Check for modification intent when we have order data
            try {
              const { OrderModificationService } = await import('@/lib/woocommerce-order-modifications');
              const detectedIntent = OrderModificationService.detectModificationIntent(message);
              
              if (detectedIntent && detectedIntent.confidence > 0.7) {
                orderModificationIntent = detectedIntent;
              }
            } catch (error) {
              console.error('Failed to detect modification intent:', error);
            }
            
            wooData.forEach((item: any) => {
              const order = item.data;
              context += `Order #${order.id}:\n`;
              context += `  Status: ${order.status}\n`;
              context += `  Date: ${order.date_created}\n`;
              context += `  Total: ${order.currency_symbol || '$'}${order.total}\n`;
              context += `  Customer: ${order.billing?.first_name} ${order.billing?.last_name}\n`;
              context += `  Email: ${order.billing?.email}\n`;
              if (order.shipping) {
                context += `  Shipping: ${order.shipping.first_name} ${order.shipping.last_name}, ${order.shipping.city}, ${order.shipping.state} ${order.shipping.postcode}\n`;
              }
              if (order.line_items && order.line_items.length > 0) {
                context += `  Items:\n`;
                order.line_items.forEach((item: any) => {
                  context += `    - ${item.name} x${item.quantity} - ${order.currency_symbol || '$'}${item.total}\n`;
                });
              }
              // If customerInfo is provided (from email/name search), include it
              if (item.customerInfo) {
                context += `  [Search Result: Found for ${item.customerInfo.name} (${item.customerInfo.email})]\n`;
              }
              
              // Add modification context if intent detected
              if (orderModificationIntent && orderModificationIntent.type) {
                const modType = orderModificationIntent.type as 'cancel' | 'update_address' | 'request_refund' | 'add_note';
                const ALLOWED_STATUSES = {
                  cancel: ['pending', 'processing', 'on-hold'],
                  update_address: ['pending', 'processing', 'on-hold'],
                  request_refund: ['processing', 'completed', 'on-hold'],
                  add_note: ['any']
                };
                
                const allowedForType = ALLOWED_STATUSES[modType];
                const isAllowed = allowedForType.includes('any') || allowedForType.includes(order.status);
                
                if (isAllowed) {
                  orderModificationContext = `\n[ORDER MODIFICATION AVAILABLE]\n`;
                  if (modType === 'cancel') {
                    orderModificationContext += `• Customer wants to cancel order #${order.id}\n`;
                    orderModificationContext += `• Current status (${order.status}) allows cancellation\n`;
                    orderModificationContext += `• Ask for confirmation before proceeding - explain this cannot be undone\n`;
                  } else if (modType === 'update_address') {
                    orderModificationContext += `• Customer wants to update shipping address for order #${order.id}\n`;
                    orderModificationContext += `• Current status (${order.status}) allows address update\n`;
                    orderModificationContext += `• Request the complete new address with all fields\n`;
                  } else if (modType === 'request_refund') {
                    orderModificationContext += `• Customer wants to request a refund for order #${order.id}\n`;
                    orderModificationContext += `• Current status (${order.status}) allows refund requests\n`;
                    orderModificationContext += `• Ask about the reason and explain the 3-5 business day processing time\n`;
                  } else if (modType === 'add_note') {
                    orderModificationContext += `• Customer wants to add a note to order #${order.id}\n`;
                    orderModificationContext += `• Notes can be added to any order\n`;
                  }
                } else {
                  orderModificationContext = `\n[ORDER MODIFICATION RESTRICTED]\n`;
                  orderModificationContext += `• Customer wants to ${modType.replace('_', ' ')} order #${order.id}\n`;
                  orderModificationContext += `• This is NOT allowed for orders in "${order.status}" status\n`;
                  orderModificationContext += `• Allowed statuses: ${allowedForType.join(', ')}\n`;
                  orderModificationContext += `• Apologize and explain why the modification cannot be made\n`;
                }
              }
              
              context += '\n';
            });
          } else {
            // Legacy product data format
            context += '\n\nRelevant products:\n';
            wooData.forEach((product: {name: string; price: string; stock_status: string}) => {
              context += `- ${product.name}: $${product.price} (${product.stock_status})\n`;
            });
          }
        }
      }
    }

    // Process real-time stock check results
    if (stockCheckPromise) {
      const stockResult = contextResults[contextIndex++];
      if (stockResult && stockResult.status === 'fulfilled' && stockResult.value) {
        const stockData = stockResult.value as any[];
        if (stockData.length > 0) {
          context += '\n\nReal-Time Stock Information:\n';
          stockData.forEach((item: any) => {
            const product = item.data;
            context += `${product.name}`;
            if (product.sku) {
              context += ` (SKU: ${product.sku})`;
            }
            context += ':\n';
            
            // Stock details
            if (product.manage_stock) {
              context += `  Stock Quantity: ${product.stock_quantity || 0} units\n`;
              context += `  Stock Status: ${
                product.stock_quantity > 10 ? 'In Stock (Good availability)' :
                product.stock_quantity > 0 ? `In Stock (${product.stock_quantity} remaining)` :
                'Out of Stock'
              }\n`;
            } else {
              context += `  Stock Status: ${
                product.stock_status === 'instock' ? 'In Stock' :
                product.stock_status === 'outofstock' ? 'Out of Stock' :
                product.stock_status === 'onbackorder' ? 'Available on Backorder' :
                product.stock_status
              }\n`;
            }
            
            // Add price information for context
            if (product.price) {
              context += `  Price: $${product.price}`;
              if (product.sale_price && product.sale_price !== product.price) {
                context += ` (Regular: $${product.regular_price})`;
              }
              context += '\n';
            }
            
            // Add variations info if this is a variable product
            if (product.type === 'variable' && product.variations && product.variations.length > 0) {
              context += `  Note: This is a variable product with ${product.variations.length} variations\n`;
            }
            
            context += '\n';
          });
          
          // Add method used for finding products (for debugging/transparency)
          const methods = [...new Set(stockData.map(item => item.method))];
          if (methods.includes('out_of_stock')) {
            context += 'Note: Showing out-of-stock items as no specific products were found in the query.\n';
          }
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
        - For STOCK availability: Use the Real-Time Stock Information if provided (this is live data from WooCommerce)
        - For ORDER status, delivery tracking, and customer data: This requires verification first
        - Only provide information based on the context provided
        - When Real-Time Stock Information is available, prioritize it over scraped website content for stock status
        - If a product shows specific stock quantities, mention the exact number to the customer
        - Be helpful and suggest alternatives when products are out of stock
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
        ${orderModificationContext ? `
        
        Order Modification Instructions:
        ${orderModificationContext}
        
        Modification Guidelines:
        - For CANCELLATIONS: Always confirm the customer understands this cannot be undone. Say something like "Are you sure you want to cancel order #[ID]? This action cannot be reversed."
        - For ADDRESS UPDATES: Request the complete new address including: Full name, Street address, City, State/Province, ZIP/Postal code, Country
        - For REFUNDS: Explain that refunds typically process within 3-5 business days after approval. Ask for the reason to help process the request.
        - For NOTES: Simply confirm what note they want to add to their order.
        - Always be empathetic and helpful when customers need to modify orders
        - If a modification is not allowed, explain why clearly and suggest alternatives
        ` : ''}
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
    const openaiClient = getOpenAIClient();
    if (!openaiClient) {
      return NextResponse.json(
        { 
          error: 'AI service unavailable',
          message: 'The AI service is temporarily unavailable. Please try again later.'
        },
        { status: 503 }
      );
    }
    
    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-4.1',
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
