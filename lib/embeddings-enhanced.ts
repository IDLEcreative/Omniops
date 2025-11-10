/**
 * Enhanced Embeddings - Main Orchestrator
 * Backward compatible enhancement of the embeddings system
 *
 * This file serves as a thin orchestration layer that delegates to focused modules.
 * All modules are located in lib/embeddings/ directory and are under 300 LOC.
 */

// Re-export enhanced generation
export { generateEnhancedEmbeddings } from './embeddings/enhanced-generation';

// Re-export enhanced search
export { searchEnhancedContent } from './embeddings/enhanced-search';

// Re-export migration utilities
export {
  migrateExistingEmbeddings,
  analyzeMetadataQuality
} from './embeddings/migration-utils';

// Re-export types from metadata extractor for convenience
export type { EnhancedEmbeddingMetadata, ContentType } from './metadata-extractor';
