import { ContentExtractor, ExtractedContent } from './content-extractor';
import * as cheerio from 'cheerio';
import { createHash } from 'crypto';
import { JSDOM } from 'jsdom';
import { SemanticChunk, AIOptimizedContent, CacheEntry } from './ai-content-extractor-types';
import { ContentExtractionStrategies } from './ai-content-extractor-strategies';
import { ContentParsers } from './ai-content-extractor-parsers';

// Re-export types for backwards compatibility
export type { SemanticChunk, AIOptimizedContent, CacheEntry } from './ai-content-extractor-types';

/**
 * AI-optimized content extractor that reduces token usage by ~70% while preserving semantic meaning
 */
export class AIContentExtractor extends ContentExtractor {
  private static cache = new Map<string, CacheEntry>();
  private static readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes
  private static readonly MAX_CACHE_SIZE = 1000;

  /**
   * Main extraction method with AI optimization
   */
  static async extractOptimized(html: string, url: string): Promise<AIOptimizedContent> {
    const startTime = Date.now();

    // Check cache first
    const cacheKey = this.generateCacheKey(html, url);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    // Extract base content using parent class
    const baseContent = this.extractWithReadability(html, url);

    // If content is not valid, return early
    if (!this.isValidContent(baseContent)) {
      const emptyResult: AIOptimizedContent = {
        ...baseContent,
        originalTokens: 0,
        optimizedTokens: 0,
        compressionRatio: 0,
        chunks: [],
        summary: '',
        keyFacts: [],
        qaPairs: [],
        topicTags: [],
        processingStats: {
          removedElements: 0,
          deduplicatedSections: 0,
          compressionTime: Date.now() - startTime
        }
      };
      return emptyResult;
    }

    // Perform AI-optimized extraction
    const dom = new JSDOM(html, { url });
    const document = dom.window.document;

    // Remove unwanted elements and count them
    const removedElements = this.removeUnwantedElements(document);

    // Extract and optimize content
    const optimizedHtml = document.documentElement.outerHTML;
    const $ = cheerio.load(optimizedHtml);

    // Extract semantic chunks using strategies module
    const chunks = ContentExtractionStrategies.extractSemanticChunks($, baseContent);

    // Deduplicate and compress content using parsers module
    const { compressedContent, deduplicatedCount } = ContentParsers.compressContent(baseContent.content);

    // Generate summary and insights using parsers module
    const summary = ContentParsers.generateSummary(baseContent.textContent);
    const keyFacts = ContentParsers.extractKeyFacts(baseContent.textContent);
    const qaPairs = ContentParsers.extractQAPairs($);
    const topicTags = ContentParsers.generateTopicTags(baseContent.textContent, baseContent.metadata);

    // Calculate token counts
    const originalTokens = ContentParsers.estimateTokens(baseContent.content);
    const optimizedTokens = ContentParsers.estimateTokens(compressedContent);
    const compressionRatio = originalTokens > 0 ? ((originalTokens - optimizedTokens) / originalTokens) : 0;

    const result: AIOptimizedContent = {
      ...baseContent,
      content: compressedContent,
      textContent: ContentParsers.stripMarkdown(compressedContent),
      originalTokens,
      optimizedTokens,
      compressionRatio,
      chunks,
      summary,
      keyFacts,
      qaPairs,
      topicTags,
      processingStats: {
        removedElements,
        deduplicatedSections: deduplicatedCount,
        compressionTime: Date.now() - startTime
      }
    };

    // Cache the result
    this.setCache(cacheKey, result);

    return result;
  }

  /**
   * Remove navigation, footer, header, sidebar content and other unwanted elements
   */
  private static removeUnwantedElements(document: Document): number {
    let removedCount = 0;

    // Define selectors for unwanted elements
    const unwantedSelectors = [
      // Structural elements
      'nav', 'header', 'footer', 'aside', 'form', 'iframe', 'object', 'embed',
      'script', 'style', 'noscript', 'meta', 'link[rel="stylesheet"]',

      // Common class-based selectors
      '.nav', '.navbar', '.navigation', '.menu', '.header', '.footer',
      '.sidebar', '.side-bar', '.aside', '.advertisement', '.ads', '.ad',
      '.social-share', '.social-media', '.comments', '.comment-section',
      '.related-posts', '.recommended', '.popup', '.modal', '.overlay',
      '.cookie-notice', '.cookie-banner', '.newsletter', '.subscription',
      '.breadcrumb', '.breadcrumbs', '.pagination', '.page-numbers',
      '.author-bio', '.author-info', '.share-buttons', '.tags-container',

      // ID-based selectors
      '#nav', '#navbar', '#navigation', '#menu', '#header', '#footer',
      '#sidebar', '#side-bar', '#ads', '#advertisement', '#social',
      '#comments', '#comment-section', '#related', '#recommended',

      // Attribute-based selectors
      '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]',
      '[role="complementary"]', '[aria-label*="navigation"]',
      '[aria-label*="menu"]', '[class*="sidebar"]', '[class*="header"]',
      '[class*="footer"]', '[class*="nav"]', '[id*="sidebar"]',
      '[id*="header"]', '[id*="footer"]', '[id*="nav"]',

      // Widget and plugin elements
      '.widget', '.wp-widget', '.plugin', '.external-content',
      '.third-party', '.tracking', '.analytics', '.gtm'
    ];

    // Remove elements
    unwantedSelectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          element.remove();
          removedCount++;
        });
      } catch (e) {
        // Ignore selector errors
      }
    });

    // Remove elements with minimal text content (likely navigation/ads)
    // PERFORMANCE OPTIMIZATION: Build a link count map first to avoid O(n²) DOM queries
    // Instead of querying all links for each element (10,000 elements = 10,000 queries),
    // we query once and build a map (1 query + O(n) map building)
    const allElements = document.querySelectorAll('div, section, article, span');

    // Single query for all links in the document
    const allLinks = document.querySelectorAll('a');

    // Build a map of link counts per element (single pass through links)
    const linkCountMap = new Map<Element, number>();
    allLinks.forEach(link => {
      let parent = link.parentElement;
      while (parent) {
        linkCountMap.set(parent, (linkCountMap.get(parent) || 0) + 1);
        parent = parent.parentElement;
      }
    });

    // Now filter elements using O(1) map lookups instead of O(n) querySelectorAll
    allElements.forEach(element => {
      const text = element.textContent?.trim() || '';
      const childCount = element.children.length;

      // Remove elements that are likely navigation/ads
      if (text.length < 50 && childCount > 5) {
        const linkCount = linkCountMap.get(element) || 0; // O(1) lookup
        if (linkCount / childCount > 0.8) { // High link density
          element.remove();
          removedCount++;
        }
      }
    });

    return removedCount;
  }

  /**
   * Cache management
   */
  private static generateCacheKey(html: string, url: string): string {
    const content = html.substring(0, 1000) + url; // Use first 1KB + URL for key
    return createHash('md5').update(content).digest('hex');
  }

  private static getFromCache(key: string): AIOptimizedContent | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.content;
  }

  private static setCache(key: string, content: AIOptimizedContent): void {
    // Clean old entries if cache is too large
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      content,
      timestamp: Date.now(),
      ttl: this.CACHE_TTL
    });
  }

  /**
   * Clear cache (useful for testing or memory management)
   */
  static clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): { size: number; maxSize: number; hitRate?: number } {
    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE
    };
  }
}

/**
 * Usage Examples:
 *
 * // Basic usage
 * const optimizedContent = await AIContentExtractor.extractOptimized(html, url);
 * console.log(`Compression ratio: ${optimizedContent.compressionRatio * 100}%`);
 * console.log(`Original tokens: ${optimizedContent.originalTokens}`);
 * console.log(`Optimized tokens: ${optimizedContent.optimizedTokens}`);
 *
 * // Access semantic chunks
 * const faqChunks = optimizedContent.chunks.filter(chunk => chunk.type === 'faq');
 * const mainChunks = optimizedContent.chunks
 *   .filter(chunk => chunk.type === 'main')
 *   .sort((a, b) => b.relevanceScore - a.relevanceScore);
 *
 * // Use pre-computed insights
 * console.log('Summary:', optimizedContent.summary);
 * console.log('Key Facts:', optimizedContent.keyFacts);
 * console.log('Q&A Pairs:', optimizedContent.qaPairs);
 * console.log('Topic Tags:', optimizedContent.topicTags);
 *
 * // Cache management
 * console.log('Cache stats:', AIContentExtractor.getCacheStats());
 * AIContentExtractor.clearCache(); // Clear cache if needed
 */
