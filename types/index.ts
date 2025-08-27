// Database types
export interface ScrapedPage {
  id: string;
  url: string;
  title?: string;
  content: string;
  metadata?: Record<string, any>;
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
  metadata?: Record<string, any>;
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
  filters?: Record<string, any>;
}

export interface WooCommerceSearchResponse {
  results: any[];
  total: number;
}