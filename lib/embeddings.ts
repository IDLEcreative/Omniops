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
  handleZeroResults,
  shouldTriggerRecovery,
} from './embeddings/index';

export type { SearchResult, CachedSearchResult, RecoveryResult } from './embeddings/index';
