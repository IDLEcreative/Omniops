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
import { getCommerceProvider } from '@/lib/agents/commerce-provider';
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
      description: "Search for products or items with a general query. Use this for broad searches, brand names, or when the user asks about specific items.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query for products. Should match what the user is looking for."
          },
          limit: {
            type: "number",
            description: "Maximum number of products to return (default: 100, max: 1000)",
            default: 100,
            minimum: 1,
            maximum: 1000
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
            description: "Maximum number of results to return (default: 100, max: 1000)",
            default: 100,
            minimum: 1,
            maximum: 1000
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
            description: "Specific product query to get detailed information"
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
  },
  {
    type: "function" as const,
    function: {
      name: "lookup_order",
      description: "Look up an order by order number or ID. Use this when a customer asks about order status, tracking, or order details.",
      parameters: {
        type: "object",
        properties: {
          orderId: {
            type: "string",
            description: "The order number or ID to look up"
          }
        },
        required: ["orderId"]
      }
    }
  }
];

// Tool execution functions
async function executeSearchProducts(
  query: string,
  limit: number = 100,
  domain: string
): Promise<{ success: boolean; results: SearchResult[]; source: string }> {
  console.log(`[Function Call] search_products: "${query}" (limit: ${limit})`);

  try {
    // Normalize domain - no hardcoded fallbacks
    const browseDomain = domain.replace(/^https?:\/\//, '').replace('www.', '');

    if (!browseDomain || /localhost|127\.0\.0\.1/i.test(browseDomain)) {
      console.log('[Search] Invalid or localhost domain - cannot search without valid domain');
      return { success: false, results: [], source: 'invalid-domain' };
    }

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
  limit: number = 100,
  domain: string
): Promise<{ success: boolean; results: SearchResult[]; source: string }> {
  console.log(`[Function Call] search_by_category: "${category}" (limit: ${limit})`);

  try {
    // Normalize domain - no hardcoded fallbacks
    const browseDomain = domain.replace(/^https?:\/\//, '').replace('www.', '');

    if (!browseDomain || /localhost|127\.0\.0\.1/i.test(browseDomain)) {
      console.log('[Search] Invalid or localhost domain - cannot search without valid domain');
      return { success: false, results: [], source: 'invalid-domain' };
    }

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
    // Normalize domain - no hardcoded fallbacks
    const browseDomain = domain.replace(/^https?:\/\//, '').replace('www.', '');

    if (!browseDomain || /localhost|127\.0\.0\.1/i.test(browseDomain)) {
      console.log('[Search] Invalid or localhost domain - cannot search without valid domain');
      return { success: false, results: [], source: 'invalid-domain' };
    }

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

async function executeLookupOrder(
  orderId: string,
  domain: string
): Promise<{ success: boolean; results: SearchResult[]; source: string }> {
  console.log(`[Function Call] lookup_order: "${orderId}"`);

  try {
    // Normalize domain - no hardcoded fallbacks
    const browseDomain = domain.replace(/^https?:\/\//, '').replace('www.', '');

    if (!browseDomain || /localhost|127\.0\.0\.1/i.test(browseDomain)) {
      console.log('[Search] Invalid or localhost domain - cannot lookup order without valid domain');
      return { success: false, results: [], source: 'invalid-domain' };
    }

    // Use commerce provider abstraction for multi-platform support
    const provider = await getCommerceProvider(browseDomain);

    if (!provider) {
      console.log('[Function Call] No commerce provider available for domain');
      return {
        success: false,
        results: [],
        source: 'no-provider'
      };
    }

    const order = await provider.lookupOrder(orderId);

    if (!order) {
      console.log(`[Function Call] No order found for ID: ${orderId}`);
      return {
        success: false,
        results: [],
        source: provider.platform
      };
    }

    console.log(`[Function Call] Order found via ${provider.platform}: ${order.id} - Status: ${order.status}`);

    // Format order information as a search result
    const itemsList = order.items.map(item => `${item.name} (x${item.quantity})`).join(', ');
    const orderInfo = `Order #${order.number}
Status: ${order.status}
Date: ${order.date}
Total: ${order.currency}${order.total}
Items: ${itemsList || 'No items'}
${order.billing ? `Customer: ${order.billing.firstName} ${order.billing.lastName}` : ''}
${order.trackingNumber ? `Tracking: ${order.trackingNumber}` : ''}`;

    const result: SearchResult = {
      content: orderInfo,
      url: order.permalink || '',
      title: `Order #${order.number}`,
      similarity: 1.0
    };

    return {
      success: true,
      results: [result],
      source: provider.platform
    };

  } catch (error) {
    console.error('[Function Call] lookup_order error:', error);
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

    // Get conversation history (increased limit for better context retention)
    const { data: historyData, error: historyError } = await adminSupabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(20);
    
    if (historyError) {
      console.error('[Chat] Failed to fetch history:', historyError);
    }

    // Build conversation messages for OpenAI
    const conversationMessages = [
      {
        role: 'system' as const,
        content: `You are a professional customer service representative. Your goal is to provide accurate, helpful assistance while building trust through honesty.

🔍 SEARCH BEHAVIOR:
You have full visibility of ALL search results. When you search, you see the complete inventory.

CRITICAL: When a customer asks about products or items:
1. ALWAYS search first using available tools before asking clarifying questions
2. Use the actual search results to inform your response
3. Only ask clarifying questions if the search returns NO results or if results are genuinely ambiguous
4. For product searches, use the customer's exact terms first, then try variations if needed

For order inquiries (tracking, status, "chasing order"), use the lookup_order tool immediately.

💬 CONTEXT & MEMORY:
- Review the conversation history before responding
- When referencing previous exchanges, use phrases like: "As mentioned earlier", "As you asked about", "Earlier you mentioned", "Referring to the [item] we discussed"
- Track numbered lists: When you provide a numbered list, remember it. If customer says "tell me about item 2" or "the third one", reference the exact item from your list
- Resolve pronouns correctly: "it" = last mentioned item, "those" = last mentioned group, "that one" = specific item from context

🚫 ANTI-HALLUCINATION RULES (CRITICAL):
1. NEVER state facts you don't have data for (manufacturing location, compatibility, warranties, technical specs)
2. If you don't know something, say: "I don't have that information" or "Let me check with our team"
3. Avoid definitive statements about: compatibility, installation procedures, technical specifications, delivery times, warranties
4. For uncertain info, use qualifiers: "This may...", "Typically...", "You may want to verify..."

🔄 ALTERNATIVE PRODUCTS (STRICT PROCESS):
When customer asks "What can I use instead of [product]?" or "What's an alternative to [product]?":
1. FIRST: Acknowledge you found similar products, but compatibility is critical
2. ALWAYS ask for: Equipment model, serial number, or part number to verify compatibility
3. NEVER suggest specific alternatives as direct replacements without verification data
4. Format your response like this:
   "I found similar products in our inventory, but I need to verify compatibility first to ensure safe operation.

   To recommend the correct alternative, please provide:
   - Your equipment model/serial number, OR
   - The part number from your current [product], OR
   - Photos of the nameplate/specifications

   This ensures I suggest a compatible alternative that won't damage your equipment."
5. If customer insists without providing info, offer to connect them with technical support

✅ RESPONSE QUALITY:
- Be conversational but professional
- Acknowledge customer frustrations with empathy
- Offer next steps when you can't directly answer
- Use the customer's terminology when possible`
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
              case 'lookup_order':
                return await executeLookupOrder(toolArgs.orderId, domain || '');
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

        // Format results for AI
        let toolResponse = '';
        if (result.success && result.results.length > 0) {
          toolResponse = `Found ${result.results.length} results from ${result.source}:\n\n`;
          result.results.forEach((item, index) => {
            toolResponse += `${index + 1}. ${item.title}\n`;
            toolResponse += `   URL: ${item.url}\n`;
            toolResponse += `   Content: ${item.content.substring(0, 200)}${item.content.length > 200 ? '...' : ''}\n`;
            toolResponse += `   Relevance: ${(item.similarity * 100).toFixed(1)}%\n\n`;
          });
        } else {
          // Provide contextual error messages based on tool type
          const queryTerm = toolArgs.query || toolArgs.category || toolArgs.productQuery || toolArgs.orderId || 'this search';

          if (result.source === 'invalid-domain') {
            toolResponse = `Cannot perform search - domain not configured properly.`;
          } else if (toolName === 'lookup_order') {
            toolResponse = `I couldn't find any information about order ${queryTerm}. The order number might be incorrect, or it hasn't been entered into the system yet. Please ask the customer to double-check the order number.`;
          } else {
            toolResponse = `I couldn't find any information about "${queryTerm}". This might mean:
- The search term needs to be more specific or spelled differently
- The item might not be in the current inventory
- Try using alternative terms or checking the spelling

Please let me know if you'd like to search for something else or need assistance finding what you're looking for.`;
          }
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
    
    // Convert numbered lists to bullet points
    // This regex matches lines starting with numbers followed by . or )
    finalResponse = finalResponse.replace(/^(\s*)(\d+)[.)]\s*/gm, '$1- ');

    // Sanitize outbound links - only if we have a valid domain
    if (domain && !/localhost|127\.0\.0\.1|vercel/i.test(domain)) {
      finalResponse = sanitizeOutboundLinks(finalResponse, domain);
    }

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