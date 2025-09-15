/**
 * Optimized Semantic Chunking System
 * Performance improvements addressing O(n²) complexity and memory usage
 */

export interface SemanticChunk {
  content: string;
  type: 'heading' | 'paragraph' | 'section' | 'list' | 'table' | 'code' | 'mixed';
  parent_heading: string;
  heading_hierarchy: string[];
  semantic_completeness: number;
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

interface ContentBlock {
  type: string;
  content: string;
  position: number;
  level?: number;
}

export class SemanticChunkerOptimized {
  private static readonly MIN_CHUNK_SIZE = 300;
  private static readonly MAX_CHUNK_SIZE = 2000;
  private static readonly IDEAL_CHUNK_SIZE = 1200;
  private static readonly OVERLAP_SIZE = 100;

  // Pre-compiled regex patterns for performance
  private static readonly PATTERNS = {
    heading: /<h([1-6])[^>]*>(.*?)<\/h\1>/gi,
    paragraph: /<p[^>]*>(.*?)<\/p>/gis,
    list: /<(ul|ol)[^>]*>.*?<\/\1>/gis,
    table: /<table[^>]*>.*?<\/table>/gis,
    code: /<(code|pre)[^>]*>.*?<\/\1>/gis,
    htmlTags: /<[^>]*>/g,
    whitespace: /\s+/g,
    sentence: /[^.!?]+[.!?]+/g,
    listItem: /^[\-\*•]\s|^\d+\.\s/,
    markdownHeading: /^#+/,
    questionAnswer: /^[QA]:/,
    codeBlock: /^```/
  };

  /**
   * Optimized content chunking with streaming approach for large documents
   */
  static async chunkContent(
    content: string,
    htmlContent?: string
  ): Promise<SemanticChunk[]> {
    // For very large documents, use streaming approach
    if (content.length > 50000) {
      return this.streamChunkLargeContent(content, htmlContent);
    }

    // Parse content structure efficiently
    const blocks = this.parseContentBlocks(content, htmlContent);
    
    // Apply size constraints with optimized merging
    const sizedChunks = this.applySizeConstraintsOptimized(blocks);
    
    // Add minimal overlaps for context
    const finalChunks = this.addMinimalOverlaps(sizedChunks);
    
    return finalChunks;
  }

  /**
   * Stream processing for large documents to avoid memory spikes
   */
  private static async streamChunkLargeContent(
    content: string,
    htmlContent?: string
  ): Promise<SemanticChunk[]> {
    const chunks: SemanticChunk[] = [];
    const STREAM_SIZE = 10000; // Process 10KB at a time
    let position = 0;
    let chunkIndex = 0;
    let previousOverlap = '';

    while (position < content.length) {
      const segment = content.slice(position, position + STREAM_SIZE);
      const lastSentenceEnd = this.findLastSentenceEnd(segment);
      const processSegment = segment.slice(0, lastSentenceEnd);
      
      if (processSegment.trim()) {
        const chunk: SemanticChunk = {
          content: previousOverlap + processSegment,
          type: 'mixed',
          parent_heading: '',
          heading_hierarchy: [],
          semantic_completeness: 0.7,
          boundary_type: 'natural',
          overlap_with_previous: previousOverlap,
          overlap_with_next: '',
          chunk_index: chunkIndex++,
          total_chunks: Math.ceil(content.length / STREAM_SIZE),
          metadata: this.calculateMetadataFast(processSegment)
        };
        
        chunks.push(chunk);
        previousOverlap = processSegment.slice(-Math.min(100, processSegment.length / 4));
      }
      
      position += lastSentenceEnd;
    }

    return chunks;
  }

  /**
   * Optimized content block parsing - O(n) complexity
   */
  private static parseContentBlocks(content: string, htmlContent?: string): ContentBlock[] {
    const blocks: ContentBlock[] = [];
    
    if (htmlContent) {
      // Single-pass HTML parsing
      this.parseHtmlEfficiently(htmlContent, blocks);
    } else {
      // Single-pass text parsing
      this.parseTextEfficiently(content, blocks);
    }

    // Sort once at the end
    blocks.sort((a, b) => a.position - b.position);
    
    return blocks;
  }

  /**
   * Efficient HTML parsing with single regex execution
   */
  private static parseHtmlEfficiently(html: string, blocks: ContentBlock[]): void {
    // Use a single combined regex for all block elements
    const blockRegex = /<(h[1-6]|p|ul|ol|table|code|pre)(?:\s[^>]*)?>.*?<\/\1>/gis;
    let match;
    
    while ((match = blockRegex.exec(html)) !== null) {
      const tag = match[1]?.toLowerCase();
      const content = this.stripHtmlFast(match[0]);
      
      if (content.trim() && tag) {
        blocks.push({
          type: this.mapTagToType(tag),
          content,
          position: match.index,
          level: tag?.startsWith('h') ? parseInt(tag[1] || '1') : undefined
        });
      }
    }
  }

  /**
   * Efficient text parsing with linear scan
   */
  private static parseTextEfficiently(text: string, blocks: ContentBlock[]): void {
    const lines = text.split('\n');
    let currentBlock: ContentBlock | null = null;
    let position = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      position += line.length + 1;

      if (!trimmed) {
        // Empty line - save current block if exists
        if (currentBlock && currentBlock.content.trim()) {
          blocks.push(currentBlock);
          currentBlock = null;
        }
        continue;
      }

      // Detect block type
      if (this.PATTERNS.markdownHeading.test(trimmed)) {
        // Save previous block
        if (currentBlock) blocks.push(currentBlock);
        
        const level = trimmed.match(this.PATTERNS.markdownHeading)![0].length;
        currentBlock = {
          type: 'heading',
          content: trimmed.replace(this.PATTERNS.markdownHeading, '').trim(),
          position,
          level
        };
      } else if (this.PATTERNS.questionAnswer.test(trimmed)) {
        // Q&A format
        if (currentBlock) blocks.push(currentBlock);
        currentBlock = {
          type: 'paragraph',
          content: trimmed,
          position
        };
      } else if (this.PATTERNS.listItem.test(trimmed)) {
        // List item
        if (currentBlock?.type !== 'list') {
          if (currentBlock) blocks.push(currentBlock);
          currentBlock = {
            type: 'list',
            content: trimmed,
            position
          };
        } else {
          currentBlock.content += '\n' + trimmed;
        }
      } else {
        // Regular paragraph
        if (currentBlock?.type === 'paragraph') {
          currentBlock.content += ' ' + trimmed;
        } else {
          if (currentBlock) blocks.push(currentBlock);
          currentBlock = {
            type: 'paragraph',
            content: trimmed,
            position
          };
        }
      }
    }

    // Add final block
    if (currentBlock && currentBlock.content.trim()) {
      blocks.push(currentBlock);
    }
  }

  /**
   * Optimized size constraint application
   */
  private static applySizeConstraintsOptimized(blocks: ContentBlock[]): SemanticChunk[] {
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
      if (currentSize + blockSize > this.MAX_CHUNK_SIZE && currentChunk.length > 0) {
        // Save current chunk
        chunks.push(this.createChunkFromBlocks(currentChunk, headingHierarchy, chunks.length));
        currentChunk = [];
        currentSize = 0;
      }

      currentChunk.push(block);
      currentSize += blockSize;

      // If chunk is in ideal range and has a natural boundary, save it
      if (currentSize >= this.IDEAL_CHUNK_SIZE && block.type === 'heading') {
        chunks.push(this.createChunkFromBlocks(currentChunk, headingHierarchy, chunks.length));
        currentChunk = [];
        currentSize = 0;
      }
    }

    // Add remaining blocks
    if (currentChunk.length > 0) {
      chunks.push(this.createChunkFromBlocks(currentChunk, headingHierarchy, chunks.length));
    }

    return chunks;
  }

  /**
   * Create chunk from blocks efficiently
   */
  private static createChunkFromBlocks(
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
      semantic_completeness: this.calculateCompleteness(content, type),
      boundary_type: 'natural',
      overlap_with_previous: '',
      overlap_with_next: '',
      chunk_index: index,
      total_chunks: 0, // Will be updated
      metadata: this.calculateMetadataFast(content)
    };
  }

  /**
   * Add minimal overlaps for context preservation
   */
  private static addMinimalOverlaps(chunks: SemanticChunk[]): SemanticChunk[] {
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

  /**
   * Fast HTML stripping
   */
  private static stripHtmlFast(html: string): string {
    return html.replace(this.PATTERNS.htmlTags, ' ').replace(this.PATTERNS.whitespace, ' ').trim();
  }

  /**
   * Fast metadata calculation
   */
  private static calculateMetadataFast(content: string): SemanticChunk['metadata'] {
    return {
      has_complete_sentences: /[.!?]$/.test(content.trim()),
      word_count: content.split(/\s+/).filter(Boolean).length,
      char_count: content.length,
      contains_list: this.PATTERNS.listItem.test(content),
      contains_code: content.includes('```') || content.includes('<code'),
      contains_table: content.includes('<table') || content.includes('|')
    };
  }

  /**
   * Calculate semantic completeness score
   */
  private static calculateCompleteness(content: string, type: string): number {
    let score = 0.5;

    // Complete sentences
    if (/[.!?]$/.test(content.trim())) score += 0.2;

    // Good length
    const ratio = content.length / this.IDEAL_CHUNK_SIZE;
    if (ratio >= 0.3 && ratio <= 1.5) {
      score += 0.2 * (1 - Math.abs(1 - ratio));
    }

    // Type coherence
    if (type !== 'mixed') score += 0.1;

    return Math.min(score, 1.0);
  }

  /**
   * Find last complete sentence boundary
   */
  private static findLastSentenceEnd(text: string): number {
    const lastPeriod = text.lastIndexOf('.');
    const lastQuestion = text.lastIndexOf('?');
    const lastExclamation = text.lastIndexOf('!');
    
    const lastEnd = Math.max(lastPeriod, lastQuestion, lastExclamation);
    
    return lastEnd > 0 ? lastEnd + 1 : text.length;
  }

  /**
   * Map HTML tag to content type
   */
  private static mapTagToType(tag: string): string {
    if (tag.startsWith('h')) return 'heading';
    if (tag === 'p') return 'paragraph';
    if (tag === 'ul' || tag === 'ol') return 'list';
    if (tag === 'table') return 'table';
    if (tag === 'code' || tag === 'pre') return 'code';
    return 'mixed';
  }
}