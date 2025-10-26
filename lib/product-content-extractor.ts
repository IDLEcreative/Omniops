/**
 * Enhanced content extractor specifically for e-commerce product pages
 * Preserves product details, prices, specifications, and other commerce data
 *
 * This is a re-export module for backward compatibility.
 * All implementation has been modularized in lib/product-content-extractor/
 */

// Re-export types
export type { ProductData, ExtractedContent, Breadcrumb } from './product-content-extractor/index';

// Re-export functions
export {
  extractProductData,
  extractContentWithProducts,
  formatProductContent,
  extractBreadcrumbs
} from './product-content-extractor/index';
