/**
 * Tool Execution Handlers
 *
 * Implements the business logic for each AI tool/function call.
 * Each handler coordinates between commerce providers and semantic search.
 */

import { SearchResult } from '@/types';
import { formatProviderProducts, formatProviderProduct } from './product-formatters';

// Type for dependencies injection
export type ToolDependencies = {
  getCommerceProvider: (domain: string) => Promise<any>;
  searchSimilarContent: (query: string, domain: string, limit?: number, minSimilarity?: number) => Promise<SearchResult[]>;
};

/**
 * Search for products using commerce provider or semantic search fallback
 */
export async function executeSearchProducts(
  query: string,
  limit: number = 100,
  domain: string,
  deps: ToolDependencies
): Promise<{ success: boolean; results: SearchResult[]; source: string }> {
  const { getCommerceProvider: getProviderFn, searchSimilarContent: searchFn } = deps;

  // Adaptive limit: reduce for targeted queries to improve speed
  const queryWords = query.trim().split(/\s+/).length;
  const adaptiveLimit = queryWords > 3 ? Math.min(50, limit) : limit;
  console.log(`[Function Call] search_products: "${query}" (limit: ${adaptiveLimit}, original: ${limit}, words: ${queryWords})`);

  try {
    // Normalize domain - no hardcoded fallbacks
    const browseDomain = domain.replace(/^https?:\/\//, '').replace('www.', '');

    if (!browseDomain || /localhost|127\.0\.0\.1/i.test(browseDomain)) {
      console.log('[Search] Invalid or localhost domain - cannot search without valid domain');
      return { success: false, results: [], source: 'invalid-domain' };
    }

    const provider = await getProviderFn(browseDomain);

    if (provider) {
      console.log(`[Function Call] Resolved commerce provider "${provider.platform}" for ${browseDomain}`);

      try {
        const providerResults = await provider.searchProducts(query, adaptiveLimit);

        if (providerResults && providerResults.length > 0) {
          const results = formatProviderProducts(provider.platform, providerResults, browseDomain);

          if (results.length > 0) {
            return { success: true, results, source: provider.platform };
          }
        }
      } catch (providerError) {
        console.error(`[Function Call] ${provider.platform} search error:`, providerError);
      }
    }

    // Fallback to semantic search
    const searchResults = await searchFn(query, browseDomain, adaptiveLimit, 0.2);
    console.log(`[Function Call] Semantic search returned ${searchResults.length} results`);

    return {
      success: true,
      results: searchResults,
      source: 'semantic'
    };

  } catch (error) {
    console.error('[Function Call] search_products error:', error);
    return {
      success: false,
      results: [],
      source: 'error'
    };
  }
}

/**
 * Search by category using semantic search
 */
export async function executeSearchByCategory(
  category: string,
  limit: number = 100,
  domain: string,
  deps: Pick<ToolDependencies, 'searchSimilarContent'>
): Promise<{ success: boolean; results: SearchResult[]; source: string }> {
  const { searchSimilarContent: searchFn } = deps;
  console.log(`[Function Call] search_by_category: "${category}" (limit: ${limit})`);

  try {
    // Normalize domain - no hardcoded fallbacks
    const browseDomain = domain.replace(/^https?:\/\//, '').replace('www.', '');

    if (!browseDomain || /localhost|127\.0\.0\.1/i.test(browseDomain)) {
      console.log('[Search] Invalid or localhost domain - cannot search without valid domain');
      return { success: false, results: [], source: 'invalid-domain' };
    }

    // Use semantic search for category-based queries
    const searchResults = await searchFn(category, browseDomain, limit, 0.15);
    console.log(`[Function Call] Category search returned ${searchResults.length} results`);

    return {
      success: true,
      results: searchResults,
      source: 'semantic'
    };

  } catch (error) {
    console.error('[Function Call] search_by_category error:', error);
    return {
      success: false,
      results: [],
      source: 'error'
    };
  }
}

/**
 * Get detailed product information
 */
export async function executeGetProductDetails(
  productQuery: string,
  includeSpecs: boolean = true,
  domain: string,
  deps: ToolDependencies
): Promise<{ success: boolean; results: SearchResult[]; source: string }> {
  const { getCommerceProvider: getProviderFn, searchSimilarContent: searchFn } = deps;
  console.log(`[Function Call] get_product_details: "${productQuery}" (includeSpecs: ${includeSpecs})`);

  try {
    // Normalize domain - no hardcoded fallbacks
    const browseDomain = domain.replace(/^https?:\/\//, '').replace('www.', '');

    if (!browseDomain || /localhost|127\.0\.0\.1/i.test(browseDomain)) {
      console.log('[Search] Invalid or localhost domain - cannot search without valid domain');
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

    const searchResults = await searchFn(enhancedQuery, browseDomain, 5, 0.3);
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

/**
 * Look up order information from commerce provider
 */
export async function executeLookupOrder(
  orderId: string,
  domain: string,
  deps: Pick<ToolDependencies, 'getCommerceProvider'>
): Promise<{ success: boolean; results: SearchResult[]; source: string }> {
  const { getCommerceProvider: getProviderFn } = deps;
  console.log(`[Function Call] lookup_order: "${orderId}"`);

  try {
    // Normalize domain - no hardcoded fallbacks
    const browseDomain = domain.replace(/^https?:\/\//, '').replace('www.', '');

    if (!browseDomain || /localhost|127\.0\.0\.1/i.test(browseDomain)) {
      console.log('[Search] Invalid or localhost domain - cannot lookup order without valid domain');
      return { success: false, results: [], source: 'invalid-domain' };
    }

    // Use commerce provider abstraction for multi-platform support
    const provider = await getProviderFn(browseDomain);

    if (!provider) {
      console.log('[Function Call] No commerce provider available for domain');
      return {
        success: false,
        results: [],
        source: 'no-provider'
      };
    }

    const order = await provider.lookupOrder(orderId);

    if (!order) {
      console.log(`[Function Call] No order found for ID: ${orderId}`);
      return {
        success: false,
        results: [],
        source: provider.platform
      };
    }

    console.log(`[Function Call] Order found via ${provider.platform}: ${order.id} - Status: ${order.status}`);

    // Format order information as a search result
    const itemsList = order.items.map((item: any) => `${item.name} (x${item.quantity})`).join(', ');
    const orderInfo = `Order #${order.number}
Status: ${order.status}
Date: ${order.date}
Total: ${order.currency}${order.total}
Items: ${itemsList || 'No items'}
${order.billing ? `Customer: ${order.billing.firstName} ${order.billing.lastName}` : ''}
${order.trackingNumber ? `Tracking: ${order.trackingNumber}` : ''}`;

    const result: SearchResult = {
      content: orderInfo,
      url: order.permalink || '',
      title: `Order #${order.number}`,
      similarity: 1.0
    };

    return {
      success: true,
      results: [result],
      source: provider.platform
    };

  } catch (error) {
    console.error('[Function Call] lookup_order error:', error);
    return {
      success: false,
      results: [],
      source: 'error'
    };
  }
}
