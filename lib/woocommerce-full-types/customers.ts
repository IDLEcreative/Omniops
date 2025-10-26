import { z } from 'zod';
import { BaseSchema, MetaDataSchema } from './base';

/**
 * WooCommerce Customer and Coupon schemas
 */

export const CustomerSchema = BaseSchema.extend({
  email: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  username: z.string(),
  role: z.string(),
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
  is_paying_customer: z.boolean(),
  avatar_url: z.string(),
  meta_data: z.array(MetaDataSchema),
});

export const CouponSchema = BaseSchema.extend({
  code: z.string(),
  amount: z.string(),
  discount_type: z.enum(['percent', 'fixed_cart', 'fixed_product']),
  description: z.string(),
  date_expires: z.string().nullable(),
  usage_count: z.number(),
  individual_use: z.boolean(),
  product_ids: z.array(z.number()),
  excluded_product_ids: z.array(z.number()),
  usage_limit: z.number().nullable(),
  usage_limit_per_user: z.number().nullable(),
  limit_usage_to_x_items: z.number().nullable(),
  free_shipping: z.boolean(),
  product_categories: z.array(z.number()),
  excluded_product_categories: z.array(z.number()),
  exclude_sale_items: z.boolean(),
  minimum_amount: z.string(),
  maximum_amount: z.string(),
  email_restrictions: z.array(z.string()),
  used_by: z.array(z.string()),
  meta_data: z.array(MetaDataSchema),
});

// Type exports
export type Customer = z.infer<typeof CustomerSchema>;
export type Coupon = z.infer<typeof CouponSchema>;
