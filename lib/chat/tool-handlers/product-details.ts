/**
 * Get detailed product information
 */

import { SearchResult } from '@/types';
import { formatProviderProduct } from '../product-formatters';
import { normalizeDomain } from './domain-utils';
import type { ToolDependencies, ToolResult } from './types';

export async function executeGetProductDetails(
  productQuery: string,
  includeSpecs: boolean = true,
  domain: string,
  deps: ToolDependencies
): Promise<ToolResult> {
  const { getCommerceProvider: getProviderFn, searchSimilarContent: searchFn } = deps;
  console.log(`[Function Call] get_product_details: "${productQuery}" (includeSpecs: ${includeSpecs})`);

  try {
    const browseDomain = normalizeDomain(domain);

    if (!browseDomain) {
      return { success: false, results: [], source: 'invalid-domain' };
    }

    const provider = await getProviderFn(browseDomain);

    if (provider) {
      try {
        const details = await provider.getProductDetails(productQuery.trim());

        if (details) {
          const result = formatProviderProduct(provider.platform, details, browseDomain);
          if (result) {
            return {
              success: true,
              results: [result],
              source: `${provider.platform}-detail`
            };
          }
        }
      } catch (providerError) {
        console.error(`[Function Call] ${provider.platform} detail error:`, providerError);
      }
    }

    // Enhanced query for detailed product information (semantic fallback)
    let enhancedQuery = productQuery;
    if (includeSpecs) {
      enhancedQuery = `${productQuery} specifications technical details features`;
    }

    // Return more chunks (15 instead of 5) to ensure AI gets complete information
    // even if some chunks are lower quality. AI can synthesize from multiple chunks.
    const searchResults = await searchFn(enhancedQuery, browseDomain, 15, 0.3);
    console.log(`[Function Call] Product details (semantic) returned ${searchResults.length} results`);

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
