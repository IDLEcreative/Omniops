/**
 * Chunking Logic
 * Applies size constraints and creates semantic chunks from content blocks
 */

import { MIN_CHUNK_SIZE, MAX_CHUNK_SIZE, IDEAL_CHUNK_SIZE } from './types';
import { calculateMetadataFast, calculateCompleteness } from './utils';
import type { ContentBlock, SemanticChunk } from './types';

/**
 * Optimized size constraint application
 * Splits blocks into chunks based on size limits while preserving semantic boundaries
 */
export function applySizeConstraintsOptimized(blocks: ContentBlock[]): SemanticChunk[] {
  const chunks: SemanticChunk[] = [];
  let currentChunk: ContentBlock[] = [];
  let currentSize = 0;
  let headingHierarchy: string[] = [];

  for (const block of blocks) {
    const blockSize = block.content.length;

    // Update heading hierarchy
    if (block.type === 'heading' && block.level) {
      headingHierarchy = headingHierarchy.slice(0, block.level - 1);
      headingHierarchy[block.level - 1] = block.content;
    }

    // Check if adding this block would exceed max size
    if (currentSize + blockSize > MAX_CHUNK_SIZE && currentChunk.length > 0) {
      // Save current chunk
      chunks.push(createChunkFromBlocks(currentChunk, headingHierarchy, chunks.length));
      currentChunk = [];
      currentSize = 0;
    }

    currentChunk.push(block);
    currentSize += blockSize;

    // If chunk is in ideal range and has a natural boundary, save it
    if (currentSize >= IDEAL_CHUNK_SIZE && block.type === 'heading') {
      chunks.push(createChunkFromBlocks(currentChunk, headingHierarchy, chunks.length));
      currentChunk = [];
      currentSize = 0;
    }
  }

  // Add remaining blocks
  if (currentChunk.length > 0) {
    chunks.push(createChunkFromBlocks(currentChunk, headingHierarchy, chunks.length));
  }

  return chunks;
}

/**
 * Create chunk from blocks efficiently
 * Combines content blocks into a single semantic chunk with metadata
 */
export function createChunkFromBlocks(
  blocks: ContentBlock[],
  headingHierarchy: string[],
  index: number
): SemanticChunk {
  const content = blocks.map(b => b.content).join('\n\n');
  const types = new Set(blocks.map(b => b.type));
  const type = types.size === 1 ? Array.from(types)[0] as SemanticChunk['type'] : 'mixed';

  return {
    content,
    type,
    parent_heading: headingHierarchy[headingHierarchy.length - 2] || '',
    heading_hierarchy: [...headingHierarchy].filter(Boolean),
    semantic_completeness: calculateCompleteness(content, type),
    boundary_type: 'natural',
    overlap_with_previous: '',
    overlap_with_next: '',
    chunk_index: index,
    total_chunks: 0, // Will be updated in addMinimalOverlaps
    metadata: calculateMetadataFast(content)
  };
}

/**
 * Add minimal overlaps for context preservation
 * Adds overlap text between adjacent chunks to maintain context
 */
export function addMinimalOverlaps(chunks: SemanticChunk[]): SemanticChunk[] {
  const totalChunks = chunks.length;

  for (let i = 0; i < chunks.length; i++) {
    const currentChunk = chunks[i];
    if (currentChunk) {
      currentChunk.total_chunks = totalChunks;

      if (i > 0) {
        const prevChunk = chunks[i - 1];
        if (prevChunk) {
          const prevContent = prevChunk.content;
          const overlapSize = Math.min(50, prevContent.length / 4);
          currentChunk.overlap_with_previous = prevContent.slice(-overlapSize);
        }
      }

      if (i < chunks.length - 1) {
        const nextChunk = chunks[i + 1];
        if (nextChunk) {
          const nextContent = nextChunk.content;
          const overlapSize = Math.min(50, nextContent.length / 4);
          currentChunk.overlap_with_next = nextContent.slice(0, overlapSize);
        }
      }
    }
  }

  return chunks;
}
