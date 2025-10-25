import { ExtractedContent } from './content-extractor';

/**
 * Represents a semantic chunk of content with AI optimization metadata
 */
export interface SemanticChunk {
  id: string;
  type: 'main' | 'faq' | 'features' | 'specs' | 'support' | 'legal';
  content: string;
  tokens: number;
  relevanceScore: number;
  metadata: {
    headings: string[];
    keywords: string[];
    entities: string[];
  };
}

/**
 * AI-optimized content extraction result
 */
export interface AIOptimizedContent extends ExtractedContent {
  originalTokens: number;
  optimizedTokens: number;
  compressionRatio: number;
  chunks: SemanticChunk[];
  summary: string;
  keyFacts: string[];
  qaPairs: Array<{ question: string; answer: string }>;
  topicTags: string[];
  processingStats: {
    removedElements: number;
    deduplicatedSections: number;
    compressionTime: number;
  };
}

/**
 * Cache entry structure for optimized content
 */
export interface CacheEntry {
  content: AIOptimizedContent;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}
