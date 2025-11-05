/**
 * MCP Tool: Get Product Details
 *
 * Purpose: Retrieve comprehensive product details using multi-strategy lookup
 * Category: commerce
 * Version: 1.0.0
 * Last Updated: 2025-11-05
 *
 * This tool provides multi-strategy product retrieval:
 * 1. Commerce provider lookup (WooCommerce/Shopify native APIs)
 * 2. Exact SKU match fallback (95% accuracy for SKUs)
 * 3. Semantic search fallback (embeddings-based)
 *
 * Strategy Selection:
 * - SKU-like queries → Try exact match first, then provider, then semantic
 * - Product name queries → Provider first, then semantic
 * - Provider errors → Fallback to exact match for SKUs, or semantic
 */

import { z } from 'zod';
import { SearchResult } from '@/types';
import { ExecutionContext, ToolResult, ToolMetadata } from '../shared/types';
import { validateInput } from '../shared/validation';
import { logToolExecution, PerformanceTimer } from '../shared/utils/logger';
import { getCommerceProvider } from '@/lib/agents/commerce-provider';
import { formatProviderProduct } from '@/lib/chat/product-formatters';
import { normalizeDomain } from '@/lib/chat/tool-handlers/domain-utils';
import { isSkuPattern, exactMatchSearch } from '@/lib/search/exact-match-search';
import { searchSimilarContent } from '@/lib/embeddings-optimized';
import { trackLookupFailure } from '@/lib/telemetry/lookup-failures';

// =====================================================
// SECTION 1: Type Definitions
// =====================================================

export const getProductDetailsInputSchema = z.object({
  productQuery: z.string().min(1).max(500).describe('Product identifier (SKU, name, or description)'),
  includeSpecs: z.boolean().optional().default(true).describe('Include technical specifications in search'),
});

export type GetProductDetailsInput = z.infer<typeof getProductDetailsInputSchema>;

export interface GetProductDetailsOutput {
  success: boolean;
  results: SearchResult[];
  source: 'woocommerce-detail' | 'shopify-detail' | 'exact-match-after-provider' | 'exact-match-after-error' |
          'exact-match-no-provider' | 'semantic' | 'woocommerce-not-found' | 'shopify-not-found' |
          'invalid-domain' | 'error';
  executionTime: number;
  errorMessage?: string;
  suggestions?: string[];
}

interface FuzzyMatchResult {
  suggestions: string[];
}

// =====================================================
// SECTION 2: MCP Metadata
// =====================================================

export const metadata: ToolMetadata = {
  name: 'getProductDetails',
  description: 'Retrieve detailed product information using multi-strategy approach: commerce provider APIs, exact SKU matching, and semantic search',
  category: 'commerce',
  version: '1.0.0',
  author: 'Omniops Engineering',

  inputSchema: getProductDetailsInputSchema,

  capabilities: {
    requiresAuth: true,
    requiresContext: ['customerId', 'domain'],
    rateLimit: { requests: 100, window: '1m' },
    caching: { enabled: true, ttl: 300 }
  },

  examples: [
    {
      description: 'Get product details by SKU',
      input: { productQuery: 'MU110667601', includeSpecs: true },
      expectedOutput: 'Complete product details from commerce provider or exact match with 1.0 similarity'
    },
    {
      description: 'Get product details by name',
      input: { productQuery: 'hydraulic pump A4VTG90', includeSpecs: true },
      expectedOutput: 'Product details with specifications from semantic search'
    },
    {
      description: 'Get product without technical specs',
      input: { productQuery: 'BP-001', includeSpecs: false },
      expectedOutput: 'Basic product information without enhanced specification search'
    }
  ],

  performance: {
    avgLatency: '250ms',
    maxLatency: '2s',
    tokenUsage: {
      input: 20, // Semantic search embedding
      output: 150 // Multiple chunks with product details
    }
  }
};

// =====================================================
// SECTION 3: Helper Functions
// =====================================================

/**
 * Check if a result contains fuzzy match suggestions
 */
function isFuzzyMatchResult(result: any): result is FuzzyMatchResult {
  return result && 'suggestions' in result && Array.isArray(result.suggestions);
}

/**
 * Determine query type for telemetry
 */
function getQueryType(query: string): 'sku' | 'product_name' {
  return /^[A-Z0-9-]{6,}$/i.test(query) ? 'sku' : 'product_name';
}

// =====================================================
// SECTION 4: Tool Implementation
// =====================================================

/**
 * Get product details using multi-strategy approach
 *
 * Strategy priority:
 * 1. Commerce provider (WooCommerce/Shopify) - fastest, most accurate
 * 2. Exact SKU match (if SKU pattern detected and provider fails/unavailable)
 * 3. Semantic search fallback (embeddings-based)
 *
 * The tool intelligently selects the best strategy based on:
 * - Query pattern (SKU vs product name)
 * - Provider availability
 * - Previous strategy success/failure
 */
export async function getProductDetails(
  input: GetProductDetailsInput,
  context: ExecutionContext
): Promise<ToolResult<GetProductDetailsOutput>> {
  const timer = new PerformanceTimer();

  try {
    // Validate input
    const validatedInput = validateInput(getProductDetailsInputSchema, input);

    // Check required context
    if (!context.domain) {
      throw new Error('Missing required context: domain');
    }

    console.log(
      `[MCP getProductDetails] Query: "${validatedInput.productQuery}" | ` +
      `IncludeSpecs: ${validatedInput.includeSpecs} | ` +
      `Domain: ${context.domain}`
    );

    // Normalize domain
    const normalizedDomain = normalizeDomain(context.domain);
    if (!normalizedDomain) {
      const executionTime = timer.elapsed();

      await logToolExecution({
        tool: 'getProductDetails',
        category: 'commerce',
        customerId: context.customerId || 'unknown',
        status: 'error',
        error: 'Invalid or localhost domain',
        executionTime,
        timestamp: new Date().toISOString()
      });

      return {
        success: false,
        data: {
          success: false,
          results: [],
          source: 'invalid-domain',
          executionTime
        },
        error: {
          code: 'INVALID_DOMAIN',
          message: 'Invalid or localhost domain - cannot retrieve product details without valid domain'
        },
        metadata: {
          executionTime
        }
      };
    }

    // STRATEGY 1: Try commerce provider first
    const provider = await getCommerceProvider(normalizedDomain);

    if (provider) {
      console.log(`[MCP getProductDetails] Using commerce provider "${provider.platform}"`);

      try {
        const details = await provider.getProductDetails(validatedInput.productQuery.trim());

        if (details) {
          // Check for fuzzy match result (product not found, but suggestions available)
          if (isFuzzyMatchResult(details)) {
            let errorMessage = `Product "${validatedInput.productQuery}" not found in catalog`;
            if (details.suggestions.length > 0) {
              errorMessage += `\n\nDid you mean one of these?\n${details.suggestions.map(s => `- ${s}`).join('\n')}`;
            }

            console.log(
              `[MCP getProductDetails] ${provider.platform} product not found, but similar SKUs suggested: ${details.suggestions.join(', ')}`
            );

            // Track for telemetry
            await trackLookupFailure({
              query: validatedInput.productQuery,
              queryType: getQueryType(validatedInput.productQuery),
              errorType: 'not_found',
              platform: provider.platform,
              suggestions: details.suggestions,
              timestamp: new Date(),
            });

            const executionTime = timer.elapsed();

            return {
              success: false,
              data: {
                success: false,
                results: [],
                source: `${provider.platform}-not-found` as any,
                executionTime,
                errorMessage,
                suggestions: details.suggestions
              },
              error: {
                code: 'PRODUCT_NOT_FOUND',
                message: errorMessage,
                details: { suggestions: details.suggestions }
              },
              metadata: {
                executionTime,
                source: provider.platform
              }
            };
          }

          // Normal product result - format and return
          const result = formatProviderProduct(provider.platform, details, normalizedDomain);
          if (result) {
            const executionTime = timer.elapsed();

            console.log(`[MCP getProductDetails] Product found via ${provider.platform}`);

            await logToolExecution({
              tool: 'getProductDetails',
              category: 'commerce',
              customerId: context.customerId || 'unknown',
              status: 'success',
              resultCount: 1,
              executionTime,
              timestamp: new Date().toISOString()
            });

            return {
              success: true,
              data: {
                success: true,
                results: [result],
                source: `${provider.platform}-detail` as any,
                executionTime
              },
              metadata: {
                executionTime,
                cached: false,
                source: provider.platform
              }
            };
          }
        } else {
          // Product not found in commerce platform
          console.log(`[MCP getProductDetails] ${provider.platform} product not found: "${validatedInput.productQuery}"`);

          // STRATEGY 2A: Try exact match if it's a SKU pattern (after provider miss)
          if (isSkuPattern(validatedInput.productQuery)) {
            console.log(`[MCP getProductDetails] Trying exact SKU match after provider miss`);

            const exactResults = await exactMatchSearch(validatedInput.productQuery, normalizedDomain, 5);
            if (exactResults.length > 0) {
              const executionTime = timer.elapsed();

              console.log(`[MCP getProductDetails] Exact match found ${exactResults.length} results after provider miss`);

              await logToolExecution({
                tool: 'getProductDetails',
                category: 'commerce',
                customerId: context.customerId || 'unknown',
                status: 'success',
                resultCount: exactResults.length,
                executionTime,
                timestamp: new Date().toISOString()
              });

              return {
                success: true,
                data: {
                  success: true,
                  results: exactResults,
                  source: 'exact-match-after-provider',
                  executionTime
                },
                metadata: {
                  executionTime,
                  cached: false,
                  source: 'exact-match'
                }
              };
            }
          }

          // Track not found for telemetry
          await trackLookupFailure({
            query: validatedInput.productQuery,
            queryType: getQueryType(validatedInput.productQuery),
            errorType: 'not_found',
            platform: provider.platform,
            timestamp: new Date(),
          });

          const executionTime = timer.elapsed();

          return {
            success: false,
            data: {
              success: false,
              results: [],
              source: `${provider.platform}-not-found` as any,
              executionTime,
              errorMessage: `Product "${validatedInput.productQuery}" not found in catalog`
            },
            error: {
              code: 'PRODUCT_NOT_FOUND',
              message: `Product "${validatedInput.productQuery}" not found in catalog`
            },
            metadata: {
              executionTime,
              source: provider.platform
            }
          };
        }
      } catch (providerError) {
        console.error(`[MCP getProductDetails] ${provider.platform} detail error:`, providerError);

        // STRATEGY 2B: Try exact match on provider error if it's a SKU pattern
        if (isSkuPattern(validatedInput.productQuery)) {
          console.log(`[MCP getProductDetails] Trying exact SKU match after provider error`);

          const exactResults = await exactMatchSearch(validatedInput.productQuery, normalizedDomain, 5);
          if (exactResults.length > 0) {
            const executionTime = timer.elapsed();

            console.log(`[MCP getProductDetails] Exact match found ${exactResults.length} results after provider error`);

            await logToolExecution({
              tool: 'getProductDetails',
              category: 'commerce',
              customerId: context.customerId || 'unknown',
              status: 'success',
              resultCount: exactResults.length,
              executionTime,
              timestamp: new Date().toISOString()
            });

            return {
              success: true,
              data: {
                success: true,
                results: exactResults,
                source: 'exact-match-after-error',
                executionTime
              },
              metadata: {
                executionTime,
                cached: false,
                source: 'exact-match'
              }
            };
          }
        }

        // Track API errors for telemetry
        await trackLookupFailure({
          query: validatedInput.productQuery,
          queryType: getQueryType(validatedInput.productQuery),
          errorType: 'api_error',
          platform: provider.platform,
          timestamp: new Date(),
        });

        const executionTime = timer.elapsed();
        const errorMessage = `Error looking up product: ${providerError instanceof Error ? providerError.message : 'Unknown error'}`;

        return {
          success: false,
          data: {
            success: false,
            results: [],
            source: 'error',
            executionTime,
            errorMessage
          },
          error: {
            code: 'PROVIDER_ERROR',
            message: errorMessage,
            details: providerError
          },
          metadata: {
            executionTime,
            source: provider.platform
          }
        };
      }
    }

    // STRATEGY 2C: If no provider, try exact match first for SKU patterns
    if (isSkuPattern(validatedInput.productQuery)) {
      console.log(`[MCP getProductDetails] No provider available, trying exact SKU match`);

      const exactResults = await exactMatchSearch(validatedInput.productQuery, normalizedDomain, 5);
      if (exactResults.length > 0) {
        const executionTime = timer.elapsed();

        console.log(`[MCP getProductDetails] Exact match found ${exactResults.length} results (no provider)`);

        await logToolExecution({
          tool: 'getProductDetails',
          category: 'commerce',
          customerId: context.customerId || 'unknown',
          status: 'success',
          resultCount: exactResults.length,
          executionTime,
          timestamp: new Date().toISOString()
        });

        return {
          success: true,
          data: {
            success: true,
            results: exactResults,
            source: 'exact-match-no-provider',
            executionTime
          },
          metadata: {
            executionTime,
            cached: false,
            source: 'exact-match'
          }
        };
      }

      console.log(`[MCP getProductDetails] No exact match found, falling back to semantic search`);
    }

    // STRATEGY 3: Semantic search fallback
    console.log(`[MCP getProductDetails] Using semantic search fallback`);

    // Enhanced query for detailed product information
    let enhancedQuery = validatedInput.productQuery;
    if (validatedInput.includeSpecs) {
      enhancedQuery = `${validatedInput.productQuery} specifications technical details features`;
    }

    // Return more chunks (15 instead of 5) to ensure AI gets complete information
    const semanticResults = await searchSimilarContent(
      enhancedQuery,
      normalizedDomain,
      15,
      0.3 // Minimum similarity threshold
    );

    const executionTime = timer.elapsed();

    console.log(`[MCP getProductDetails] Semantic search returned ${semanticResults.length} results`);

    await logToolExecution({
      tool: 'getProductDetails',
      category: 'commerce',
      customerId: context.customerId || 'unknown',
      status: 'success',
      resultCount: semanticResults.length,
      executionTime,
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      data: {
        success: true,
        results: semanticResults,
        source: 'semantic',
        executionTime
      },
      metadata: {
        executionTime,
        cached: false,
        source: 'semantic'
      }
    };

  } catch (error) {
    const executionTime = timer.elapsed();

    console.error('[MCP getProductDetails] Error:', error);

    await logToolExecution({
      tool: 'getProductDetails',
      category: 'commerce',
      customerId: context.customerId || 'unknown',
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTime,
      timestamp: new Date().toISOString()
    });

    return {
      success: false,
      data: {
        success: false,
        results: [],
        source: 'error',
        executionTime
      },
      error: {
        code: 'GET_PRODUCT_DETAILS_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred while retrieving product details',
        details: error
      },
      metadata: {
        executionTime
      }
    };
  }
}

export default getProductDetails;
