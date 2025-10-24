/**
 * AI Processor
 *
 * Handles the complete AI conversation processing flow including:
 * - Model configuration (GPT-5-mini vs GPT-4)
 * - ReAct loop orchestration
 * - Tool execution and result formatting
 * - Response assembly and formatting
 */

import OpenAI from 'openai';
import { SearchResult } from '@/types';
import { ChatTelemetry } from '@/lib/chat-telemetry';
import { SEARCH_TOOLS, validateToolArguments, runWithTimeout } from './tool-definitions';
import {
  executeSearchProducts,
  executeSearchByCategory,
  executeGetProductDetails,
  executeLookupOrder
} from './tool-handlers';

export interface AIProcessorDependencies {
  getCommerceProvider: any;
  searchSimilarContent: any;
  sanitizeOutboundLinks: any;
}

export interface AIProcessorResult {
  finalResponse: string;
  allSearchResults: SearchResult[];
  searchLog: Array<{ tool: string; query: string; resultCount: number; source: string }>;
  iteration: number;
}

/**
 * Process AI conversation with ReAct loop and tool execution
 */
export async function processAIConversation(params: {
  conversationMessages: Array<any>;
  domain: string | undefined;
  config: any;
  telemetry: ChatTelemetry | null;
  openaiClient: OpenAI;
  useGPT5Mini: boolean;
  dependencies: AIProcessorDependencies;
}): Promise<AIProcessorResult> {
  const {
    conversationMessages,
    domain,
    config,
    telemetry,
    openaiClient,
    useGPT5Mini,
    dependencies
  } = params;

  const { getCommerceProvider: getProviderFn, searchSimilarContent: searchFn, sanitizeOutboundLinks: sanitizeFn } = dependencies;

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

  return {
    finalResponse,
    allSearchResults,
    searchLog,
    iteration
  };
}
