/**
 * Semantic Chunker Optimized - Proxy Export
 *
 * This file maintains backward compatibility while the implementation
 * has been refactored into a modular structure in lib/semantic-chunker-optimized/
 *
 * Original file: 411 LOC (backed up to .old)
 * New structure: 5 focused modules totaling ~329 LOC
 */

export {
  type SemanticChunk,
  type ContentBlock,
  MIN_CHUNK_SIZE,
  MAX_CHUNK_SIZE,
  IDEAL_CHUNK_SIZE,
  OVERLAP_SIZE,
  PATTERNS,
  SemanticChunkerOptimized,
} from './semantic-chunker-optimized/';
