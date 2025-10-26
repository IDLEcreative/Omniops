/**
 * Main product data extraction orchestrator
 */

import * as cheerio from 'cheerio';
import type { CheerioAPI } from 'cheerio';
import type { ProductData } from './types';
import { extractBreadcrumbs } from './breadcrumb-extractor';
import {
  extractJsonLdProductData,
  extractPrices,
  extractCategories,
  extractSpecifications,
  extractImages
} from './product-extractors';

/**
 * Check if the page is likely a product page
 */
function isProductPage($: CheerioAPI, url: string): boolean {
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

  const productData: ProductData = { name: '' };

  // CRITICAL: Extract breadcrumbs FIRST
  productData.breadcrumbs = extractBreadcrumbs($);
  productData.categoryHierarchy = productData.breadcrumbs
    ?.filter(b => !b.name.toLowerCase().includes('home'))
    ?.map(b => b.name) || [];

  // Extract from JSON-LD structured data
  extractJsonLdProductData($, productData);

  // Extract product name
  if (!productData.name) {
    productData.name = $('h1.product_title, .product-title h1, .entry-title').first().text().trim() ||
      $('meta[property="og:title"]').attr('content') ||
      $('h1').first().text().trim();
  }

  // Extract prices
  extractPrices($, productData);

  // Extract SKU
  if (!productData.sku) {
    productData.sku = $('.sku, .product-sku, .product_meta .sku_wrapper .sku').first().text().trim();
  }

  // Extract description
  if (!productData.description) {
    productData.description = $('.woocommerce-product-details__short-description, .product-short-description, .summary .description').first().text().trim() ||
      $('meta[name="description"]').attr('content');
  }

  // Extract availability
  if (!productData.availability) {
    const stockText = $('.stock, .availability, .in-stock, .out-of-stock').first().text().trim();
    if (stockText) {
      productData.availability = stockText;
    } else if ($('.in-stock').length > 0) {
      productData.availability = 'In Stock';
    } else if ($('.out-of-stock').length > 0) {
      productData.availability = 'Out of Stock';
    }
  }

  // Extract categories
  extractCategories($, productData);

  // Extract specifications
  extractSpecifications($, productData);

  // Extract images
  extractImages($, productData);

  // Only return if we found meaningful product data
  if (!productData.name || productData.name.length < 3) {
    return null;
  }

  return productData;
}

/**
 * Format product data as text content for embedding
 */
export function formatProductContent(productData: ProductData): string {
  const lines: string[] = [];

  lines.push(`Product: ${productData.name}`);

  if (productData.price) {
    lines.push(`Price: ${productData.price}`);
  }
  if (productData.regularPrice && productData.regularPrice !== productData.price) {
    lines.push(`Regular Price: ${productData.regularPrice}`);
  }
  if (productData.salePrice) {
    lines.push(`Sale Price: ${productData.salePrice}`);
  }

  if (productData.sku) {
    lines.push(`SKU: ${productData.sku}`);
  }

  if (productData.brand) {
    lines.push(`Brand: ${productData.brand}`);
  }

  if (productData.availability) {
    lines.push(`Availability: ${productData.availability}`);
  }

  if (productData.rating) {
    lines.push(`Rating: ${productData.rating}/5${productData.reviews ? ` (${productData.reviews} reviews)` : ''}`);
  }

  if (productData.categories && productData.categories.length > 0) {
    lines.push(`Categories: ${productData.categories.join(', ')}`);
  }

  if (productData.description) {
    lines.push('');
    lines.push('Description:');
    lines.push(productData.description);
  }

  if (productData.specifications && Object.keys(productData.specifications).length > 0) {
    lines.push('');
    lines.push('Specifications:');
    for (const [key, value] of Object.entries(productData.specifications)) {
      lines.push(`- ${key}: ${value}`);
    }
  }

  return lines.join('\n');
}
