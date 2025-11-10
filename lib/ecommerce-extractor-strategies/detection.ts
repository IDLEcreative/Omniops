/**
 * E-commerce Platform Detection
 */

import type { CheerioAPI } from 'cheerio';
import type { EcommerceExtractedContent } from '@/lib/ecommerce-extractor-types';
import { PLATFORM_SIGNATURES, PRODUCT_SELECTORS } from '@/lib/ecommerce-extractor-types';

/**
 * Detect e-commerce platform from HTML
 */
export function detectPlatform($: CheerioAPI): string | undefined {
  for (const [platform, signatures] of Object.entries(PLATFORM_SIGNATURES)) {
    for (const signature of signatures) {
      if ($(signature).length > 0) {
        return platform;
      }
    }
  }

  // Check for generic e-commerce indicators
  if ($('[itemtype*="schema.org/Product"]').length > 0 ||
      $('.product, .product-item').length > 0 ||
      $('script[type="application/ld+json"]:contains("Product")').length > 0) {
    return 'generic-ecommerce';
  }

  return undefined;
}

/**
 * Detect page type (product, category, search, etc.)
 */
export function detectPageType($: CheerioAPI, url: string): EcommerceExtractedContent['pageType'] {
  const urlLower = url.toLowerCase();
  let hasProductSlug = /\/(product|products|item|p)(?:\/|$|\?|\#)/.test(urlLower) || /[?&](sku|product)=/.test(urlLower);
  const hasCategorySlug = /\/(category|categories|shop|collection|collections)(?:\/|$|\?|\#)/.test(urlLower) || /[?&](category|cat|collection)=/.test(urlLower);
  const hasSearchSlug = /\/search(?:\/|$|\?|\#)/.test(urlLower) || /[?&](q|s|search|keyword)=/.test(urlLower);

  if (hasProductSlug && hasCategorySlug) {
    try {
      const pathSegments = new URL(url).pathname.toLowerCase().split('/').filter(Boolean);
      const categoryIndex = pathSegments.findIndex(segment => ['category', 'categories', 'collection', 'collections', 'shop'].includes(segment));
      const productIndex = pathSegments.findIndex(segment => ['product', 'products', 'item', 'p'].includes(segment));
      if (categoryIndex !== -1 && productIndex !== -1 && categoryIndex <= productIndex) {
        hasProductSlug = false;
      }
    } catch {
      // Ignore URL parsing issues and fall back to existing heuristics
    }
  }

  if (hasSearchSlug) {
    return 'search';
  }
  if (hasCategorySlug) {
    return 'category';
  }
  if (hasProductSlug) {
    return 'product';
  }
  if (urlLower.includes('/cart')) {
    return 'cart';
  }
  if (urlLower.includes('/checkout')) {
    return 'checkout';
  }

  const productSchemaCount = $('[itemtype*="schema.org/Product"]').length;
  const productCount = $('.product, .product-item, [data-product-id]').length;
  const hasListingContainer = $('.product-list, .product-grid, .products, [data-listing]').length > 0;
  const paginationSelectors = PRODUCT_SELECTORS.listing.pagination.join(', ');
  const hasPagination = $(paginationSelectors).length > 0;
  const hasSearchForm = $('form[action*="search"], input[name="s"], input[name="q"], input[name="search"]').length > 0;

  // If we have multiple products, it's likely a listing page
  if (productSchemaCount > 1 || productCount > 1) {
    if (hasSearchForm) {
      return 'search';
    }
    return 'category';
  }

  // Single product indicators
  const hasSingleProduct = productSchemaCount === 1 || $('.product-single, .single-product').length > 0;
  if (hasSingleProduct) {
    return 'product';
  }

  if (hasSearchForm && (hasListingContainer || productCount > 0 || hasPagination)) {
    return 'search';
  }

  if ((hasListingContainer && productCount > 0) || hasPagination) {
    return 'category';
  }

  return 'other';
}
