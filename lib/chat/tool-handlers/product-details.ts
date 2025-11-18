/**
 * Get detailed product information
 * Includes exact-match SKU search optimization for improved accuracy
 */

import { SearchResult } from '@/types';
import { formatProviderProduct } from '../product-formatters';
import { normalizeDomain } from './domain-utils';
import { trackLookupFailure } from '@/lib/telemetry/lookup-failures';
import { isSkuPattern, exactMatchSearch } from '@/lib/search/exact-match-search';
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
          // Check if result contains suggestions (fuzzy match result)
          if ('suggestions' in details && Array.isArray(details.suggestions)) {
            let errorMessage = `Product "${productQuery}" not found in catalog`;
            if (details.suggestions.length > 0) {
              errorMessage += `\n\nDid you mean one of these?\n${details.suggestions.map(s => `- ${s}`).join('\n')}`;
            }

            console.log(`[Function Call] ${provider.platform} product not found, but similar SKUs suggested: ${details.suggestions.join(', ')}`);

            // Track for telemetry
            await trackLookupFailure({
              query: productQuery,
              queryType: /^[A-Z0-9-]{6,}$/i.test(productQuery) ? 'sku' : 'product_name',
              errorType: 'not_found',
              platform: provider.platform,
              timestamp: new Date(),
            });

            return {
              success: false,
              results: [],
              source: `${provider.platform}-not-found`,
              errorMessage
            };
          }

          // Normal product result
          const result = formatProviderProduct(provider.platform, details, browseDomain);
          if (result) {
            return {
              success: true,
              results: [result],
              source: `${provider.platform}-detail`
            };
          }
        } else {
          // Product not found in commerce platform - log explicitly

          // NEW: Before returning not-found, try exact match if it's a SKU pattern
          if (isSkuPattern(productQuery)) {

            const exactResults = await exactMatchSearch(productQuery, browseDomain, 5);
            if (exactResults.length > 0) {
              return {
                success: true,
                results: exactResults,
                source: 'exact-match-after-provider'
              };
            }
          }

          // Track for telemetry
          await trackLookupFailure({
            query: productQuery,
            queryType: /^[A-Z0-9-]{6,}$/i.test(productQuery) ? 'sku' : 'product_name',
            errorType: 'not_found',
            platform: provider.platform,
            timestamp: new Date(),
            // domainId and sessionId would come from context if available
          });

          return {
            success: false,
            results: [],
            source: `${provider.platform}-not-found`,
            errorMessage: `Product "${productQuery}" not found in catalog`
          };
        }
      } catch (providerError) {
        console.error(`[Function Call] ${provider.platform} detail error:`, providerError);

        // NEW: Try exact match on provider error if it's a SKU pattern
        if (isSkuPattern(productQuery)) {

          const exactResults = await exactMatchSearch(productQuery, browseDomain, 5);
          if (exactResults.length > 0) {
            return {
              success: true,
              results: exactResults,
              source: 'exact-match-after-error'
            };
          }
        }

        // Track API errors for telemetry
        await trackLookupFailure({
          query: productQuery,
          queryType: /^[A-Z0-9-]{6,}$/i.test(productQuery) ? 'sku' : 'product_name',
          errorType: 'api_error',
          platform: provider.platform,
          timestamp: new Date(),
        });

        return {
          success: false,
          results: [],
          source: `${provider.platform}-error`,
          errorMessage: `Error looking up product: ${providerError instanceof Error ? providerError.message : 'Unknown error'}`
        };
      }
    }

    // NEW: If no provider, try exact match first for SKU patterns
    if (isSkuPattern(productQuery)) {

      const exactResults = await exactMatchSearch(productQuery, browseDomain, 5);
      if (exactResults.length > 0) {
        console.log(`[Function Call] Exact match found ${exactResults.length} results (no provider)`);
        return {
          success: true,
          results: exactResults,
          source: 'exact-match-no-provider'
        };
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
