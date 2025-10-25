/**
 * E-commerce content extractor - Main orchestrator
 * Refactored to use modular components (< 300 LOC)
 */

import { ContentExtractor } from '@/lib/content-extractor';
import * as cheerio from 'cheerio';

// Import modular components
import type {
  ProductData,
  EcommerceExtractedContent,
  ProductSpecification,
  ProductVariant,
  BusinessInfo
} from '@/lib/ecommerce-extractor-types';
import type { NormalizedProduct } from '@/lib/product-normalizer';

import {
  PLATFORM_SIGNATURES,
  PRODUCT_SELECTORS
} from '@/lib/ecommerce-extractor-types';

import {
  detectPlatform,
  detectPageType,
  extractProductData,
  extractProductListing
} from '@/lib/ecommerce-extractor-strategies';

import {
  extractJsonLdProduct,
  extractMicrodataProduct,
  extractProductFromDOM,
  extractPagination,
  extractBreadcrumbs,
  extractTotalProductCount
} from '@/lib/ecommerce-extractor-parsers';

import {
  extractVariants,
  extractSpecifications,
  extractBusinessInfo,
  extractPhoneNumbers,
  extractEmails,
  extractAddresses,
  extractBusinessHours
} from '@/lib/ecommerce-extractor-utils';

/**
 * Main e-commerce extractor class
 * Orchestrates extraction using platform-specific strategies
 */
export class EcommerceExtractor extends ContentExtractor {
  /**
   * Platform detection signatures (re-exported for backward compatibility)
   */
  private static platformSignatures = PLATFORM_SIGNATURES;

  /**
   * Product selectors (re-exported for backward compatibility)
   */
  private static productSelectors = PRODUCT_SELECTORS;

  /**
   * Enhanced extraction for e-commerce sites
   * Main entry point for extracting e-commerce content
   */
  static async extractEcommerce(html: string, url: string): Promise<EcommerceExtractedContent> {
    // First get base content
    const baseContent = this.extractWithReadability(html, url);

    // Load HTML for detailed parsing
    const $ = cheerio.load(html);

    // Detect platform and page type
    const platform = detectPlatform($);
    const pageType = detectPageType($, url);

    // Extract e-commerce specific data
    let products: NormalizedProduct[] = [];
    let pagination;
    let breadcrumbs: any = null;
    let totalProducts;

    if (pageType === 'product') {
      // Single product page
      const product = await extractProductData($, url);
      if (product) products = [product];
    } else if (pageType === 'category' || pageType === 'search') {
      // Product listing page
      products = await extractProductListing($, url, platform);
      pagination = extractPagination($, url);
      totalProducts = extractTotalProductCount($);
    }

    breadcrumbs = extractBreadcrumbs($);

    if ((pageType === 'category' || pageType === 'search') && typeof totalProducts === 'undefined' && products.length > 0) {
      totalProducts = products.length;
    }

    // Create consolidated metadata for backward compatibility
    const firstProduct = products?.[0];
    const consolidatedMetadata = firstProduct ? {
      productSku: firstProduct.sku,
      productName: firstProduct.name,
      productPrice: firstProduct.price?.formatted ||
                    (typeof firstProduct.price === 'object' ? JSON.stringify(firstProduct.price) : firstProduct.price),
      productInStock: firstProduct.availability?.inStock,
      productBrand: firstProduct.brand,
      productCategory: firstProduct.categories?.[0],
      platform,
      pageType,
      businessInfo: baseContent.metadata.businessInfo || extractBusinessInfo($)
    } : {
      platform,
      pageType,
      businessInfo: baseContent.metadata.businessInfo || extractBusinessInfo($)
    };

    return {
      ...baseContent,
      platform,
      pageType,
      products,
      pagination,
      breadcrumbs,
      totalProducts,
      // Merge consolidated metadata into the existing metadata
      metadata: {
        ...baseContent.metadata,
        ...consolidatedMetadata,
        // Keep ecommerceData as a separate structured object
        ecommerceData: {
          platform,
          pageType,
          products,
          pagination,
          breadcrumbs,
          totalProducts
        }
      }
    };
  }

  // Backward compatibility: re-export detection methods
  private static detectPlatform = detectPlatform;
  private static detectPageType = detectPageType;

  // Backward compatibility: re-export extraction methods
  private static extractProductData = extractProductData;
  private static extractJsonLdProduct = extractJsonLdProduct;
  private static extractMicrodataProduct = extractMicrodataProduct;
  private static extractProductFromDOM = extractProductFromDOM;
  private static extractProductListing = extractProductListing;

  // Backward compatibility: re-export parsing utilities
  private static extractPagination = extractPagination;
  private static extractBreadcrumbs = extractBreadcrumbs;
  private static extractVariants = extractVariants;
  private static extractSpecifications = extractSpecifications;
  private static extractBusinessInfo = extractBusinessInfo;
  private static extractPhoneNumbers = extractPhoneNumbers;
  private static extractEmails = extractEmails;
  private static extractAddresses = extractAddresses;
  private static extractBusinessHours = extractBusinessHours;
  private static extractTotalProductCount = extractTotalProductCount;
}

// Re-export all types for backward compatibility
export type {
  ProductData,
  EcommerceExtractedContent,
  ProductSpecification,
  ProductVariant,
  BusinessInfo
};

export {
  PLATFORM_SIGNATURES,
  PRODUCT_SELECTORS
};
