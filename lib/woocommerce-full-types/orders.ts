import { z } from 'zod';
import { BaseSchema, MetaDataSchema } from './base';

/**
 * WooCommerce Order-related schemas
 * Includes orders, order notes, and refunds
 */

export const OrderNoteSchema = z.object({
  id: z.number(),
  author: z.string(),
  date_created: z.string(),
  note: z.string(),
  customer_note: z.boolean(),
});

export const RefundSchema = BaseSchema.extend({
  amount: z.string(),
  reason: z.string(),
  refunded_by: z.number(),
  line_items: z.array(z.object({
    id: z.number(),
    name: z.string(),
    product_id: z.number(),
    variation_id: z.number(),
    quantity: z.number(),
    tax_class: z.string(),
    subtotal: z.string(),
    total: z.string(),
    taxes: z.array(z.any()),
    meta_data: z.array(MetaDataSchema),
    refund_total: z.number(),
  })),
});

export const OrderSchema = BaseSchema.extend({
  parent_id: z.number(),
  number: z.string(),
  order_key: z.string(),
  created_via: z.string(),
  version: z.string(),
  status: z.enum(['pending', 'processing', 'on-hold', 'completed', 'cancelled', 'refunded', 'failed', 'trash']),
  currency: z.string(),
  date_paid: z.string().nullable(),
  date_completed: z.string().nullable(),
  cart_hash: z.string(),
  customer_id: z.number(),
  customer_ip_address: z.string(),
  customer_user_agent: z.string(),
  customer_note: z.string(),
  billing: z.object({
    first_name: z.string(),
    last_name: z.string(),
    company: z.string(),
    address_1: z.string(),
    address_2: z.string(),
    city: z.string(),
    state: z.string(),
    postcode: z.string(),
    country: z.string(),
    email: z.string(),
    phone: z.string(),
  }),
  shipping: z.object({
    first_name: z.string(),
    last_name: z.string(),
    company: z.string(),
    address_1: z.string(),
    address_2: z.string(),
    city: z.string(),
    state: z.string(),
    postcode: z.string(),
    country: z.string(),
  }),
  payment_method: z.string(),
  payment_method_title: z.string(),
  transaction_id: z.string(),
  line_items: z.array(z.object({
    id: z.number(),
    name: z.string(),
    product_id: z.number(),
    variation_id: z.number(),
    quantity: z.number(),
    tax_class: z.string(),
    subtotal: z.string(),
    subtotal_tax: z.string(),
    total: z.string(),
    total_tax: z.string(),
    taxes: z.array(z.any()),
    meta_data: z.array(MetaDataSchema),
    sku: z.string().optional(),
    price: z.number(),
  })),
  tax_lines: z.array(z.object({
    id: z.number(),
    rate_code: z.string(),
    rate_id: z.number(),
    label: z.string(),
    compound: z.boolean(),
    tax_total: z.string(),
    shipping_tax_total: z.string(),
    meta_data: z.array(MetaDataSchema),
  })),
  shipping_lines: z.array(z.object({
    id: z.number(),
    method_title: z.string(),
    method_id: z.string(),
    total: z.string(),
    total_tax: z.string(),
    taxes: z.array(z.any()),
    meta_data: z.array(MetaDataSchema),
  })),
  fee_lines: z.array(z.any()),
  coupon_lines: z.array(z.object({
    id: z.number(),
    code: z.string(),
    discount: z.string(),
    discount_tax: z.string(),
    meta_data: z.array(MetaDataSchema),
  })),
  refunds: z.array(z.object({
    id: z.number(),
    reason: z.string(),
    total: z.string(),
  })),
  total: z.string(),
  total_tax: z.string(),
  discount_total: z.string(),
  discount_tax: z.string(),
  shipping_total: z.string(),
  shipping_tax: z.string(),
  prices_include_tax: z.boolean(),
  meta_data: z.array(MetaDataSchema),
});

// Type exports
export type Order = z.infer<typeof OrderSchema>;
export type OrderNote = z.infer<typeof OrderNoteSchema>;
export type Refund = z.infer<typeof RefundSchema>;
