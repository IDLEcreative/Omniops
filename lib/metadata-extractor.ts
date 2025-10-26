/**
 * Enhanced Metadata Extraction for Embeddings
 * Extracts rich contextual information from content for improved search relevance
 */

import type { EnhancedEmbeddingMetadata } from './metadata-extractor-types';
import {
  classifyContent,
  extractEntities,
  extractQAPairs,
  extractEcommerceData,
  extractDate,
  extractContactInfo
} from './metadata-extractor-parsers';
import {
  extractCategory,
  extractKeywords,
  findSectionHeading,
  hasStructuredData,
  detectLanguage,
  calculateReadability
} from './metadata-extractor-utils';

// Re-export types for backward compatibility
export type { ContentType, EnhancedEmbeddingMetadata } from './metadata-extractor-types';

export class MetadataExtractor {
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
    const contentType = classifyContent(chunk, url, title);

    return {
      // Core fields
      url,
      title,
      chunk_index: chunkIndex,
      total_chunks: totalChunks,

      // Content classification
      content_type: contentType,
      content_category: extractCategory(url, title, chunk),

      // Contextual information
      section_title: findSectionHeading(fullContent, chunkIndex),
      keywords: extractKeywords(chunk, 10),
      entities: extractEntities(chunk),

      // Temporal information
      content_date: extractDate(fullContent, htmlContent),
      indexed_at: new Date().toISOString(),
      last_modified: undefined, // Can be set from HTTP headers

      // Quality signals
      word_count: chunk.split(/\s+/).filter(w => w.length > 0).length,
      has_structured_data: hasStructuredData(htmlContent || fullContent),
      language: detectLanguage(chunk),
      readability_score: calculateReadability(chunk),

      // Domain-specific
      ...extractEcommerceData(chunk, fullContent, htmlContent),

      // Contact information
      contact_info: extractContactInfo(chunk),

      // Q&A pairs (for FAQ content)
      qa_pairs: contentType === 'faq' ? extractQAPairs(fullContent) : undefined
    };
  }
}