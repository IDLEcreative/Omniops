/**
 * Validation and Helper Utilities
 *
 * Common test helpers for validation, assertions, and utility functions.
 * Used across integration tests for consistent validation patterns.
 */

import { SemanticChunk, AIOptimizedContent } from '@/lib/ai-content-extractor';

// Type definition for normalized product
interface NormalizedProduct {
  name: string;
  scrapedAt: string;
  price?: {
    amount: number;
    currency: string;
    formatted: string;
  };
}

export const TestHelpers = {
  async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  validateSemanticChunks(chunks: SemanticChunk[]): void {
    expect(chunks).toBeDefined();
    expect(Array.isArray(chunks)).toBe(true);

    chunks.forEach(chunk => {
      expect(chunk).toHaveProperty('id');
      expect(chunk).toHaveProperty('type');
      expect(chunk).toHaveProperty('content');
      expect(chunk).toHaveProperty('tokens');
      expect(chunk).toHaveProperty('relevanceScore');
      expect(chunk).toHaveProperty('metadata');
      expect(chunk.tokens).toBeGreaterThan(0);
      expect(chunk.relevanceScore).toBeGreaterThanOrEqual(0);
      expect(chunk.relevanceScore).toBeLessThanOrEqual(1);
    });
  },

  validateAIOptimizedContent(content: AIOptimizedContent): void {
    expect(content).toHaveProperty('originalTokens');
    expect(content).toHaveProperty('optimizedTokens');
    expect(content).toHaveProperty('compressionRatio');
    expect(content).toHaveProperty('chunks');
    expect(content).toHaveProperty('summary');
    expect(content).toHaveProperty('keyFacts');
    expect(content).toHaveProperty('qaPairs');
    expect(content).toHaveProperty('topicTags');
    expect(content).toHaveProperty('processingStats');

    expect(content.originalTokens).toBeGreaterThanOrEqual(content.optimizedTokens);
    expect(content.compressionRatio).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(content.chunks)).toBe(true);
    expect(Array.isArray(content.keyFacts)).toBe(true);
    expect(Array.isArray(content.qaPairs)).toBe(true);
    expect(Array.isArray(content.topicTags)).toBe(true);
  },

  validateNormalizedProduct(product: NormalizedProduct): void {
    expect(product).toHaveProperty('name');
    expect(product).toHaveProperty('scrapedAt');
    expect(typeof product.name).toBe('string');
    expect(product.name.length).toBeGreaterThan(0);

    if (product.price) {
      expect(product.price).toHaveProperty('amount');
      expect(product.price).toHaveProperty('currency');
      expect(product.price).toHaveProperty('formatted');
      expect(typeof product.price.amount).toBe('number');
      expect(product.price.amount).toBeGreaterThan(0);
    }
  }
};
