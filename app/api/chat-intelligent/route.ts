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
      telemetry = telemetryManager.createSession(session_id, 'gpt-4o', {
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
        content: `You are a helpful customer service assistant. Use the smart_search tool for product inquiries.

## Core Behavior
- You have full conversation history - reference previous messages when users say "that", "it", etc.
- When you receive search results, they come as structured JSON with pre-formatted display text
- Simply use the provided formatted_response field - it's already properly formatted
- Do NOT add your own formatting or counts - everything is pre-calculated

## Search Results Format
Search results will provide:
- formatted_response: Ready-to-use text for displaying to users
- data: Raw data if you need specific details
- metadata: Additional context like totals, categories

## Important Rules
- NEVER suggest external websites or competitors
- For stock levels: Search results show availability status, not exact quantities
- If no results found: Offer to help find alternatives from our inventory
- Only use URLs explicitly provided in search results`
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
    
    let allSearchResults: any[] = [];
    let finalResponse = '';
    
    // First AI call with tools
    requestTimer.setPhaseTimeout('ai_initial', 10000, () => {
      console.error('[TIMEOUT] Initial AI call exceeded 10 seconds');
    });
    
    let completion = await openaiClient.chat.completions.create({
      model: 'gpt-4o', // GPT-5 class model as per INTELLIGENT_AI_DESIGN.md
      messages: conversationMessages,
      tools: OPTIMIZED_TOOLS,
      tool_choice: 'auto',
      temperature: 0.3, // Lower for consistency and speed
      max_tokens: 600, // Optimized for response time
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
          
          // Format response as structured JSON with pre-formatted display text
          let toolResponse: any = {};
          
          if (result.results.length > 0 || result.overview?.total) {
            const total = result.overview?.total || result.results.length;
            const shown = Math.min(5, result.results.length);
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
              
              // Add numbered list of products
              result.results.slice(0, shown).forEach((item, idx) => {
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
                      formattedText += ' ✓ Available';
                    } else if (item.stockStatus === 'outofstock') {
                      formattedText += ' ✗ Out of stock';
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
            
            // Extract valid category URLs (validated from actual results)
            const validCategoryUrls: string[] = [];
            const seenCategories = new Set<string>();
            result.results.forEach(item => {
              if (item.url && item.url.includes('/product-category/')) {
                const match = item.url.match(/(.+\/product-category\/[^\/]+)\/.*/);;
                if (match && !seenCategories.has(match[1])) {
                  seenCategories.add(match[1]);
                  validCategoryUrls.push(match[1] + '/');
                }
              }
            });
            
            // Build structured response
            toolResponse = {
              formatted_response: formattedText,
              data: {
                total: total,
                shown: shown,
                products: result.results.slice(0, shown).map(item => ({
                  name: item.title,
                  url: item.url,
                  price: item.content?.match(/£([\d,]+\.?\d*)/)?.[1],
                  availability: item.stockStatus || 'unknown'
                }))
              },
              metadata: {
                query: args.query,
                product_type: productType,
                categories: result.overview?.categories?.slice(0, 3) || [],
                brands: result.overview?.brands?.slice(0, 3) || [],
                valid_category_urls: validCategoryUrls.slice(0, 3)
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
        model: 'gpt-4o', // Using GPT-5 class model
        messages: conversationMessages,
        tools: isLastIteration ? undefined : OPTIMIZED_TOOLS,
        temperature: 0.3, // Consistent with GPT-5 capabilities
        max_tokens: 600,
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