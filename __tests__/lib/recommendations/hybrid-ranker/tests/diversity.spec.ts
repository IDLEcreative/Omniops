import { describe, it, expect } from '@jest/globals';
import { hybridRanker } from '@/lib/recommendations/hybrid-ranker';
import { setupHybridMocks } from '../helpers/setupMocks';
import { vectorResults, collabResults, contentResults } from '../helpers/mock-data';

describe('hybridRanker – diversity filtering', () => {
  it('skips diversity filtering for <= 5 recommendations', async () => {
    const { vector, collab, content } = setupHybridMocks();
    vector.mockResolvedValue(vectorResults(3));
    collab.mockResolvedValue([]);
    content.mockResolvedValue([]);

    const result = await hybridRanker({ domainId: 'domain-123', limit: 5 });
    expect(result).toHaveLength(3);
  });

  it('ensures algorithm diversity when limit > 5', async () => {
    const { vector, collab, content } = setupHybridMocks();
    vector.mockResolvedValue(vectorResults(4));
    collab.mockResolvedValue(collabResults(2));
    content.mockResolvedValue(contentResults(1));

    const result = await hybridRanker({ domainId: 'domain-123', limit: 10 });
    const algorithms = result.map((r) => r.metadata?.algorithms?.[0]);
    expect(new Set(algorithms).size).toBeGreaterThan(1);
  });

  it('always keeps top 3 regardless of diversity', async () => {
    const { vector, collab, content } = setupHybridMocks();
    vector.mockResolvedValue([
      { productId: 'prod-1', score: 0.95, algorithm: 'vector_similarity' },
      { productId: 'prod-2', score: 0.92, algorithm: 'vector_similarity' },
      { productId: 'prod-3', score: 0.9, algorithm: 'vector_similarity' },
    ]);
    collab.mockResolvedValue([{ productId: 'prod-4', score: 0.85, algorithm: 'collaborative' }]);
    content.mockResolvedValue([]);

    const result = await hybridRanker({ domainId: 'domain-123', limit: 10 });
    expect(result.slice(0, 3).every((r) => r.metadata?.algorithms?.includes('vector'))).toBe(true);
  });
});
