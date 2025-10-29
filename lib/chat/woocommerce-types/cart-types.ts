/**
 * WooCommerce Cart Types
 * Type definitions for cart-related operations
 */

// ==================== INFORMATIONAL MODE ====================
// Used when Store API is not available (legacy mode)

// Add to cart info type (informational)
export interface AddToCartInfo {
  productId: number;
  productName: string;
  quantity: number;
  price: string;
  total: string;
  addToCartUrl: string;
  inStock: boolean;
  stockQuantity: number | null;
}

// Cart info type (informational)
export interface CartInfo {
  cartUrl: string;
  message?: string;
}

// ==================== TRANSACTIONAL MODE ====================
// Used when Store API is available (direct cart manipulation)

// Store API Cart Response (from woocommerce-store-api.ts)
export interface StoreAPICartItem {
  key: string;
  id: number;
  name: string;
  quantity: number;
  price: string;
  subtotal: string;
  total: string;
  images: Array<{ src: string; alt?: string }>;
}

export interface StoreAPICartTotals {
  total_items: string;
  total_items_tax: string;
  total_discount: string;
  total_shipping: string;
  total_price: string;
  currency_code: string;
  currency_symbol: string;
}

export interface StoreAPICartResponse {
  items: StoreAPICartItem[];
  items_count: number;
  totals: StoreAPICartTotals;
  needs_shipping: boolean;
  coupons: Array<{ code: string; discount: string }>;
}

// Transactional cart operations result
export interface TransactionalCartInfo {
  items: Array<{
    key: string;
    productId: number;
    name: string;
    quantity: number;
    price: string;
    total: string;
    imageUrl?: string;
  }>;
  itemsCount: number;
  subtotal: string;
  discount: string;
  shipping: string;
  total: string;
  currency: string;
  currencySymbol: string;
  needsShipping: boolean;
  appliedCoupons: Array<{ code: string; discount: string }>;
}
