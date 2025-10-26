/**
 * Optimized Metadata Extraction for Embeddings
 * Performance improvements based on profiling analysis
 */

import {
  extractSKUs,
  extractModels,
  extractBrands,
  extractContactInfo,
  extractQAPairs,
  extractDate,
  extractPrices,
  detectAvailability,
  extractRating
} from './metadata-extractor-optimized-parsers';

import {
  BRANDS,
  classifyContent,
  extractCategory,
  extractKeywords,
  calculateReadability,
  detectCurrency
} from './metadata-extractor-optimized-utils';

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
      contentType = classifyContent(chunk, url, title);
      this.classificationCache.set(cacheKey, contentType);
    }

    // Pre-calculate word array once (used by multiple methods)
    const words = chunk.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;

    // Parallel extraction for independent operations
    const [
      keywords,
      entities,
      contactInfoData,
      ecommerceData,
      readabilityScore
    ] = await Promise.all([
      Promise.resolve(extractKeywords(words)),
      Promise.resolve(this.extractEntities(chunk)),
      Promise.resolve(extractContactInfo(chunk)),
      Promise.resolve(this.extractEcommerceData(chunk)),
      Promise.resolve(calculateReadability(chunk, words))
    ]);

    // Only extract Q&A for FAQ content
    const qaPairs = contentType === 'faq'
      ? extractQAPairs(fullContent)
      : undefined;

    return {
      // Core fields
      url,
      title,
      chunk_index: chunkIndex,
      total_chunks: totalChunks,

      // Content classification
      content_type: contentType,
      content_category: extractCategory(url, title),

      // Contextual information
      section_title: undefined, // Removed expensive operation
      keywords,
      entities,

      // Temporal information
      content_date: extractDate(fullContent),
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
      contact_info: contactInfoData,

      // Q&A pairs
      qa_pairs: qaPairs
    };
  }

  /**
   * Extract entities (SKUs, models, brands)
   */
  private static extractEntities(text: string): EnhancedEmbeddingMetadata['entities'] {
    const entities: EnhancedEmbeddingMetadata['entities'] = {};

    // SKUs
    const skus = extractSKUs(text);
    if (skus) {
      entities.skus = skus;
    }

    // Models
    const models = extractModels(text);
    if (models) {
      entities.models = models;
    }

    // Brands
    const brands = extractBrands(text, BRANDS);
    if (brands) {
      entities.brands = brands;
    }

    return entities;
  }

  /**
   * Extract e-commerce data (prices, availability, ratings)
   */
  private static extractEcommerceData(chunk: string): Partial<EnhancedEmbeddingMetadata> {
    const result: Partial<EnhancedEmbeddingMetadata> = {};

    // Extract prices
    const prices = extractPrices(chunk);

    if (prices.length > 0) {
      result.price_range = {
        min: Math.min(...prices),
        max: Math.max(...prices),
        currency: detectCurrency(chunk)
      };
    }

    // Check availability
    const availability = detectAvailability(chunk);
    if (availability) {
      result.availability = availability;
    }

    // Extract rating
    const rating = extractRating(chunk);
    if (rating) {
      result.ratings = rating;
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
