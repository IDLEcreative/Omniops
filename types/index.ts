// Database types
export interface ScrapedPage {
  id: string;
  url: string;
  title?: string;
  content: string;
  metadata?: Record<string, unknown>;
  last_scraped_at: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  session_id: string;
  user_email?: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: {
    sources?: string[];
    products?: number[];
    orders?: number[];
  };
  created_at: string;
}

export interface PageEmbedding {
  id: string;
  page_id: string;
  chunk_text: string;
  embedding: number[];
  metadata?: Record<string, unknown>;
  created_at: string;
}

// API Request/Response types
export interface ChatRequest {
  message: string;
  conversation_id?: string;
  session_id: string;
}

export interface ChatResponse {
  message: string;
  conversation_id: string;
  sources?: {
    url: string;
    title: string;
    relevance: number;
  }[];
}

export interface ScrapeRequest {
  url: string;
  crawl?: boolean;
  max_pages?: number;
}

export interface ScrapeResponse {
  job_id?: string;
  pages_scraped?: number;
  status: 'started' | 'completed' | 'failed';
  message: string;
}

export interface WooCommerceSearchRequest {
  query?: string;
  type: 'products' | 'orders' | 'customer';
  filters?: Record<string, string | number | boolean | string[] | number[]>;
}

export interface ShopifySearchRequest {
  query?: string;
  type: 'products' | 'orders' | 'customer';
  filters?: Record<string, string | number | boolean | string[] | number[]>;
}

// Define proper types for WooCommerce results
export type WooCommerceProduct = {
  id: number;
  name: string;
  slug: string;
  type: string;
  status: string;
  description: string;
  price: string;
  regular_price: string;
  sale_price?: string;
  sku?: string;
  stock_status?: string;
  stock_quantity?: number;
  categories?: Array<{ id: number; name: string; slug: string }>;
  images?: Array<{ id: number; src: string; name: string; alt: string }>;
  [key: string]: unknown;
};

export type WooCommerceOrder = {
  id: number;
  parent_id: number;
  number: string;
  order_key: string;
  created_via: string;
  status: string;
  currency: string;
  date_created: string;
  date_modified: string;
  total: string;
  customer_id: number;
  billing?: Record<string, string>;
  shipping?: Record<string, string>;
  line_items?: Array<Record<string, unknown>>;
  [key: string]: unknown;
};

export type WooCommerceCustomer = {
  id: number;
  date_created: string;
  date_modified: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  username: string;
  billing?: Record<string, string>;
  shipping?: Record<string, string>;
  is_paying_customer: boolean;
  [key: string]: unknown;
};

export interface WooCommerceSearchResponse {
  results: Array<WooCommerceProduct | WooCommerceOrder | WooCommerceCustomer>;
  total: number;
}

// Shopify Types (imported from shopify-api.ts)
export type {
  ShopifyProduct,
  ShopifyOrder,
  ShopifyCustomer,
  ShopifyProductVariant,
  ShopifyInventoryLevel
} from '@/lib/shopify-api';

export interface ShopifySearchResponse {
  results: Array<any>; // Use ShopifyProduct | ShopifyOrder | ShopifyCustomer when needed
  total: number;
}

export * from './dashboard';
