/**
 * JavaScript version of SemanticChunker for use in scraper-worker.js
 * Intelligent content splitting with semantic boundaries
 */

class SemanticChunker {
  static chunkContent(textContent, htmlContent = null, options = {}) {
    const {
      minChunkSize = 300,
      maxChunkSize = 2000,
      targetChunkSize = 1000,
      overlapSize = 100
    } = options;
    
    // If we have HTML, try to use structure-aware chunking
    if (htmlContent) {
      try {
        return this.htmlAwareChunking(htmlContent, {
          minChunkSize,
          maxChunkSize,
          targetChunkSize,
          overlapSize
        });
      } catch (error) {
        console.error('HTML chunking failed, falling back to text chunking:', error);
      }
    }
    
    // Fallback to text-based semantic chunking
    return this.textSemanticChunking(textContent, {
      minChunkSize,
      maxChunkSize,
      targetChunkSize,
      overlapSize
    });
  }
  
  static htmlAwareChunking(html, options) {
    const cheerio = require('cheerio');
    const $ = cheerio.load(html);
    const chunks = [];
    
    // Remove script and style elements
    $('script, style, nav, footer, header').remove();
    
    // Process main content sections
    const sections = [];
    
    // Try to find semantic sections
    $('article, section, main, .content, #content').each((i, elem) => {
      const text = $(elem).text().trim();
      if (text.length > 50) {
        sections.push({
          text,
          type: 'section',
          heading: $(elem).find('h1, h2, h3').first().text() || null
        });
      }
    });
    
    // If no semantic sections found, process by headings
    if (sections.length === 0) {
      let currentSection = { text: '', heading: null };
      
      $('body *').each((i, elem) => {
        const tagName = elem.name;
        const text = $(elem).clone().children().remove().end().text().trim();
        
        if (/^h[1-6]$/.test(tagName)) {
          // Save previous section if it has content
          if (currentSection.text.length > 50) {
            sections.push(currentSection);
          }
          // Start new section
          currentSection = {
            text: '',
            heading: text,
            type: 'heading-section'
          };
        } else if (text) {
          currentSection.text += ' ' + text;
        }
      });
      
      // Don't forget the last section
      if (currentSection.text.length > 50) {
        sections.push(currentSection);
      }
    }
    
    // Convert sections to chunks with proper sizing
    sections.forEach((section, index) => {
      const sectionChunks = this.splitIntoSizedChunks(
        section.text,
        options.targetChunkSize,
        options.maxChunkSize
      );
      
      sectionChunks.forEach((chunkText, chunkIndex) => {
        // Add overlap with previous chunk
        let overlap_with_previous = '';
        if (chunks.length > 0) {
          const prevChunk = chunks[chunks.length - 1];
          overlap_with_previous = prevChunk.content.slice(-options.overlapSize);
        }
        
        chunks.push({
          content: chunkText,
          type: section.type || 'paragraph',
          parent_heading: section.heading,
          semantic_completeness: this.calculateCompleteness(chunkText),
          boundary_type: chunkIndex === 0 ? 'natural' : 'forced',
          overlap_with_previous,
          overlap_with_next: '', // Will be set for previous chunk
          metadata: {
            char_count: chunkText.length,
            word_count: chunkText.split(/\s+/).length,
            sentence_count: (chunkText.match(/[.!?]+/g) || []).length,
            has_code: /```|<code>/.test(chunkText),
            has_list: /^\s*[-*•]\s+/m.test(chunkText)
          }
        });
        
        // Update previous chunk's overlap_with_next
        if (chunks.length > 1) {
          chunks[chunks.length - 2].overlap_with_next = chunkText.slice(0, options.overlapSize);
        }
      });
    });
    
    return chunks.length > 0 ? chunks : this.textSemanticChunking($.text(), options);
  }
  
  static textSemanticChunking(text, options) {
    const chunks = [];
    
    // Split by natural boundaries
    const paragraphs = this.splitByParagraphs(text);
    let currentChunk = '';
    let currentHeading = null;
    
    paragraphs.forEach((para, index) => {
      // Check if this looks like a heading
      if (this.isLikelyHeading(para)) {
        // Save current chunk if it exists
        if (currentChunk.trim().length > options.minChunkSize) {
          chunks.push(this.createChunk(currentChunk, currentHeading, chunks, options.overlapSize));
        }
        currentChunk = '';
        currentHeading = para;
      }
      
      // Check if adding this paragraph would exceed max size
      if (currentChunk.length + para.length > options.maxChunkSize && currentChunk.length > options.minChunkSize) {
        // Save current chunk
        chunks.push(this.createChunk(currentChunk, currentHeading, chunks, options.overlapSize));
        // Start new chunk with overlap
        currentChunk = currentChunk.slice(-options.overlapSize) + ' ' + para;
      } else {
        // Add to current chunk
        currentChunk += (currentChunk ? '\n\n' : '') + para;
      }
    });
    
    // Don't forget the last chunk
    if (currentChunk.trim().length > 50) {
      chunks.push(this.createChunk(currentChunk, currentHeading, chunks, options.overlapSize));
    }
    
    // Update overlap_with_next for all chunks
    chunks.forEach((chunk, i) => {
      if (i < chunks.length - 1) {
        chunk.overlap_with_next = chunks[i + 1].content.slice(0, options.overlapSize);
      }
    });
    
    return chunks;
  }
  
  static splitByParagraphs(text) {
    // Split by double newlines, but preserve some structure
    const paragraphs = text.split(/\n\s*\n+/)
      .map(p => p.trim())
      .filter(p => p.length > 0);
    
    // Further split very long paragraphs at sentence boundaries
    const result = [];
    paragraphs.forEach(para => {
      if (para.length > 1500) {
        const sentences = para.match(/[^.!?]+[.!?]+/g) || [para];
        let temp = '';
        sentences.forEach(sent => {
          if (temp.length + sent.length > 1000 && temp) {
            result.push(temp.trim());
            temp = sent;
          } else {
            temp += ' ' + sent;
          }
        });
        if (temp.trim()) result.push(temp.trim());
      } else {
        result.push(para);
      }
    });
    
    return result;
  }
  
  static splitIntoSizedChunks(text, targetSize, maxSize) {
    if (text.length <= maxSize) {
      return [text];
    }
    
    const chunks = [];
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    let currentChunk = '';
    
    sentences.forEach(sentence => {
      if (currentChunk.length + sentence.length > targetSize && currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += ' ' + sentence;
      }
    });
    
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }
  
  static isLikelyHeading(text) {
    // Heuristics for detecting headings
    if (text.length > 200) return false; // Too long for a heading
    if (text.endsWith(':')) return true; // Often indicates a heading
    if (/^(Chapter|Section|Part)\s+\d+/i.test(text)) return true;
    if (/^[A-Z][^.!?]*$/.test(text) && text.length < 100) return true; // All caps or title case, no punctuation
    if (/^\d+\.?\s+[A-Z]/.test(text)) return true; // Numbered heading
    return false;
  }
  
  static createChunk(content, heading, existingChunks, overlapSize) {
    const overlap_with_previous = existingChunks.length > 0 
      ? existingChunks[existingChunks.length - 1].content.slice(-overlapSize)
      : '';
    
    return {
      content: content.trim(),
      type: this.detectChunkType(content),
      parent_heading: heading,
      semantic_completeness: this.calculateCompleteness(content),
      boundary_type: 'natural',
      overlap_with_previous,
      overlap_with_next: '', // Will be updated later
      metadata: {
        char_count: content.length,
        word_count: content.split(/\s+/).length,
        sentence_count: (content.match(/[.!?]+/g) || []).length,
        has_code: /```|<code>|\bfunction\b|\bclass\b/.test(content),
        has_list: /^\s*[-*•]\s+/m.test(content) || /^\s*\d+\.\s+/m.test(content)
      }
    };
  }
  
  static detectChunkType(content) {
    if (/^\s*[-*•]\s+/m.test(content) || /^\s*\d+\.\s+/m.test(content)) return 'list';
    if (/```|<code>|\bfunction\b|\bclass\b/.test(content)) return 'code';
    if (/\|.*\|.*\|/m.test(content)) return 'table';
    if (/^(Q:|Question:)/mi.test(content)) return 'qa';
    if (/^(Chapter|Section|Part)\s+\d+/i.test(content)) return 'section';
    return 'paragraph';
  }
  
  static calculateCompleteness(content) {
    // Score how semantically complete a chunk is
    let score = 0.5; // Base score
    
    // Complete sentences boost score
    const sentences = content.match(/[.!?]+/g) || [];
    if (sentences.length > 0) score += 0.2;
    
    // Has both opening and closing context
    if (content.length > 200) score += 0.1;
    
    // Contains a complete thought (paragraph)
    if (/\n\n/.test(content)) score += 0.1;
    
    // Penalize if it starts mid-sentence (lowercase start)
    if (/^[a-z]/.test(content)) score -= 0.2;
    
    // Penalize if it ends mid-sentence (no punctuation)
    if (!/[.!?]$/.test(content)) score -= 0.1;
    
    return Math.max(0, Math.min(1, score));
  }
  
  // Backward compatibility method
  static smartChunk(text, options = {}) {
    const chunks = this.chunkContent(text, null, {
      targetChunkSize: options.maxChunkSize || 1500,
      overlapSize: options.overlap || 100
    });
    
    // Return just the content strings for backward compatibility
    return chunks.map(chunk => chunk.content);
  }
}

module.exports = { SemanticChunker };