/**
 * Type definitions for Chat Context Enhancer
 * Separated for modularity and maintainability
 */

export interface ContextChunk {
  content: string;
  url: string;
  title: string;
  similarity: number;
  source?: 'embedding' | 'smart' | 'fallback' | 'hybrid' | 'product';
  metadata?: any;
}

export interface EnhancedContext {
  chunks: ContextChunk[];
  totalChunks: number;
  averageSimilarity: number;
  hasHighConfidence: boolean;
  contextSummary?: string;
  reformulatedQuery?: string;
  queryStrategy?: string;
}

export interface EnhancementOptions {
  enableSmartSearch?: boolean;
  minChunks?: number;
  maxChunks?: number;
  conversationHistory?: Array<{ role: string; content: string }>;
}

export interface QueryAnalysis {
  needsProductContext: boolean;
  needsTechnicalContext: boolean;
  needsGeneralContext: boolean;
  suggestedChunks: number;
}

export interface BusinessTerminology {
  entity: string;
  plural: string;
  priceLabel: string;
}

export interface BusinessClassification {
  business_type: string;
  entity_terminology: BusinessTerminology;
}
