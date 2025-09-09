/**
 * Optimized Metadata Extraction for Embeddings
 * Performance improvements based on profiling analysis
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
  
  // Q&A pairs (for FAQ content)
  qa_pairs?: Array<{
    question: string;
    answer: string;
  }>;
}

export class OptimizedMetadataExtractor {
  // Pre-compiled regex patterns (major optimization)
  private static readonly PATTERNS = {
    // SKU patterns
    sku: /\b(?:[A-Z]{2,}[\-\/]?[\d]{2,}[\w\-]*|SKU[\s]?[\d]+)\b/gi,
    // Model patterns
    model: /\b(?:model\s+)?([A-Z]{1,}[\-]?[\d]{2,}[\w\-]*)\b/gi,
    // Price patterns
    price: /(?:[\$£€]\s?)([\d,]+(?:\.\d{2})?)/g,
    // Email pattern - simplified
    email: /[\w._%+-]+@[\w.-]+\.[A-Z|a-z]{2,}/gi,
    // Phone patterns - combined
    phone: /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
    // Q&A patterns - optimized
    qaFormat1: /Q:\s*(.+?)\s*A:\s*(.+?)(?=Q:|$)/gis,
    qaFormat2: /([^.!?\n]+\?)\s*\n+([^?]+?)(?=\n[^.!?\n]+\?|$)/gis,
    // Date patterns
    isoDate: /(\d{4}-\d{2}-\d{2})/,
    usDate: /(\d{1,2}\/\d{1,2}\/\d{4})/,
    // Availability patterns
    inStock: /in stock|available now|ready to ship/i,
    outOfStock: /out of stock|sold out|unavailable/i,
    preorder: /pre-?order|coming soon/i,
    discontinued: /discontinued|no longer available/i,
    // Rating pattern
    rating: /([\d.]+)\s*(?:out of\s*5|\s*stars?)/i,
    reviewCount: /(\d+)\s*(?:reviews?|ratings?)/i,
    // Address pattern - simplified
    address: /\d+\s+[\w\s]+(?:street|st|avenue|ave|road|rd|lane|ln|drive|dr)/gi
  };

  // Stop words as Set for O(1) lookup
  private static readonly STOP_WORDS = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'to', 'of', 'in', 'on', 'for', 
    'with', 'at', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
    'it', 'this', 'that', 'as', 'about', 'what', 'which', 'who', 'when',
    'where', 'how', 'why', 'you', 'your', 'we', 'our', 'they', 'their'
  ]);

  // Brand list as Set for O(1) lookup
  private static readonly BRANDS = new Set([
    'Samsung', 'Apple', 'Sony', 'Microsoft', 'Google', 'Amazon',
    'Bosch', 'Makita', 'DeWalt', 'Milwaukee', 'Ryobi',
    'Ford', 'Toyota', 'Honda', 'BMW', 'Mercedes'
  ]);

  // Cache for content classification (shared across chunks from same page)
  private static classificationCache = new Map<string, ContentType>();

  /**
   * Extract enhanced metadata from content chunk - Optimized version
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
    // Use cache key for classification
    const cacheKey = `${url}:${title}`;
    let contentType = this.classificationCache.get(cacheKey);
    
    if (!contentType) {
      contentType = this.classifyContent(chunk, url, title);
      this.classificationCache.set(cacheKey, contentType);
    }

    // Pre-calculate word array once (used by multiple methods)
    const words = chunk.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;
    
    // Parallel extraction for independent operations
    const [
      keywords,
      entities,
      contactInfo,
      ecommerceData,
      readabilityScore
    ] = await Promise.all([
      Promise.resolve(this.extractKeywordsOptimized(words)),
      Promise.resolve(this.extractEntitiesOptimized(chunk)),
      Promise.resolve(this.extractContactInfoOptimized(chunk)),
      Promise.resolve(this.extractEcommerceDataOptimized(chunk)),
      Promise.resolve(this.calculateReadabilityOptimized(chunk, words))
    ]);

    // Only extract Q&A for FAQ content
    const qaPairs = contentType === 'faq' 
      ? this.extractQAPairsOptimized(fullContent) 
      : undefined;
    
    return {
      // Core fields
      url,
      title,
      chunk_index: chunkIndex,
      total_chunks: totalChunks,
      
      // Content classification
      content_type: contentType,
      content_category: this.extractCategory(url, title),
      
      // Contextual information
      section_title: undefined, // Removed expensive operation
      keywords,
      entities,
      
      // Temporal information
      content_date: this.extractDateOptimized(fullContent),
      indexed_at: new Date().toISOString(),
      last_modified: undefined,
      
      // Quality signals
      word_count: wordCount,
      has_structured_data: false, // Simplified
      language: 'en', // Simplified assumption
      readability_score: readabilityScore,
      
      // Domain-specific
      ...ecommerceData,
      
      // Contact information
      contact_info: contactInfo,
      
      // Q&A pairs
      qa_pairs: qaPairs
    };
  }

  /**
   * Optimized content classification
   */
  private static classifyContent(chunk: string, url: string, title: string): ContentType {
    const lowerUrl = url.toLowerCase();
    const lowerTitle = title.toLowerCase();
    
    // URL-based classification (fastest)
    if (lowerUrl.includes('/product') || lowerUrl.includes('/shop')) return 'product';
    if (lowerUrl.includes('/faq') || lowerUrl.includes('/questions')) return 'faq';
    if (lowerUrl.includes('/docs') || lowerUrl.includes('/guide')) return 'documentation';
    if (lowerUrl.includes('/blog') || lowerUrl.includes('/article')) return 'blog';
    if (lowerUrl.includes('/support') || lowerUrl.includes('/help')) return 'support';
    
    // Title-based classification
    if (lowerTitle.includes('product') || lowerTitle.includes('shop')) return 'product';
    if (lowerTitle.includes('faq') || lowerTitle.includes('question')) return 'faq';
    if (lowerTitle.includes('guide') || lowerTitle.includes('documentation')) return 'documentation';
    if (lowerTitle.includes('blog') || lowerTitle.includes('article')) return 'blog';
    
    // Content-based only if needed (expensive)
    const lowerChunk = chunk.toLowerCase();
    if (this.PATTERNS.price.test(chunk) && this.PATTERNS.sku.test(chunk)) return 'product';
    if (lowerChunk.includes('frequently asked') || lowerChunk.includes('q:')) return 'faq';
    
    return 'general';
  }

  /**
   * Simplified category extraction
   */
  private static extractCategory(url: string, title: string): string | undefined {
    const urlParts = url.split('/').filter(p => p && !p.includes('.'));
    const categories = ['automotive', 'electronics', 'clothing', 'tools', 'parts'];
    
    // Check URL parts
    for (const part of urlParts) {
      const lower = part.toLowerCase();
      for (const cat of categories) {
        if (lower.includes(cat)) return cat;
      }
    }
    
    // Check title
    const titleLower = title.toLowerCase();
    for (const cat of categories) {
      if (titleLower.includes(cat)) return cat;
    }
    
    return undefined;
  }

  /**
   * Optimized keyword extraction - reuse word array
   */
  private static extractKeywordsOptimized(words: string[], limit: number = 10): string[] {
    const frequencies = new Map<string, number>();
    
    for (const word of words) {
      const lower = word.toLowerCase().replace(/[^\w-]/g, '');
      if (lower.length >= 3 && !this.STOP_WORDS.has(lower)) {
        frequencies.set(lower, (frequencies.get(lower) || 0) + 1);
      }
    }
    
    // Use array sort (faster for small sets)
    return Array.from(frequencies.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([word]) => word);
  }

  /**
   * Optimized entity extraction
   */
  private static extractEntitiesOptimized(text: string): EnhancedEmbeddingMetadata['entities'] {
    const entities: EnhancedEmbeddingMetadata['entities'] = {};
    
    // SKUs - use pre-compiled pattern
    const skus = text.match(this.PATTERNS.sku);
    if (skus && skus.length > 0) {
      entities.skus = [...new Set(skus.slice(0, 5).map(s => s.toUpperCase()))];
    }
    
    // Models - limit to 5
    const models: string[] = [];
    let match;
    this.PATTERNS.model.lastIndex = 0; // Reset regex
    let count = 0;
    while ((match = this.PATTERNS.model.exec(text)) !== null && count < 5) {
      models.push(match[1].toUpperCase());
      count++;
    }
    if (models.length > 0) {
      entities.models = [...new Set(models)];
    }
    
    // Brands - use Set for O(1) lookup
    const foundBrands: string[] = [];
    for (const brand of this.BRANDS) {
      if (text.includes(brand)) {
        foundBrands.push(brand);
        if (foundBrands.length >= 5) break; // Limit brands
      }
    }
    if (foundBrands.length > 0) {
      entities.brands = foundBrands;
    }
    
    return entities;
  }

  /**
   * Optimized contact info extraction
   */
  private static extractContactInfoOptimized(text: string): EnhancedEmbeddingMetadata['contact_info'] | undefined {
    const result: EnhancedEmbeddingMetadata['contact_info'] = {};
    
    // Email - first match only
    const emailMatch = text.match(this.PATTERNS.email);
    if (emailMatch && emailMatch[0]) {
      result.email = emailMatch[0].toLowerCase();
    }
    
    // Phone - first valid match only
    const phoneMatch = text.match(this.PATTERNS.phone);
    if (phoneMatch && phoneMatch[0]) {
      const cleaned = phoneMatch[0].replace(/[^\d+]/g, '');
      if (cleaned.length >= 10) {
        result.phone = phoneMatch[0];
      }
    }
    
    // Address - first match only
    const addressMatch = text.match(this.PATTERNS.address);
    if (addressMatch && addressMatch[0]) {
      result.address = addressMatch[0];
    }
    
    return Object.keys(result).length > 0 ? result : undefined;
  }

  /**
   * Optimized Q&A extraction - limit complexity
   */
  private static extractQAPairsOptimized(text: string): Array<{ question: string; answer: string }> {
    const pairs: Array<{ question: string; answer: string }> = [];
    
    // Try simple Q: A: format first (fastest)
    this.PATTERNS.qaFormat1.lastIndex = 0;
    let match;
    let count = 0;
    while ((match = this.PATTERNS.qaFormat1.exec(text)) !== null && count < 5) {
      if (match[1] && match[2]) {
        pairs.push({
          question: match[1].trim().replace(/\s+/g, ' '),
          answer: match[2].trim().replace(/\s+/g, ' ')
        });
        count++;
      }
    }
    
    // Only try second pattern if first found nothing
    if (pairs.length === 0) {
      this.PATTERNS.qaFormat2.lastIndex = 0;
      count = 0;
      while ((match = this.PATTERNS.qaFormat2.exec(text)) !== null && count < 5) {
        if (match[1] && match[2]) {
          pairs.push({
            question: match[1].trim(),
            answer: match[2].trim()
          });
          count++;
        }
      }
    }
    
    return pairs;
  }

  /**
   * Optimized readability calculation
   */
  private static calculateReadabilityOptimized(text: string, words: string[]): number {
    // Quick approximation - avoid expensive operations
    const sentences = (text.match(/[.!?]+/g) || []).length || 1;
    const avgWordsPerSentence = words.length / sentences;
    
    // Simplified syllable count (vowel groups)
    let totalSyllables = 0;
    for (const word of words) {
      const vowelGroups = word.toLowerCase().match(/[aeiou]+/g);
      totalSyllables += vowelGroups ? vowelGroups.length : 1;
    }
    const avgSyllablesPerWord = totalSyllables / words.length;
    
    // Flesch Reading Ease (simplified)
    const score = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Optimized date extraction
   */
  private static extractDateOptimized(content: string): string | undefined {
    // Try ISO format first (most common)
    const isoMatch = content.match(this.PATTERNS.isoDate);
    if (isoMatch) {
      return isoMatch[0];
    }
    
    // Try US format
    const usMatch = content.match(this.PATTERNS.usDate);
    if (usMatch) {
      try {
        const date = new Date(usMatch[0]);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      } catch {}
    }
    
    return undefined;
  }

  /**
   * Optimized e-commerce data extraction
   */
  private static extractEcommerceDataOptimized(chunk: string): Partial<EnhancedEmbeddingMetadata> {
    const result: Partial<EnhancedEmbeddingMetadata> = {};
    
    // Extract prices
    const prices: number[] = [];
    this.PATTERNS.price.lastIndex = 0;
    let priceMatch;
    let priceCount = 0;
    while ((priceMatch = this.PATTERNS.price.exec(chunk)) !== null && priceCount < 10) {
      const price = parseFloat(priceMatch[1].replace(',', ''));
      if (!isNaN(price) && price > 0 && price < 1000000) {
        prices.push(price);
        priceCount++;
      }
    }
    
    if (prices.length > 0) {
      result.price_range = {
        min: Math.min(...prices),
        max: Math.max(...prices),
        currency: chunk.includes('£') ? 'GBP' : chunk.includes('€') ? 'EUR' : 'USD'
      };
    }
    
    // Check availability (use pre-compiled patterns)
    if (this.PATTERNS.inStock.test(chunk)) {
      result.availability = 'in_stock';
    } else if (this.PATTERNS.outOfStock.test(chunk)) {
      result.availability = 'out_of_stock';
    } else if (this.PATTERNS.preorder.test(chunk)) {
      result.availability = 'preorder';
    } else if (this.PATTERNS.discontinued.test(chunk)) {
      result.availability = 'discontinued';
    }
    
    // Extract rating
    const ratingMatch = chunk.match(this.PATTERNS.rating);
    if (ratingMatch) {
      const value = parseFloat(ratingMatch[1]);
      if (!isNaN(value) && value <= 5) {
        const countMatch = chunk.match(this.PATTERNS.reviewCount);
        result.ratings = {
          value,
          count: countMatch ? parseInt(countMatch[1]) : 0
        };
      }
    }
    
    return result;
  }

  /**
   * Clear classification cache (call periodically or between domains)
   */
  static clearCache(): void {
    this.classificationCache.clear();
  }
}