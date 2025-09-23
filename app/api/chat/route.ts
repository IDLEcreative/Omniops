import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { createServiceRoleClient, validateSupabaseEnv } from '@/lib/supabase-server';
import { ChatResponse } from '@/types';
import OpenAI from 'openai';
import { z } from 'zod';
import { checkDomainRateLimit } from '@/lib/rate-limit';
import { searchSimilarContent } from '@/lib/embeddings';
import { getDynamicWooCommerceClient, searchProductsDynamic } from '@/lib/woocommerce-dynamic';
import { sanitizeOutboundLinks } from '@/lib/link-sanitizer';
import { extractQueryKeywords, isPriceQuery, extractPriceRange } from '@/lib/search-wrapper';
import { ChatTelemetry, telemetryManager } from '@/lib/chat-telemetry';

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
      maxSearchIterations: z.number().min(1).max(5).optional().default(3),
      searchTimeout: z.number().min(1000).max(30000).optional().default(10000),
    }).optional(),
  }).optional(),
});

// Search result interface
interface SearchResult {
  content: string;
  url: string;
  title: string;
  similarity: number;
}

// Function calling tools for AI
const SEARCH_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "search_products",
      description: "Search for products with a general query. Use this for broad product searches, brand names, or when the user asks about specific items.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query for products (e.g., 'hydraulic pump', 'Cifa parts', 'torque wrench')"
          },
          limit: {
            type: "number",
            description: "Maximum number of products to return (default: 8, max: 20)",
            default: 8,
            minimum: 1,
            maximum: 20
          }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "search_by_category",
      description: "Search for content by category or topic area. Use this when the user asks about general topics or wants to browse categories.",
      parameters: {
        type: "object",
        properties: {
          category: {
            type: "string",
            description: "The category to search (e.g., 'contact information', 'shipping policy', 'installation guides')"
          },
          limit: {
            type: "number",
            description: "Maximum number of results to return (default: 6, max: 15)",
            default: 6,
            minimum: 1,
            maximum: 15
          }
        },
        required: ["category"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "get_product_details",
      description: "Get detailed information about specific products when you need more comprehensive data than the general search provides.",
      parameters: {
        type: "object",
        properties: {
          productQuery: {
            type: "string",
            description: "Specific product query to get detailed information (e.g., 'DC66-10P Agri Flip', 'model XYZ specifications')"
          },
          includeSpecs: {
            type: "boolean",
            description: "Whether to include technical specifications in the search",
            default: true
          }
        },
        required: ["productQuery"]
      }
    }
  }
];

// Tool execution functions
async function executeSearchProducts(
  query: string, 
  limit: number = 8, 
  domain: string
): Promise<{ success: boolean; results: SearchResult[]; source: string }> {
  console.log(`[Function Call] search_products: "${query}" (limit: ${limit})`);
  
  try {
    // Try WooCommerce search first for product queries
    const browseDomain = /localhost|127\.0\.0\.1/i.test(domain)
      ? 'thompsonseparts.co.uk'
      : domain.replace(/^https?:\/\//, '').replace('www.', '');
    
    const wcProducts = await searchProductsDynamic(browseDomain, query, Math.min(limit, 10));
    
    if (wcProducts && wcProducts.length > 0) {
      console.log(`[Function Call] WooCommerce returned ${wcProducts.length} products`);
      const results = wcProducts.map(p => ({
        content: `${p.name}\nPrice: £${p.price || p.regular_price || 'Contact for pricing'}\nSKU: ${p.sku || 'N/A'}\n${(p.short_description || p.description || '').replace(/<[^>]+>/g, ' ').trim()}`,
        url: p.permalink || '',
        title: p.name,
        similarity: 0.9
      }));
      
      return { success: true, results, source: 'woocommerce' };
    }
    
    // Fallback to semantic search
    const searchResults = await searchSimilarContent(query, browseDomain, limit, 0.2);
    console.log(`[Function Call] Semantic search returned ${searchResults.length} results`);
    
    return { 
      success: true, 
      results: searchResults, 
      source: 'semantic' 
    };
    
  } catch (error) {
    console.error('[Function Call] search_products error:', error);
    return { 
      success: false, 
      results: [], 
      source: 'error' 
    };
  }
}

async function executeSearchByCategory(
  category: string, 
  limit: number = 6, 
  domain: string
): Promise<{ success: boolean; results: SearchResult[]; source: string }> {
  console.log(`[Function Call] search_by_category: "${category}" (limit: ${limit})`);
  
  try {
    const browseDomain = /localhost|127\.0\.0\.1/i.test(domain)
      ? 'thompsonseparts.co.uk'
      : domain.replace(/^https?:\/\//, '').replace('www.', '');
    
    // Use semantic search for category-based queries
    const searchResults = await searchSimilarContent(category, browseDomain, limit, 0.15);
    console.log(`[Function Call] Category search returned ${searchResults.length} results`);
    
    return { 
      success: true, 
      results: searchResults, 
      source: 'semantic' 
    };
    
  } catch (error) {
    console.error('[Function Call] search_by_category error:', error);
    return { 
      success: false, 
      results: [], 
      source: 'error' 
    };
  }
}

async function executeGetProductDetails(
  productQuery: string, 
  includeSpecs: boolean = true, 
  domain: string
): Promise<{ success: boolean; results: SearchResult[]; source: string }> {
  console.log(`[Function Call] get_product_details: "${productQuery}" (includeSpecs: ${includeSpecs})`);
  
  try {
    const browseDomain = /localhost|127\.0\.0\.1/i.test(domain)
      ? 'thompsonseparts.co.uk'
      : domain.replace(/^https?:\/\//, '').replace('www.', '');
    
    // Enhanced query for detailed product information
    let enhancedQuery = productQuery;
    if (includeSpecs) {
      enhancedQuery = `${productQuery} specifications technical details features`;
    }
    
    // Use higher similarity threshold for specific product details
    const searchResults = await searchSimilarContent(enhancedQuery, browseDomain, 5, 0.3);
    console.log(`[Function Call] Product details search returned ${searchResults.length} results`);
    
    return { 
      success: true, 
      results: searchResults, 
      source: 'semantic' 
    };
    
  } catch (error) {
    console.error('[Function Call] get_product_details error:', error);
    return { 
      success: false, 
      results: [], 
      source: 'error' 
    };
  }
}

export async function POST(request: NextRequest) {
  // Initialize telemetry at the very start
  let telemetry: ChatTelemetry | null = null;
  
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
    const { message, conversation_id, session_id, domain, config } = validatedData;

    // Check if GPT-5 mini is enabled
    const useGPT5Mini = process.env.USE_GPT5_MINI === 'true';
    
    // Initialize telemetry with session data
    try {
      telemetry = telemetryManager.createSession(
        session_id,
        useGPT5Mini ? 'gpt-5-mini' : 'gpt-4',
        {
          metricsEnabled: true,
          detailedLogging: process.env.NODE_ENV === 'development',
          persistToDatabase: true
        }
      );
      
      // Log initial request data
      telemetry.log('info', 'performance', 'Chat request started', {
        message: message.substring(0, 100),
        domain,
        hasConversationId: !!conversation_id
      });
    } catch (telemetryError) {
      // Telemetry should not break the main flow
      console.warn('Failed to initialize telemetry:', telemetryError);
    }

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

    // Initialize Supabase client
    const adminSupabase = await createServiceRoleClient();
    
    if (!adminSupabase) {
      return NextResponse.json(
        { error: 'Database connection unavailable' },
        { status: 503 }
      );
    }

    // Look up domain_id if we have a domain
    let domainId: string | null = null;
    if (domain) {
      const { data: domainData } = await adminSupabase
        .from('domains')
        .select('id')
        .eq('domain', domain.replace(/^https?:\/\//, '').replace('www.', ''))
        .single();
      domainId = domainData?.id || null;
    }

    // Get or create conversation
    let conversationId = conversation_id;
    
    if (!conversationId) {
      const { data: newConversation, error: convError } = await adminSupabase
        .from('conversations')
        .insert({ 
          session_id,
          domain_id: domainId
        })
        .select()
        .single();
      
      if (convError) throw convError;
      conversationId = newConversation.id;
    } else {
      const { data: existingConv } = await adminSupabase
        .from('conversations')
        .select('id')
        .eq('id', conversationId)
        .single();
      
      if (!existingConv) {
        const { error: createError } = await adminSupabase
          .from('conversations')
          .insert({ 
            id: conversationId,
            session_id,
            domain_id: domainId
          });
        
        if (createError) {
          console.error('[Chat] Failed to create conversation:', createError);
        }
      }
    }

    // Save user message
    const { error: userSaveError } = await adminSupabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'user',
        content: message,
      });
    
    if (userSaveError) {
      console.error('[Chat] Failed to save user message:', userSaveError);
    }

    // Get conversation history
    const { data: historyData, error: historyError } = await adminSupabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(10);
    
    if (historyError) {
      console.error('[Chat] Failed to fetch history:', historyError);
    }

    // Build conversation messages for OpenAI
    const conversationMessages = [
      {
        role: 'system' as const,
        content: `You are a customer service representative. Act like a real human who works here and knows the business well.

FORMATTING RULES:
- Use plain text only - NO markdown formatting
- Do NOT use asterisks (*) for emphasis or bold text
- Do NOT use underscores (_) for italics  
- Do NOT use backticks (\`) for code or inline formatting
- Present product lists with simple numbering (1. 2. 3.) or dashes (-)
- Keep all text clean and simple without special formatting characters

CRITICAL: You have access to FULL PRODUCT DATA in each search with total counts. ALWAYS mention the total when listing products.

KEY PRINCIPLES:
1. MANDATORY PRODUCT LISTING FORMAT:
   - ALWAYS start with: "We have [TOTAL] [product type] available"
   - Example: "We have 24 Teng products available. Here are 5 popular ones:"
   - After showing partial list: "...and [X] more [product type] available"
   - NEVER just list items without mentioning the total count

2. NUMBERED LIST REFERENCES:
   - When users say "tell me about 3" or "item 3" or "the third one"
   - They mean item #3 from your LAST numbered list
   - Respond with details about THAT SPECIFIC ITEM
   - DON'T re-list all items or get confused

3. STOCK & AVAILABILITY:
   - NEVER claim to check live stock levels
   - If asked about stock, say: "To check current stock, please contact us at [phone] or visit our store"
   - DON'T offer to check postcodes or delivery options
   - DON'T offer click-and-collect or store pickup

4. WHAT NOT TO OFFER:
   - NEVER offer to check delivery to specific postcodes
   - NEVER offer store collection options
   - NEVER promise specific delivery timeframes
   - NEVER offer to process orders or payments
   - Direct these queries to: "Please contact our store directly"

Remember: Be honest about system limitations while remaining helpful.`
      },
      ...(historyData || []).map((msg: any) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      {
        role: 'user' as const,
        content: message
      }
    ];

    // Get OpenAI client
    const openaiClient = getOpenAIClient();
    if (!openaiClient) {
      throw new Error('OpenAI client not available');
    }

    console.log(`[Intelligent Chat] Starting conversation with ${conversationMessages.length} messages`);

    // Configuration
    const maxIterations = config?.ai?.maxSearchIterations || 3;
    const searchTimeout = config?.ai?.searchTimeout || 10000;
    
    let iteration = 0;
    const allSearchResults: SearchResult[] = [];
    const searchLog: Array<{ tool: string; query: string; resultCount: number; source: string }> = [];

    // Initial AI call with tools - use GPT-5-mini if enabled
    const modelConfig = useGPT5Mini ? {
      model: 'gpt-5-mini',
      reasoning_effort: 'low',
      max_completion_tokens: 2500
    } : {
      model: 'gpt-4',
      temperature: 0.7,
      max_tokens: 500
    };
    
    let completion = await openaiClient.chat.completions.create({
      ...modelConfig,
      messages: conversationMessages,
      tools: SEARCH_TOOLS,
      tool_choice: 'auto'
    } as any);

    let finalResponse = '';
    let shouldContinue = true;

    // ReAct loop - iterate until AI stops calling tools or max iterations reached
    while (shouldContinue && iteration < maxIterations) {
      iteration++;
      console.log(`[Intelligent Chat] Iteration ${iteration}/${maxIterations}`);

      const choice = completion.choices[0];
      if (!choice?.message) break;

      // Check if AI wants to call tools
      const toolCalls = choice.message.tool_calls;
      
      // Track iteration in telemetry
      telemetry?.trackIteration(iteration, toolCalls?.length || 0);
      
      if (!toolCalls || toolCalls.length === 0) {
        // No tool calls - AI is ready to respond
        finalResponse = choice.message.content || 'I apologize, but I was unable to generate a response.';
        shouldContinue = false;
        console.log('[Intelligent Chat] AI finished without tool calls');
        break;
      }

      // Execute tool calls IN PARALLEL for comprehensive context gathering
      console.log(`[Intelligent Chat] Executing ${toolCalls.length} tools in parallel for comprehensive search`);
      const parallelStartTime = Date.now();
      
      // Create promises for all tool executions
      const toolPromises = toolCalls.map(async (toolCall) => {
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments || '{}');
        
        console.log(`[Intelligent Chat] Starting parallel execution of: ${toolName}`, toolArgs);
        const startTime = Date.now();

        let result: { success: boolean; results: SearchResult[]; source: string };

        try {
          // Execute the appropriate tool with timeout
          const toolPromise = (async () => {
            switch (toolName) {
              case 'search_products':
                return await executeSearchProducts(toolArgs.query, toolArgs.limit, domain || '');
              case 'search_by_category':
                return await executeSearchByCategory(toolArgs.category, toolArgs.limit, domain || '');
              case 'get_product_details':
                return await executeGetProductDetails(toolArgs.productQuery, toolArgs.includeSpecs, domain || '');
              default:
                throw new Error(`Unknown tool: ${toolName}`);
            }
          })();

          result = await Promise.race([
            toolPromise,
            new Promise<{ success: boolean; results: SearchResult[]; source: string }>((_, reject) => 
              setTimeout(() => reject(new Error('Tool execution timeout')), searchTimeout)
            )
          ]);

        } catch (error) {
          console.error(`[Intelligent Chat] Tool ${toolName} failed:`, error);
          result = { success: false, results: [], source: 'error' };
        }

        const executionTime = Date.now() - startTime;
        console.log(`[Intelligent Chat] Tool ${toolName} completed in ${executionTime}ms: ${result.results.length} results`);

        // Track search in telemetry
        telemetry?.trackSearch({
          tool: toolName,
          query: toolArgs.query || toolArgs.category || toolArgs.productQuery || '',
          resultCount: result.results.length,
          source: result.source,
          startTime
        });

        // Return all data for processing
        return {
          toolCall,
          toolName,
          toolArgs,
          result,
          executionTime
        };
      });

      // Wait for ALL tools to complete in parallel
      const toolExecutionResults = await Promise.all(toolPromises);
      const parallelExecutionTime = Date.now() - parallelStartTime;
      console.log(`[Intelligent Chat] All ${toolCalls.length} tools completed in ${parallelExecutionTime}ms (parallel execution)`);

      // Process results and build responses
      const toolResults: Array<{ tool_call_id: string; content: string }> = [];
      
      for (const execResult of toolExecutionResults) {
        const { toolCall, toolName, toolArgs, result } = execResult;
        
        // Log search activity
        searchLog.push({
          tool: toolName,
          query: toolArgs.query || toolArgs.category || toolArgs.productQuery || '',
          resultCount: result.results.length,
          source: result.source
        });

        // Collect all results
        allSearchResults.push(...result.results);

        // Format results for AI with limit awareness
        let toolResponse = '';
        if (result.success && result.results.length > 0) {
          // Check if we likely hit a search limit
          const hitLimit = [10, 20, 25, 50, 100].includes(result.results.length);
          const limitNote = hitLimit ? ` (Note: Got exactly ${result.results.length} results - likely hit search limit, more may exist)` : '';
          
          toolResponse = `Found ${result.results.length} results from ${result.source}${limitNote}:\n\n`;
          result.results.forEach((item, index) => {
            toolResponse += `${index + 1}. ${item.title}\n`;
            toolResponse += `   URL: ${item.url}\n`;
            toolResponse += `   Content: ${item.content.substring(0, 200)}${item.content.length > 200 ? '...' : ''}\n`;
            toolResponse += `   Relevance: ${(item.similarity * 100).toFixed(1)}%\n\n`;
          });
        } else {
          toolResponse = `No results found. The search returned 0 results.`;
        }

        toolResults.push({
          tool_call_id: toolCall.id,
          content: toolResponse
        });
      }
      
      // Log parallel execution stats
      console.log(`[Intelligent Chat] Parallel execution complete:`, {
        totalTools: toolCalls.length,
        totalTime: parallelExecutionTime,
        averageTimePerTool: Math.round(parallelExecutionTime / toolCalls.length),
        totalResultsFound: allSearchResults.length
      });

      // Add tool results to conversation
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

      // Get AI's next response
      try {
        const iterationConfig = useGPT5Mini ? {
          model: 'gpt-5-mini',
          reasoning_effort: 'low',
          max_completion_tokens: 2500
        } : {
          model: 'gpt-4',
          temperature: 0.7,
          max_tokens: 1000
        };
        
        completion = await openaiClient.chat.completions.create({
          ...iterationConfig,
          messages: conversationMessages,
          tools: SEARCH_TOOLS,
          tool_choice: 'auto'
        } as any);
      } catch (error) {
        console.error('[Intelligent Chat] Error in follow-up completion:', error);
        finalResponse = 'I found some information but encountered an error processing it. Please try again.';
        break;
      }
    }

    // If we hit max iterations, get final response without tools
    if (iteration >= maxIterations && shouldContinue) {
      console.log('[Intelligent Chat] Max iterations reached, getting final response');
      try {
        const finalConfig = useGPT5Mini ? {
          model: 'gpt-5-mini',
          reasoning_effort: 'low',
          max_completion_tokens: 2500
        } : {
          model: 'gpt-4',
          temperature: 0.7,
          max_tokens: 1000
        };
        
        const finalCompletion = await openaiClient.chat.completions.create({
          ...finalConfig,
          messages: conversationMessages
        } as any);
        finalResponse = finalCompletion.choices[0]?.message?.content || finalResponse;
      } catch (error) {
        console.error('[Intelligent Chat] Error getting final response:', error);
      }
    }

    // If no final response yet, get it from the last completion
    if (!finalResponse) {
      finalResponse = completion.choices[0]?.message?.content || 'I apologize, but I was unable to generate a response.';
    }

    // Clean up response formatting
    finalResponse = finalResponse.replace(/\n{3,}/g, '\n\n');
    finalResponse = finalResponse.replace(/\n\s+•/g, '\n• ');
    finalResponse = finalResponse.replace(/([^•\n]) • /g, '$1\n• ');

    // Sanitize outbound links
    const allowedDomain = (domain && !/localhost|127\.0\.0\.1|vercel/i.test(domain))
      ? domain
      : 'thompsonseparts.co.uk';
    finalResponse = sanitizeOutboundLinks(finalResponse, allowedDomain);

    // Log search activity
    console.log('[Intelligent Chat] Search Summary:', {
      totalIterations: iteration,
      totalSearches: searchLog.length,
      totalResults: allSearchResults.length,
      searchBreakdown: searchLog,
      uniqueUrlsFound: Array.from(new Set(allSearchResults.map(r => r.url))).length
    });

    // Save assistant response
    const { error: assistantSaveError } = await adminSupabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: finalResponse,
      });
    
    if (assistantSaveError) {
      console.error('[Chat] Failed to save assistant message:', assistantSaveError);
    }

    // Complete telemetry with success
    await telemetry?.complete(finalResponse);

    // Return response with search metadata
    return NextResponse.json<ChatResponse & { searchMetadata?: any }>({
      message: finalResponse,
      conversation_id: conversationId!,
      sources: allSearchResults.slice(0, 10).map(r => ({
        url: r.url,
        title: r.title,
        relevance: r.similarity
      })),
      searchMetadata: {
        iterations: iteration,
        totalSearches: searchLog.length,
        searchLog: searchLog
      }
    });

  } catch (error) {
    console.error('[Intelligent Chat API] Error:', error);
    
    // Complete telemetry with error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await telemetry?.complete(undefined, errorMessage);
    
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