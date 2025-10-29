/**
 * WooCommerce Shared Types
 * Common types used across multiple operations
 */

// Operation parameter types
export interface WooCommerceOperationParams {
  productId?: string;
  orderId?: string;
  email?: string;
  includeQuantity?: boolean;
  categoryId?: string;
  parentCategory?: number;
  limit?: number;
  minRating?: number;
  couponCode?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  variationId?: string;
  country?: string;
  postcode?: string;
  threshold?: number;
  period?: string;
  query?: string;
  minPrice?: number;
  maxPrice?: number;
  orderby?: string;
  attributes?: Record<string, string>;
  reason?: string;
  quantity?: number;        // Quantity to add to cart (default: 1)
  cartItemKey?: string;     // Cart item key for removal/update
  domain?: string;          // Store domain for URL generation
}

// Operation result type
export interface WooCommerceOperationResult {
  success: boolean;
  data: any;
  message: string;
}

// Billing info type
export interface BillingInfo {
  firstName: string;
  lastName: string;
  email: string;
}
