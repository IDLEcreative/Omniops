/**
 * Semantic Chunker Optimized - Main Export
 * Composed from modular components
 *
 * Original file: lib/semantic-chunker-optimized.ts (411 LOC)
 * Refactored into 5 focused modules:
 * - types.ts (54 LOC) - Type definitions and constants
 * - utils.ts (50 LOC) - Helper functions
 * - parsers.ts (96 LOC) - Content parsing logic
 * - chunking.ts (117 LOC) - Size constraints and chunk creation
 * - streaming.ts (54 LOC) - Large document stream processing
 */

import { parseContentBlocks } from './parsers';
import { applySizeConstraintsOptimized, addMinimalOverlaps } from './chunking';
import { streamChunkLargeContent } from './streaming';
import type { SemanticChunk } from './types';

// Re-export types for backward compatibility
export type { SemanticChunk, ContentBlock } from './types';
export {
  MIN_CHUNK_SIZE,
  MAX_CHUNK_SIZE,
  IDEAL_CHUNK_SIZE,
  OVERLAP_SIZE,
  PATTERNS
} from './types';

/**
 * Semantic Chunker Optimized
 * Main class that composes chunking functionality from specialized modules
 */
export class SemanticChunkerOptimized {
  /**
   * Optimized content chunking with streaming approach for large documents
   */
  static async chunkContent(
    content: string,
    htmlContent?: string
  ): Promise<SemanticChunk[]> {
    // For very large documents, use streaming approach
    if (content.length > 50000) {
      return streamChunkLargeContent(content, htmlContent);
    }

    // Parse content structure efficiently
    const blocks = parseContentBlocks(content, htmlContent);

    // Apply size constraints with optimized merging
    const sizedChunks = applySizeConstraintsOptimized(blocks);

    // Add minimal overlaps for context
    const finalChunks = addMinimalOverlaps(sizedChunks);

    return finalChunks;
  }
}
