import { z } from 'zod';
import { BaseSchema, MetaDataSchema } from './base';

/**
 * WooCommerce Product-related schemas
 * Includes products, variations, attributes, tags, and shipping classes
 */

export const ProductVariationSchema = z.object({
  id: z.number(),
  sku: z.string().optional(),
  price: z.string(),
  regular_price: z.string(),
  sale_price: z.string().optional(),
  stock_quantity: z.number().nullable(),
  stock_status: z.string(),
  attributes: z.array(z.object({
    id: z.number(),
    name: z.string(),
    option: z.string(),
  })),
  image: z.object({
    id: z.number(),
    src: z.string(),
    alt: z.string(),
  }).optional(),
});

export const ProductAttributeSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  type: z.string(),
  has_archives: z.boolean(),
  options: z.array(z.string()).optional(),
});

export const ProductTagSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  count: z.number(),
});

export const ProductShippingClassSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  count: z.number(),
});

// Enhanced Product schema with all fields
export const ProductSchema = BaseSchema.extend({
  name: z.string(),
  slug: z.string(),
  permalink: z.string(),
  type: z.enum([
    'simple', 'grouped', 'external', 'variable',
    'variation', 'bundle', 'subscription', 'booking', 'composite'
  ]).or(z.string()), // Fallback for unknown product types
  status: z.enum(['draft', 'pending', 'private', 'publish']),
  featured: z.boolean(),
  catalog_visibility: z.enum(['visible', 'catalog', 'search', 'hidden']),
  description: z.string(),
  short_description: z.string(),
  sku: z.string().optional(),
  price: z.string(),
  regular_price: z.string(),
  sale_price: z.string().optional(),
  on_sale: z.boolean().optional(),
  date_on_sale_from: z.string().nullable(),
  date_on_sale_to: z.string().nullable(),
  virtual: z.boolean(),
  downloadable: z.boolean(),
  downloads: z.array(z.object({
    id: z.string(),
    name: z.string(),
    file: z.string(),
  })),
  download_limit: z.number(),
  download_expiry: z.number(),
  stock_quantity: z.number().nullable(),
  stock_status: z.enum(['instock', 'outofstock', 'onbackorder']),
  manage_stock: z.boolean(),
  backorders: z.enum(['no', 'notify', 'yes']),
  sold_individually: z.boolean(),
  weight: z.string(),
  dimensions: z.object({
    length: z.string(),
    width: z.string(),
    height: z.string(),
  }),
  shipping_class: z.string(),
  shipping_class_id: z.number(),
  reviews_allowed: z.boolean(),
  average_rating: z.string(),
  rating_count: z.number(),
  categories: z.array(z.object({
    id: z.number(),
    name: z.string(),
    slug: z.string(),
  })),
  tags: z.array(z.object({
    id: z.number(),
    name: z.string(),
    slug: z.string(),
  })),
  images: z.array(z.object({
    id: z.number(),
    src: z.string(),
    alt: z.string(),
  })),
  attributes: z.array(z.object({
    id: z.number(),
    name: z.string(),
    position: z.number().optional(),
    visible: z.boolean().optional(),
    variation: z.boolean().optional(),
    options: z.array(z.string()).optional(),
  })),
  default_attributes: z.array(z.object({
    id: z.number(),
    name: z.string(),
    option: z.string(),
  })),
  variations: z.array(z.number()),
  grouped_products: z.array(z.number()),
  related_ids: z.array(z.number()),
  upsell_ids: z.array(z.number()),
  cross_sell_ids: z.array(z.number()),
  parent_id: z.number(),
  meta_data: z.array(MetaDataSchema),
});

// Type exports
export type Product = z.infer<typeof ProductSchema>;
export type ProductVariation = z.infer<typeof ProductVariationSchema>;
export type ProductAttribute = z.infer<typeof ProductAttributeSchema>;
export type ProductTag = z.infer<typeof ProductTagSchema>;
export type ProductShippingClass = z.infer<typeof ProductShippingClassSchema>;
