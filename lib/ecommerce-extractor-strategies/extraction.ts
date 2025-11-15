/**
 * Product Extraction Logic
 */

import type { CheerioAPI } from 'cheerio';
import type { NormalizedProduct } from '@/lib/product-normalizer';
import type { ProductData } from '@/lib/ecommerce-extractor-types';
import { PRODUCT_SELECTORS } from '@/lib/ecommerce-extractor-types';
import { PriceParser } from '@/lib/price-parser';
import { extractJsonLdProduct, extractMicrodataProduct, extractProductFromDOM } from '@/lib/ecommerce-extractor-parsers';
import { extractSpecifications, extractVariants } from '@/lib/ecommerce-extractor-utils';
import { configManager } from '@/lib/scraper-config';
import { logger } from '@/lib/logger';
import { detectPlatform } from './detection';

// Dynamic imports to break circular dependencies
type ProductNormalizerClass = typeof import('@/lib/product-normalizer').ProductNormalizer;
type PatternLearnerClass = typeof import('@/lib/pattern-learner').PatternLearner;

let productNormalizerPromise: Promise<ProductNormalizerClass> | null = null;
let patternLearnerPromise: Promise<PatternLearnerClass> | null = null;

const getProductNormalizer = async (): Promise<ProductNormalizerClass> => {
  if (!productNormalizerPromise) {
    productNormalizerPromise = import('@/lib/product-normalizer').then((mod) => mod.ProductNormalizer);
  }
  return productNormalizerPromise;
};

const getPatternLearner = async (): Promise<PatternLearnerClass> => {
  if (!patternLearnerPromise) {
    patternLearnerPromise = import('@/lib/pattern-learner').then((mod) => mod.PatternLearner);
  }
  return patternLearnerPromise;
};

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
          const patternLearner = await getPatternLearner();
          const learnedProduct = await patternLearner.applyPatterns(url, patternContext);
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
    const normalizedProduct = await normalizeProductSafely(rawProduct, url);

    // Learn from successful extraction
    if (normalizedProduct && normalizedProduct.name) {
      try {
        const patternLearner = await getPatternLearner();
        await patternLearner.learnFromExtraction(url, [normalizedProduct], {
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
    const normalized = await normalizeProductSafely(product, url);
    if (normalized) {
      normalizedProducts.push(normalized);
    }
  }

  // Learn from successful extraction if we found products
  if (normalizedProducts.length > 0) {
    try {
      const patternLearner = await getPatternLearner();
      await patternLearner.learnFromExtraction(url, normalizedProducts, {
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
async function normalizeProductSafely(product: ProductData, url: string): Promise<NormalizedProduct | null> {
  try {
    // Convert ProductData to RawProduct for normalization
    const rawProduct: any = {
      name: product.name,
      sku: product.sku,
      url: url,
      price: product.price?.value ?? product.rawPrice, // Use price value if available, else rawPrice
      currency: product.price?.currency,
      description: product.description,
      images: product.images,
      specifications: product.specifications,
      variants: product.variants, // Include variants for variable products
      categories: product.categories,
      brand: product.brand,
      rating: product.rating,
      availability: product.availability?.availabilityText, // RawProduct expects string
      inStock: product.availability?.inStock,
    };

    const normalizer = await getProductNormalizer();
    const normalized = normalizer.normalizeProduct(rawProduct);
    return normalized || null;
  } catch (error) {
    logger.warn('EcommerceExtractor: Failed to normalize product', { url, error });
    return null;
  }
}
