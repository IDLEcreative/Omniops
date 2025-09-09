/**
 * Semantic Chunking System
 * Intelligently splits content at natural boundaries while preserving context
 */

export interface SemanticChunk {
  content: string;
  type: 'heading' | 'paragraph' | 'section' | 'list' | 'table' | 'code' | 'mixed';
  parent_heading: string;
  heading_hierarchy: string[];
  semantic_completeness: number; // 0-1 score
  boundary_type: 'natural' | 'forced' | 'overlap';
  overlap_with_previous: string;
  overlap_with_next: string;
  chunk_index: number;
  total_chunks: number;
  metadata: {
    has_complete_sentences: boolean;
    word_count: number;
    char_count: number;
    contains_list: boolean;
    contains_code: boolean;
    contains_table: boolean;
  };
}

export class SemanticChunker {
  private static readonly MIN_CHUNK_SIZE = 300;  // Reduced to allow smaller semantic units
  private static readonly MAX_CHUNK_SIZE = 2000;
  private static readonly IDEAL_CHUNK_SIZE = 1200;
  private static readonly OVERLAP_SIZE = 100;  // Slightly smaller overlaps

  /**
   * Split content into semantic chunks
   */
  static async chunkContent(
    content: string,
    htmlContent?: string
  ): Promise<SemanticChunk[]> {
    // Parse content structure
    const structure = this.parseContentStructure(content, htmlContent);
    
    // Create initial semantic blocks
    const blocks = this.createSemanticBlocks(structure);
    
    // Merge or split blocks to meet size constraints
    const sizedChunks = this.applySizeConstraints(blocks);
    
    // Add overlaps for context preservation
    const chunksWithOverlap = this.addOverlaps(sizedChunks);
    
    // Calculate semantic completeness scores
    const finalChunks = this.scoreCompleteness(chunksWithOverlap);
    
    return finalChunks;
  }

  /**
   * Parse content to identify structure
   */
  private static parseContentStructure(
    content: string,
    htmlContent?: string
  ): ContentStructure {
    const structure: ContentStructure = {
      headings: [],
      paragraphs: [],
      lists: [],
      tables: [],
      codeBlocks: []
    };

    if (htmlContent) {
      // Parse HTML structure
      const headingRegex = /<h([1-6])[^>]*>(.*?)<\/h\1>/gi;
      let match;
      while ((match = headingRegex.exec(htmlContent)) !== null) {
        structure.headings.push({
          level: parseInt(match[1]),
          text: this.stripHtml(match[2]),
          position: match.index
        });
      }

      // Find paragraphs
      const paraRegex = /<p[^>]*>(.*?)<\/p>/gis;
      while ((match = paraRegex.exec(htmlContent)) !== null) {
        const content = this.stripHtml(match[1]);
        if (content.trim()) {
          structure.paragraphs.push({
            content,
            position: match.index
          });
        }
      }

      // Find lists
      const listRegex = /<(ul|ol)[^>]*>.*?<\/\1>/gis;
      while ((match = listRegex.exec(htmlContent)) !== null) {
        structure.lists.push({
          content: this.stripHtml(match[0]),
          position: match.index,
          type: match[1] as 'ul' | 'ol'
        });
      }

      // Find tables
      const tableRegex = /<table[^>]*>.*?<\/table>/gis;
      while ((match = tableRegex.exec(htmlContent)) !== null) {
        structure.tables.push({
          content: this.stripHtml(match[0]),
          position: match.index
        });
      }

      // Find code blocks
      const codeRegex = /<(code|pre)[^>]*>.*?<\/\1>/gis;
      while ((match = codeRegex.exec(htmlContent)) !== null) {
        structure.codeBlocks.push({
          content: this.stripHtml(match[0]),
          position: match.index
        });
      }
    } else {
      // Improved text-based parsing
      const lines = content.split('\n');
      let currentParagraph = [];
      let currentList = [];
      let isInList = false;
      let position = 0;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        position += line.length + 1;
        
        // Detect markdown headings
        if (trimmed.startsWith('#')) {
          // Save current paragraph if exists
          if (currentParagraph.length > 0) {
            structure.paragraphs.push({
              content: currentParagraph.join(' '),
              position: position - currentParagraph.join(' ').length
            });
            currentParagraph = [];
          }
          // Save current list if exists
          if (currentList.length > 0) {
            structure.lists.push({
              content: currentList.join('\n'),
              position: position - currentList.join('\n').length,
              type: 'ul'
            });
            currentList = [];
            isInList = false;
          }
          
          const level = trimmed.match(/^#+/)[0].length;
          const text = trimmed.replace(/^#+\s*/, '');
          structure.headings.push({
            level,
            text,
            position: position - line.length
          });
        }
        // Detect Q&A format - treat Q: as a heading-like boundary
        else if (trimmed.startsWith('Q:')) {
          // Save current content
          if (currentParagraph.length > 0) {
            structure.paragraphs.push({
              content: currentParagraph.join(' '),
              position: position - currentParagraph.join(' ').length
            });
            currentParagraph = [];
          }
          if (currentList.length > 0) {
            structure.lists.push({
              content: currentList.join('\n'),
              position: position - currentList.join('\n').length,
              type: 'ul'
            });
            currentList = [];
            isInList = false;
          }
          
          // Treat Q: as a pseudo-heading for better chunking
          structure.headings.push({
            level: 3, // Treat Q&A as level 3 headings
            text: trimmed,
            position: position - line.length
          });
        }
        else if (trimmed.startsWith('A:')) {
          currentParagraph.push(trimmed);
        }
        // Detect list items
        else if (/^[\-\*•]\s/.test(trimmed) || /^\d+\.\s/.test(trimmed)) {
          // Save current paragraph if exists
          if (currentParagraph.length > 0) {
            structure.paragraphs.push({
              content: currentParagraph.join(' '),
              position: position - currentParagraph.join(' ').length
            });
            currentParagraph = [];
          }
          isInList = true;
          currentList.push(trimmed);
        }
        // Detect code blocks
        else if (trimmed.startsWith('```')) {
          // Find end of code block
          let codeContent = [];
          let j = i + 1;
          while (j < lines.length && !lines[j].trim().startsWith('```')) {
            codeContent.push(lines[j]);
            j++;
          }
          if (j < lines.length) {
            structure.codeBlocks.push({
              content: codeContent.join('\n'),
              position
            });
            i = j; // Skip to end of code block
          }
        }
        // Regular paragraph text
        else if (trimmed.length > 0) {
          // End list if we were in one
          if (isInList && currentList.length > 0) {
            structure.lists.push({
              content: currentList.join('\n'),
              position: position - currentList.join('\n').length,
              type: 'ul'
            });
            currentList = [];
            isInList = false;
          }
          currentParagraph.push(trimmed);
        }
        // Empty line - end of paragraph or list
        else {
          if (currentParagraph.length > 0) {
            structure.paragraphs.push({
              content: currentParagraph.join(' '),
              position: position - currentParagraph.join(' ').length
            });
            currentParagraph = [];
          }
          if (currentList.length > 0) {
            structure.lists.push({
              content: currentList.join('\n'),
              position: position - currentList.join('\n').length,
              type: 'ul'
            });
            currentList = [];
            isInList = false;
          }
        }
      }
      
      // Add remaining content
      if (currentParagraph.length > 0) {
        structure.paragraphs.push({
          content: currentParagraph.join(' '),
          position
        });
      }
      if (currentList.length > 0) {
        structure.lists.push({
          content: currentList.join('\n'),
          position,
          type: 'ul'
        });
      }
    }

    return structure;
  }

  /**
   * Create semantic blocks from structure
   */
  private static createSemanticBlocks(structure: ContentStructure): SemanticBlock[] {
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
        
        currentBlock.elements.push(element);
        const elementContent = this.getElementContent(element);
        if (elementContent) {
          // Add proper spacing
          if (currentBlock.content && !currentBlock.content.endsWith('\n')) {
            currentBlock.content += '\n';
          }
          currentBlock.content += elementContent;
          
          // Update type based on dominant element type
          if (element.type === 'list' && currentBlock.elements.filter(e => e.type === 'list').length > 
              currentBlock.elements.filter(e => e.type === 'paragraph').length) {
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
  private static applySizeConstraints(blocks: SemanticBlock[]): SemanticBlock[] {
    const sizedBlocks: SemanticBlock[] = [];

    for (const block of blocks) {
      const blockSize = block.content.length;

      if (blockSize <= this.MAX_CHUNK_SIZE) {
        // Block is within size limits
        sizedBlocks.push(block);
      } else {
        // Split large block
        const splits = this.splitLargeBlock(block);
        sizedBlocks.push(...splits);
      }
    }

    // First pass: merge very small blocks (< 200 chars)
    let firstPass = this.mergeVerySmallBlocks(sizedBlocks);
    
    // Second pass: merge small adjacent blocks with same parent
    const mergedBlocks = this.mergeSmallBlocks(firstPass);

    return mergedBlocks;
  }

  /**
   * Merge very small blocks to avoid tiny chunks
   */
  private static mergeVerySmallBlocks(blocks: SemanticBlock[]): SemanticBlock[] {
    const merged: SemanticBlock[] = [];
    let i = 0;
    
    while (i < blocks.length) {
      const current = blocks[i];
      
      // If block is very small and not the last one
      if (current.content.length < 200 && i < blocks.length - 1) {
        const next = blocks[i + 1];
        
        // Merge with next if combined size is reasonable
        if (current.content.length + next.content.length <= this.IDEAL_CHUNK_SIZE) {
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
      if (current.content.length < 200 && i > 0 && merged.length > 0) {
        const prev = merged[merged.length - 1];
        
        // Merge with previous if combined size is reasonable
        if (prev.content.length + current.content.length <= this.IDEAL_CHUNK_SIZE) {
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
   * Split a large block into smaller chunks
   */
  private static splitLargeBlock(block: SemanticBlock): SemanticBlock[] {
    const chunks: SemanticBlock[] = [];
    const sentences = this.splitIntoSentences(block.content);
    
    let currentChunk = {
      ...block,
      content: '',
      elements: []
    };
    
    for (const sentence of sentences) {
      if ((currentChunk.content + sentence).length > this.MAX_CHUNK_SIZE) {
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
   * Merge small adjacent blocks
   */
  private static mergeSmallBlocks(blocks: SemanticBlock[]): SemanticBlock[] {
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
          currentMerge.content.length < this.MIN_CHUNK_SIZE &&
          blockSize < this.MIN_CHUNK_SIZE &&
          // And they share the same parent heading
          currentMerge.parent_heading === block.parent_heading &&
          // And the result won't be too large
          mergedSize <= this.IDEAL_CHUNK_SIZE &&
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

  /**
   * Add overlaps between chunks
   */
  private static addOverlaps(blocks: SemanticBlock[]): SemanticChunk[] {
    const chunks: SemanticChunk[] = [];

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const prevBlock = blocks[i - 1];
      const nextBlock = blocks[i + 1];

      let chunkContent = block.content;
      let overlapPrevious = '';
      let overlapNext = '';

      // Add overlap with previous chunk (last N chars of previous content)
      if (prevBlock && prevBlock.content.length > 0) {
        const prevContent = prevBlock.content.trim();
        const overlapLength = Math.min(this.OVERLAP_SIZE, prevContent.length);
        overlapPrevious = prevContent.slice(-overlapLength);
        
        // Add context from previous chunk to beginning of current chunk for continuity
        if (overlapPrevious && i > 0) {
          chunkContent = `[...${overlapPrevious.slice(-50)}]\n\n${chunkContent}`;
        }
      }

      // Add overlap with next chunk (first N chars of next content)
      if (nextBlock && nextBlock.content.length > 0) {
        const nextContent = nextBlock.content.trim();
        const overlapLength = Math.min(this.OVERLAP_SIZE, nextContent.length);
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
  private static scoreCompleteness(chunks: SemanticChunk[]): SemanticChunk[] {
    return chunks.map(chunk => {
      let score = 0.4; // Base score

      // Complete sentences boost
      if (chunk.metadata.has_complete_sentences) score += 0.15;

      // Good size boost (more lenient)
      const sizeRatio = chunk.metadata.char_count / this.IDEAL_CHUNK_SIZE;
      if (sizeRatio >= 0.2 && sizeRatio <= 2.0) {
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

  /**
   * Helper: Strip HTML tags
   */
  private static stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  /**
   * Helper: Get element content
   */
  private static getElementContent(element: any): string {
    if (element.type === 'heading') return element.text;
    if (element.type === 'paragraph') return element.content;
    if (element.type === 'list') return element.content;
    if (element.type === 'table') return element.content;
    if (element.type === 'code') return element.content;
    return element.content || '';
  }

  /**
   * Helper: Split text into sentences
   */
  private static splitIntoSentences(text: string): string[] {
    // Simple sentence splitter - can be improved
    return text.match(/[^.!?]+[.!?]+/g) || [text];
  }

  /**
   * Helper: Check if text has complete sentences
   */
  private static hasCompleteSentences(text: string): boolean {
    return /[.!?]$/.test(text.trim());
  }

  /**
   * Helper: Map block type to chunk type
   */
  private static mapBlockType(type: string): SemanticChunk['type'] {
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
}

// Type definitions
interface ContentStructure {
  headings: Array<{ level: number; text: string; position: number }>;
  paragraphs: Array<{ content: string; position: number }>;
  lists: Array<{ content: string; position: number; type: 'ul' | 'ol' }>;
  tables: Array<{ content: string; position: number }>;
  codeBlocks: Array<{ content: string; position: number }>;
}

interface SemanticBlock {
  content: string;
  type: string;
  parent_heading: string;
  heading_hierarchy: string[];
  elements?: any[];
}