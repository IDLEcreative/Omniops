/**
 * MCP Tool: Search Products
 *
 * Purpose: Semantic search for products using embeddings, exact SKU matching, and commerce provider integration
 * Category: search
 * Version: 1.0.0
 * Last Updated: 2025-11-05
 *
 * This tool provides multi-strategy product search:
 * 1. Exact SKU match (fastest, 95% accuracy for SKUs)
 * 2. Commerce provider search (WooCommerce/Shopify native APIs)
 * 3. Semantic search fallback (embeddings-based)
 */

import { z } from 'zod';
import { SearchResult } from '@/types';
import { ExecutionContext, ToolResult, ToolMetadata } from '../shared/types';
import { validateInput } from '../shared/validation';
import { logToolExecution, PerformanceTimer } from '../shared/utils/logger';
import { getCommerceProvider } from '@/lib/agents/commerce-provider';
import { searchSimilarContent } from '@/lib/embeddings-optimized';
import { formatProviderProducts } from '@/lib/chat/product-formatters';
import { normalizeDomain } from '@/lib/chat/tool-handlers/domain-utils';
import { isSkuPattern, exactMatchSearch } from '@/lib/search/exact-match-search';

// =====================================================
// SECTION 1: Type Definitions
// =====================================================

export const searchProductsInputSchema = z.object({
  query: z.string().min(1).max(500).describe('Search query (product name, SKU, or description)'),
  limit: z.number().int().min(1).max(1000).default(100).describe('Maximum number of results to return'),
});

export type SearchProductsInput = z.infer<typeof searchProductsInputSchema>;

export interface SearchProductsOutput {
  results: SearchResult[];
  totalMatches: number;
  executionTime: number;
  source: 'exact-match' | 'woocommerce' | 'shopify' | 'semantic' | 'error' | 'invalid-domain';
  adaptiveLimit?: number; // The actual limit used after adaptive optimization
}

// =====================================================
// SECTION 2: MCP Metadata
// =====================================================

export const metadata: ToolMetadata = {
  name: 'searchProducts',
  description: 'Search for products using multi-strategy approach: exact SKU matching, commerce provider APIs, and semantic embeddings search',
  category: 'search',
  version: '1.0.0',
  author: 'Omniops Engineering',

  inputSchema: searchProductsInputSchema,

  capabilities: {
    requiresAuth: true,
    requiresContext: ['customerId', 'domain'],
    rateLimit: { requests: 100, window: '1m' },
    caching: { enabled: true, ttl: 300 }
  },

  examples: [
    {
      description: 'Search for hydraulic pumps',
      input: { query: 'hydraulic pumps', limit: 10 },
      expectedOutput: 'Array of 10 pump products with relevance scores from semantic search'
    },
    {
      description: 'Exact SKU lookup',
      input: { query: 'MU110667601', limit: 5 },
      expectedOutput: 'Exact match results for SKU MU110667601 with 1.0 similarity'
    },
    {
      description: 'Broad product search',
      input: { query: 'spare parts', limit: 50 },
      expectedOutput: 'Up to 50 spare parts from commerce provider or semantic search'
    }
  ],

  performance: {
    avgLatency: '200ms',
    maxLatency: '2s',
    tokenUsage: {
      input: 0, // No token usage for exact match or provider search
      output: 50 // Estimated tokens for semantic search results
    }
  }
};

// =====================================================
// SECTION 3: Tool Implementation
// =====================================================

/**
 * Search for products using multi-strategy approach
 *
 * Strategy priority:
 * 1. If query is SKU-like → Try exact match first
 * 2. If commerce provider available → Use native provider search
 * 3. Fallback → Semantic embeddings search
 */
export async function searchProducts(
  input: SearchProductsInput,
  context: ExecutionContext
): Promise<ToolResult<SearchProductsOutput>> {
  const timer = new PerformanceTimer();

  try {
    // Validate input
    const validatedInput = validateInput(searchProductsInputSchema, input);

    // Check required context
    if (!context.domain) {
      throw new Error('Missing required context: domain');
    }

    // Normalize domain
    const normalizedDomain = normalizeDomain(context.domain);
    if (!normalizedDomain) {
      const executionTime = timer.elapsed();

      await logToolExecution({
        tool: 'searchProducts',
        category: 'search',
        customerId: context.customerId || 'unknown',
        status: 'error',
        error: 'Invalid or localhost domain',
        executionTime,
        timestamp: new Date().toISOString()
      });

      return {
        success: false,
        data: {
          results: [],
          totalMatches: 0,
          executionTime,
          source: 'invalid-domain'
        },
        error: {
          code: 'INVALID_DOMAIN',
          message: 'Invalid or localhost domain - cannot search without valid domain'
        },
        metadata: {
          executionTime
        }
      };
    }

    // Adaptive limit: reduce for targeted queries to improve speed
    const queryWords = validatedInput.query.trim().split(/\s+/).length;
    const adaptiveLimit = queryWords > 3 ? Math.min(50, validatedInput.limit) : validatedInput.limit;

    console.log(
      `[MCP searchProducts] Query: "${validatedInput.query}" | ` +
      `Limit: ${adaptiveLimit} (original: ${validatedInput.limit}) | ` +
      `Words: ${queryWords} | Domain: ${normalizedDomain}`
    );

    // STRATEGY 1: Exact SKU match (if pattern detected)
    if (isSkuPattern(validatedInput.query)) {
      console.log(`[MCP searchProducts] Detected SKU pattern "${validatedInput.query}", trying exact match`);

      const exactResults = await exactMatchSearch(validatedInput.query, normalizedDomain, 10);

      if (exactResults.length > 0) {
        const executionTime = timer.elapsed();

        console.log(`[MCP searchProducts] Exact match found ${exactResults.length} results for SKU "${validatedInput.query}"`);

        await logToolExecution({
          tool: 'searchProducts',
          category: 'search',
          customerId: context.customerId || 'unknown',
          status: 'success',
          resultCount: exactResults.length,
          executionTime,
          timestamp: new Date().toISOString()
        });

        return {
          success: true,
          data: {
            results: exactResults,
            totalMatches: exactResults.length,
            executionTime,
            source: 'exact-match',
            adaptiveLimit
          },
          metadata: {
            executionTime,
            cached: false,
            source: 'exact-match'
          }
        };
      }

      console.log(`[MCP searchProducts] No exact match for SKU "${validatedInput.query}", falling back to provider/semantic`);
    }

    // STRATEGY 2: Commerce provider search (WooCommerce/Shopify)
    const provider = await getCommerceProvider(normalizedDomain);

    if (provider) {
      console.log(`[MCP searchProducts] Using commerce provider "${provider.platform}" for ${normalizedDomain}`);

      try {
        const providerResults = await provider.searchProducts(validatedInput.query, adaptiveLimit);

        if (providerResults && providerResults.length > 0) {
          const formattedResults = formatProviderProducts(provider.platform, providerResults, normalizedDomain);

          if (formattedResults.length > 0) {
            const executionTime = timer.elapsed();

            console.log(`[MCP searchProducts] Provider "${provider.platform}" returned ${formattedResults.length} results`);

            await logToolExecution({
              tool: 'searchProducts',
              category: 'search',
              customerId: context.customerId || 'unknown',
              status: 'success',
              resultCount: formattedResults.length,
              executionTime,
              timestamp: new Date().toISOString()
            });

            return {
              success: true,
              data: {
                results: formattedResults,
                totalMatches: formattedResults.length,
                executionTime,
                source: provider.platform as any,
                adaptiveLimit
              },
              metadata: {
                executionTime,
                cached: false,
                source: provider.platform
              }
            };
          }
        }
      } catch (providerError) {
        console.error(`[MCP searchProducts] ${provider.platform} search error:`, providerError);
        // Continue to semantic fallback
      }
    }

    // STRATEGY 3: Semantic search fallback
    console.log(`[MCP searchProducts] Using semantic search fallback`);

    const semanticResults = await searchSimilarContent(
      validatedInput.query,
      normalizedDomain,
      adaptiveLimit,
      0.2 // Minimum similarity threshold
    );

    const executionTime = timer.elapsed();

    console.log(`[MCP searchProducts] Semantic search returned ${semanticResults.length} results`);

    await logToolExecution({
      tool: 'searchProducts',
      category: 'search',
      customerId: context.customerId || 'unknown',
      status: 'success',
      resultCount: semanticResults.length,
      executionTime,
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      data: {
        results: semanticResults,
        totalMatches: semanticResults.length,
        executionTime,
        source: 'semantic',
        adaptiveLimit
      },
      metadata: {
        executionTime,
        cached: false,
        source: 'semantic'
      }
    };

  } catch (error) {
    const executionTime = timer.elapsed();

    console.error('[MCP searchProducts] Error:', error);

    await logToolExecution({
      tool: 'searchProducts',
      category: 'search',
      customerId: context.customerId || 'unknown',
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTime,
      timestamp: new Date().toISOString()
    });

    return {
      success: false,
      data: {
        results: [],
        totalMatches: 0,
        executionTime,
        source: 'error'
      },
      error: {
        code: 'SEARCH_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred during search',
        details: error
      },
      metadata: {
        executionTime
      }
    };
  }
}

export default searchProducts;
