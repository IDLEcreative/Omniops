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
            description: "Maximum number of products to return (default: 20, max: 20)",
            default: 20,
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
    
    const wcProducts = await searchProductsDynamic(browseDomain, query, limit);
    
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
  let telemetry: ChatTelemetry | undefined;
  
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
            session_id 
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
        content: `You are an intelligent customer service assistant with advanced search capabilities. You help customers by gathering comprehensive information to answer their queries.

CORE PRINCIPLE: For product-related queries, ALWAYS search to gather complete context before responding.

INTELLIGENT SEARCH STRATEGY:

1. ANALYZE the request:
   - What is the customer looking for?
   - What context would be helpful?
   - What related information might they need?

2. GATHER comprehensive context:
   - Use your reasoning to decide what searches would be most helpful
   - Execute multiple relevant searches in parallel
   - Cast a wide net initially, then refine based on what you find
   - Use search limits of 15-20 to ensure comprehensive coverage

3. UNDERSTAND what you found:
   - Analyze all search results
   - Identify patterns and categories
   - Determine what's most relevant to the customer's need
   - Note the total scope of available options

4. RESPOND intelligently:
   - Show you understand the full context
   - Present the most relevant options
   - Be transparent about what you found
   - Offer to provide more details or alternatives

SEARCH EXECUTION:
- Think about what searches would be most helpful for THIS specific query
- Execute multiple searches in parallel for speed and comprehensiveness
- Don't wait for permission - search proactively to be helpful
- You can make up to 5 search calls to ensure you have complete context

WHEN TO SEARCH:
- Product inquiries: Always search for current information
- Technical questions: Search for documentation or specifications
- Availability questions: Search for inventory
- Simple greetings or thank you: No search needed

RESPONSE APPROACH:
- Be transparent about your search process when relevant
- Show awareness of the breadth of options available
- Present information in a clear, organized way
- Include specific details like prices and specifications when available
- Group related items logically

CRITICAL ANTI-HALLUCINATION RULES:
- ONLY mention products that appear in your search results
- NEVER invent or assume products exist
- If searching for something returns no results, clearly state it's not available
- Do not fill gaps with general knowledge about what "should" exist
- Each product you mention MUST have a corresponding search result
- If unsure whether something exists, say "let me check" and search for it

ACCURACY REQUIREMENTS:
- Every product name must match exactly what's in search results
- Every price must come from search results
- Every specification must be found in search results
- If you don't find what the customer wants, be honest about it

EXAMPLE RESPONSES:
- Good: "I searched for vehicle batteries but didn't find any in our current inventory."
- Bad: "Here are some batteries we have: [invented product names]"
- Good: "I found these remote control batteries, but no truck batteries."
- Bad: "We have Numax batteries" (when search found none)

REMEMBER:
- Truth and accuracy are more important than being helpful
- Customers trust us to show real inventory, not imagined products
- If something doesn't exist in search results, it doesn't exist in inventory
- Let your intelligence guide HOW you search, but ONLY report what you find`
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
    let allSearchResults: SearchResult[] = [];
    let searchLog: Array<{ tool: string; query: string; resultCount: number; source: string }> = [];

    // Use GPT-5-mini reasoning model for better search intelligence
    const useGPT5 = process.env.USE_GPT5_MINI === 'true';
    const baseModelConfig = useGPT5 
      ? {
          model: 'gpt-5-mini' as any,
          max_completion_tokens: 2500,  // Increased to accommodate reasoning + output
          reasoning_effort: 'low',       // Low reasoning for balanced quality and speed
          // GPT-5 doesn't support custom temperature
        }
      : {
          model: 'gpt-4.1' as any,       // Use same fallback as main chat route
          temperature: 0.7,
          max_tokens: 1000,              // Higher for intelligent search responses
        };
    console.log(`[Intelligent Chat] Using model: ${baseModelConfig.model}`);

    // Initialize telemetry after model config is defined
    const telemetrySessionId = `chat_${conversationId}_${Date.now()}`;
    telemetry = telemetryManager.createSession(telemetrySessionId, baseModelConfig.model || 'gpt-4.1', {
      domain: domain || rateLimitDomain,
      persistToDatabase: true,
      detailedLogging: process.env.NODE_ENV === 'development'
    });
    
    // Store model config in telemetry
    telemetry.setModelConfig(baseModelConfig);

    // Initial AI call with tools
    let completion;
    try {
      // Merge config with tool-calling parameters
      const toolCallConfig = {
        ...baseModelConfig,
        messages: conversationMessages,
        tools: SEARCH_TOOLS,
        tool_choice: 'auto',
        // Only add temperature if not GPT-5
        ...(useGPT5 ? {} : { temperature: 0.7 }),
      };
      
      completion = await openaiClient.chat.completions.create(toolCallConfig as any);
      
      // Track token usage from initial call
      if (completion.usage) {
        telemetry?.trackTokenUsage(completion.usage);
      }
    } catch (error: any) {
      // Fallback to GPT-4.1 if GPT-5-mini fails
      if (useGPT5) {
        console.log('[Intelligent Chat] GPT-5-mini failed, falling back to GPT-4.1...');
        telemetry?.log('warn', 'ai', 'GPT-5-mini failed, falling back to GPT-4.1', { error: error.message });
        completion = await openaiClient.chat.completions.create({
          model: 'gpt-4.1' as any,
          messages: conversationMessages,
          tools: SEARCH_TOOLS,
          tool_choice: 'auto',
          temperature: 0.7,
          max_tokens: 1000,
        });
        
        // Track token usage from fallback
        if (completion.usage) {
          telemetry?.trackTokenUsage(completion.usage);
        }
      } else {
        throw error;
      }
    }

    let finalResponse = '';
    let shouldContinue = true;

    // ReAct loop - iterate until AI stops calling tools or max iterations reached
    while (shouldContinue && iteration < maxIterations) {
      iteration++;
      console.log(`[Intelligent Chat] Iteration ${iteration}/${maxIterations}`);
      telemetry?.trackIteration(iteration, 0);

      const choice = completion.choices[0];
      if (!choice?.message) break;

      // Check if AI wants to call tools
      const toolCalls = choice.message.tool_calls;
      
      if (!toolCalls || toolCalls.length === 0) {
        // No tool calls - AI is ready to respond
        finalResponse = choice.message.content || 'I apologize, but I was unable to generate a response.';
        shouldContinue = false;
        console.log('[Intelligent Chat] AI finished without tool calls');
        break;
      }

      // Execute tool calls IN PARALLEL for faster, more comprehensive results
      console.log(`[Intelligent Chat] Executing ${toolCalls.length} tools in parallel...`);
      const toolResults: Array<{ tool_call_id: string; content: string }> = [];
      
      // Prepare all tool executions
      const toolExecutions = toolCalls.map(async (toolCall) => {
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments || '{}');
        
        console.log(`[Intelligent Chat] Starting tool: ${toolName}`, toolArgs);
        const startTime = Date.now();

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

          const result = await Promise.race([
            toolPromise,
            new Promise<{ success: boolean; results: SearchResult[]; source: string }>((_, reject) => 
              setTimeout(() => reject(new Error('Tool execution timeout')), searchTimeout)
            )
          ]);

          const executionTime = Date.now() - startTime;
          console.log(`[Intelligent Chat] Tool ${toolName} completed in ${executionTime}ms: ${result.results.length} results`);
          
          // Track search in telemetry
          telemetry?.trackSearch({
            tool: toolName,
            query: toolArgs.query || toolArgs.category || toolArgs.productQuery || '',
            resultCount: result.results.length,
            source: result.source,
            startTime: startTime
          });

          return {
            toolCall,
            toolName,
            toolArgs,
            result,
            executionTime
          };

        } catch (error) {
          console.error(`[Intelligent Chat] Tool ${toolName} failed:`, error);
          return {
            toolCall,
            toolName,
            toolArgs,
            result: { success: false, results: [], source: 'error' },
            executionTime: Date.now() - startTime
          };
        }
      });

      // Execute all tools in parallel
      const toolExecutionResults = await Promise.all(toolExecutions);
      
      // Process results
      for (const execution of toolExecutionResults) {
        const { toolCall, toolName, toolArgs, result } = execution;
        
        // Log search activity
        searchLog.push({
          tool: toolName,
          query: toolArgs.query || toolArgs.category || toolArgs.productQuery || '',
          resultCount: result.results.length,
          source: result.source
        });

        // Collect all results
        allSearchResults.push(...result.results);

        // Format results for AI - keep concise to avoid overwhelming the model
        let toolResponse = '';
        if (result.success && result.results.length > 0) {
          toolResponse = `Found ${result.results.length} results from ${result.source}:\n\n`;
          
          // Limit to first 20 results to avoid token overflow
          const resultsToShow = Math.min(result.results.length, 20);
          
          result.results.slice(0, resultsToShow).forEach((item, index) => {
            // Keep response concise - just title, URL, and price if available
            toolResponse += `${index + 1}. ${item.title}\n`;
            toolResponse += `   URL: ${item.url}\n`;
            
            // Extract price if available in content
            const priceMatch = item.content.match(/£[\d,]+\.?\d*/);
            if (priceMatch) {
              toolResponse += `   Price: ${priceMatch[0]}\n`;
            }
            
            // Only add brief snippet for first 5 items
            if (index < 5) {
              toolResponse += `   Preview: ${item.content.substring(0, 100)}...\n`;
            }
            toolResponse += '\n';
          });
          
          if (result.results.length > resultsToShow) {
            toolResponse += `... and ${result.results.length - resultsToShow} more results\n`;
          }
        } else {
          toolResponse = `No results found. The search returned 0 results.`;
        }

        toolResults.push({
          tool_call_id: toolCall.id,
          content: toolResponse
        });
      }

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
        const iterationConfig = {
          ...baseModelConfig,
          messages: conversationMessages,
          tools: SEARCH_TOOLS,
          tool_choice: 'auto',
          ...(useGPT5 ? {} : { temperature: 0.7 }),
        };
        completion = await openaiClient.chat.completions.create(iterationConfig as any);
        
        // Track token usage for iteration
        if (completion.usage) {
          telemetry?.trackTokenUsage(completion.usage);
        }
      } catch (error: any) {
        // Fallback to GPT-4.1 if GPT-5-mini fails
        if (useGPT5 && baseModelConfig.model === 'gpt-5-mini') {
          console.log('[Intelligent Chat] GPT-5-mini failed in iteration, falling back to GPT-4.1...');
          try {
            completion = await openaiClient.chat.completions.create({
              model: 'gpt-4.1' as any,
              messages: conversationMessages,
              tools: SEARCH_TOOLS,
              tool_choice: 'auto',
              temperature: 0.7,
              max_tokens: 1000,
            });
            
            // Track token usage from fallback
            if (completion.usage) {
              telemetry?.trackTokenUsage(completion.usage);
            }
          } catch (fallbackError) {
            console.error('[Intelligent Chat] GPT-4.1 fallback also failed:', fallbackError);
            telemetry?.log('error', 'ai', 'GPT-4.1 fallback failed', { error: fallbackError });
            finalResponse = 'I found some information but encountered an error processing it. Please try again.';
            break;
          }
        } else {
          console.error('[Intelligent Chat] Error in follow-up completion:', error);
          finalResponse = 'I found some information but encountered an error processing it. Please try again.';
          break;
        }
      }
    }

    // If we hit max iterations, get final response without tools
    if (iteration >= maxIterations && shouldContinue) {
      console.log('[Intelligent Chat] Max iterations reached, getting final response');
      
      // Add grounding reminder to ensure no hallucination
      const finalMessages = [
        ...conversationMessages,
        {
          role: 'system' as const,
          content: `IMPORTANT REMINDER: Base your response ONLY on the search results you found. 
Do not mention any products, prices, or specifications that were not in your search results.
If you didn't find what the customer asked for, be honest and suggest alternatives from what you DID find.
Every product you mention must have appeared in your search results.`
        }
      ];
      
      try {
        const finalConfig = {
          ...baseModelConfig,
          messages: finalMessages,
          // No tools in final response
          ...(useGPT5 ? {} : { temperature: 0.7 }),
        };
        const finalCompletion = await openaiClient.chat.completions.create(finalConfig as any);
        finalResponse = finalCompletion.choices[0]?.message?.content || finalResponse;
        
        // Track final completion tokens
        if (finalCompletion.usage) {
          telemetry?.trackTokenUsage(finalCompletion.usage);
        }
      } catch (error: any) {
        // Fallback to GPT-4.1 if GPT-5-mini fails
        if (useGPT5 && baseModelConfig.model === 'gpt-5-mini') {
          console.log('[Intelligent Chat] GPT-5-mini failed in final response, falling back to GPT-4.1...');
          try {
            const finalCompletion = await openaiClient.chat.completions.create({
              model: 'gpt-4.1' as any,
              messages: conversationMessages,
              temperature: 0.7,
              max_tokens: 1000,
            });
            finalResponse = finalCompletion.choices[0]?.message?.content || finalResponse;
            
            // Track final fallback tokens
            if (finalCompletion.usage) {
              telemetry?.trackTokenUsage(finalCompletion.usage);
            }
          } catch (fallbackError) {
            console.error('[Intelligent Chat] GPT-4.1 fallback also failed:', fallbackError);
            telemetry?.log('error', 'ai', 'Final GPT-4.1 fallback failed', { error: fallbackError });
          }
        } else {
          console.error('[Intelligent Chat] Error getting final response:', error);
        }
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

    // Complete telemetry session with success
    const telemetrySummary = await telemetry?.complete(finalResponse);
    
    // Log search activity with telemetry summary
    console.log('[Intelligent Chat] Session Complete:', {
      totalIterations: iteration,
      totalSearches: searchLog.length,
      totalResults: allSearchResults.length,
      searchBreakdown: searchLog,
      uniqueUrlsFound: Array.from(new Set(allSearchResults.map(r => r.url))).length,
      telemetry: telemetrySummary
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

    // Return response with search metadata and cost info
    const tokenUsage = telemetry?.getTokenUsage();
    return NextResponse.json<ChatResponse & { searchMetadata?: any; tokenUsage?: any }>({
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
      },
      tokenUsage: tokenUsage ? {
        input: tokenUsage.input,
        output: tokenUsage.output,
        total: tokenUsage.total,
        estimatedCostUSD: tokenUsage.costUSD.toFixed(6)
      } : undefined
    });

  } catch (error) {
    console.error('[Intelligent Chat API] Error:', error);
    
    // Complete telemetry with error
    if (telemetry) {
      await telemetry.complete(undefined, error instanceof Error ? error.message : 'Unknown error');
    }
    
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