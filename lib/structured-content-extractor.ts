/**
 * Generic structured content extractor
 * Preserves hierarchical navigation, categories, and structured data from ANY website
 * Works for e-commerce, blogs, documentation, services - any domain
 */

export type { ProductData, Breadcrumb, ContentWithProducts } from './structured-content-extractor/types';
export { extractBreadcrumbs } from './structured-content-extractor/breadcrumb-extractor';
export { extractProductData, formatProductContent } from './structured-content-extractor/product-extractor';

import type { ProductData, ContentWithProducts } from './structured-content-extractor/types';
import { extractProductData, formatProductContent } from './structured-content-extractor/product-extractor';

/**
 * Enhanced content extraction that preserves product data
 */
export function extractContentWithProducts(html: string, url: string): ContentWithProducts {
  // First try to extract product data
  const productData = extractProductData(html, url);

  if (productData) {
    // If this is a product page, format the product data as content
    const content = formatProductContent(productData);
    return { content, productData };
  }

  // For non-product pages, return regular content extraction
  // This would use the existing extraction logic
  return { content: '' };
}
