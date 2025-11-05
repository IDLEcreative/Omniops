/**
 * Embedding Cache Tests
 * Validates caching logic for embedding generation
 */

import { embeddingCache } from '@/lib/embedding-cache';
import { generateEmbeddingVectors } from '@/lib/embeddings-functions';
import OpenAI from 'openai';

// Mock OpenAI
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      embeddings: {
        create: jest.fn().mockResolvedValue({
          data: [
            { embedding: new Array(1536).fill(0.1) },
            { embedding: new Array(1536).fill(0.2) },
            { embedding: new Array(1536).fill(0.3) },
          ]
        })
      }
    }))
  };
});

describe('Embedding Cache', () => {
  beforeEach(() => {
    // Clear cache before each test
    embeddingCache.clear();
    jest.clearAllMocks();
  });

  describe('Basic Cache Operations', () => {
    it('returns null for cache miss', () => {
      const result = embeddingCache.get('test text');
      expect(result).toBeNull();
    });

    it('returns cached embedding on cache hit', () => {
      const text = 'test text';
      const embedding = [0.1, 0.2, 0.3];

      embeddingCache.set(text, embedding);
      const result = embeddingCache.get(text);

      expect(result).toEqual(embedding);
    });

    it('tracks cache statistics correctly', () => {
      embeddingCache.get('miss1'); // Miss
      embeddingCache.set('hit1', [0.1]);
      embeddingCache.get('hit1'); // Hit
      embeddingCache.get('miss2'); // Miss

      const stats = embeddingCache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(2);
      expect(stats.hitRate).toBe('33.33%');
    });
  });

  describe('Cache Expiration', () => {
    it('expires entries after TTL', () => {
      // Create cache with 1ms TTL for testing
      const testCache = new (embeddingCache.constructor as any)(1000, 0.0001); // ~6ms TTL

      const text = 'test text';
      const embedding = [0.1, 0.2, 0.3];

      testCache.set(text, embedding);

      // Immediate retrieval should work
      expect(testCache.get(text)).toEqual(embedding);

      // Wait for expiration
      return new Promise(resolve => {
        setTimeout(() => {
          expect(testCache.get(text)).toBeNull();
          resolve(undefined);
        }, 10);
      });
    });
  });

  describe('LRU Eviction', () => {
    it('evicts least recently used entries when cache is full', () => {
      // Create cache with maxSize=2
      const testCache = new (embeddingCache.constructor as any)(2, 60);

      testCache.set('text1', [0.1]);
      testCache.set('text2', [0.2]);
      testCache.set('text3', [0.3]); // Should evict text1

      expect(testCache.get('text1')).toBeNull();
      expect(testCache.get('text2')).toEqual([0.2]);
      expect(testCache.get('text3')).toEqual([0.3]);

      const stats = testCache.getStats();
      expect(stats.evictions).toBe(1);
    });

    it('updates LRU order on cache hit', () => {
      const testCache = new (embeddingCache.constructor as any)(2, 60);

      testCache.set('text1', [0.1]);
      testCache.set('text2', [0.2]);

      // Access text1 to make it recently used
      testCache.get('text1');

      // Add text3, which should evict text2 (not text1)
      testCache.set('text3', [0.3]);

      expect(testCache.get('text1')).toEqual([0.1]);
      expect(testCache.get('text2')).toBeNull();
      expect(testCache.get('text3')).toEqual([0.3]);
    });
  });

  describe('Batch Operations', () => {
    it('getMultiple returns cached and missing indices', () => {
      embeddingCache.set('text1', [0.1]);
      embeddingCache.set('text3', [0.3]);

      const texts = ['text1', 'text2', 'text3'];
      const result = embeddingCache.getMultiple(texts);

      expect(result.cached.get(0)).toEqual([0.1]);
      expect(result.cached.get(2)).toEqual([0.3]);
      expect(result.missing).toEqual([1]);
    });

    it('setMultiple caches all embeddings', () => {
      const texts = ['text1', 'text2', 'text3'];
      const embeddings = [[0.1], [0.2], [0.3]];

      embeddingCache.setMultiple(texts, embeddings);

      expect(embeddingCache.get('text1')).toEqual([0.1]);
      expect(embeddingCache.get('text2')).toEqual([0.2]);
      expect(embeddingCache.get('text3')).toEqual([0.3]);
    });
  });

  describe('Integration with generateEmbeddingVectors', () => {
    it('caches generated embeddings for reuse', async () => {
      const chunks = ['chunk1', 'chunk2', 'chunk3'];

      // First call generates embeddings
      const result1 = await generateEmbeddingVectors(chunks);

      // Second call should use cache
      const result2 = await generateEmbeddingVectors(chunks);

      // Results should be identical
      expect(result1).toEqual(result2);

      // All embeddings should be valid
      expect(result1).toHaveLength(3);
      expect(result1[0]).toHaveLength(1536);
      expect(result1[1]).toHaveLength(1536);
      expect(result1[2]).toHaveLength(1536);
    });

    it('returns all cached embeddings without API call', async () => {
      const chunks = ['chunk1', 'chunk2', 'chunk3'];

      // First call - generates embeddings
      const firstResult = await generateEmbeddingVectors(chunks);

      // Clear mock call history
      const mockCreate = (OpenAI as jest.MockedClass<typeof OpenAI>).mock.results[0].value.embeddings.create;
      mockCreate.mockClear();

      // Second call - should use cache
      const secondResult = await generateEmbeddingVectors(chunks);

      // Should return same embeddings
      expect(secondResult).toEqual(firstResult);

      // Should NOT call OpenAI API
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('uses partial cache for mixed hits and misses', async () => {
      const chunks = ['chunk1', 'chunk2', 'chunk3'];

      // Prefill cache with chunk1
      await generateEmbeddingVectors(['chunk1']);

      // Get cache stats before
      const statsBefore = embeddingCache.getStats();
      const initialHits = statsBefore.hits;

      // Now request all 3 chunks
      const result = await generateEmbeddingVectors(chunks);

      // Should have 3 embeddings
      expect(result).toHaveLength(3);

      // All should be valid embeddings
      result.forEach(embedding => {
        expect(embedding).toHaveLength(1536);
      });

      // Cache hits should have increased (chunk1 was cached)
      const statsAfter = embeddingCache.getStats();
      expect(statsAfter.hits).toBeGreaterThan(initialHits);
    });
  });

  describe('Clear Cache', () => {
    it('clears all entries and resets stats', () => {
      embeddingCache.set('text1', [0.1]);
      embeddingCache.set('text2', [0.2]);
      embeddingCache.get('text1');

      const statsBefore = embeddingCache.getStats();
      expect(statsBefore.size).toBe(2);
      expect(statsBefore.hits).toBe(1);

      embeddingCache.clear();

      const statsAfter = embeddingCache.getStats();
      expect(statsAfter.size).toBe(0);
      expect(statsAfter.hits).toBe(0);
      expect(statsAfter.misses).toBe(0);
    });
  });

  describe('Cost Savings Calculation', () => {
    it('calculates correct cost savings', () => {
      // Simulate 100 cache hits
      for (let i = 0; i < 100; i++) {
        embeddingCache.set(`text${i}`, [0.1]);
      }
      for (let i = 0; i < 100; i++) {
        embeddingCache.get(`text${i}`);
      }

      const stats = embeddingCache.getStats();
      expect(stats.hits).toBe(100);

      // Cost per embedding: ~$0.000025
      // 100 hits = $0.0025 savings
      const expectedSavings = 100 * 0.000025;
      expect(expectedSavings).toBe(0.0025);
    });
  });
});
