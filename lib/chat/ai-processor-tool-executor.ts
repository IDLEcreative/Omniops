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
import { crossReferenceResults } from './tool-executor-cross-reference';

// Re-export formatToolResultsForAI for backward compatibility
export { formatToolResultsForAI } from './tool-executor-formatters';

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
      (toolName === 'search_website_content' || toolName === 'search_by_category') &&
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
          case 'search_website_content':
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

            console.log(`[Tool Executor] WooCommerce operation result:`, {
              operation: parsedArgs.operation,
              success: wcResult.success,
              hasData: !!wcResult.data,
              hasProducts: !!wcResult.data?.products,
              productCount: wcResult.data?.products?.length || 0
            });

            // Convert WooCommerce result to SearchResult format for consistency
            let searchResults: SearchResult[] = [];

            if (wcResult.success) {
              // Special handling for search_products - unwrap products array
              if (parsedArgs.operation === 'search_products' && wcResult.data?.products) {
                // Convert each product to a SearchResult with product as metadata
                searchResults = wcResult.data.products.map((product: any) => ({
                  url: product.permalink || `${domain}/product/${product.id}`,
                  title: product.name,
                  content: product.shortDescription || product.description || '',
                  similarity: 1.0,
                  metadata: {
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    permalink: product.permalink,
                    short_description: product.shortDescription,
                    description: product.description,
                    stock_status: product.stockStatus,
                    stock_quantity: product.stockQuantity,
                    categories: product.categories,
                    images: product.images
                  }
                }));
                console.log(`[Tool Executor] Converted ${searchResults.length} WooCommerce products to SearchResults`);
              } else {
                // For other operations, wrap entire result
                searchResults = [{
                  url: domain || 'woocommerce',
                  title: `WooCommerce: ${parsedArgs.operation}`,
                  content: wcResult.message,
                  similarity: 1.0,
                  metadata: wcResult.data
                }];
              }
            }

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

  // Cross-reference WooCommerce/Shopify products with scraped pages
  const enrichedResults = await crossReferenceResults(toolExecutionResults);

  return enrichedResults;
}
