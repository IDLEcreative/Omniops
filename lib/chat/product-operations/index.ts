/**
 * WooCommerce Product Operations
 * Centralized exports for all product-related operations
 *
 * This module was refactored from a single 801 LOC file into
 * specialized modules under 300 LOC each for better maintainability.
 */

// Stock operations
export {
  checkStock,
  getStockQuantity,
  getLowStockProducts
} from './stock-operations';

// Product information operations
export {
  getProductDetails,
  checkPrice
} from './product-info-operations';

// Search and category operations
export {
  searchProducts,
  getProductCategories
} from './product-search-operations';

// Variation operations
export {
  getProductVariations
} from './product-variation-operations';

// Review operations
export {
  getProductReviews
} from './product-review-operations';
