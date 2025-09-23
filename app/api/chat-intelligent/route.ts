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
import { CategoryMapper } from '@/lib/category-mapper';
import { WOOCOMMERCE_TOOL, executeWooCommerceOperation, formatWooCommerceResponse } from '@/lib/chat/woocommerce-tool';

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
  },
  WOOCOMMERCE_TOOL // Add WooCommerce agent tool
];

// Analyze URL patterns to intelligently detect category structure  
async function analyzeCategoryStructure(results: any[], supabase: any): Promise<{
  categoryUrls: string[];
  categoryPatterns: Map<string, number>;
  suggestedCategory?: string;
}> {
  const categoryPatterns = new Map<string, number>();
  const categoryUrls: string[] = [];
  
  // Use intelligent CategoryMapper
  const mapper = new CategoryMapper(supabase);
  const categoryInfo = await mapper.findCategoryForQuery('', results);
  
  if (categoryInfo && categoryInfo.confidence > 0.5) {
    // We found a strong category match
    if (categoryInfo.url) {
      categoryUrls.push(categoryInfo.url);
    }
    categoryPatterns.set(categoryInfo.category, results.length);
    
    return {
      categoryUrls,
      categoryPatterns,
      suggestedCategory: categoryInfo.category
    };
  }
  
  // Fallback to basic URL analysis if mapper doesn't find strong match
  const seenCategories = new Set<string>();
  
  results.forEach(item => {
    if (!item.url) return;
    
    // Look for category patterns in URLs
    // Pattern 1: /product-category/xxx/
    const categoryMatch = item.url.match(/\/product-category\/([^\/]+)/);
    if (categoryMatch) {
      const categoryPath = categoryMatch[0];
      const fullCategoryUrl = item.url.split('/product-category/')[0] + categoryPath + '/';
      
      if (!seenCategories.has(fullCategoryUrl)) {
        seenCategories.add(fullCategoryUrl);
        categoryUrls.push(fullCategoryUrl);
      }
      
      // Count how many products are in each category
      const categoryName = categoryMatch[1];
      categoryPatterns.set(categoryName, (categoryPatterns.get(categoryName) || 0) + 1);
    }
    
    // Pattern 2: Look for common URL prefixes that might indicate categories
    const urlParts = item.url.split('/').filter((p: string) => p && p !== 'product');
    if (urlParts.length > 3) {
      const possibleCategory = urlParts.slice(0, -1).join('/');
      if (possibleCategory.includes('category') || possibleCategory.includes('shop')) {
        categoryPatterns.set(possibleCategory, (categoryPatterns.get(possibleCategory) || 0) + 1);
      }
    }
  });
  
  // If most products share a category, suggest it
  let suggestedCategory: string | undefined;
  if (categoryPatterns.size > 0 && results.length > 3) {
    // Find the most common category pattern
    let maxCount = 0;
    categoryPatterns.forEach((count, pattern) => {
      if (count > maxCount && count >= results.length * 0.5) { // At least 50% of results
        maxCount = count;
        suggestedCategory = pattern;
      }
    });
  }
  
  return {
    categoryUrls,
    categoryPatterns,
    suggestedCategory
  };
}

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
      searchSimilarContent(query, browseDomain, limit, 0.15, timeoutMs - 500)
        .then(results => results.map(r => ({ ...r, type: 'content' })))
        .catch(err => {
          console.error(`[Smart Search] Semantic search error:`, err.message);
          return [];
        })
    );
    
    // Also try WooCommerce if it's for products (but don't rely on it)
    if (searchType === "products" || searchType === "mixed") {
      searchPromises.push(
        searchProductsDynamic(browseDomain, query, Math.min(limit, 20))
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
  
  // Set overall timeout for the entire request (25 seconds for better UX)
  const overallTimeout = setTimeout(() => {
    console.error('[TIMEOUT] Request exceeded 25 seconds, returning partial response');
    // Force return if taking too long
    clearTimeout(overallTimeout);
    requestTimer.clearAll();
    return NextResponse.json(
      { error: 'Request timeout - please try again with a simpler query' },
      { status: 504 }
    );
  }, 25000);
  
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
      telemetry = telemetryManager.createSession(session_id, 'gpt-5-mini', {
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

    // Initialize Supabase with pure async/await
    const adminSupabase = await createServiceRoleClient();
    
    if (!adminSupabase) {
      clearTimeout(overallTimeout);
      return NextResponse.json(
        { error: 'Database connection unavailable' },
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

IMPORTANT: You receive FULL VISIBILITY of ALL search results as JSON with:
- formatted_response: Pre-built text showing first 10 items (for display)
- data: COMPLETE list of ALL products found (not just first 10!)
  * You have access to ALL products for filtering, counting, and analysis
  * This enables you to answer follow-ups without re-searching
- metadata: Contains:
  * category_urls: Detected category pages from product URLs
  * suggested_category: Most common category if products share one
  * has_common_category: Boolean indicating if products share a category
  * categories: Product categories found
  * brands: Brands in the results
- When metadata.category_urls has URLs, mention them in your response

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

CRITICAL BUSINESS RULES:
- NEVER suggest external websites or tell customers to "search elsewhere"
- NEVER recommend competitors, Amazon, manufacturer sites, or third-party retailers
- If a product isn't found, offer to help find alternatives from OUR inventory
- ONLY use category URLs that are explicitly provided in the search results
- DO NOT make up or guess category URLs - use EXACTLY what's given
- If category URLs are provided with "USE THESE EXACT URLS", you MUST use those exact URLs
- ALWAYS use GBP (£) for prices, NEVER USD ($) - this is a UK business
- Keep responses concise - aim for under 150 words unless showing detailed product lists

FORMATTING RULES:
- ALWAYS start with total count: "We have X items matching..."
- Keep product listings clean and easy to read
- Use numbered lists (1. 2. 3.) for products
- Include product names with prices clearly in GBP (£)
- Add links as [Product Name](url) when showing products
- End partial lists with: "...plus X more items. Would you like to see [specific category/more options]?"

CATEGORY PAGE GUIDANCE:
- Check metadata.has_common_category - if true, products share a category
- When metadata.category_urls exists and has URLs, mention them:
  "You can browse our full range at [category URL]"
- If metadata.suggested_category exists, most products are from that category
- Only recommend category pages when they're detected in the actual search results
- The system intelligently detects categories - use what's provided, don't guess
- For specific product codes, focus on the item unless a clear category exists

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
- CRITICAL NUMBER REFERENCES:
  * When users reference a number (e.g., "tell me about 3", "item 3", "the third one")
  * Look at your LAST numbered list and identify that specific item
  * Respond with details about THAT EXACT ITEM from the list
  * Example: If you listed "3. TENG 1/4" Torque Wrench..." and they ask about "3", describe the TENG 1/4" Torque Wrench
  * NEVER re-list items when someone asks about a specific number

STOCK & AVAILABILITY RULES:
- WooCommerce provides real-time stock status in the product data
- When users ask about stock/availability:
  * If stock_status is "instock": Say "✓ This item is currently in stock"
  * If stock_status is "outofstock": Say "✗ This item is currently out of stock"
  * If stock_status is "onbackorder": Say "This item is available on backorder"
  * If no stock data: Say "Stock information not available - please contact us"
- When showing products, include stock status if available:
  * Add ✓ for in stock, ✗ for out of stock
- You CAN check and report stock status from the WooCommerce data
- DO NOT offer specific delivery times or collection options
- For stock quantities, only show if explicitly provided in the data

WOOCOMMERCE AGENT TOOL:
- Use the woocommerce_operations tool for detailed commerce operations:
  * check_stock: Get detailed stock info including quantities
  * get_product_details: Get full product information
  * check_price: Get current pricing including sale prices
- This tool provides more detailed information than the general search

RESPONSE LENGTH & STYLE:
- Be concise and direct - customers want quick answers
- Don't ask multiple questions - provide information and one follow-up question maximum
- For general queries, suggest the category page rather than asking many qualifying questions
- Aim for helpful brevity over exhaustive detail

WHAT NOT TO OFFER:
- NEVER offer to check delivery to specific postcodes
- NEVER offer store collection or click-and-collect options
- NEVER promise specific delivery timeframes
- NEVER offer to process orders or payments
- If asked about these services, politely direct to contact the store directly`
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
    const searchTimeout = Math.min(config?.ai?.searchTimeout || 3000, 3000); // Reduced for GPT-5 performance
    
    const allSearchResults: any[] = [];
    let finalResponse = '';
    
    // First AI call with tools
    requestTimer.setPhaseTimeout('ai_initial', 10000, () => {
      console.error('[TIMEOUT] Initial AI call exceeded 10 seconds');
    });
    
    let completion = await openaiClient.chat.completions.create({
      model: 'gpt-5-mini', // GPT-5-mini with reasoning
      messages: conversationMessages,
      tools: OPTIMIZED_TOOLS,
      tool_choice: 'auto',
      reasoning_effort: 'low', // ~20% reasoning tokens for balanced performance
      max_completion_tokens: 2500, // Required for GPT-5 models instead of max_tokens
    } as any);
    
    requestTimer.clearPhaseTimeout('ai_initial');
    
    // Log token usage for GPT-5-mini
    if (completion.usage) {
      console.log(`[GPT-5-mini] Total tokens: ${completion.usage.total_tokens}, Completion tokens: ${completion.usage.completion_tokens}`);
    }
    
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
          const toolName = toolCall.function.name;
          const args = JSON.parse(toolCall.function.arguments || '{}');
          
          // Handle WooCommerce operations
          if (toolName === 'woocommerce_operations') {
            const wcResult = await executeWooCommerceOperation(
              args.operation,
              args,
              domain || 'thompsonseparts.co.uk'
            );
            
            return {
              tool_call_id: toolCall.id,
              content: formatWooCommerceResponse(wcResult)
            };
          }
          
          // Handle smart search (default behavior)
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
          
          // Format response as structured JSON with pre-formatted display text
          let toolResponse: any = {};
          
          if (result.results.length > 0 || result.overview?.total) {
            const total = result.overview?.total || result.results.length;
            // For display purposes, show reasonable number but AI gets all
            const displayLimit = 10; // Show first 10 in formatted text
            const shown = Math.min(displayLimit, result.results.length);
            const remaining = total - shown;
            
            // Determine product type from query or results
            const queryLower = args.query.toLowerCase();
            let productType = 'products';
            if (queryLower.includes('pump')) productType = 'pumps';
            else if (queryLower.includes('starter')) productType = 'starter chargers';
            else if (queryLower.includes('charger')) productType = 'chargers';
            else if (queryLower.includes('cifa')) productType = 'Cifa products';
            else if (queryLower.includes('teng')) productType = 'Teng products';
            else if (result.overview?.categories?.[0]) {
              productType = result.overview.categories[0].value.toLowerCase();
            }
            
            // Build pre-formatted response text
            let formattedText = `We have ${total} ${productType} available.`;
            
            if (shown > 0) {
              formattedText += ` Here ${shown === 1 ? 'is' : 'are'} ${shown === total ? 'all of them' : `the top ${shown}`}:\n\n`;
              
              // Add numbered list of products - MAINTAIN CONSISTENT NUMBERING
              result.results.slice(0, shown).forEach((item, idx) => {
                // Store the number reference for later lookup
                formattedText += `${idx + 1}. ${item.title}`;
                
                // Extract price if available
                if (item.type === 'product' && item.content) {
                  // Extract ALL prices and use the FIRST one consistently
                  const allPrices = item.content.match(/£([\d,]+\.?\d*)/g);
                  if (allPrices && allPrices.length > 0) {
                    // Always use the first price found for consistency
                    const firstPrice = allPrices[0].replace(/£/g, '').replace(/,/g, '');
                    const formattedPrice = parseFloat(firstPrice).toFixed(2);
                    formattedText += ` - Price: £${formattedPrice}`;
                  }
                  
                  // Add stock status if available
                  if (item.stockStatus) {
                    if (item.stockStatus === 'instock') {
                      formattedText += ' ✓ In stock';
                    } else if (item.stockStatus === 'outofstock') {
                      formattedText += ' ✗ Out of stock';
                    } else if (item.stockStatus === 'onbackorder') {
                      formattedText += ' ⏳ Backorder';
                    }
                  }
                }
                formattedText += '\n';
              });
              
              // Add footer for remaining items
              if (remaining > 0) {
                formattedText += `\n...and ${remaining} more ${productType} available.`;
                formattedText += ' Would you like to see more options or filter by a specific type?';
              }
            }
            
            // Intelligently extract category URLs from search results
            // Skip category analysis for now since we don't have supabase client in this context
            const categoryAnalysis = { 
              categoryUrls: [], 
              categoryPatterns: new Map<string, number>(), 
              suggestedCategory: undefined 
            };
            
            // Debug logging
            console.log('[Category Detection] Analysis:', {
              foundUrls: categoryAnalysis.categoryUrls.length,
              suggestedCategory: categoryAnalysis.suggestedCategory,
              hasCommonCategory: categoryAnalysis.categoryUrls.length > 0
            });
            
            // Build structured response
            const totalCount = result.overview?.total || result.results.length;
            // IMPORTANT: Send ALL results to AI for full contextual awareness
            // AI can choose to display subset but needs full data for follow-ups
            const allResults = result.results;
            
            // Build structured response
            toolResponse = {
              formatted_response: formattedText,
              data: {
                total: totalCount,
                shown: allResults.length, // AI gets ALL results
                products: allResults.map(item => ({
                  name: item.title,
                  url: item.url,
                  price: item.content?.match(/£([\d,]+\.?\d*)/)?.[1],
                  stock_status: item.stockStatus || 'unknown',
                  availability: item.stockStatus === 'instock' ? 'in_stock' : item.stockStatus === 'outofstock' ? 'out_of_stock' : item.stockStatus || 'unknown'
                }))
              },
              metadata: {
                query: args.query,
                product_type: productType,
                categories: result.overview?.categories?.slice(0, 3) || [],
                brands: result.overview?.brands?.slice(0, 3) || [],
                category_urls: categoryAnalysis.categoryUrls.slice(0, 3),
                suggested_category: categoryAnalysis.suggestedCategory,
                has_common_category: categoryAnalysis.categoryUrls.length > 0
              }
            };
            
            toolResponse = JSON.stringify(toolResponse, null, 2);
            
          } else {
            // No results found
            toolResponse = JSON.stringify({
              formatted_response: "I couldn't find any products matching that search. Would you like me to try a different search or help you browse our product categories?",
              data: { total: 0, shown: 0, products: [] },
              metadata: { query: args.query }
            });
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
        model: 'gpt-5-mini', // GPT-5-mini with reasoning
        messages: conversationMessages,
        tools: isLastIteration ? undefined : OPTIMIZED_TOOLS,
        reasoning_effort: 'low', // ~20% reasoning tokens for balanced performance
        max_completion_tokens: 2500, // Required for GPT-5 models instead of max_tokens
      } as any);
      
      requestTimer.clearPhaseTimeout('ai_followup');
      
      // Log token usage for follow-up
      if (completion.usage) {
        console.log(`[GPT-5-mini Follow-up] Total tokens: ${completion.usage.total_tokens}, Completion tokens: ${completion.usage.completion_tokens}`);
      }
      
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