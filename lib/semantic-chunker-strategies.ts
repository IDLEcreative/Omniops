/**
 * Chunking Strategies and Algorithms
 * Block creation, size constraints, merging, and splitting logic
 */

import type { ContentStructure, SemanticBlock } from './semantic-chunker-types';
import { CHUNK_CONSTANTS } from './semantic-chunker-types';

export class ChunkingStrategy {
  /**
   * Get element content helper
   */
  static getElementContent(element: any): string {
    if (element.type === 'heading') return element.text;
    if (element.type === 'paragraph') return element.content;
    if (element.type === 'list') return element.content;
    if (element.type === 'table') return element.content;
    if (element.type === 'code') return element.content;
    return element.content || '';
  }

  /**
   * Create semantic blocks from structure
   */
  static createSemanticBlocks(structure: ContentStructure): SemanticBlock[] {
    const blocks: SemanticBlock[] = [];
    let currentHeading = '';
    let headingHierarchy: string[] = [];

    // Sort all elements by position
    const allElements = [
      ...structure.headings.map(h => ({ ...h, type: 'heading' as const })),
      ...structure.paragraphs.map(p => ({ ...p, type: 'paragraph' as const })),
      ...structure.lists.map(l => ({ ...l, type: 'list' as const })),
      ...structure.tables.map(t => ({ ...t, type: 'table' as const })),
      ...structure.codeBlocks.map(c => ({ ...c, type: 'code' as const }))
    ].sort((a, b) => a.position - b.position);

    let currentBlock: SemanticBlock | null = null;

    for (const element of allElements) {
      if (element.type === 'heading') {
        // Save current block if exists and has content
        if (currentBlock && currentBlock.content.trim().length > 0) {
          blocks.push(currentBlock);
        }

        // Update heading hierarchy
        const level = (element as any).level;
        headingHierarchy = headingHierarchy.slice(0, level - 1);
        headingHierarchy[level - 1] = (element as any).text;
        currentHeading = (element as any).text;

        // Start new block with heading
        currentBlock = {
          content: currentHeading + '\n',
          type: 'section',
          parent_heading: level > 1 ? headingHierarchy[level - 2] || '' : '',
          heading_hierarchy: [...headingHierarchy].filter(Boolean),
          elements: [element]
        };
      } else {
        // Add element to current block
        if (!currentBlock) {
          currentBlock = {
            content: '',
            type: 'mixed',
            parent_heading: '',
            heading_hierarchy: [],
            elements: []
          };
        }

        if (!currentBlock.elements) {
          currentBlock.elements = [];
        }
        currentBlock.elements.push(element);
        const elementContent = this.getElementContent(element);
        if (elementContent) {
          // Add proper spacing
          if (currentBlock.content && !currentBlock.content.endsWith('\n')) {
            currentBlock.content += '\n';
          }
          currentBlock.content += elementContent;

          // Update type based on dominant element type
          const elements = currentBlock.elements || [];
          if (element.type === 'list' && elements.filter(e => e.type === 'list').length >
            elements.filter(e => e.type === 'paragraph').length) {
            currentBlock.type = 'list';
          } else if (element.type === 'code' && currentBlock.type !== 'section') {
            currentBlock.type = 'code';
          } else if (element.type === 'table' && currentBlock.type !== 'section') {
            currentBlock.type = 'table';
          }
        }
      }
    }

    // Add final block if has content
    if (currentBlock && currentBlock.content.trim().length > 0) {
      blocks.push(currentBlock);
    }

    return blocks;
  }

  /**
   * Apply size constraints to blocks
   */
  static applySizeConstraints(blocks: SemanticBlock[]): SemanticBlock[] {
    const sizedBlocks: SemanticBlock[] = [];

    for (const block of blocks) {
      const blockSize = block.content.length;

      if (blockSize <= CHUNK_CONSTANTS.MAX_CHUNK_SIZE) {
        // Block is within size limits
        sizedBlocks.push(block);
      } else {
        // Split large block
        const splits = this.splitLargeBlock(block);
        sizedBlocks.push(...splits);
      }
    }

    // First pass: merge very small blocks (< 200 chars)
    const firstPass = this.mergeVerySmallBlocks(sizedBlocks);

    // Second pass: merge small adjacent blocks with same parent
    const mergedBlocks = this.mergeSmallBlocks(firstPass);

    return mergedBlocks;
  }

  /**
   * Split text into sentences
   */
  static splitIntoSentences(text: string): string[] {
    return text.match(/[^.!?]+[.!?]+/g) || [text];
  }

  /**
   * Split a large block into smaller chunks
   */
  static splitLargeBlock(block: SemanticBlock): SemanticBlock[] {
    const chunks: SemanticBlock[] = [];
    const sentences = this.splitIntoSentences(block.content);

    let currentChunk = {
      ...block,
      content: '',
      elements: []
    };

    for (const sentence of sentences) {
      if ((currentChunk.content + sentence).length > CHUNK_CONSTANTS.MAX_CHUNK_SIZE) {
        if (currentChunk.content) {
          chunks.push(currentChunk);
          currentChunk = {
            ...block,
            content: '',
            elements: []
          };
        }
      }
      currentChunk.content += (currentChunk.content ? ' ' : '') + sentence;
    }

    if (currentChunk.content) {
      chunks.push(currentChunk);
    }

    return chunks;
  }

  /**
   * Merge very small blocks to avoid tiny chunks
   */
  static mergeVerySmallBlocks(blocks: SemanticBlock[]): SemanticBlock[] {
    const merged: SemanticBlock[] = [];
    let i = 0;

    while (i < blocks.length) {
      const current = blocks[i];
      if (!current) {
        i++;
        continue;
      }

      // If block is very small and not the last one
      if (current.content.length < CHUNK_CONSTANTS.VERY_SMALL_THRESHOLD && i < blocks.length - 1) {
        const next = blocks[i + 1];

        // Merge with next if combined size is reasonable
        if (next && current.content.length + next.content.length <= CHUNK_CONSTANTS.IDEAL_CHUNK_SIZE) {
          merged.push({
            ...current,
            content: current.content + '\n\n' + next.content,
            elements: [...(current.elements || []), ...(next.elements || [])],
            type: current.type === next.type ? current.type : 'mixed'
          });
          i += 2; // Skip next block since we merged it
          continue;
        }
      }

      // If block is very small and not the first one
      if (current.content.length < CHUNK_CONSTANTS.VERY_SMALL_THRESHOLD && i > 0 && merged.length > 0) {
        const prev = merged[merged.length - 1];

        // Merge with previous if combined size is reasonable
        if (prev && prev.content.length + current.content.length <= CHUNK_CONSTANTS.IDEAL_CHUNK_SIZE) {
          prev.content = prev.content + '\n\n' + current.content;
          prev.elements = [...(prev.elements || []), ...(current.elements || [])];
          if (prev.type !== current.type) {
            prev.type = 'mixed';
          }
          i++;
          continue;
        }
      }

      merged.push(current);
      i++;
    }

    return merged;
  }

  /**
   * Merge small adjacent blocks
   */
  static mergeSmallBlocks(blocks: SemanticBlock[]): SemanticBlock[] {
    const merged: SemanticBlock[] = [];
    let currentMerge: SemanticBlock | null = null;

    for (const block of blocks) {
      const blockSize = block.content.length;

      if (!currentMerge) {
        // Start with first block
        currentMerge = { ...block };
      } else {
        const mergedSize = currentMerge.content.length + block.content.length;
        const shouldMerge =
          // Only merge if both are small
          currentMerge.content.length < CHUNK_CONSTANTS.MIN_CHUNK_SIZE &&
          blockSize < CHUNK_CONSTANTS.MIN_CHUNK_SIZE &&
          // And they share the same parent heading
          currentMerge.parent_heading === block.parent_heading &&
          // And the result won't be too large
          mergedSize <= CHUNK_CONSTANTS.IDEAL_CHUNK_SIZE &&
          // Don't merge different types (preserve semantic boundaries)
          (currentMerge.type === block.type || currentMerge.type === 'mixed' || block.type === 'mixed');

        if (shouldMerge) {
          // Merge blocks
          currentMerge.content += '\n\n' + block.content;
          currentMerge.elements = [...(currentMerge.elements || []), ...(block.elements || [])];
          if (currentMerge.type !== block.type) {
            currentMerge.type = 'mixed';
          }
        } else {
          // Save current merge and start new one
          if (currentMerge.content.trim().length > 0) {
            merged.push(currentMerge);
          }
          currentMerge = { ...block };
        }
      }
    }

    // Add the last merge
    if (currentMerge && currentMerge.content.trim().length > 0) {
      merged.push(currentMerge);
    }

    return merged;
  }
}
