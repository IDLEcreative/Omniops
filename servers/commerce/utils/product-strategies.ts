/**
 * Product Lookup Strategies
 * Extracted from getProductDetails.ts for modularity
 */

import { SearchResult } from '@/types';
import { getCommerceProvider } from '@/lib/agents/commerce-provider';
import { formatProviderProduct } from '@/lib/chat/product-formatters';
import { isSkuPattern, exactMatchSearch } from '@/lib/search/exact-match-search';
import { searchSimilarContent } from '@/lib/embeddings-optimized';
import { trackLookupFailure } from '@/lib/telemetry/lookup-failures';

export interface StrategyResult {
  success: boolean;
  results: SearchResult[];
  source: string;
  errorMessage?: string;
  suggestions?: string[];
  platform?: string;
}

export interface FuzzyMatchResult {
  suggestions: string[];
}

export function isFuzzyMatchResult(result: any): result is FuzzyMatchResult {
  return result && 'suggestions' in result && Array.isArray(result.suggestions);
}

export function getQueryType(query: string): 'sku' | 'product_name' {
  return /^[A-Z0-9-]{6,}$/i.test(query) ? 'sku' : 'product_name';
}

/**
 * Strategy 1: Commerce Provider Lookup
 */
export async function tryProviderStrategy(
  productQuery: string,
  domain: string
): Promise<StrategyResult | null> {
  const provider = await getCommerceProvider(domain);

  if (!provider) {
    return null;
  }

  console.log(`[ProductStrategy] Using commerce provider "${provider.platform}"`);

  try {
    const details = await provider.getProductDetails(productQuery.trim());

    if (!details) {
      return {
        success: false,
        results: [],
        source: `${provider.platform}-not-found`,
        errorMessage: `Product "${productQuery}" not found in catalog`,
        platform: provider.platform
      };
    }

    // Check for fuzzy match result
    if (isFuzzyMatchResult(details)) {
      let errorMessage = `Product "${productQuery}" not found in catalog`;
      if (details.suggestions.length > 0) {
        errorMessage += `\n\nDid you mean one of these?\n${details.suggestions.map(s => `- ${s}`).join('\n')}`;
      }

      await trackLookupFailure({
        query: productQuery,
        queryType: getQueryType(productQuery),
        errorType: 'not_found',
        platform: provider.platform,
        suggestions: details.suggestions,
        timestamp: new Date(),
      });

      return {
        success: false,
        results: [],
        source: `${provider.platform}-not-found`,
        errorMessage,
        suggestions: details.suggestions,
        platform: provider.platform
      };
    }

    // Normal product result
    const result = formatProviderProduct(provider.platform, details, domain);
    if (result) {
      return {
        success: true,
        results: [result],
        source: `${provider.platform}-detail`,
        platform: provider.platform
      };
    }

    return {
      success: false,
      results: [],
      source: `${provider.platform}-not-found`,
      errorMessage: `Product "${productQuery}" not found in catalog`,
      platform: provider.platform
    };

  } catch (error) {
    console.error(`[ProductStrategy] Provider error:`, error);

    await trackLookupFailure({
      query: productQuery,
      queryType: getQueryType(productQuery),
      errorType: 'api_error',
      platform: provider.platform,
      timestamp: new Date(),
    });

    throw error; // Re-throw to allow fallback strategies
  }
}

/**
 * Strategy 2: Exact SKU Match
 */
export async function tryExactMatchStrategy(
  productQuery: string,
  domain: string,
  maxResults: number = 5
): Promise<StrategyResult | null> {
  if (!isSkuPattern(productQuery)) {
    return null;
  }

  console.log(`[ProductStrategy] Trying exact SKU match`);

  const exactResults = await exactMatchSearch(productQuery, domain, maxResults);

  if (exactResults.length > 0) {
    return {
      success: true,
      results: exactResults,
      source: 'exact-match'
    };
  }

  return null;
}

/**
 * Strategy 3: Semantic Search
 */
export async function trySemanticStrategy(
  productQuery: string,
  domain: string,
  includeSpecs: boolean = true
): Promise<StrategyResult> {
  console.log(`[ProductStrategy] Using semantic search fallback`);

  let enhancedQuery = productQuery;
  if (includeSpecs) {
    enhancedQuery = `${productQuery} specifications technical details features`;
  }

  const semanticResults = await searchSimilarContent(
    enhancedQuery,
    domain,
    15,
    0.3
  );

  return {
    success: true,
    results: semanticResults,
    source: 'semantic'
  };
}
