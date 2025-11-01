/**
 * Embeddings module - main exports
 *
 * Provides query embedding generation and semantic search capabilities
 */

// Export main search function
export { searchSimilarContentOptimized as searchSimilarContent } from './search-orchestrator';
export { searchSimilarContentOptimized } from './search-orchestrator';

// Export query embedding generation
export { generateQueryEmbedding } from './query-embedding';

// Export utilities
export { QueryTimer } from './timer';
export { getOpenAIClient } from './openai-client';

// Re-export functions from embeddings-functions.ts
export {
  generateEmbeddings,
  splitIntoChunks,
  generateEmbeddingVectors,
} from '../embeddings-functions';

// Export types
export type { SearchResult, CachedSearchResult } from './types';
