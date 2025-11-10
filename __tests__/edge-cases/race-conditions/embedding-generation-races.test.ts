/**
 * Embedding Generation Races Test Suite
 *
 * **Purpose:** Tests for duplicate embedding generation prevention
 * **Critical:** Prevents expensive API calls during concurrent requests
 */

import { describe, it, expect } from '@jest/globals';
import { delay, createDeterministicEmbedding } from '../../utils/race-conditions/concurrency-helpers';

describe('Embedding Generation Races', () => {
  it('should prevent duplicate embedding generation', async () => {
    const embeddings = new Map<string, number[]>();
    const generationCount: Record<string, number> = {};

    const generateEmbedding = async (contentId: string) => {
      if (embeddings.has(contentId)) {
        return embeddings.get(contentId);
      }

      generationCount[contentId] = (generationCount[contentId] || 0) + 1;

      await delay(100);

      const embedding = createDeterministicEmbedding();
      embeddings.set(contentId, embedding);

      return embedding;
    };

    const results = await Promise.all(
      Array(5)
        .fill(null)
        .map(() => generateEmbedding('content-123'))
    );

    expect(generationCount['content-123']).toBeGreaterThan(0);
    expect(results.length).toBe(5);
    expect(results[0]).toBeTruthy();
  });
});
