/**
 * Tests for zero-results recovery system
 */

import { handleZeroResults, shouldTriggerRecovery } from '@/lib/embeddings/zero-results-recovery';
import type { SearchResult } from '@/lib/embeddings/types';

describe('Zero-Results Recovery', () => {
  describe('shouldTriggerRecovery', () => {
    it('should return true for empty results array', () => {
      expect(shouldTriggerRecovery([])).toBe(true);
    });

    it('should return false for non-empty results array', () => {
      const results: SearchResult[] = [{
        content: 'test',
        url: 'http://example.com',
        title: 'Test',
        similarity: 0.8
      }];
      expect(shouldTriggerRecovery(results)).toBe(false);
    });
  });

  describe('handleZeroResults', () => {
    it('should return a recovery result with strategy', async () => {
      const result = await handleZeroResults(
        'nonexistent product query',
        'test-domain.com',
        20
      );

      expect(result).toBeDefined();
      expect(result.strategy).toBeDefined();
      expect(['keyword_removal', 'relaxed_threshold', 'single_keyword', 'exhausted']).toContain(result.strategy);
    });

    it('should provide helpful suggestions when exhausted', async () => {
      const result = await handleZeroResults(
        'zzzznonexistentproductzzz12345',
        'test-domain.com',
        20
      );

      expect(result.suggestion).toBeDefined();
      expect(result.suggestion).toContain('No results found');
      expect(result.suggestion).toContain('Try');
    });

    it('should handle single-word queries', async () => {
      const result = await handleZeroResults(
        'nonexistent',
        'test-domain.com',
        20
      );

      expect(result).toBeDefined();
      // Single word should skip keyword_removal strategy
      expect(['relaxed_threshold', 'exhausted']).toContain(result.strategy);
    });

    it('should handle multi-word queries', async () => {
      const result = await handleZeroResults(
        'very specific nonexistent product',
        'test-domain.com',
        20
      );

      expect(result).toBeDefined();
      // Multi-word should try keyword_removal or other strategies
      expect(result.strategy).toBeDefined();
    });
  });
});
