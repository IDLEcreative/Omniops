/**
 * Platform-specific extraction strategies
 * Extracted from lib/ecommerce-extractor.ts for modularity
 */

import type { CheerioAPI } from 'cheerio';
import type { NormalizedProduct } from '@/lib/product-normalizer';
import type { ProductData, EcommerceExtractedContent } from '@/lib/ecommerce-extractor-types';
import { PLATFORM_SIGNATURES, PRODUCT_SELECTORS } from '@/lib/ecommerce-extractor-types';
import { PriceParser } from '@/lib/price-parser';
import { extractJsonLdProduct, extractMicrodataProduct, extractProductFromDOM } from '@/lib/ecommerce-extractor-parsers';
import { extractSpecifications, extractVariants } from '@/lib/ecommerce-extractor-utils';
import { configManager } from '@/lib/scraper-config';
import { logger } from '@/lib/logger';

// Dynamic imports to break circular dependencies
type ProductNormalizerClass = typeof import('@/lib/product-normalizer').ProductNormalizer;
type PatternLearnerClass = typeof import('@/lib/pattern-learner').PatternLearner;

declare const require: NodeRequire;

let cachedProductNormalizer: ProductNormalizerClass | null = null;
let cachedPatternLearner: PatternLearnerClass | null = null;

const getProductNormalizer = (): ProductNormalizerClass => {
  if (!cachedProductNormalizer) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('@/lib/product-normalizer') as { ProductNormalizer: ProductNormalizerClass };
    cachedProductNormalizer = mod.ProductNormalizer;
  }
  return cachedProductNormalizer;
};

const getPatternLearner = (): PatternLearnerClass => {
  if (!cachedPatternLearner) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('@/lib/pattern-learner') as { PatternLearner: PatternLearnerClass };
    cachedPatternLearner = mod.PatternLearner;
  }
  return cachedPatternLearner;
};

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
  const hasSingleProduct = productSchemaCount === 1 || $('.product-single, .single-product').length > 0;
  if (hasSingleProduct) {
    return 'product';
  }

  const productCount = $('.product, .product-item, [data-product-id]').length;
  const hasListingContainer = $('.product-list, .product-grid, .products, [data-listing]').length > 0;
  const paginationSelectors = PRODUCT_SELECTORS.listing.pagination.join(', ');
  const hasPagination = $(paginationSelectors).length > 0;
  const hasSearchForm = $('form[action*="search"], input[name="s"], input[name="q"], input[name="search"]').length > 0;

  if (hasSearchForm && (hasListingContainer || productCount > 0 || hasPagination)) {
    return 'search';
  }

  if ((hasListingContainer && productCount > 0) || hasPagination) {
    return 'category';
  }

  return 'other';
}

/**
 * Extract single product data using multiple strategies
 */
export async function extractProductData($: CheerioAPI, url: string): Promise<NormalizedProduct | null> {
  let rawProduct: any = null;
  let extractionMethod: string = 'unknown';

  // Get configuration for extraction strategies
  const config = configManager.getConfig();
  const platform = detectPlatform($);
  const patternContext = {
    query: (selector: string) => $(selector),
    $,
    platform,
  };

  // Get platform-specific configuration if available
  const platformConfig = platform ? config.extraction.platformOverrides[platform] : null;
  const extractionPriority = platformConfig?.extractionPriority || config.extraction.strategies.fallbackChain;

  // Try extraction methods in configured priority order
  for (const method of extractionPriority) {
    if (rawProduct) break;

    switch (method) {
      case 'learned-patterns':
        if (config.extraction.strategies.patternLearningEnabled) {
          const learnedProduct = await getPatternLearner().applyPatterns(url, patternContext);
          if (learnedProduct && Object.keys(learnedProduct).length > 0) {
            rawProduct = learnedProduct;
            extractionMethod = 'learned-patterns';
          }
        }
        break;

      case 'json-ld':
        if (config.extraction.strategies.jsonLdEnabled) {
          rawProduct = extractJsonLdProduct($);
          if (rawProduct) extractionMethod = 'json-ld';
        }
        break;

      case 'microdata':
        if (config.extraction.strategies.microdataEnabled) {
          rawProduct = extractMicrodataProduct($);
          if (rawProduct) extractionMethod = 'microdata';
        }
        break;

      case 'dom':
        if (config.extraction.strategies.domScrapingEnabled) {
          // Use platform-specific selectors if available
          rawProduct = extractProductFromDOM($, platformConfig?.selectors);
          if (rawProduct) extractionMethod = 'dom';
        }
        break;
    }
  }

  // If we found a product, normalize it
  if (rawProduct) {
    // Add URL
    rawProduct.url = url;

    // Extract additional details
    rawProduct.specifications = extractSpecifications($);
    rawProduct.variants = extractVariants($);

    // Normalize the product
    const normalizedProduct = normalizeProductSafely(rawProduct, url);

    // Learn from successful extraction
    if (normalizedProduct && normalizedProduct.name) {
      try {
        await getPatternLearner().learnFromExtraction(url, [normalizedProduct], {
          platform,
          extractionMethod
        });
      } catch (error) {
        logger.warn('EcommerceExtractor: Failed to record learned patterns', { url, platform, extractionMethod, error });
      }
    }

    return normalizedProduct;
  }

  return null;
}

/**
 * Extract product listing from category/search pages
 */
export async function extractProductListing($: CheerioAPI, url: string, platform?: string): Promise<NormalizedProduct[]> {
  const products: ProductData[] = [];

  // Find product containers
  const primarySelectors = PRODUCT_SELECTORS.listing.products.join(', ');
  let productContainers = $(primarySelectors);

  if (productContainers.length === 0) {
    const fallbackContainers = $('.product-grid, .products, .product-list, [data-product-list], [class*="product-list"]');
    productContainers = fallbackContainers.find('div, article, li').filter((_, el) => {
      const $el = $(el);
      if ($el.find('.product-title, .product-name, h2, h3, h4').first().text()?.trim()) {
        return true;
      }
      const className = $el.attr('class') || '';
      return /product|item/i.test(className) || Boolean($el.attr('data-product-id'));
    });
  }

  productContainers.each((_, element) => {
    const $product = $(element);

    // Extract basic product info from listing
    const productName = $product.find('h2, h3, h4, .product-title, .product-name').first().text()?.trim();
    const rawPriceText = $product.find('.price, .product-price, [class*="price"]').first().text()?.trim();
    const rawSkuText = $product.find('.sku').text()?.trim();

    const product: ProductData = {
      name: productName,
      sku: PriceParser.cleanSKU(rawSkuText) || undefined,
      rawPrice: rawPriceText,
      price: PriceParser.parse(rawPriceText),
      images: [{
        url: $product.find('img').first().attr('src') ||
             $product.find('img').first().attr('data-src') || '',
      }],
    };

    // Only add if we found a name
    if (product.name) {
      products.push(product);
    }
  });

  // Normalize all products
  const normalizedProducts: NormalizedProduct[] = [];
  for (const product of products) {
    const normalized = normalizeProductSafely(product, url);
    if (normalized) {
      normalizedProducts.push(normalized);
    }
  }

  // Learn from successful extraction if we found products
  if (normalizedProducts.length > 0) {
    try {
      await getPatternLearner().learnFromExtraction(url, normalizedProducts, {
        platform,
        extractionMethod: 'dom-listing'
      });
    } catch (error) {
      logger.warn('EcommerceExtractor: Failed to record listing patterns', { url, platform, error });
    }
  }

  return normalizedProducts;
}

/**
 * Safely normalize product data with error handling
 */
function normalizeProductSafely(product: ProductData, url: string): NormalizedProduct | null {
  try {
    const normalized = getProductNormalizer().normalizeProduct(product);
    return normalized || null;
  } catch (error) {
    logger.warn('EcommerceExtractor: Failed to normalize product', { url, error });
    return null;
  }
}
