import { describe, it, expect } from '@jest/globals';
import { hybridRanker } from '@/lib/recommendations/hybrid-ranker';
import { setupHybridMocks } from '../helpers/setupMocks';

describe('hybridRanker – reason building', () => {
  it('produces reason for 3 algorithms agreeing', async () => {
    const { vector, collab, content } = setupHybridMocks();
    vector.mockResolvedValue([{ productId: 'prod-1', score: 0.9, algorithm: 'vector_similarity' }]);
    collab.mockResolvedValue([{ productId: 'prod-1', score: 0.85, algorithm: 'collaborative' }]);
    content.mockResolvedValue([{ productId: 'prod-1', score: 0.8, algorithm: 'content_based' }]);

    const result = await hybridRanker({ domainId: 'domain-123', limit: 5 });
    expect(result[0].reason).toBe('Highly recommended based on multiple factors');
  });

  it('produces reason for 2 algorithms agreeing', async () => {
    const { vector, collab, content } = setupHybridMocks();
    vector.mockResolvedValue([{ productId: 'prod-1', score: 0.9, algorithm: 'vector_similarity' }]);
    collab.mockResolvedValue([{ productId: 'prod-1', score: 0.85, algorithm: 'collaborative' }]);
    content.mockResolvedValue([]);

    const result = await hybridRanker({ domainId: 'domain-123', limit: 5 });
    expect(result[0].reason).toContain('vector and collaborative analysis');
  });

  it('produces reason for single algorithm', async () => {
    const { vector, collab, content } = setupHybridMocks();
    vector.mockResolvedValue([{ productId: 'prod-1', score: 0.9, algorithm: 'vector_similarity' }]);
    collab.mockResolvedValue([]);
    content.mockResolvedValue([]);

    const result = await hybridRanker({ domainId: 'domain-123', limit: 5 });
    expect(result[0].reason).toContain('Semantically similar');
  });
});
