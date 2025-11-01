/**
 * Dual Embeddings Module
 *
 * NOTE: This file has been refactored into modular structure.
 * See lib/dual-embeddings/ directory for implementation details.
 *
 * Original file backed up as: lib/dual-embeddings.ts.old
 */

export {
  // Types
  type DualEmbeddingResult,
  type QueryIntent,

  // Main class
  DualEmbeddings,

  // Functions
  detectQueryIntent,
  enrichQueryByIntent,
  createMetadataQuery,
  calculateOptimalWeights,
  createMetadataOnlyContent,
  calculateEmbeddingQuality,
  generateSingleEmbedding,
  storeDualEmbeddings,
} from './dual-embeddings/'
