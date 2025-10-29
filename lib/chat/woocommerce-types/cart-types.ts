/**
 * WooCommerce Cart Types
 * Type definitions for cart-related operations
 */

// Add to cart info type
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

// Cart info type
export interface CartInfo {
  cartUrl: string;
  message?: string;
}
