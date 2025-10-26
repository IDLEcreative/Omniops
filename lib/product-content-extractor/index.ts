/**
 * Enhanced content extractor specifically for e-commerce product pages
 * Main orchestrator module - delegates to specialized parsers
 */

import * as cheerio from 'cheerio';
import { ProductData, ExtractedContent } from './types';
import { extractBreadcrumbs } from './breadcrumb-extractor';
import { wooCommerceSelectors } from './selectors';
import {
  extractFromJsonLd,
  extractPriceData,
  extractSpecifications,
  extractProductImages,
  extractCategories
} from './parsers';
import { formatProductContent } from './formatter';

/**
 * Check if URL/HTML indicates a product page
 */
function isProductPage($: cheerio.CheerioAPI, url: string): boolean {
  return url.includes('/product/') ||
         $('[itemtype*="Product"]').length > 0 ||
         $('.product-info, .product-details, .product-page').length > 0 ||
         $('meta[property="og:type"][content="product"]').length > 0;
}

/**
 * Extract product-specific information from HTML
 */
export function extractProductData(html: string, url: string): ProductData | null {
  const $ = cheerio.load(html);

  if (!isProductPage($, url)) {
    return null;
  }

  const productData: ProductData = {
    name: '',
  };

  // CRITICAL: Extract breadcrumbs FIRST before any HTML manipulation
  productData.breadcrumbs = extractBreadcrumbs($);
  productData.categoryHierarchy = productData.breadcrumbs
    ?.filter(b => !b.name.toLowerCase().includes('home'))
    ?.map(b => b.name) || [];

  // Extract structured data (JSON-LD)
  extractFromJsonLd($, productData);

  // Extract product name
  if (!productData.name) {
    productData.name = $(wooCommerceSelectors.name).first().text().trim() ||
                      $('meta[property="og:title"]').attr('content') ||
                      $('h1').first().text().trim();
  }

  // Extract prices
  extractPriceData($, productData);

  // Extract regular/sale prices
  productData.regularPrice = $(wooCommerceSelectors.regularPrice).first().text().trim() || productData.regularPrice;

  // Extract SKU
  if (!productData.sku) {
    productData.sku = $(wooCommerceSelectors.sku).first().text().trim();
  }

  // Extract description
  if (!productData.description) {
    productData.description = $(wooCommerceSelectors.description).first().text().trim() ||
                             $('meta[name="description"]').attr('content');
  }

  // Extract availability
  if (!productData.availability) {
    const stockText = $(wooCommerceSelectors.availability).first().text().trim();
    if (stockText) {
      productData.availability = stockText;
    } else if ($('.in-stock').length > 0) {
      productData.availability = 'In Stock';
    } else if ($('.out-of-stock').length > 0) {
      productData.availability = 'Out of Stock';
    }
  }

  // Extract categories
  const categories = extractCategories($, productData, wooCommerceSelectors.category);
  if (categories.length > 0) {
    productData.categories = categories;
    productData.primaryCategory = productData.categoryHierarchy?.[productData.categoryHierarchy.length - 2] || categories[0];
  }

  // Extract specifications
  const specs = extractSpecifications($);
  if (Object.keys(specs).length > 0) {
    productData.specifications = specs;
  }

  // Extract product images
  extractProductImages($, productData);

  // Only return if we found meaningful product data
  if (!productData.name || productData.name.length < 3) {
    return null;
  }

  return productData;
}

/**
 * Enhanced content extraction that preserves product data
 */
export function extractContentWithProducts(html: string, url: string): ExtractedContent {
  // First try to extract product data
  const productData = extractProductData(html, url);

  if (productData) {
    // If this is a product page, format the product data as content
    const content = formatProductContent(productData);
    return { content, productData };
  }

  // For non-product pages, return regular content extraction
  return { content: '' };
}

// Re-export types and utilities
export type { ProductData, ExtractedContent, Breadcrumb } from './types';
export { formatProductContent } from './formatter';
export { extractBreadcrumbs } from './breadcrumb-extractor';
