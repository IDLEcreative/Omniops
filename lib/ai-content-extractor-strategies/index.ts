/**
 * Extraction strategies for different content types
 * Handles semantic chunking of web content by category (FAQ, features, specs, etc.)
 */

import * as cheerio from 'cheerio';
import { ExtractedContent } from '../content-extractor';
import { SemanticChunk } from '../ai-content-extractor-types';
import {
  extractFAQChunks,
  extractFeatureChunks,
  extractSpecChunks,
  extractSupportChunks,
  extractLegalChunks,
  extractMainContentChunks
} from './extractors';

export class ContentExtractionStrategies {
  /**
   * Extract semantic chunks from the content
   */
  static extractSemanticChunks($: cheerio.CheerioAPI, baseContent: ExtractedContent): SemanticChunk[] {
    const chunks: SemanticChunk[] = [];

    // Extract FAQ sections
    extractFAQChunks($, chunks);

    // Extract feature sections
    extractFeatureChunks($, chunks);

    // Extract specification sections
    extractSpecChunks($, chunks);

    // Extract support/help sections
    extractSupportChunks($, chunks);

    // Extract legal sections
    extractLegalChunks($, chunks);

    // Extract main content chunks
    extractMainContentChunks($, chunks, baseContent);

    return chunks;
  }
}
