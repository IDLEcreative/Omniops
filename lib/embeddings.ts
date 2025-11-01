/**
 * Embeddings module - proxy file for backward compatibility
 *
 * This file re-exports all functions from the modular embeddings directory
 * to maintain backward compatibility with existing imports.
 */

export {
  searchSimilarContent,
  searchSimilarContentOptimized,
  generateQueryEmbedding,
  QueryTimer,
  getOpenAIClient,
  generateEmbeddings,
  splitIntoChunks,
  generateEmbeddingVectors,
} from './embeddings/index';

export type { SearchResult, CachedSearchResult } from './embeddings/index';
