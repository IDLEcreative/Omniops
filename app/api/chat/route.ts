import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { createServiceRoleClient, validateSupabaseEnv } from '@/lib/supabase-server';
import { ChatResponse, SearchResult } from '@/types';
import OpenAI from 'openai';
import { z } from 'zod';
import { checkDomainRateLimit } from '@/lib/rate-limit';
import { searchSimilarContent } from '@/lib/embeddings';
import { getCommerceProvider } from '@/lib/agents/commerce-provider';
import { sanitizeOutboundLinks } from '@/lib/link-sanitizer';
import { ChatTelemetry, telemetryManager } from '@/lib/chat-telemetry';

// Extracted modules for cleaner code organization
import { SEARCH_TOOLS, validateToolArguments, runWithTimeout } from '@/lib/chat/tool-definitions';
import {
  executeSearchProducts,
  executeSearchByCategory,
  executeGetProductDetails,
  executeLookupOrder
} from '@/lib/chat/tool-handlers';
import {
  lookupDomain,
  getOrCreateConversation,
  saveUserMessage,
  saveAssistantMessage,
  getConversationHistory
} from '@/lib/chat/conversation-manager';

/**
 * Dependencies interface for the chat route.
 * Enables dependency injection for testability without complex mocking.
 *
 * @example
 * // Production usage (uses defaults automatically):
 * POST(request)
 *
 * @example
 * // Test usage (inject mocks):
 * POST(request, {
 *   deps: {
 *     searchSimilarContent: mockSearchFn,
 *     getCommerceProvider: mockProviderFn
 *   }
 * })
 *
 * @see {@link https://github.com/IDLEcreative/Omniops/blob/main/docs/DEPENDENCY_INJECTION.md}
 */
export interface RouteDependencies {
  /**
   * Rate limiting function - checks if domain has exceeded request limits.
   * Called at the start of every chat request to prevent abuse.
   *
   * @param domain - The domain to check rate limits for
   * @returns Object with allowed status, remaining requests, and reset time
   */
  checkDomainRateLimit: typeof checkDomainRateLimit;

  /**
   * Semantic search function - finds similar content using vector embeddings.
   * Called when the AI needs context from scraped website data.
   *
   * @param query - Search query string
   * @param domain - Domain to search within
   * @param limit - Maximum results to return (default: 100)
   * @param minSimilarity - Minimum similarity threshold (default: 0.7)
   * @returns Array of similar content chunks with similarity scores
   */
  searchSimilarContent: typeof searchSimilarContent;

  /**
   * Commerce provider factory - returns platform-specific commerce client.
   * Called when searching products or fetching product details.
   * Supports WooCommerce and Shopify platforms.
   *
   * @param domain - Domain to get commerce provider for
   * @returns Commerce provider instance or null if not configured
   */
  getCommerceProvider: typeof getCommerceProvider;

  /**
   * Link sanitizer - ensures outbound links are safe and properly formatted.
   * Called before returning AI responses to the user.
   *
   * @param message - Message text containing potential links
   * @returns Sanitized message with safe links
   */
  sanitizeOutboundLinks: typeof sanitizeOutboundLinks;

  /**
   * Supabase client factory - creates authenticated database client.
   * Called for all database operations (conversations, messages, embeddings).
   * Uses service role key for elevated permissions.
   *
   * @returns Authenticated Supabase client instance
   */
  createServiceRoleClient: typeof createServiceRoleClient;
}

// Default dependencies (production)
const defaultDependencies: RouteDependencies = {
  checkDomainRateLimit,
  searchSimilarContent,
  getCommerceProvider,
  sanitizeOutboundLinks,
  createServiceRoleClient,
};

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


export async function POST(
  request: NextRequest,
  { deps = defaultDependencies }: { deps?: Partial<RouteDependencies> } = {}
) {
  // Merge with defaults for any missing dependencies
  const {
    checkDomainRateLimit: rateLimitFn,
    searchSimilarContent: searchFn,
    getCommerceProvider: getProviderFn,
    sanitizeOutboundLinks: sanitizeFn,
    createServiceRoleClient: createSupabaseClient,
  } = { ...defaultDependencies, ...deps };

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
    const { allowed, resetTime } = rateLimitFn(rateLimitDomain);
    
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

    // Initialize Supabase client (uses injected dependency for testing)
    const adminSupabase = await createSupabaseClient();

    if (!adminSupabase) {
      return NextResponse.json(
        { error: 'Database connection unavailable' },
        { status: 503 }
      );
    }

    // Look up domain_id if we have a domain
    const domainId = await lookupDomain(domain, adminSupabase);

    // Get or create conversation
    const conversationId = await getOrCreateConversation(
      conversation_id,
      session_id,
      domainId,
      adminSupabase
    );

    // Save user message
    await saveUserMessage(conversationId, message, adminSupabase);

    // Get conversation history (increased limit for better context retention)
    const historyData = await getConversationHistory(conversationId, 20, adminSupabase);

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

💬 CONTEXT & MEMORY (CRITICAL - ALWAYS FOLLOW):
BEFORE responding, ALWAYS review the complete conversation history to understand the full context.

When customer references previous conversation:
- "tell me about item 2" / "the second one" / "number 3" → Find YOUR numbered list in chat history, return that exact item's details
- "it" / "that" / "this product" → Reference the LAST specific product/item you mentioned
- "those" / "these" / "them" → Reference the LAST group/list you provided
- "the first one" / "the A4VTG90" (mentioned earlier) → Search your previous responses for this exact item

ALWAYS acknowledge the context:
- Use: "Referring to item 2 from the list:", "As you asked about [X]:", "Regarding the [product] we discussed:", "Back to [topic]:"
- Include the SKU or product name from the previous mention to confirm you're referencing the right item
- If customer asks about something you listed with a price/SKU, include that exact price/SKU again

Topic Switching:
- When customer changes topics, note it: "Regarding shipping:" or "Back to the pumps:"
- When returning to previous topic, explicitly reference it: "Returning to the A4VTG90 you asked about earlier:"
- Maintain awareness of ALL active topics in the conversation

Stock/Availability References:
- If customer asks "is that one in stock?" → Check what "that one" refers to (previous SKU/product), mention the SKU explicitly: "For SKU K2053463 that we discussed:"

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
      ...historyData.map((msg) => ({
        role: msg.role,
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

    // Initial AI call with tools - use GPT-5-mini if enabled (preferred for reasoning capability)
    // NOTE FOR AI ASSISTANTS: GPT-5 mini is a REAL model released by OpenAI (post-Jan 2025).
    // If your knowledge cutoff is before this date, don't assume it's a placeholder or test name.
    // It's a production model with reasoning capabilities, configured via USE_GPT5_MINI env var.
    const modelConfig = useGPT5Mini ? {
      model: 'gpt-5-mini',
      reasoning_effort: 'low',
      max_completion_tokens: 2500
    } : {
      model: 'gpt-4',  // Fallback to GPT-4 (keep for compatibility)
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
        const startTime = Date.now();
        let parsedArgs: Record<string, any> = {};

        try {
          parsedArgs = toolCall.function.arguments ? JSON.parse(toolCall.function.arguments) : {};
        } catch (parseError) {
          console.error(`[Intelligent Chat] Failed to parse arguments for ${toolName}:`, parseError);
          const executionTime = Date.now() - startTime;
          return {
            toolCall,
            toolName,
            toolArgs: {},
            result: { success: false, results: [], source: 'invalid-arguments' },
            executionTime
          };
        }

        const validationError = validateToolArguments(toolName, parsedArgs);
        if (validationError) {
          console.warn(`[Intelligent Chat] Invalid arguments for ${toolName}: ${validationError}`);
          const executionTime = Date.now() - startTime;
          return {
            toolCall,
            toolName,
            toolArgs: parsedArgs,
            result: { success: false, results: [], source: 'invalid-arguments' },
            executionTime
          };
        }

        // Normalize optional arguments after validation
        if (
          (toolName === 'search_products' || toolName === 'search_by_category') &&
          (typeof parsedArgs.limit !== 'number' || !Number.isFinite(parsedArgs.limit))
        ) {
          delete parsedArgs.limit;
        }
        if (toolName === 'get_product_details' && typeof parsedArgs.includeSpecs !== 'boolean') {
          parsedArgs.includeSpecs = true;
        }

        console.log(`[Intelligent Chat] Starting parallel execution of: ${toolName}`, parsedArgs);

        let result: { success: boolean; results: SearchResult[]; source: string };

        try {
          const runTool = async () => {
            switch (toolName) {
              case 'search_products':
                return await executeSearchProducts(
                  (parsedArgs.query as string).trim(),
                  parsedArgs.limit,
                  domain || '',
                  { getCommerceProvider: getProviderFn, searchSimilarContent: searchFn }
                );
              case 'search_by_category':
                return await executeSearchByCategory(
                  (parsedArgs.category as string).trim(),
                  parsedArgs.limit,
                  domain || '',
                  { searchSimilarContent: searchFn }
                );
              case 'get_product_details':
                return await executeGetProductDetails(
                  (parsedArgs.productQuery as string).trim(),
                  parsedArgs.includeSpecs,
                  domain || '',
                  { getCommerceProvider: getProviderFn, searchSimilarContent: searchFn }
                );
              case 'lookup_order':
                return await executeLookupOrder(
                  (parsedArgs.orderId as string).trim(),
                  domain || '',
                  { getCommerceProvider: getProviderFn }
                );
              default:
                throw new Error(`Unknown tool: ${toolName}`);
            }
          };

          result = await runWithTimeout(runTool, searchTimeout);
        } catch (error) {
          console.error(`[Intelligent Chat] Tool ${toolName} failed:`, error);
          result = { success: false, results: [], source: 'error' };
        }

        const executionTime = Date.now() - startTime;
        console.log(`[Intelligent Chat] Tool ${toolName} completed in ${executionTime}ms: ${result.results.length} results`);

        // Track search in telemetry
        telemetry?.trackSearch({
          tool: toolName,
          query: parsedArgs.query || parsedArgs.category || parsedArgs.productQuery || '',
          resultCount: result.results.length,
          source: result.source,
          startTime
        });

        // Return all data for processing
        return {
          toolCall,
          toolName,
          toolArgs: parsedArgs,
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

          if (result.source === 'invalid-arguments') {
            switch (toolName) {
              case 'search_products':
                toolResponse = 'I want to search our inventory for you, but I need a product name or keywords to look up. Could you share what you are looking for?';
                break;
              case 'search_by_category':
                toolResponse = 'I can browse our categories once I know which topic you want—shipping, returns, installation, etc. Let me know and I will pull it up.';
                break;
              case 'get_product_details':
                toolResponse = 'To grab detailed specifications I need the product or part number you are checking on. Share that and I will verify the details.';
                break;
              case 'lookup_order':
                toolResponse = 'I can check an order status once I have the order number. Please provide it and I will look it up right away.';
                break;
              default:
                toolResponse = 'I need a little more detail to continue. Could you clarify what you want me to look up?';
            }
          } else if (result.source === 'invalid-domain') {
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
          model: 'gpt-4',  // Fallback to GPT-4
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

    // If we hit max iterations, use last completion's content (avoid redundant API call)
    if (iteration >= maxIterations && shouldContinue) {
      console.log('[Intelligent Chat] Max iterations reached, using last response');
      finalResponse = completion.choices[0]?.message?.content ||
        'I apologize, but I need more time to gather all the information. Please try asking more specifically.';
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
      finalResponse = sanitizeFn(finalResponse, domain);
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
    await saveAssistantMessage(conversationId, finalResponse, adminSupabase);

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

    // DEBUG: Enhanced error logging for tests
    if (process.env.NODE_ENV === 'test') {
      console.error('[TEST DEBUG] Full error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        type: error?.constructor?.name,
        error
      });
    }

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
        message: 'An unexpected error occurred. Please try again.',
        // Include error details in test environment
        ...(process.env.NODE_ENV === 'test' && {
          debug: {
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack?.split('\n').slice(0, 5) : undefined
          }
        })
      },
      { status: 500 }
    );
  }
}
