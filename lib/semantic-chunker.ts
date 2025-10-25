/**
 * Semantic Chunking System - Main Orchestrator
 * Intelligently splits content at natural boundaries while preserving context
 *
 * Re-exports all public types for backwards compatibility
 */

// Re-export all public types
export type { SemanticChunk, ContentStructure, SemanticBlock } from './semantic-chunker-types';
export { CHUNK_CONSTANTS } from './semantic-chunker-types';

// Import internal modules
import type { SemanticChunk } from './semantic-chunker-types';
import { ContentParser } from './semantic-chunker-parsing';
import { ChunkingStrategy } from './semantic-chunker-strategies';
import { ChunkScoring } from './semantic-chunker-scoring';

/**
 * Main semantic chunking orchestrator
 * Coordinates parsing, chunking, and scoring operations
 */
export class SemanticChunker {
  /**
   * Split content into semantic chunks
   *
   * @param content - Plain text content to chunk
   * @param htmlContent - Optional HTML content for better structure detection
   * @returns Array of semantically complete chunks with metadata
   */
  static async chunkContent(
    content: string,
    htmlContent?: string
  ): Promise<SemanticChunk[]> {
    // Parse content structure
    const structure = ContentParser.parseContentStructure(content, htmlContent);

    // Create initial semantic blocks
    const blocks = ChunkingStrategy.createSemanticBlocks(structure);

    // Merge or split blocks to meet size constraints
    const sizedChunks = ChunkingStrategy.applySizeConstraints(blocks);

    // Add overlaps for context preservation
    const chunksWithOverlap = ChunkScoring.addOverlaps(sizedChunks);

    // Calculate semantic completeness scores
    const finalChunks = ChunkScoring.scoreCompleteness(chunksWithOverlap);

    return finalChunks;
  }
}
