/**
 * Type definitions for structured content extraction
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

export interface Breadcrumb {
  name: string;
  url?: string;
}

export interface ContentWithProducts {
  content: string;
  productData?: ProductData;
}
