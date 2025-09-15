/**
 * Enhanced Metadata Extraction for Embeddings
 * Extracts rich contextual information from content for improved search relevance
 */

export type ContentType = 'product' | 'faq' | 'documentation' | 'blog' | 'support' | 'general';

export interface EnhancedEmbeddingMetadata {
  // Core fields (existing)
  url: string;
  title: string;
  chunk_index: number;
  total_chunks: number;
  
  // Content classification
  content_type: ContentType;
  content_category?: string;
  
  // Contextual information
  section_title?: string;
  keywords: string[];
  entities: {
    products?: string[];
    brands?: string[];
    models?: string[];
    skus?: string[];
  };
  
  // Temporal information
  content_date?: string;
  indexed_at: string;
  last_modified?: string;
  
  // Quality signals
  word_count: number;
  has_structured_data: boolean;
  language: string;
  readability_score?: number;
  
  // Domain-specific (e-commerce)
  price_range?: {
    min: number;
    max: number;
    currency: string;
  };
  availability?: 'in_stock' | 'out_of_stock' | 'preorder' | 'discontinued';
  ratings?: {
    value: number;
    count: number;
  };
  
  // Contact information
  contact_info?: {
    email?: string;
    phone?: string;
    address?: string;
  };
  
  // Q&A pairs for FAQ content
  qa_pairs?: Array<{
    question: string;
    answer: string;
  }>;
}

export class MetadataExtractor {
  private static readonly STOP_WORDS = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'to', 'of', 'in', 'on', 'for', 
    'with', 'at', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
    'it', 'this', 'that', 'as', 'about', 'what', 'which', 'who', 'when',
    'where', 'how', 'why', 'you', 'your', 'we', 'our', 'they', 'their'
  ]);

  /**
   * Extract enhanced metadata from content chunk
   */
  static async extractEnhancedMetadata(
    chunk: string,
    fullContent: string,
    url: string,
    title: string,
    chunkIndex: number,
    totalChunks: number,
    htmlContent?: string
  ): Promise<EnhancedEmbeddingMetadata> {
    // Determine content type first
    const contentType = this.classifyContent(chunk, url, title);
    
    return {
      // Core fields
      url,
      title,
      chunk_index: chunkIndex,
      total_chunks: totalChunks,
      
      // Content classification
      content_type: contentType,
      content_category: this.extractCategory(url, title, chunk),
      
      // Contextual information
      section_title: this.findSectionHeading(fullContent, chunkIndex),
      keywords: this.extractKeywords(chunk, 10),
      entities: this.extractEntities(chunk),
      
      // Temporal information
      content_date: this.extractDate(fullContent, htmlContent),
      indexed_at: new Date().toISOString(),
      last_modified: undefined, // Can be set from HTTP headers
      
      // Quality signals
      word_count: chunk.split(/\s+/).filter(w => w.length > 0).length,
      has_structured_data: this.hasStructuredData(htmlContent || fullContent),
      language: this.detectLanguage(chunk),
      readability_score: this.calculateReadability(chunk),
      
      // Domain-specific
      ...this.extractEcommerceData(chunk, fullContent, htmlContent),
      
      // Contact information
      contact_info: this.extractContactInfo(chunk),
      
      // Q&A pairs (for FAQ content)
      qa_pairs: contentType === 'faq' ? this.extractQAPairs(fullContent) : undefined
    };
  }

  /**
   * Classify content type based on patterns and signals
   */
  private static classifyContent(chunk: string, url: string, title: string): ContentType {
    const lowerChunk = chunk.toLowerCase();
    const lowerUrl = url.toLowerCase();
    const lowerTitle = title.toLowerCase();
    
    // URL-based classification
    if (lowerUrl.includes('/product') || lowerUrl.includes('/item') || lowerUrl.includes('/shop')) {
      return 'product';
    }
    if (lowerUrl.includes('/faq') || lowerUrl.includes('/questions')) {
      return 'faq';
    }
    if (lowerUrl.includes('/docs') || lowerUrl.includes('/guide') || lowerUrl.includes('/manual')) {
      return 'documentation';
    }
    if (lowerUrl.includes('/blog') || lowerUrl.includes('/news') || lowerUrl.includes('/article')) {
      return 'blog';
    }
    if (lowerUrl.includes('/support') || lowerUrl.includes('/help') || lowerUrl.includes('/contact')) {
      return 'support';
    }
    
    // Content-based classification
    const productSignals = [
      /\$[\d,]+(\.\d{2})?/g,  // Price patterns
      /price|cost|buy|purchase|order|cart|shipping/i,
      /in stock|out of stock|available|availability/i,
      /sku|model|part number|item/i
    ];
    
    const faqSignals = [
      /\?[\s\n]*$/gm,  // Questions
      /^q:|^a:|question:|answer:/im,
      /how to|what is|why does|when should/i,
      /frequently asked|common questions/i
    ];
    
    const docSignals = [
      /installation|configuration|setup|tutorial/i,
      /step \d|procedure|instructions/i,
      /requirement|prerequisite|specification/i
    ];
    
    // Count signals
    const productScore = productSignals.filter(pattern => pattern.test(lowerChunk)).length;
    const faqScore = faqSignals.filter(pattern => pattern.test(lowerChunk)).length;
    const docScore = docSignals.filter(pattern => pattern.test(lowerChunk)).length;
    
    // Return highest scoring type
    if (productScore >= 2) return 'product';
    if (faqScore >= 2) return 'faq';
    if (docScore >= 2) return 'documentation';
    
    // Check title for additional hints
    if (lowerTitle.includes('product') || lowerTitle.includes('shop')) return 'product';
    if (lowerTitle.includes('faq') || lowerTitle.includes('question')) return 'faq';
    if (lowerTitle.includes('guide') || lowerTitle.includes('documentation')) return 'documentation';
    if (lowerTitle.includes('blog') || lowerTitle.includes('article')) return 'blog';
    
    return 'general';
  }

  /**
   * Extract category from URL path and content
   */
  private static extractCategory(url: string, title: string, chunk: string): string | undefined {
    // Extract from URL path
    const urlParts = url.split('/').filter(p => p && !p.includes('.'));
    const categoryPatterns = [
      'automotive', 'electronics', 'clothing', 'tools', 'parts', 'accessories',
      'equipment', 'supplies', 'components', 'hardware', 'software'
    ];
    
    for (const part of urlParts) {
      for (const pattern of categoryPatterns) {
        if (part.toLowerCase().includes(pattern)) {
          return part.toLowerCase().replace(/-/g, ' ');
        }
      }
    }
    
    // Extract from title
    const titleLower = title.toLowerCase();
    for (const pattern of categoryPatterns) {
      if (titleLower.includes(pattern)) {
        return pattern;
      }
    }
    
    return undefined;
  }

  /**
   * Extract top keywords using TF-IDF-like scoring
   */
  private static extractKeywords(text: string, limit: number = 10): string[] {
    // Tokenize and clean
    const words = text.toLowerCase()
      .replace(/[^\w\s-]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 3 && !this.STOP_WORDS.has(w));
    
    // Count frequencies
    const frequencies = new Map<string, number>();
    for (const word of words) {
      frequencies.set(word, (frequencies.get(word) || 0) + 1);
    }
    
    // Sort by frequency and return top keywords
    return Array.from(frequencies.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([word]) => word);
  }

  /**
   * Extract named entities (products, brands, models, SKUs)
   */
  private static extractEntities(text: string): EnhancedEmbeddingMetadata['entities'] {
    const entities: EnhancedEmbeddingMetadata['entities'] = {};
    
    // SKU patterns (e.g., DC66-10P, ABC-123, SKU12345)
    const skuPattern = /\b(?:[A-Z]{2,}[\-\/]?[\d]{2,}[\w\-]*|SKU[\s]?[\d]+)\b/gi;
    const skus = text.match(skuPattern);
    if (skus) {
      entities.skus = [...new Set(skus.map(s => s.toUpperCase()))];
    }
    
    // Model numbers (e.g., Model 2000, XR-500)
    const modelPattern = /\b(?:model\s+)?([A-Z]{1,}[\-]?[\d]{2,}[\w\-]*)\b/gi;
    const models = [];
    let match;
    while ((match = modelPattern.exec(text)) !== null) {
      if (match[1]) {
        models.push(match[1].toUpperCase());
      }
    }
    if (models.length > 0) {
      entities.models = [...new Set(models)];
    }
    
    // Common brand detection (expand this list based on domain)
    const brandPatterns = [
      'Samsung', 'Apple', 'Sony', 'Microsoft', 'Google', 'Amazon',
      'Bosch', 'Makita', 'DeWalt', 'Milwaukee', 'Ryobi',
      'Ford', 'Toyota', 'Honda', 'BMW', 'Mercedes'
    ];
    const foundBrands = brandPatterns.filter(brand => 
      new RegExp(`\\b${brand}\\b`, 'i').test(text)
    );
    if (foundBrands.length > 0) {
      entities.brands = foundBrands;
    }
    
    // Product names (capitalize proper nouns that appear multiple times)
    const properNouns = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g);
    if (properNouns) {
      const nounCounts = new Map<string, number>();
      properNouns.forEach(noun => {
        nounCounts.set(noun, (nounCounts.get(noun) || 0) + 1);
      });
      const products = Array.from(nounCounts.entries())
        .filter(([_, count]) => count >= 2)
        .map(([noun]) => noun);
      if (products.length > 0) {
        entities.products = products.slice(0, 5);
      }
    }
    
    return entities;
  }

  /**
   * Find section heading for a chunk
   */
  private static findSectionHeading(fullContent: string, chunkIndex: number): string | undefined {
    // Simple approach: look for headings before this chunk
    const chunks = fullContent.split(/\n{2,}/);
    if (chunkIndex >= chunks.length) return undefined;
    
    // Look backwards for a heading-like line
    for (let i = chunkIndex - 1; i >= Math.max(0, chunkIndex - 5); i--) {
      const chunk = chunks[i];
      // Check if it looks like a heading (short, possibly capitalized)
      if (chunk && chunk.length < 100 && /^[A-Z]/.test(chunk) && !chunk.includes('.')) {
        return chunk.trim();
      }
    }
    
    return undefined;
  }

  /**
   * Extract date from content
   */
  private static extractDate(content: string, htmlContent?: string): string | undefined {
    // Common date patterns
    const datePatterns = [
      /(\d{4}-\d{2}-\d{2})/,  // ISO format
      /(\d{1,2}\/\d{1,2}\/\d{4})/,  // US format
      /(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}/i,
      /\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}/i
    ];
    
    for (const pattern of datePatterns) {
      const match = content.match(pattern);
      if (match) {
        try {
          const date = new Date(match[0]);
          if (!isNaN(date.getTime())) {
            return date.toISOString();
          }
        } catch {}
      }
    }
    
    return undefined;
  }

  /**
   * Check for structured data
   */
  private static hasStructuredData(content: string): boolean {
    // Check for common structured data patterns
    const patterns = [
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>/i,
      /itemscope\s+itemtype=/i,
      /<meta[^>]*property=["']og:/i,
      /data-structured=/i
    ];
    
    return patterns.some(pattern => pattern.test(content));
  }

  /**
   * Simple language detection
   */
  private static detectLanguage(text: string): string {
    // Very basic detection - in production, use a proper library
    const englishWords = ['the', 'and', 'of', 'to', 'in', 'is', 'for'];
    const wordCount = text.toLowerCase().split(/\s+/).filter(w => englishWords.includes(w)).length;
    
    return wordCount > 5 ? 'en' : 'unknown';
  }

  /**
   * Calculate readability score (Flesch Reading Ease approximation)
   */
  private static calculateReadability(text: string): number {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const syllables = words.reduce((count, word) => {
      // Simple syllable counting (not perfect but good enough)
      return count + Math.max(1, word.toLowerCase().replace(/[^aeiou]/g, '').length);
    }, 0);
    
    if (sentences.length === 0 || words.length === 0) return 0;
    
    const avgWordsPerSentence = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;
    
    // Flesch Reading Ease formula
    const score = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;
    
    // Clamp between 0 and 100
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Extract contact information from text
   */
  private static extractContactInfo(text: string): { 
    email?: string; 
    phone?: string; 
    address?: string 
  } | undefined {
    const result: { email?: string; phone?: string; address?: string } = {};
    
    // Extract email addresses
    const emailPattern = /[\w._%+-]+@[\w.-]+\.[A-Z|a-z]{2,}/gi;
    const emails = text.match(emailPattern);
    if (emails && emails.length > 0) {
      result.email = emails[0].toLowerCase();
    }
    
    // Extract phone numbers (various formats)
    const phonePatterns = [
      /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, // US format
      /\+?[0-9]{1,4}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g, // International
      /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g // Simple format
    ];
    
    for (const pattern of phonePatterns) {
      const phones = text.match(pattern);
      if (phones && phones.length > 0) {
        // Clean up the phone number
        const cleaned = phones[0].replace(/[^\d+]/g, '');
        if (cleaned.length >= 10) {
          result.phone = phones[0];
          break;
        }
      }
    }
    
    // Extract address (simple pattern - can be enhanced)
    const addressPattern = /\d+\s+[\w\s]+(?:street|st|avenue|ave|road|rd|lane|ln|drive|dr|court|ct|boulevard|blvd)/gi;
    const addresses = text.match(addressPattern);
    if (addresses && addresses.length > 0) {
      result.address = addresses[0];
    }
    
    return Object.keys(result).length > 0 ? result : undefined;
  }

  /**
   * Extract Q&A pairs from text
   */
  private static extractQAPairs(text: string): Array<{
    question: string;
    answer: string;
  }> {
    const pairs: Array<{ question: string; answer: string }> = [];
    
    // Pattern 1: Q: ... A: ... format
    const qaPattern1 = /Q:\s*(.+?)\s*A:\s*(.+?)(?=Q:|$)/gis;
    let match;
    while ((match = qaPattern1.exec(text)) !== null) {
      if (match[1] && match[2]) {
        pairs.push({
          question: match[1].trim().replace(/\n+/g, ' '),
          answer: match[2].trim().replace(/\n+/g, ' ')
        });
      }
    }
    
    // Pattern 2: Question? Answer format (FAQ style)
    if (pairs.length === 0) {
      const qaPattern2 = /([^.!?\n]+\?)\s*([^?]+?)(?=\n[^.!?\n]+\?|$)/gis;
      while ((match = qaPattern2.exec(text)) !== null) {
        if (match[1] && match[2]) {
          pairs.push({
            question: match[1].trim(),
            answer: match[2].trim()
          });
        }
      }
    }
    
    // Pattern 3: Numbered FAQ format
    if (pairs.length === 0) {
      const qaPattern3 = /\d+\.\s*([^.!?\n]+\?)\s*([^?]+?)(?=\d+\.|$)/gis;
      while ((match = qaPattern3.exec(text)) !== null) {
        if (match[1] && match[2]) {
          pairs.push({
            question: match[1].trim(),
            answer: match[2].trim()
          });
        }
      }
    }
    
    // Limit to reasonable number of Q&A pairs
    return pairs.slice(0, 10);
  }

  /**
   * Extract e-commerce specific data
   */
  private static extractEcommerceData(
    chunk: string, 
    fullContent: string,
    htmlContent?: string
  ): Partial<EnhancedEmbeddingMetadata> {
    const result: Partial<EnhancedEmbeddingMetadata> = {};
    
    // Extract prices
    const pricePattern = /(?:[\$£€]\s?)([\d,]+(?:\.\d{2})?)/g;
    const prices: number[] = [];
    let priceMatch;
    while ((priceMatch = pricePattern.exec(chunk)) !== null) {
      if (priceMatch[1]) {
        const price = parseFloat(priceMatch[1].replace(',', ''));
        if (!isNaN(price)) prices.push(price);
      }
    }
    
    if (prices.length > 0) {
      result.price_range = {
        min: Math.min(...prices),
        max: Math.max(...prices),
        currency: chunk.includes('£') ? 'GBP' : chunk.includes('€') ? 'EUR' : 'USD'
      };
    }
    
    // Extract availability
    if (/in stock|available now|ready to ship/i.test(chunk)) {
      result.availability = 'in_stock';
    } else if (/out of stock|sold out|unavailable/i.test(chunk)) {
      result.availability = 'out_of_stock';
    } else if (/pre-?order|coming soon/i.test(chunk)) {
      result.availability = 'preorder';
    } else if (/discontinued|no longer available/i.test(chunk)) {
      result.availability = 'discontinued';
    }
    
    // Extract ratings (simple pattern)
    const ratingPattern = /([\d.]+)\s*(?:out of\s*5|\s*stars?)/i;
    const ratingMatch = chunk.match(ratingPattern);
    if (ratingMatch && ratingMatch[1]) {
      const value = parseFloat(ratingMatch[1]);
      if (!isNaN(value) && value <= 5) {
        // Look for review count
        const countPattern = /(\d+)\s*(?:reviews?|ratings?)/i;
        const countMatch = chunk.match(countPattern);
        result.ratings = {
          value,
          count: countMatch && countMatch[1] ? parseInt(countMatch[1]) : 0
        };
      }
    }
    
    return result;
  }
}