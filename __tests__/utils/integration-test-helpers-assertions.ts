import { SemanticChunk, AIOptimizedContent } from '@/lib/ai-content-extractor';
import { NormalizedProduct } from '@/lib/product-normalizer';
import { ContentHash, DeduplicationMetrics } from '@/lib/content-deduplicator';
import { RateLimitResponse } from '@/lib/rate-limiter-enhanced';

/**
 * Validation Utilities
 * Helper functions for validating data structures and test results
 */

export class ValidationHelpers {
  /**
   * Validate AI optimized content structure and values
   */
  static validateAIOptimizedContent(content: AIOptimizedContent): void {
    expect(content).toHaveProperty('originalTokens');
    expect(content).toHaveProperty('optimizedTokens');
    expect(content).toHaveProperty('compressionRatio');
    expect(content).toHaveProperty('chunks');
    expect(content).toHaveProperty('summary');
    expect(content).toHaveProperty('keyFacts');
    expect(content).toHaveProperty('qaPairs');
    expect(content).toHaveProperty('topicTags');
    expect(content).toHaveProperty('processingStats');

    expect(typeof content.originalTokens).toBe('number');
    expect(typeof content.optimizedTokens).toBe('number');
    expect(typeof content.compressionRatio).toBe('number');
    expect(Array.isArray(content.chunks)).toBe(true);
    expect(Array.isArray(content.keyFacts)).toBe(true);
    expect(Array.isArray(content.qaPairs)).toBe(true);
    expect(Array.isArray(content.topicTags)).toBe(true);

    expect(content.originalTokens).toBeGreaterThanOrEqual(0);
    expect(content.optimizedTokens).toBeGreaterThanOrEqual(0);
    expect(content.compressionRatio).toBeGreaterThanOrEqual(0);

    if (content.originalTokens > 0) {
      expect(content.optimizedTokens).toBeLessThanOrEqual(content.originalTokens);
    }

    expect(content.processingStats).toHaveProperty('removedElements');
    expect(content.processingStats).toHaveProperty('deduplicatedSections');
    expect(content.processingStats).toHaveProperty('compressionTime');
    expect(content.processingStats.compressionTime).toBeGreaterThan(0);
  }

  /**
   * Validate semantic chunks structure and content
   */
  static validateSemanticChunks(chunks: SemanticChunk[]): void {
    expect(Array.isArray(chunks)).toBe(true);

    chunks.forEach((chunk) => {
      expect(chunk).toHaveProperty('id');
      expect(chunk).toHaveProperty('type');
      expect(chunk).toHaveProperty('content');
      expect(chunk).toHaveProperty('tokens');
      expect(chunk).toHaveProperty('relevanceScore');
      expect(chunk).toHaveProperty('metadata');

      expect(typeof chunk.id).toBe('string');
      expect(chunk.id.length).toBeGreaterThan(0);

      expect(['main', 'faq', 'features', 'specs', 'support', 'legal']).toContain(chunk.type);

      expect(typeof chunk.content).toBe('string');
      expect(chunk.content.length).toBeGreaterThan(0);

      expect(typeof chunk.tokens).toBe('number');
      expect(chunk.tokens).toBeGreaterThan(0);

      expect(typeof chunk.relevanceScore).toBe('number');
      expect(chunk.relevanceScore).toBeGreaterThanOrEqual(0);
      expect(chunk.relevanceScore).toBeLessThanOrEqual(1);

      expect(chunk.metadata).toHaveProperty('headings');
      expect(chunk.metadata).toHaveProperty('keywords');
      expect(chunk.metadata).toHaveProperty('entities');
      expect(Array.isArray(chunk.metadata.headings)).toBe(true);
      expect(Array.isArray(chunk.metadata.keywords)).toBe(true);
      expect(Array.isArray(chunk.metadata.entities)).toBe(true);
    });
  }

  /**
   * Validate normalized product structure
   */
  static validateNormalizedProduct(product: NormalizedProduct): void {
    expect(product).toHaveProperty('name');
    expect(product).toHaveProperty('scrapedAt');

    expect(typeof product.name).toBe('string');
    expect(product.name.length).toBeGreaterThan(0);

    expect(typeof product.scrapedAt).toBe('string');
    expect(new Date(product.scrapedAt).toISOString()).toBe(product.scrapedAt);

    if (product.price) {
      expect(product.price).toHaveProperty('amount');
      expect(product.price).toHaveProperty('currency');
      expect(product.price).toHaveProperty('formatted');

      expect(typeof product.price.amount).toBe('number');
      expect(product.price.amount).toBeGreaterThan(0);

      expect(typeof product.price.currency).toBe('string');
      expect(product.price.currency.length).toBeGreaterThanOrEqual(3);

      expect(typeof product.price.formatted).toBe('string');
      expect(product.price.formatted).toContain(product.price.amount.toString());
    }

    if (product.sku) {
      expect(typeof product.sku).toBe('string');
      expect(product.sku.length).toBeGreaterThan(0);
    }

    if (product.images && product.images.length > 0) {
      product.images.forEach(image => {
        expect(image).toHaveProperty('url');
        expect(image).toHaveProperty('isMain');
        expect(image).toHaveProperty('position');

        expect(typeof image.url).toBe('string');
        expect(image.url.length).toBeGreaterThan(0);
        expect(typeof image.isMain).toBe('boolean');
        expect(typeof image.position).toBe('number');
        expect(image.position).toBeGreaterThanOrEqual(0);
      });
    }
  }

  /**
   * Validate rate limit response
   */
  static validateRateLimitResponse(response: RateLimitResponse): void {
    expect(response).toHaveProperty('allowed');
    expect(response).toHaveProperty('waitTimeMs');
    expect(response).toHaveProperty('tokensRemaining');
    expect(response).toHaveProperty('resetTime');

    expect(typeof response.allowed).toBe('boolean');
    expect(typeof response.waitTimeMs).toBe('number');
    expect(typeof response.tokensRemaining).toBe('number');
    expect(typeof response.resetTime).toBe('number');

    expect(response.waitTimeMs).toBeGreaterThanOrEqual(0);
    expect(response.tokensRemaining).toBeGreaterThanOrEqual(0);
    expect(response.resetTime).toBeGreaterThan(Date.now() - 1000); // Allow for clock skew

    if (!response.allowed) {
      expect(response.waitTimeMs).toBeGreaterThan(0);
      expect(response).toHaveProperty('reason');
      expect(typeof response.reason).toBe('string');
    }
  }

  /**
   * Validate deduplication metrics
   */
  static validateDeduplicationMetrics(metrics: DeduplicationMetrics): void {
    expect(metrics).toHaveProperty('totalPages');
    expect(metrics).toHaveProperty('uniqueContent');
    expect(metrics).toHaveProperty('duplicateContent');
    expect(metrics).toHaveProperty('storageReduction');
    expect(metrics).toHaveProperty('compressionRatio');
    expect(metrics).toHaveProperty('processingTime');

    expect(typeof metrics.totalPages).toBe('number');
    expect(typeof metrics.uniqueContent).toBe('number');
    expect(typeof metrics.duplicateContent).toBe('number');
    expect(typeof metrics.storageReduction).toBe('number');
    expect(typeof metrics.compressionRatio).toBe('number');
    expect(typeof metrics.processingTime).toBe('number');

    expect(metrics.totalPages).toBeGreaterThanOrEqual(0);
    expect(metrics.uniqueContent).toBeGreaterThanOrEqual(0);
    expect(metrics.duplicateContent).toBeGreaterThanOrEqual(0);
    expect(metrics.storageReduction).toBeGreaterThanOrEqual(0);
    expect(metrics.compressionRatio).toBeGreaterThanOrEqual(1);
    expect(metrics.processingTime).toBeGreaterThan(0);

    expect(metrics.uniqueContent + metrics.duplicateContent).toBeGreaterThanOrEqual(0);
  }

  /**
   * Validate content hash structure
   */
  static validateContentHash(hash: ContentHash): void {
    expect(hash).toHaveProperty('hash');
    expect(hash).toHaveProperty('content');
    expect(hash).toHaveProperty('type');
    expect(hash).toHaveProperty('frequency');
    expect(hash).toHaveProperty('pages');
    expect(hash).toHaveProperty('size');

    expect(typeof hash.hash).toBe('string');
    expect(hash.hash.length).toBeGreaterThan(0);

    expect(typeof hash.content).toBe('string');
    expect(hash.content.length).toBeGreaterThan(0);

    expect(['navigation', 'footer', 'sidebar', 'header', 'unique']).toContain(hash.type);

    expect(typeof hash.frequency).toBe('number');
    expect(hash.frequency).toBeGreaterThan(0);

    expect(Array.isArray(hash.pages)).toBe(true);
    expect(hash.pages.length).toBeGreaterThan(0);

    expect(typeof hash.size).toBe('number');
    expect(hash.size).toBeGreaterThan(0);

    hash.pages.forEach(page => {
      expect(typeof page).toBe('string');
      expect(page.length).toBeGreaterThan(0);
    });
  }
}
