/**
 * MCP Tool: Get Product Details
 *
 * Purpose: Retrieve comprehensive product details using multi-strategy lookup
 * Category: commerce
 * Version: 1.0.0
 * Last Updated: 2025-11-07
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
import { PerformanceTimer } from '../shared/utils/logger';
import { normalizeDomain } from '@/lib/chat/tool-handlers/domain-utils';
import {
  tryProviderStrategy,
  tryExactMatchStrategy,
  trySemanticStrategy,
  StrategyResult
} from './utils/product-strategies';
import {
  buildSuccessResult,
  buildNotFoundResult,
  buildErrorResult,
  buildInvalidDomainResult
} from './utils/product-results';

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
      input: { productQuery: 'equipment model A4VTG90', includeSpecs: true },
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
      input: 20,
      output: 150
    }
  }
};

// =====================================================
// SECTION 3: Tool Implementation
// =====================================================

/**
 * Get product details using multi-strategy approach
 */
export async function getProductDetails(
  input: GetProductDetailsInput,
  context: ExecutionContext
): Promise<ToolResult<GetProductDetailsOutput>> {
  const timer = new PerformanceTimer();

  try {
    const validatedInput = validateInput(getProductDetailsInputSchema, input);

    if (!context.domain) {
      throw new Error('Missing required context: domain');
    }

    console.log(
      `[MCP getProductDetails] Query: "${validatedInput.productQuery}" | ` +
      `IncludeSpecs: ${validatedInput.includeSpecs} | ` +
      `Domain: ${context.domain}`
    );

    // Normalize and validate domain
    const normalizedDomain = normalizeDomain(context.domain);
    if (!normalizedDomain) {
      return buildInvalidDomainResult({
        customerId: context.customerId,
        executionTime: timer.elapsed()
      });
    }

    const query = validatedInput.productQuery;
    let result: StrategyResult | null = null;

    // STRATEGY 1: Try commerce provider first
    try {
      result = await tryProviderStrategy(query, normalizedDomain);

      if (result?.success) {
        return buildSuccessResult(result, {
          customerId: context.customerId,
          executionTime: timer.elapsed()
        });
      }

      if (result && !result.success) {
        // Provider found product not found, try exact match for SKUs
        const exactMatch = await tryExactMatchStrategy(query, normalizedDomain);
        if (exactMatch?.success) {
          return buildSuccessResult(exactMatch, {
            customerId: context.customerId,
            executionTime: timer.elapsed()
          }, 'exact-match-after-provider');
        }

        // Return provider's not-found result with suggestions
        return buildNotFoundResult(result, {
          customerId: context.customerId,
          executionTime: timer.elapsed()
        });
      }
    } catch (providerError) {
      console.log(`[MCP getProductDetails] Provider error, trying fallback strategies`);

      // STRATEGY 2: Try exact match on provider error
      const exactMatch = await tryExactMatchStrategy(query, normalizedDomain);
      if (exactMatch?.success) {
        return buildSuccessResult(exactMatch, {
          customerId: context.customerId,
          executionTime: timer.elapsed()
        }, 'exact-match-after-error');
      }
    }

    // STRATEGY 2: No provider available - try exact match for SKUs
    if (!result) {
      const exactMatch = await tryExactMatchStrategy(query, normalizedDomain);
      if (exactMatch?.success) {
        return buildSuccessResult(exactMatch, {
          customerId: context.customerId,
          executionTime: timer.elapsed()
        }, 'exact-match-no-provider');
      }
    }

    // STRATEGY 3: Semantic search fallback
    const semanticResult = await trySemanticStrategy(
      query,
      normalizedDomain,
      validatedInput.includeSpecs
    );

    return buildSuccessResult(semanticResult, {
      customerId: context.customerId,
      executionTime: timer.elapsed()
    });

  } catch (error) {
    console.error('[MCP getProductDetails] Error:', error);

    return buildErrorResult(error, {
      customerId: context.customerId,
      executionTime: timer.elapsed()
    });
  }
}

export default getProductDetails;
