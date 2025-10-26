/**
 * Type definitions for product content extraction
 */

export interface ProductData {
  name: string;
  price?: string;
  regularPrice?: string;
  salePrice?: string;
  sku?: string;
  description?: string;
  specifications?: Record<string, string>;
  availability?: string;
  images?: string[];
  categories?: string[];
  breadcrumbs?: Array<{ name: string; url?: string }>;
  categoryHierarchy?: string[];
  primaryCategory?: string;
  brand?: string;
  rating?: number;
  reviews?: number;
}

export interface ExtractedContent {
  content: string;
  productData?: ProductData;
}

export interface Breadcrumb {
  name: string;
  url?: string;
}
