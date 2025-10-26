/**
 * Shopify Admin API Types and Schemas
 * Contains all Zod schemas and TypeScript types for Shopify API responses
 *
 * @see https://shopify.dev/docs/api/admin-rest
 */

import { z } from 'zod';

/**
 * Shopify API Configuration
 */
export interface ShopifyConfig {
  shop: string; // e.g., 'mystore.myshopify.com'
  accessToken: string; // Shopify Admin API access token
  apiVersion?: string; // Default: '2025-01'
}

/**
 * Product Variant Schema
 */
export const ShopifyProductVariantSchema = z.object({
  id: z.number(),
  product_id: z.number(),
  title: z.string(),
  price: z.string(),
  sku: z.string().nullable(),
  position: z.number(),
  inventory_policy: z.string(),
  compare_at_price: z.string().nullable(),
  fulfillment_service: z.string(),
  inventory_management: z.string().nullable(),
  option1: z.string().nullable(),
  option2: z.string().nullable(),
  option3: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  taxable: z.boolean(),
  barcode: z.string().nullable(),
  grams: z.number(),
  image_id: z.number().nullable(),
  weight: z.number(),
  weight_unit: z.string(),
  inventory_item_id: z.number(),
  inventory_quantity: z.number(),
  old_inventory_quantity: z.number(),
  requires_shipping: z.boolean(),
});

/**
 * Product Image Schema
 */
export const ShopifyProductImageSchema = z.object({
  id: z.number(),
  product_id: z.number(),
  position: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
  alt: z.string().nullable(),
  width: z.number(),
  height: z.number(),
  src: z.string(),
  variant_ids: z.array(z.number()),
});

/**
 * Product Schema
 */
export const ShopifyProductSchema = z.object({
  id: z.number(),
  title: z.string(),
  body_html: z.string().nullable(),
  vendor: z.string(),
  product_type: z.string(),
  created_at: z.string(),
  handle: z.string(),
  updated_at: z.string(),
  published_at: z.string().nullable(),
  template_suffix: z.string().nullable(),
  status: z.string(),
  published_scope: z.string(),
  tags: z.string(),
  admin_graphql_api_id: z.string(),
  variants: z.array(ShopifyProductVariantSchema),
  options: z.array(z.object({
    id: z.number(),
    product_id: z.number(),
    name: z.string(),
    position: z.number(),
    values: z.array(z.string()),
  })),
  images: z.array(ShopifyProductImageSchema),
  image: ShopifyProductImageSchema.nullable(),
});

/**
 * Line Item Schema
 */
export const ShopifyLineItemSchema = z.object({
  id: z.number(),
  variant_id: z.number().nullable(),
  title: z.string(),
  quantity: z.number(),
  sku: z.string().nullable(),
  variant_title: z.string().nullable(),
  vendor: z.string().nullable(),
  fulfillment_service: z.string(),
  product_id: z.number().nullable(),
  requires_shipping: z.boolean(),
  taxable: z.boolean(),
  gift_card: z.boolean(),
  name: z.string(),
  price: z.string(),
  total_discount: z.string(),
});

/**
 * Order Schema
 */
export const ShopifyOrderSchema = z.object({
  id: z.number(),
  admin_graphql_api_id: z.string(),
  app_id: z.number().nullable(),
  browser_ip: z.string().nullable(),
  buyer_accepts_marketing: z.boolean(),
  cancel_reason: z.string().nullable(),
  cancelled_at: z.string().nullable(),
  cart_token: z.string().nullable(),
  checkout_id: z.number().nullable(),
  checkout_token: z.string().nullable(),
  client_details: z.any().nullable(),
  closed_at: z.string().nullable(),
  confirmed: z.boolean(),
  contact_email: z.string().nullable(),
  created_at: z.string(),
  currency: z.string(),
  current_subtotal_price: z.string(),
  current_total_discounts: z.string(),
  current_total_price: z.string(),
  current_total_tax: z.string(),
  customer_locale: z.string().nullable(),
  email: z.string(),
  financial_status: z.string(),
  fulfillment_status: z.string().nullable(),
  name: z.string(),
  note: z.string().nullable(),
  number: z.number(),
  order_number: z.number(),
  phone: z.string().nullable(),
  processed_at: z.string(),
  processing_method: z.string(),
  reference: z.string().nullable(),
  referring_site: z.string().nullable(),
  source_name: z.string(),
  subtotal_price: z.string(),
  tags: z.string(),
  total_discounts: z.string(),
  total_line_items_price: z.string(),
  total_price: z.string(),
  total_tax: z.string(),
  total_weight: z.number(),
  updated_at: z.string(),
  line_items: z.array(ShopifyLineItemSchema),
  shipping_address: z.any().nullable(),
  billing_address: z.any().nullable(),
  customer: z.any().nullable(),
});

/**
 * Customer Schema
 */
export const ShopifyCustomerSchema = z.object({
  id: z.number(),
  email: z.string(),
  accepts_marketing: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  orders_count: z.number(),
  state: z.string(),
  total_spent: z.string(),
  last_order_id: z.number().nullable(),
  note: z.string().nullable(),
  verified_email: z.boolean(),
  phone: z.string().nullable(),
  tags: z.string(),
  currency: z.string(),
});

/**
 * Inventory Level Schema
 */
export const ShopifyInventoryLevelSchema = z.object({
  inventory_item_id: z.number(),
  location_id: z.number(),
  available: z.number().nullable(),
  updated_at: z.string(),
});

/**
 * TypeScript Types (inferred from Zod schemas)
 */
export type ShopifyProduct = z.infer<typeof ShopifyProductSchema>;
export type ShopifyProductVariant = z.infer<typeof ShopifyProductVariantSchema>;
export type ShopifyProductImage = z.infer<typeof ShopifyProductImageSchema>;
export type ShopifyOrder = z.infer<typeof ShopifyOrderSchema>;
export type ShopifyLineItem = z.infer<typeof ShopifyLineItemSchema>;
export type ShopifyCustomer = z.infer<typeof ShopifyCustomerSchema>;
export type ShopifyInventoryLevel = z.infer<typeof ShopifyInventoryLevelSchema>;
