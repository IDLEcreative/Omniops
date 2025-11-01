/**
 * Dual Embeddings Types
 * Type definitions for dual embedding strategy
 */

export interface DualEmbeddingResult {
  textEmbedding: number[];
  metadataEmbedding: number[];
  quality: {
    hasStructuredData: boolean;
    metadataScore: number;
    recommendedWeights: {
      text: number;
      metadata: number;
    };
  };
}

export interface QueryIntent {
  type: 'product' | 'shopping' | 'price' | 'availability' | 'general';
  hasSKU: boolean;
  hasPrice: boolean;
  hasAvailability: boolean;
  hasBrand: boolean;
  hasComparison: boolean;
  confidence: number;
}
