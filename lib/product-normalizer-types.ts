/**
 * Product Normalizer Type Definitions
 * Type interfaces for product normalization system
 */

export interface NormalizedPrice {
  amount: number;
  currency: string;
  formatted: string;
  original?: number;
  discount?: number;
  discountPercent?: number;
  vatIncluded?: boolean;
  vatRate?: number;
  priceType?: 'single' | 'range' | 'starting-from';
}

export interface ProductVariant {
  id?: string;
  name: string;
  type: 'color' | 'size' | 'material' | 'style' | 'custom';
  value: string;
  priceModifier?: number;
  stockLevel?: number;
  sku?: string;
  image?: string;
}

export interface ProductSpecification {
  name: string;
  value: string;
  unit?: string;
  group?: string;
}

export interface ProductImage {
  url: string;
  alt?: string;
  title?: string;
  isMain?: boolean;
  position?: number;
}

export interface ProductAvailability {
  inStock: boolean;
  stockLevel?: number;
  stockStatus?: 'in-stock' | 'out-of-stock' | 'pre-order' | 'backorder' | 'limited';
  expectedDate?: string;
}

export interface ProductBreadcrumb {
  name: string;
  url?: string;
  level?: number;
}

export interface ProductRating {
  value: number;
  max?: number;
  count?: number;
}

export interface ProductPriceRange {
  min: NormalizedPrice;
  max: NormalizedPrice;
}

export interface NormalizedProduct {
  // Core fields
  id?: string;
  sku?: string;
  name: string;
  url?: string;

  // Pricing
  price?: NormalizedPrice;
  priceRange?: ProductPriceRange;

  // Stock
  availability?: ProductAvailability;

  // Content
  description?: string;
  shortDescription?: string;

  // Media
  images?: ProductImage[];

  // Variants & Options
  variants?: ProductVariant[];
  hasVariants?: boolean;

  // Specifications
  specifications?: ProductSpecification[];

  // Categorization
  categories?: string[];
  breadcrumbs?: ProductBreadcrumb[];
  tags?: string[];

  // Metadata
  brand?: string;
  manufacturer?: string;
  model?: string;
  mpn?: string; // Manufacturer Part Number
  gtin?: string; // Global Trade Item Number (includes UPC, EAN, ISBN)

  // Reviews
  rating?: ProductRating;

  // SEO
  metaTitle?: string;
  metaDescription?: string;

  // Timestamps
  createdAt?: string;
  updatedAt?: string;
  scrapedAt: string;
}

export interface RawProduct {
  name?: string;
  title?: string;
  sku?: string;
  url?: string;
  id?: string;
  price?: string | number;
  currency?: string;
  priceMin?: string | number;
  priceMax?: string | number;
  availability?: string;
  stock?: string;
  inStock?: boolean;
  description?: string;
  shortDescription?: string;
  images?: any[];
  image?: any;
  specifications?: any;
  details?: any;
  features?: any;
  categories?: string[];
  breadcrumbs?: ProductBreadcrumb[];
  tags?: string[];
  brand?: string;
  manufacturer?: string;
  model?: string;
  rating?: any;
  reviewCount?: string | number;
}

export interface VariantSelector {
  color: string[];
  size: string[];
  material: string[];
  style: string[];
}

export interface SpecificationPattern {
  pattern: RegExp;
  name: string;
}
