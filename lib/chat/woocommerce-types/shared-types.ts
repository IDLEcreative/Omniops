/**
 * WooCommerce Shared Types
 * Common types used across multiple operations
 */

import type { PaginationMetadata } from '../pagination-utils';

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
  page?: number;            // Page number for pagination (1-indexed, default: 1)
  per_page?: number;        // Results per page (default: 20, max: 100)
  offset?: number;          // Number of results to skip (alternative to page)
  currency?: { code: string; symbol: string; name: string }; // Currency data (injected by woocommerce-tool)
  storeAPI?: any;           // WooCommerce Store API client (for transactional mode)
  userId?: string;          // User ID for session management
}

// Operation result type
export interface WooCommerceOperationResult {
  success: boolean;
  data: any;
  message: string;
  currency?: string;        // ISO currency code (e.g., "GBP", "USD", "EUR")
  currencySymbol?: string;  // Display symbol (e.g., "£", "$", "€")
  pagination?: PaginationMetadata;  // Pagination metadata for list operations
}

// Billing info type
export interface BillingInfo {
  firstName: string;
  lastName: string;
  email: string;
}
