import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
// Set max duration to 60 seconds for Vercel
export const maxDuration = 60;

import { createServiceRoleClient, validateSupabaseEnv } from '@/lib/supabase-server';
import { ChatResponse } from '@/types';
import OpenAI from 'openai';
import { z } from 'zod';
import { checkDomainRateLimit } from '@/lib/rate-limit';
import { searchSimilarContent } from '@/lib/embeddings';
import { getDynamicWooCommerceClient, searchProductsDynamic } from '@/lib/woocommerce-dynamic';
import { getProductOverview, ProductOverview } from '@/lib/search-overview';
import { sanitizeOutboundLinks } from '@/lib/link-sanitizer';
import { ChatTelemetry, telemetryManager } from '@/lib/chat-telemetry';

// Performance monitoring
class RequestTimer {
  private startTime: number;
  private timeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.startTime = Date.now();
  }

  setPhaseTimeout(phase: string, timeoutMs: number, callback: () => void) {
    const timeout = setTimeout(callback, timeoutMs);
    this.timeouts.set(phase, timeout);
  }

  clearPhaseTimeout(phase: string) {
    const timeout = this.timeouts.get(phase);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(phase);
    }
  }

  clearAll() {
    this.timeouts.forEach(timeout => clearTimeout(timeout));
    this.timeouts.clear();
  }

  elapsed(): number {
    return Date.now() - this.startTime;
  }
}

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

// Request validation
const ChatRequestSchema = z.object({
  message: z.string().min(1).max(5000),
  conversation_id: z.string().uuid().optional(),
  session_id: z.string().min(1),
  domain: z.string().optional(),
  demoId: z.string().optional(),
  config: z.object({
    features: z.object({
      woocommerce: z.object({ enabled: z.boolean() }).optional(),
      websiteScraping: z.object({ enabled: z.boolean() }).optional(),
    }).optional(),
    ai: z.object({
      maxSearchIterations: z.number().min(1).max(5).optional().default(2),
      searchTimeout: z.number().min(1000).max(60000).optional().default(10000),
    }).optional(),
  }).optional(),
});

// Simplified tools - reduce tool calls for better performance
const OPTIMIZED_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "smart_search",
      description: "Intelligent search that automatically determines the best search strategy based on the query",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query"
          },
          searchType: {
            type: "string",
            enum: ["products", "information", "mixed"],
            description: "Type of search to perform",
            default: "mixed"
          },
          limit: {
            type: "number",
            description: "Maximum results to return (use 500 for 'all' queries, 50 for specific items)",
            default: 50,
            minimum: 1,
            maximum: 500
          }
        },
        required: ["query"]
      }
    }
  }
];

// Optimized tool execution with timeout and full metadata
async function executeSmartSearch(
  query: string, 
  searchType: string = "mixed",
  limit: number = 50, 
  domain: string,
  timeoutMs: number = 5000
): Promise<{ success: boolean; results: any[]; source: string; executionTime: number; overview?: ProductOverview }> {
  const startTime = Date.now();
  console.log(`[Smart Search] Starting: "${query}" (type: ${searchType}, limit: ${limit})`);
  
  try {
    const browseDomain = /localhost|127\.0\.0\.1/i.test(domain)
      ? 'thompsonseparts.co.uk'
      : domain.replace(/^https?:\/\//, '').replace('www.', '');
    
    // Parallel search strategy for comprehensive results
    const searchPromises: Promise<any[]>[] = [];
    
    // Get product overview in parallel for full visibility
    console.log(`[Smart Search] Getting overview for query: "${query}", domain: "${browseDomain}"`);
    const overviewPromise = getProductOverview(query, browseDomain)
      .then(result => {
        console.log(`[Smart Search] Overview result:`, result ? `${result.total} total items` : 'null');
        return result;
      })
      .catch(err => {
        console.error('[Smart Search] Overview error:', err.message);
        return null;
      });
    
    // Always add semantic search as primary method
    searchPromises.push(
      searchSimilarContent(query, browseDomain, Math.min(limit, 20), 0.15, timeoutMs - 500)
        .then(results => results.map(r => ({ ...r, type: 'content' })))
        .catch(err => {
          console.error(`[Smart Search] Semantic search error:`, err.message);
          return [];
        })
    );
    
    // Also try WooCommerce if it's for products (but don't rely on it)
    if (searchType === "products" || searchType === "mixed") {
      searchPromises.push(
        searchProductsDynamic(browseDomain, query, Math.min(limit, 5))
          .then(products => products?.map(p => ({
            content: `${p.name}\nPrice: £${p.price || p.regular_price || 'Contact'}\nSKU: ${p.sku || 'N/A'}\nAvailability: ${p.stock_status || 'Unknown'}`,
            url: p.permalink || '',
            title: p.name,
            similarity: 0.95,
            type: 'product',
            stockStatus: p.stock_status
          })) || [])
          .catch(err => {
            // WooCommerce not configured is expected, just return empty
            return [];
          })
      );
    }
    
    // Execute searches with timeout (including overview)
    const [allResults, overview] = await Promise.race([
      Promise.all([Promise.all(searchPromises).then(results => results.flat()), overviewPromise]),
      new Promise<[any[], ProductOverview | null]>((_, reject) => 
        setTimeout(() => reject(new Error('Search timeout')), timeoutMs)
      )
    ]);
    
    // Deduplicate by URL and sort by relevance
    const uniqueResults = Array.from(
      new Map(allResults.map(r => [r.url, r])).values()
    ).sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
    .slice(0, limit);
    
    const executionTime = Date.now() - startTime;
    console.log(`[Smart Search] Completed in ${executionTime}ms: ${uniqueResults.length} results`);
    
    return { 
      success: true, 
      results: uniqueResults, 
      source: searchType,
      executionTime,
      overview: overview || undefined
    };
    
  } catch (error: any) {
    const executionTime = Date.now() - startTime;
    console.error(`[Smart Search] Error after ${executionTime}ms:`, error.message);
    return { 
      success: false, 
      results: [], 
      source: 'error',
      executionTime
    };
  }
}

export async function POST(request: NextRequest) {
  const requestTimer = new RequestTimer();
  let telemetry: ChatTelemetry | null = null;
  
  // Set overall timeout for the entire request (55 seconds to stay under Vercel's 60s limit)
  const overallTimeout = setTimeout(() => {
    console.error('[TIMEOUT] Request exceeded 55 seconds, returning partial response');
  }, 55000);
  
  try {
    // Quick environment check
    if (!validateSupabaseEnv() || !process.env.OPENAI_API_KEY) {
      clearTimeout(overallTimeout);
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const validatedData = ChatRequestSchema.parse(body);
    const { message, conversation_id, session_id, domain, config } = validatedData;

    // Initialize telemetry (non-blocking)
    try {
      telemetry = telemetryManager.createSession(session_id, 'gpt-4', {
        metricsEnabled: true,
        detailedLogging: false, // Reduce logging overhead
        persistToDatabase: false // Skip DB writes for performance
      });
    } catch {}

    // Rate limiting check
    const rateLimitDomain = domain || request.headers.get('host') || 'unknown';
    const { allowed, resetTime } = checkDomainRateLimit(rateLimitDomain);
    
    if (!allowed) {
      clearTimeout(overallTimeout);
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Initialize Supabase (with timeout)
    const supabasePromise = createServiceRoleClient();
    const adminSupabase = await Promise.race([
      supabasePromise,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000))
    ]);
    
    if (!adminSupabase) {
      clearTimeout(overallTimeout);
      return NextResponse.json(
        { error: 'Database connection timeout' },
        { status: 503 }
      );
    }

    // Conversation management - ensure we have a valid conversation record
    let conversationId = conversation_id;
    
    // Check if conversation exists (if ID was provided) or create new
    if (conversationId) {
      // Check if this conversation exists in the database
      const { data: existingConv } = await adminSupabase
        .from('conversations')
        .select('id')
        .eq('id', conversationId)
        .single();
      
      // If it doesn't exist, create it with the provided ID
      if (!existingConv) {
        const { error: createError } = await adminSupabase
          .from('conversations')
          .insert({ 
            id: conversationId,
            session_id: session_id,
            metadata: { domain },
            created_at: new Date().toISOString()
          });
        
        if (createError) {
          console.error('[Chat API] Failed to create conversation with provided ID:', createError);
        }
      }
    } else {
      // No ID provided, create a new conversation
      const { data: newConversation, error: createError } = await adminSupabase
        .from('conversations')
        .insert({ 
          session_id: session_id,
          metadata: { domain },
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();
      
      if (createError) {
        console.error('[Chat API] Failed to create new conversation:', createError);
        // Fallback to UUID if database write fails
        conversationId = crypto.randomUUID();
      } else {
        conversationId = newConversation.id;
      }
    }

    // Save user message asynchronously (non-blocking for speed)
    const saveUserMessage = adminSupabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'user',
        content: message,
        created_at: new Date().toISOString()
      })
      .then(({ error }) => {
        if (error) console.error('[Chat API] Failed to save user message:', error);
      });
    
    // Load conversation history in parallel with message save
    const [historyData] = await Promise.all([
      adminSupabase
        .from('messages')
        .select('role, content')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(10)
        .then(({ data, error }) => {
          if (error) {
            console.error('[Chat API] Failed to load history:', error);
            return [];
          }
          return data || [];
        }),
      saveUserMessage // Run in parallel
    ]);
    
    // Build conversation context with history
    const conversationMessages: Array<{role: 'system' | 'user' | 'assistant'; content: string; tool_calls?: any}> = [
      {
        role: 'system' as const,
        content: `You are a helpful customer service assistant with FULL conversation memory. ALWAYS use the smart_search tool when users ask about products, inventory, or availability.

CONVERSATION CONTEXT:
- You have access to the ENTIRE conversation history
- When users reference "that", "those", "it" etc., check previous messages for context
- Remember products, categories, and details discussed earlier in the conversation
- Build on previous responses rather than starting fresh each time

IMPORTANT: You receive FULL VISIBILITY of search results:
- Total count of ALL matching items
- Category and brand breakdowns
- Detailed information for top results
- Awareness of additional items beyond the detailed results

MANDATORY PRODUCT LISTING RULES:
- ALWAYS mention the total count when showing products
- Use format: "We have [TOTAL] [product type] available. Here are [NUMBER SHOWN]:"
- Example: "We have 24 Teng products available. Here are 5 popular ones:"
- When showing a partial list, ALWAYS add: "...and [X] more [product type] available"
- Example: "...and 19 more Teng products available. Would you like to see more or filter by specific type?"
- NEVER just list items without mentioning the total
- If categories/brands are available, mention them: "These span across [categories/brands]"

This means:
- You can accurately answer "How many X do you have?" without re-searching
- You can filter and recommend from the COMPLETE catalog
- You can provide category/brand statistics immediately
- You DO NOT need to search multiple times for refinements
- When asked about "this product" or "that item", refer to previously discussed products

CRITICAL RULES:
- NEVER suggest external websites or tell customers to "search elsewhere"
- NEVER recommend competitors, manufacturer sites, or third-party retailers
- If a product isn't found, offer to help find alternatives from OUR inventory
- ONLY use category URLs that are explicitly provided in the search results
- DO NOT make up or guess category URLs - use EXACTLY what's given
- If category URLs are provided with "USE THESE EXACT URLS", you MUST use those exact URLs

FORMATTING RULES:
- ALWAYS start with total count: "We have X items matching..."
- Keep product listings clean and easy to read
- Use numbered lists (1. 2. 3.) for products
- Include product names with prices clearly
- Add links as [Product Name](url) when showing products
- End partial lists with: "...plus X more items. Would you like to see [specific category/more options]?"

SEARCH STRATEGY:
- For initial queries → Use limit: 20-50 for detailed results (you'll see total count regardless)
- For counting/statistics → The total count is always provided
- For filtering → You already have the full list, just describe what's available

FOLLOW-UP HANDLING:
- When users ask follow-up questions about previously mentioned products:
  * Reference the specific product details from earlier messages
  * No need to re-search unless they want something different
  * Use phrases like "Regarding the [product name] I mentioned..."
- Examples of follow-ups:
  * "tell me about this" → Look at the last product discussed
  * "what's the price?" → Reference the last item's price
  * "do you have more like that?" → Use context from previous search

STOCK & AVAILABILITY RULES:
- NEVER make up stock quantities - the count of search results is NOT stock level
- When users ask about stock/availability, inform them that you need to check the live inventory system
- Suggest: "I can search for the product, but for real-time stock levels, please use our stock checking system"
- If availability data shows "instock" in search results, say "This item shows as available"
- If availability shows "outofstock", say "This item appears to be out of stock"
- If availability shows "Unknown" or missing, say "Stock status unclear - please verify with our inventory system"
- For specific quantity questions, say "For exact stock quantities, our inventory system needs to be checked directly"
- DO NOT confuse the number of search results with inventory quantity
- Note: Real-time stock checking requires calling the WooCommerce API at /api/woocommerce/stock`
      }
    ];
    
    // Add conversation history (excluding the current message which we'll add after)
    historyData.forEach(msg => {
      if (msg.role === 'user' || msg.role === 'assistant') {
        conversationMessages.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        });
      }
    });
    
    // Add current user message
    conversationMessages.push({
      role: 'user' as const,
      content: message
    });

    // Get OpenAI client
    const openaiClient = getOpenAIClient();
    if (!openaiClient) {
      clearTimeout(overallTimeout);
      throw new Error('OpenAI client not available');
    }

    console.log(`[Optimized Chat] Processing: "${message.substring(0, 50)}..."`);

    // Simplified ReAct loop - maximum 2 iterations for performance
    const maxIterations = Math.min(config?.ai?.maxSearchIterations || 2, 2);
    const searchTimeout = Math.min(config?.ai?.searchTimeout || 5000, 5000);
    
    let allSearchResults: any[] = [];
    let finalResponse = '';
    
    // First AI call with tools
    requestTimer.setPhaseTimeout('ai_initial', 10000, () => {
      console.error('[TIMEOUT] Initial AI call exceeded 10 seconds');
    });
    
    let completion = await openaiClient.chat.completions.create({
      model: 'gpt-4o-mini', // Use faster model for better performance
      messages: conversationMessages,
      tools: OPTIMIZED_TOOLS,
      tool_choice: 'auto',
      temperature: 0.7,
      max_tokens: 800, // Reduced for faster response
    });
    
    requestTimer.clearPhaseTimeout('ai_initial');
    
    // Process tool calls efficiently
    for (let iteration = 0; iteration < maxIterations; iteration++) {
      const choice = completion.choices[0];
      if (!choice?.message) break;
      
      const toolCalls = choice.message.tool_calls;
      
      if (!toolCalls || toolCalls.length === 0) {
        finalResponse = choice.message.content || '';
        break;
      }
      
      console.log(`[Optimized Chat] Iteration ${iteration + 1}: ${toolCalls.length} tool calls`);
      
      // Execute tool calls with strict timeout
      requestTimer.setPhaseTimeout('search', searchTimeout + 1000, () => {
        console.error('[TIMEOUT] Search phase exceeded limit');
      });
      
      const toolResults = await Promise.all(
        toolCalls.map(async (toolCall) => {
          const args = JSON.parse(toolCall.function.arguments || '{}');
          const result = await executeSmartSearch(
            args.query,
            args.searchType,
            args.limit,
            domain || '',
            searchTimeout
          );
          
          if (result.success && result.results.length > 0) {
            allSearchResults.push(...result.results);
          }
          
          // Format response with full visibility metadata
          let toolResponse = '';
          if (result.results.length > 0 || result.overview?.total) {
            const total = result.overview?.total || result.results.length;
            const returned = result.results.length;
            
            // Provide complete context to AI - EMPHASIZE TOTAL COUNT
            toolResponse = `IMPORTANT: TOTAL COUNT = ${total} items found\n`;
            toolResponse += `You MUST tell the user: "We have ${total} [item type] available"\n`;
            toolResponse += `Showing detailed info for ${returned} items below:\n\n`;
            
            // Extract ACTUAL category URLs from the results
            const categoryUrls = new Set<string>();
            result.results.forEach(item => {
              if (item.url) {
                const categoryMatch = item.url.match(/\/product-category\/([^\/]+(?:\/[^\/]+)*)\//);
                if (categoryMatch) {
                  categoryUrls.add(`/product-category/${categoryMatch[1]}/`);
                }
              }
            });
            
            // Include category/brand breakdown if available
            if (result.overview?.categories && result.overview.categories.length > 0) {
              toolResponse += 'Categories found: ';
              toolResponse += result.overview.categories.map(c => `${c.value} (${c.count})`).join(', ');
              toolResponse += '\n';
            }
            
            // Add ACTUAL category URLs found in results
            if (categoryUrls.size > 0) {
              toolResponse += '\nActual category pages from results:\n';
              Array.from(categoryUrls).slice(0, 3).forEach(url => {
                toolResponse += `- ${url}\n`;
              });
              toolResponse += 'USE THESE EXACT URLS when suggesting categories to browse.\n\n';
            }
            
            if (result.overview?.brands && result.overview.brands.length > 0) {
              toolResponse += 'Brands: ';
              toolResponse += result.overview.brands.map(b => `${b.value} (${b.count})`).join(', ');
              toolResponse += '\n';
            }
            
            toolResponse += '\nDetailed results:\n';
            result.results.slice(0, Math.min(5, returned)).forEach((item, idx) => {
              toolResponse += `${idx + 1}. ${item.title}\n`;
              if (item.type === 'product' && item.content.includes('£')) {
                toolResponse += `   ${item.content.split('\n')[1]}\n`;
              }
              // Include the URL if available
              if (item.url) {
                toolResponse += `   URL: ${item.url}\n`;
              }
            });
            
            // Category pages are already included above if categories were found
            // The AI will use the category information provided to suggest relevant browsing options
            
            // If we have many more results, list some IDs for awareness
            if (result.overview?.allIds && result.overview.allIds.length > returned) {
              const additionalCount = result.overview.allIds.length - returned;
              toolResponse += `\nREMINDER: ${additionalCount} MORE items exist beyond those shown above!\n`;
              toolResponse += `You MUST mention to the user: "...plus ${additionalCount} more items available"\n`;
              toolResponse += `Additional items include: `;
              toolResponse += result.overview.allIds.slice(returned, returned + 10).map(i => i.title).join(', ');
              if (additionalCount > 10) toolResponse += ', ...';
              toolResponse += '\n';
            }
          } else {
            toolResponse = 'No results found for this specific search. I can help you browse our categories or search for alternative products.';
          }
          
          return {
            tool_call_id: toolCall.id,
            content: toolResponse
          };
        })
      );
      
      requestTimer.clearPhaseTimeout('search');
      
      // Add results to conversation
      conversationMessages.push({
        role: 'assistant' as const,
        content: choice.message.content,
        tool_calls: toolCalls
      } as any);
      
      toolResults.forEach(result => {
        conversationMessages.push({
          role: 'tool' as const,
          tool_call_id: result.tool_call_id,
          content: result.content
        } as any);
      });
      
      // Get next response (or final if last iteration)
      const isLastIteration = iteration === maxIterations - 1;
      
      requestTimer.setPhaseTimeout('ai_followup', 8000, () => {
        console.error('[TIMEOUT] Follow-up AI call exceeded 8 seconds');
      });
      
      completion = await openaiClient.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: conversationMessages,
        tools: isLastIteration ? undefined : OPTIMIZED_TOOLS,
        temperature: 0.7,
        max_tokens: 800,
      });
      
      requestTimer.clearPhaseTimeout('ai_followup');
      
      if (isLastIteration || !completion.choices[0]?.message?.tool_calls) {
        finalResponse = completion.choices[0]?.message?.content || '';
        break;
      }
    }
    
    // Clean up response
    finalResponse = finalResponse.replace(/\n{3,}/g, '\n\n').trim();
    
    // Save assistant response asynchronously
    adminSupabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: finalResponse,
        created_at: new Date().toISOString()
      })
      .then(({ error }) => {
        if (error) console.error('[Chat API] Failed to save assistant message:', error);
      });
    
    // Sanitize links
    const allowedDomain = (domain && !/localhost|127\.0\.0\.1|vercel/i.test(domain))
      ? domain : 'thompsonseparts.co.uk';
    finalResponse = sanitizeOutboundLinks(finalResponse, allowedDomain);
    
    const totalTime = requestTimer.elapsed();
    console.log(`[Optimized Chat] Completed in ${totalTime}ms`);
    
    // Clear timeout
    clearTimeout(overallTimeout);
    requestTimer.clearAll();
    
    // Complete telemetry (non-blocking)
    telemetry?.complete(finalResponse).catch(() => {});
    
    // Return optimized response
    return NextResponse.json<ChatResponse>({
      message: finalResponse,
      conversation_id: conversationId,
      sources: allSearchResults.slice(0, 5).map(r => ({
        url: r.url,
        title: r.title,
        relevance: r.similarity || 0.5
      })),
      metadata: {
        executionTime: totalTime,
        searchCount: allSearchResults.length
      }
    } as any);

  } catch (error) {
    clearTimeout(overallTimeout);
    requestTimer.clearAll();
    
    console.error('[Optimized Chat API] Error:', error);
    
    // Complete telemetry with error (non-blocking)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    telemetry?.complete(undefined, errorMessage).catch(() => {});
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request format', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}