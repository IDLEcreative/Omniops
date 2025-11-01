/**
 * Category Mapper Types
 */

export interface CategoryMapping {
  pattern: string;           // URL pattern or keyword
  category_name: string;      // Display name
  category_url?: string;      // Optional category page URL
  product_count: number;      // Number of products
  confidence: number;         // Confidence score 0-1
}

export interface ProductCategory {
  product_url: string;
  product_name: string;
  category: string;
  category_url?: string;
}

export interface ExtractedCategory {
  name: string;
  url?: string;
}
