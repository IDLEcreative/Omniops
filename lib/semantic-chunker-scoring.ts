/**
 * Chunk Overlap and Completeness Scoring
 * Adds context preservation overlaps and calculates semantic quality scores
 */

import type { SemanticChunk, SemanticBlock } from './semantic-chunker-types';
import { CHUNK_CONSTANTS } from './semantic-chunker-types';

export class ChunkScoring {
  /**
   * Check if text has complete sentences
   */
  static hasCompleteSentences(text: string): boolean {
    return /[.!?]$/.test(text.trim());
  }

  /**
   * Map block type to chunk type
   */
  static mapBlockType(type: string): SemanticChunk['type'] {
    const typeMap: Record<string, SemanticChunk['type']> = {
      'section': 'section',
      'paragraph': 'paragraph',
      'list': 'list',
      'table': 'table',
      'code': 'code',
      'mixed': 'mixed',
      'heading': 'heading'
    };
    return typeMap[type] || 'mixed';
  }

  /**
   * Add overlaps between chunks for context preservation
   */
  static addOverlaps(blocks: SemanticBlock[]): SemanticChunk[] {
    const chunks: SemanticChunk[] = [];

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      if (!block) continue;

      const prevBlock = i > 0 ? blocks[i - 1] : undefined;
      const nextBlock = i < blocks.length - 1 ? blocks[i + 1] : undefined;

      let chunkContent = block.content;
      let overlapPrevious = '';
      let overlapNext = '';

      // Add overlap with previous chunk (last N chars of previous content)
      if (prevBlock && prevBlock.content.length > 0) {
        const prevContent = prevBlock.content.trim();
        const overlapLength = Math.min(CHUNK_CONSTANTS.OVERLAP_SIZE, prevContent.length);
        overlapPrevious = prevContent.slice(-overlapLength);

        // Add context from previous chunk to beginning of current chunk for continuity
        if (overlapPrevious && i > 0) {
          chunkContent = `[...${overlapPrevious.slice(-50)}]\n\n${chunkContent}`;
        }
      }

      // Add overlap with next chunk (first N chars of next content)
      if (nextBlock && nextBlock.content.length > 0) {
        const nextContent = nextBlock.content.trim();
        const overlapLength = Math.min(CHUNK_CONSTANTS.OVERLAP_SIZE, nextContent.length);
        overlapNext = nextContent.slice(0, overlapLength);

        // Add preview of next chunk to end of current chunk for continuity
        if (overlapNext && i < blocks.length - 1) {
          chunkContent = `${chunkContent}\n\n[${overlapNext.slice(0, 50)}...]`;
        }
      }

      const chunk: SemanticChunk = {
        content: chunkContent,
        type: this.mapBlockType(block.type),
        parent_heading: block.parent_heading,
        heading_hierarchy: block.heading_hierarchy,
        semantic_completeness: 0, // Will be calculated
        boundary_type: overlapPrevious || overlapNext ? 'overlap' : 'natural',
        overlap_with_previous: overlapPrevious,
        overlap_with_next: overlapNext,
        chunk_index: i,
        total_chunks: blocks.length,
        metadata: {
          has_complete_sentences: this.hasCompleteSentences(chunkContent),
          word_count: chunkContent.split(/\s+/).filter(w => w.length > 0).length,
          char_count: chunkContent.length,
          contains_list: block.elements?.some(e => e.type === 'list') ||
            block.content.includes('•') ||
            /[\-\*]\s/.test(block.content) ||
            /\d+\.\s/.test(block.content),
          contains_code: block.elements?.some(e => e.type === 'code') ||
            block.content.includes('```') ||
            false,
          contains_table: block.elements?.some(e => e.type === 'table') || false
        }
      };

      chunks.push(chunk);
    }

    return chunks;
  }

  /**
   * Calculate semantic completeness scores
   */
  static scoreCompleteness(chunks: SemanticChunk[]): SemanticChunk[] {
    return chunks.map(chunk => {
      let score = 0.4; // Base score

      // Complete sentences boost
      if (chunk.metadata.has_complete_sentences) score += 0.15;

      // Good size boost (more lenient)
      const sizeRatio = chunk.metadata.char_count / CHUNK_CONSTANTS.IDEAL_CHUNK_SIZE;
      if (sizeRatio >= CHUNK_CONSTANTS.MIN_SIZE_RATIO && sizeRatio <= CHUNK_CONSTANTS.MAX_SIZE_RATIO) {
        // Scale score based on how close to ideal
        const deviation = Math.abs(1.0 - sizeRatio);
        score += (1.0 - deviation) * 0.2;
      }

      // Has heading boost
      if (chunk.parent_heading || chunk.heading_hierarchy.length > 0) score += 0.1;

      // Contains structured content boost
      if (chunk.metadata.contains_list) score += 0.05;
      if (chunk.metadata.contains_code) score += 0.05;
      if (chunk.metadata.contains_table) score += 0.05;

      // Natural boundary boost (overlaps show context preservation)
      if (chunk.boundary_type === 'overlap') score += 0.1;
      else if (chunk.boundary_type === 'natural') score += 0.05;

      // Context preservation boost
      if (chunk.overlap_with_previous || chunk.overlap_with_next) score += 0.05;

      // Type coherence boost
      if (chunk.type !== 'mixed') score += 0.05;

      return {
        ...chunk,
        semantic_completeness: Math.min(score, 1.0)
      };
    });
  }
}
