/**
 * AI Processor - Tool Executor
 *
 * Handles parallel execution of AI tool calls including:
 * - Argument validation and normalization
 * - Timeout management
 * - Error handling and recovery
 * - Result formatting for AI consumption
 */

import { SearchResult } from '@/types';
import { ChatTelemetry } from '@/lib/chat-telemetry';
import { validateToolArguments, runWithTimeout } from './tool-definitions';
import {
  executeSearchProducts,
  executeSearchByCategory,
  executeGetProductDetails,
  executeGetCompletePageDetails,
  executeLookupOrder
} from './tool-handlers';
import { executeWooCommerceOperation } from './woocommerce-tool';
import type { ToolExecutionResult, AIProcessorDependencies } from './ai-processor-types';

/**
 * Execute all tool calls in parallel and return formatted results
 */
export async function executeToolCallsParallel(
  toolCalls: Array<any>,
  domain: string | undefined,
  searchTimeout: number,
  telemetry: ChatTelemetry | null,
  dependencies: AIProcessorDependencies
): Promise<ToolExecutionResult[]> {
  const { getCommerceProvider: getProviderFn, searchSimilarContent: searchFn } = dependencies;

  console.log(`[Tool Executor] Executing ${toolCalls.length} tools in parallel`);
  const parallelStartTime = Date.now();

  // Create promises for all tool executions
  const toolPromises = toolCalls.map(async (toolCall) => {
    const toolName = toolCall.function.name;
    const startTime = Date.now();
    let parsedArgs: Record<string, any> = {};

    try {
      parsedArgs = toolCall.function.arguments ? JSON.parse(toolCall.function.arguments) : {};
    } catch (parseError) {
      console.error(`[Tool Executor] Failed to parse arguments for ${toolName}:`, parseError);
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
      console.warn(`[Tool Executor] Invalid arguments for ${toolName}: ${validationError}`);
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

    console.log(`[Tool Executor] Starting: ${toolName}`, parsedArgs);

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
          case 'get_complete_page_details':
            return await executeGetCompletePageDetails(
              (parsedArgs.pageQuery as string).trim(),
              domain || ''
            );
          case 'lookup_order':
            return await executeLookupOrder(
              (parsedArgs.orderId as string).trim(),
              domain || '',
              { getCommerceProvider: getProviderFn }
            );
          case 'woocommerce_operations': {
            // Execute WooCommerce operation and format result as SearchResult
            const wcResult = await executeWooCommerceOperation(
              parsedArgs.operation,
              parsedArgs,
              domain || ''
            );

            // Convert WooCommerce result to SearchResult format for consistency
            const searchResults: SearchResult[] = wcResult.success ? [{
              url: domain || 'woocommerce',
              title: `WooCommerce: ${parsedArgs.operation}`,
              content: wcResult.message,
              similarity: 1.0,
              metadata: wcResult.data
            }] : [];

            return {
              success: wcResult.success,
              results: searchResults,
              source: 'woocommerce-api'
            };
          }
          default:
            throw new Error(`Unknown tool: ${toolName}`);
        }
      };

      result = await runWithTimeout(runTool, searchTimeout);
    } catch (error) {
      console.error(`[Tool Executor] Tool ${toolName} failed:`, error);
      result = { success: false, results: [], source: 'error' };
    }

    const executionTime = Date.now() - startTime;
    console.log(`[Tool Executor] Tool ${toolName} completed in ${executionTime}ms: ${result.results.length} results`);

    // Track search in telemetry
    telemetry?.trackSearch({
      tool: toolName,
      query: parsedArgs.query || parsedArgs.category || parsedArgs.productQuery || '',
      resultCount: result.results.length,
      source: result.source,
      startTime
    });

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

  console.log(`[Tool Executor] All ${toolCalls.length} tools completed in ${parallelExecutionTime}ms`, {
    totalTools: toolCalls.length,
    totalTime: parallelExecutionTime,
    averageTimePerTool: Math.round(parallelExecutionTime / toolCalls.length),
    totalResultsFound: toolExecutionResults.reduce((sum, r) => sum + r.result.results.length, 0)
  });

  return toolExecutionResults;
}

/**
 * Format tool execution results for AI consumption
 */
export function formatToolResultsForAI(
  toolExecutionResults: ToolExecutionResult[]
): Array<{ tool_call_id: string; content: string }> {
  return toolExecutionResults.map(({ toolCall, toolName, toolArgs, result }) => {
    let toolResponse = '';

    // CRITICAL: Surface errorMessage prominently when present
    // This ensures AI explicitly communicates errors (e.g., "Product X not found") to users
    if (!result.success && result.errorMessage) {
      toolResponse = `⚠️ ERROR: ${result.errorMessage}\n\n`;
      console.log(`[Tool Executor] Surfacing error to AI: ${result.errorMessage}`);
    }

    if (result.success && result.results.length > 0) {
      toolResponse += `Found ${result.results.length} results from ${result.source}:\n\n`;
      result.results.forEach((item, index) => {
        toolResponse += `${index + 1}. ${item.title}\n`;
        toolResponse += `   URL: ${item.url}\n`;
        toolResponse += `   Content: ${item.content.substring(0, 200)}${item.content.length > 200 ? '...' : ''}\n`;
        toolResponse += `   Relevance: ${(item.similarity * 100).toFixed(1)}%\n\n`;
      });
    } else if (!result.errorMessage) {
      // Only provide generic fallback messages if no explicit errorMessage was set
      // Provide contextual error messages based on tool type
      const queryTerm = toolArgs.query || toolArgs.category || toolArgs.productQuery || toolArgs.orderId || 'this search';

      if (result.source === 'invalid-arguments') {
        switch (toolName) {
          case 'search_products':
            toolResponse += 'I want to search our inventory for you, but I need a product name or keywords to look up. Could you share what you are looking for?';
            break;
          case 'search_by_category':
            toolResponse += 'I can browse our categories once I know which topic you want—shipping, returns, installation, etc. Let me know and I will pull it up.';
            break;
          case 'get_product_details':
            toolResponse += 'To grab detailed specifications I need the product or item number you are checking on. Share that and I will verify the details.';
            break;
          case 'get_complete_page_details':
            toolResponse += 'I need to know which specific page or item you want complete details for. Let me know what you are interested in and I will retrieve all available information about it.';
            break;
          case 'lookup_order':
            toolResponse += 'I can check an order status once I have the order number. Please provide it and I will look it up right away.';
            break;
          default:
            toolResponse += 'I need a little more detail to continue. Could you clarify what you want me to look up?';
        }
      } else if (result.source === 'invalid-domain') {
        toolResponse += `Cannot perform search - domain not configured properly.`;
      } else if (toolName === 'lookup_order') {
        toolResponse += `I couldn't find any information about order ${queryTerm}. The order number might be incorrect, or it hasn't been entered into the system yet. Please ask the customer to double-check the order number.`;
      } else {
        toolResponse += `I couldn't find any information about "${queryTerm}". This might mean:
- The search term needs to be more specific or spelled differently
- The item might not be in the current inventory
- Try using alternative terms or checking the spelling

Please let me know if you'd like to search for something else or need assistance finding what you're looking for.`;
      }
    }

    // Ensure we always return some content (even if just the error message)
    const finalContent = toolResponse.trim() || 'Search completed with no results.';

    return {
      tool_call_id: toolCall.id,
      content: finalContent
    };
  });
}
