/**
 * Shopping Experience Types
 *
 * Minimal type definitions for next-level mobile shopping
 */

export interface ShoppingProduct {
  id: string;
  name: string;
  price: number;
  salePrice?: number;
  image: string;              // Main hero image
  images?: string[];          // Gallery images for detail view
  permalink: string;
  stockStatus?: 'instock' | 'outofstock' | 'onbackorder';
  shortDescription?: string;
  variants?: ProductVariant[];
}

export interface ProductVariant {
  id: string;
  name: string;              // e.g., "Size", "Color"
  options: string[];         // e.g., ["S", "M", "L", "XL"]
  selected?: string;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  selectedVariants?: Record<string, string>;
}

export type MessageType =
  | { type: 'text'; content: string }
  | { type: 'products'; products: ShoppingProduct[]; context?: string };
