/**
 * AI Processor Helper Functions
 *
 * Utility functions for tool execution, product collection, and shopping mode integration.
 */

import { SearchResult } from '@/types';
import { ChatTelemetry } from '@/lib/chat-telemetry';
import { executeToolCallsParallel, formatToolResultsForAI } from './ai-processor-tool-executor';
import {
  transformWooCommerceProducts,
  transformShopifyProducts,
  shouldTriggerShoppingMode,
  extractShoppingContext
} from './shopping-message-transformer';
import { ShoppingProduct } from '@/types/shopping';
import { AIProcessorDependencies } from './ai-processor-types';

/**
 * Execute tools and collect search results and products
 */
export async function executeAndCollectTools(
  toolCalls: any[],
  domain: string,
  searchTimeout: number,
  telemetry: ChatTelemetry | undefined,
  dependencies: AIProcessorDependencies,
  conversationMessages: any[]
): Promise<{
  toolResults: any[];
  allSearchResults: SearchResult[];
  allProducts: any[];
  searchLog: Array<{ tool: string; query: string; resultCount: number; source: string }>;
}> {
  const allSearchResults: SearchResult[] = [];
  const searchLog: Array<{ tool: string; query: string; resultCount: number; source: string }> = [];
  const allProducts: any[] = [];

  console.log('[Tool Execution] Starting tool execution for', toolCalls.length, 'tools');

  const toolExecutionResults = await executeToolCallsParallel(
    toolCalls,
    domain,
    searchTimeout,
    telemetry,
    dependencies
  );

  // Collect search results and log
  for (const execResult of toolExecutionResults) {
    const { toolName, toolArgs, result } = execResult;

    searchLog.push({
      tool: toolName,
      query: toolArgs.query || toolArgs.category || toolArgs.productQuery || '',
      resultCount: result.results.length,
      source: result.source
    });

    allSearchResults.push(...result.results);

    // Collect products from ALL tool results (API and semantic search)
    console.log(`[Shopping Debug] Checking ${result.results.length} results from ${result.source}`);
    console.log('[Shopping Debug] First result keys:', result.results[0] ? Object.keys(result.results[0]) : []);

    for (const searchResult of result.results) {
      // Case 1: Direct API results with metadata.id
      if (searchResult.metadata && searchResult.metadata.id) {
        console.log('[Shopping Debug] ✅ Case 1 matched - API result with metadata.id');
        allProducts.push(searchResult.metadata);
      }
      // Case 2: Embeddings results with product URL (e.g., /product/pump-name/)
      else if (searchResult.url && searchResult.url.includes('/product/') && searchResult.content) {
        console.log('[Shopping Debug] ✅ Case 2 matched - Embeddings result with /product/ URL');
        // Parse product data from embeddings result
        const priceMatch = searchResult.content.match(/Price:\s*([0-9,.]+)/i);
        const skuMatch = searchResult.content.match(/SKU:\s*([^\s\n]+)/i);

        const product = {
          id: searchResult.url,
          name: searchResult.title || 'Product',
          price: priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 0,
          sku: skuMatch ? skuMatch[1] : '',
          permalink: searchResult.url,
          images: [],
          stockStatus: 'instock',
          shortDescription: searchResult.content.split('\n')[0] || '',
        };
        allProducts.push(product);
      }
    }
  }

  const toolResults = formatToolResultsForAI(toolExecutionResults);

  // Log error messages for telemetry
  toolResults.forEach(result => {
    if (result.content.includes('⚠️ ERROR:')) {
      console.log('[Intelligent Chat] Error message sent to AI:', {
        errorContent: result.content.substring(0, 200),
        toolCallId: result.tool_call_id
      });

      telemetry?.log('warn', 'ai', 'Error message sent to AI', {
        errorPreview: result.content.substring(0, 200)
      });
    }
  });

  return { toolResults, allSearchResults, allProducts, searchLog };
}

/**
 * Process and prepare shopping products for the response
 */
export function prepareShoppingProducts(
  allProducts: any[],
  searchLog: Array<{ tool: string; query: string; resultCount: number; source: string }>,
  finalResponse: string,
  lastUserQuery: string,
  isMobile: boolean
): { shoppingProducts?: ShoppingProduct[]; shoppingContext?: string } {
  if (allProducts.length === 0) {
    return {};
  }

  console.log(`[Shopping Integration] Found ${allProducts.length} products from commerce providers`);

  // DEBUG: Check searchLog structure
  console.log('[Shopping Debug] searchLog length:', searchLog.length);
  console.log('[Shopping Debug] searchLog sources:', searchLog.map(log => log.source));

  // Determine platform from search log
  const hasWooCommerce = searchLog.some(log => log.source.includes('woocommerce'));
  const hasShopify = searchLog.some(log => log.source.includes('shopify'));

  console.log('[Shopping Debug] hasWooCommerce:', hasWooCommerce);
  console.log('[Shopping Debug] hasShopify:', hasShopify);

  // Transform products based on platform
  let shoppingProducts: ShoppingProduct[] | undefined;
  if (hasWooCommerce) {
    shoppingProducts = transformWooCommerceProducts(allProducts);
  } else if (hasShopify) {
    shoppingProducts = transformShopifyProducts(allProducts);
  }

  // Check if shopping mode should be triggered
  if (shoppingProducts && shouldTriggerShoppingMode(finalResponse, shoppingProducts, isMobile)) {
    const shoppingContext = extractShoppingContext(finalResponse, lastUserQuery);
    console.log(`[Shopping Integration] Shopping mode triggered with ${shoppingProducts.length} products${isMobile ? ' (mobile)' : ''}`);
    if (shoppingContext) {
      console.log(`[Shopping Integration] Context: ${shoppingContext}`);
    }
    return { shoppingProducts, shoppingContext };
  }

  // Don't include shopping products if mode shouldn't be triggered
  return {};
}

/**
 * Log search summary and iteration metrics
 */
export function logSearchSummary(
  iteration: number,
  maxIterations: number,
  searchLog: Array<{ tool: string; query: string; resultCount: number; source: string }>,
  allSearchResults: SearchResult[],
  allProducts: any[],
  shoppingProducts: ShoppingProduct[] | undefined
): void {
  console.log('[Intelligent Chat] Search Summary:', {
    totalIterations: iteration,
    maxIterations,
    iterationUtilization: `${Math.round((iteration / maxIterations) * 100)}%`,
    totalSearches: searchLog.length,
    totalResults: allSearchResults.length,
    searchBreakdown: searchLog,
    uniqueUrlsFound: Array.from(new Set(allSearchResults.map(r => r.url))).length,
    productsFound: allProducts.length,
    shoppingModeTriggered: !!shoppingProducts
  });

  if (iteration >= maxIterations - 1) {
    console.warn(`[Intelligent Chat] Nearly hit iteration limit (${iteration}/${maxIterations}). Consider increasing maxIterations if queries frequently timeout.`);
  }
}
