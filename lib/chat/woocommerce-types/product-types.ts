/**
 * WooCommerce Product Types
 * Type definitions for product-related operations
 */

// Stock info type
export interface StockInfo {
  productName: string;
  sku: string;
  stockStatus: string;
  stockQuantity?: number;
  manageStock: boolean;
  backorders: string;
  price: string;
  onSale: boolean;
  salePrice: string;
}

// Product details type
export interface ProductDetails {
  id: number;
  name: string;
  sku: string;
  price: string;
  salePrice: string;
  description: string;
  shortDescription: string;
  categories: any[];
  images: any[];
  stockStatus: string;
  permalink: string;
  attributes: any[];
  variations: any[];
}

// Price info type
export interface PriceInfo {
  regularPrice: string;
  salePrice: string;
  currentPrice: string;
  onSale: boolean;
  currency: string;
}

// Category info type
export interface CategoryInfo {
  id: number;
  name: string;
  slug: string;
  parent: number;
  description: string;
  count: number;
}

// Review info type
export interface ReviewInfo {
  id: number;
  productId: number;
  rating: number;
  reviewer: string;
  reviewerEmail: string;
  review: string;
  dateCreated: string;
  verified: boolean;
}

// Product variation info type
export interface ProductVariationInfo {
  id: number;
  sku: string;
  price: string;
  regularPrice: string;
  salePrice: string;
  stockStatus: string;
  stockQuantity: number | null;
  attributes: Array<{
    name: string;
    option: string;
  }>;
  image: any;
  available: boolean;
}

// Search products info type
export interface SearchProductsInfo {
  products: Array<{
    id: number;
    name: string;
    price: string;
    regularPrice: string;
    salePrice: string;
    onSale: boolean;
    stockStatus: string;
    stockQuantity: number | null;
    categories: Array<{ id: number; name: string; }>;
    images: Array<{ src: string; alt: string; }>;
    shortDescription: string;
    averageRating: string;
    ratingCount: number;
  }>;
  total: number;
  query: string;
  filters: {
    minPrice?: number;
    maxPrice?: number;
    categoryId?: string;
  };
}
