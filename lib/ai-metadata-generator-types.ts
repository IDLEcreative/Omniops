/**
 * AI Metadata Generator - Type Definitions
 *
 * Contains all interfaces, types, and schemas for AI metadata generation.
 * Extracted from ai-metadata-generator.ts for modularity.
 */

// Core metadata interface
export interface AIMetadata {
  summary: string; // 50-100 words
  briefSummary: string; // 10-15 words
  contentType: ContentType;
  topics: string[];
  keywords: string[];
  entities: {
    people: string[];
    organizations: string[];
    locations: string[];
    products: string[];
    dates: string[];
  };
  answerableQuestions: Question[];
  sentiment: 'positive' | 'negative' | 'neutral';
  complexity: 'simple' | 'moderate' | 'complex';
  embeddings: {
    summary: number[];
    keywords: number[][];
    cached: boolean;
    model: string;
  };
  intentMappings: IntentMapping[];
  quality: QualityScore;
  generatedAt: string;
  contentHash: string;
}

// Question interface
export interface Question {
  question: string;
  answer: string;
  confidence: number;
  source: string; // section of content
  type: 'factual' | 'procedural' | 'conceptual';
}

// Intent mapping interface
export interface IntentMapping {
  pattern: string; // regex or keyword pattern
  intent: string;
  confidence: number;
  examples: string[];
}

// Quality score interface
export interface QualityScore {
  overall: number;
  summaryAccuracy: number;
  entityAccuracy: number;
  questionQuality: number;
  completeness: number;
}

// Content type enum
export type ContentType =
  | 'faq'
  | 'documentation'
  | 'product_info'
  | 'support_article'
  | 'policy'
  | 'troubleshooting'
  | 'general';

// Cache entry interface
export interface CacheEntry {
  hash: string;
  metadata: AIMetadata;
  timestamp: number;
  ttl: number;
}

// Processing options interface
export interface ProcessingOptions {
  useCache?: boolean;
  cacheTimeout?: number;
  embeddingModel?: string;
  maxKeywords?: number;
  maxQuestions?: number;
  includeEmbeddings?: boolean;
}
