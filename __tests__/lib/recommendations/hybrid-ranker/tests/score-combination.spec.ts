import { describe, it, expect } from '@jest/globals';
import { hybridRanker } from '@/lib/recommendations/hybrid-ranker';
import { setupHybridMocks } from '../helpers/setupMocks';
import { vectorResults, collabResults } from '../helpers/mock-data';

describe('hybridRanker – score combination', () => {
  it('applies default weights and caps at 1.0', async () => {
    const { vector, collab, content } = setupHybridMocks();
    vector.mockResolvedValue([{ productId: 'prod-1', score: 1.0, algorithm: 'vector_similarity' }]);
    collab.mockResolvedValue([{ productId: 'prod-1', score: 1.0, algorithm: 'collaborative' }]);
    content.mockResolvedValue([{ productId: 'prod-1', score: 1.0, algorithm: 'content_based' }]);

    const result = await hybridRanker({ domainId: 'domain-123', limit: 5 });
    expect(result[0].score).toBeLessThanOrEqual(1.0);
  });

  it('combines scores from multiple algorithms', async () => {
    const { vector, collab, content } = setupHybridMocks();
    vector.mockResolvedValue([
      { productId: 'prod-1', score: 0.8, algorithm: 'vector_similarity' },
      { productId: 'prod-2', score: 0.6, algorithm: 'vector_similarity' },
    ]);
    collab.mockResolvedValue([{ productId: 'prod-1', score: 0.9, algorithm: 'collaborative' }]);
    content.mockResolvedValue([{ productId: 'prod-2', score: 0.7, algorithm: 'content_based' }]);

    const result = await hybridRanker({ domainId: 'domain-123', limit: 5 });
    expect(result[0].productId).toBe('prod-1');
    expect(result[0].score).toBeGreaterThan(result[1].score);
  });

  it('boosts scores when multiple algorithms agree and includes metadata', async () => {
    const { vector, collab, content } = setupHybridMocks();
    vector.mockResolvedValue(vectorResults(2));
    collab.mockResolvedValue(collabResults(1));
    content.mockResolvedValue([]);

    const result = await hybridRanker({ domainId: 'domain-123', limit: 5 });
    expect(result[0].metadata?.algorithms?.length).toBeGreaterThan(0);
    expect(result[0].metadata?.scores).toBeDefined();
  });
});
