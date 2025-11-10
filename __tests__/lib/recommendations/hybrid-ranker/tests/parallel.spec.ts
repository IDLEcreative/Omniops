import { describe, it, expect } from '@jest/globals';
import { hybridRanker } from '@/lib/recommendations/hybrid-ranker';
import { setupHybridMocks } from '../helpers/setupMocks';

describe('hybridRanker – parallel execution', () => {
  it('runs all algorithms', async () => {
    const { vector, collab, content } = setupHybridMocks();
    vector.mockResolvedValue([{ productId: 'vec-1', score: 0.9, algorithm: 'vector_similarity' }]);
    collab.mockResolvedValue([{ productId: 'collab-1', score: 0.85, algorithm: 'collaborative' }]);
    content.mockResolvedValue([{ productId: 'content-1', score: 0.8, algorithm: 'content_based' }]);

    await hybridRanker({ domainId: 'domain-123', limit: 5 });

    expect(vector).toHaveBeenCalled();
    expect(collab).toHaveBeenCalled();
    expect(content).toHaveBeenCalled();
  });

  it('requests 2x limit from each algorithm', async () => {
    const { vector, collab, content } = setupHybridMocks();
    vector.mockResolvedValue([]);
    collab.mockResolvedValue([]);
    content.mockResolvedValue([]);

    await hybridRanker({ domainId: 'domain-123', limit: 5 });

    expect(vector).toHaveBeenCalledWith(expect.objectContaining({ limit: 10 }));
    expect(collab).toHaveBeenCalledWith(expect.objectContaining({ limit: 10 }));
    expect(content).toHaveBeenCalledWith(expect.objectContaining({ limit: 10 }));
  });

  it('passes through request parameters', async () => {
    const { vector, collab, content } = setupHybridMocks();
    vector.mockResolvedValue([]);
    collab.mockResolvedValue([]);
    content.mockResolvedValue([]);

    const context = { detectedIntent: 'test' };
    await hybridRanker({
      domainId: 'domain-123',
      sessionId: 'session-123',
      userId: 'user-456',
      productIds: ['prod-1'],
      categories: ['cat-1'],
      tags: ['tag-1'],
      excludeProductIds: ['prod-2'],
      context,
      limit: 5,
    });

    expect(vector).toHaveBeenCalledWith(expect.objectContaining({ productIds: ['prod-1'], context }));
    expect(collab).toHaveBeenCalledWith(expect.objectContaining({ sessionId: 'session-123', userId: 'user-456' }));
    expect(content).toHaveBeenCalledWith(expect.objectContaining({ categories: ['cat-1'], tags: ['tag-1'] }));
  });
});
