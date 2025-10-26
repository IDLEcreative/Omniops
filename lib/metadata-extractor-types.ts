/**
 * Type definitions for metadata extraction
 */

export type ContentType = 'product' | 'faq' | 'documentation' | 'blog' | 'support' | 'general';

export interface EnhancedEmbeddingMetadata {
  // Core fields (existing)
  url: string;
  title: string;
  chunk_index: number;
  total_chunks: number;

  // Content classification
  content_type: ContentType;
  content_category?: string;

  // Contextual information
  section_title?: string;
  keywords: string[];
  entities: {
    products?: string[];
    brands?: string[];
    models?: string[];
    skus?: string[];
  };

  // Temporal information
  content_date?: string;
  indexed_at: string;
  last_modified?: string;

  // Quality signals
  word_count: number;
  has_structured_data: boolean;
  language: string;
  readability_score?: number;

  // Domain-specific (e-commerce)
  price_range?: {
    min: number;
    max: number;
    currency: string;
  };
  availability?: 'in_stock' | 'out_of_stock' | 'preorder' | 'discontinued';
  ratings?: {
    value: number;
    count: number;
  };

  // Contact information
  contact_info?: {
    email?: string;
    phone?: string;
    address?: string;
  };

  // Q&A pairs for FAQ content
  qa_pairs?: Array<{
    question: string;
    answer: string;
  }>;
}

export interface QAPair {
  question: string;
  answer: string;
}

export interface ContactInfo {
  email?: string;
  phone?: string;
  address?: string;
}

export interface PriceRange {
  min: number;
  max: number;
  currency: string;
}

export interface Ratings {
  value: number;
  count: number;
}
