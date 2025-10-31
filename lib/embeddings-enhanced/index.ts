/**
 * Enhanced Embeddings - Main Export
 * Provides backward-compatible exports from modular structure
 */

// Export all functions for backward compatibility
export { generateEnhancedEmbeddings } from './generation';
export { searchEnhancedContent } from './search';
export { migrateExistingEmbeddings } from './migration';
export { analyzeMetadataQuality } from './analytics';

// Re-export types from metadata-extractor for convenience
export type { EnhancedEmbeddingMetadata } from '../metadata-extractor';
