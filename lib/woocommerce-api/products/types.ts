/**
 * WooCommerce Products API Types
 */

import type {
  Product,
  ProductVariation,
  ProductAttribute,
  ProductTag,
  ProductShippingClass,
  BatchOperation,
  BatchResponse
} from '@/lib/woocommerce-full';

import type {
  ProductAttributeTerm,
  ProductCategory,
  ProductReview
} from '@/lib/woocommerce-types';

// Re-export all types
export type {
  Product,
  ProductVariation,
  ProductAttribute,
  ProductTag,
  ProductShippingClass,
  BatchOperation,
  BatchResponse,
  ProductAttributeTerm,
  ProductCategory,
  ProductReview
};
