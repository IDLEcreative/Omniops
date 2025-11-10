import { describe, it, expect } from '@jest/globals';
import { hybridRanker } from '@/lib/recommendations/hybrid-ranker';
import { setupHybridMocks } from '../helpers/setupMocks';

describe('hybridRanker – error handling', () => {
  it('returns empty array if any algorithm rejects', async () => {
    const { vector, collab, content } = setupHybridMocks();
    vector.mockRejectedValue(new Error('Vector failed'));
    collab.mockResolvedValue([{ productId: 'prod-1', score: 0.85, algorithm: 'collaborative' }]);
    content.mockResolvedValue([]);

    const result = await hybridRanker({ domainId: 'domain-123', limit: 5 });
    expect(result).toEqual([]);
  });

  it('returns empty array if all algorithms return empty', async () => {
    const { vector, collab, content } = setupHybridMocks();
    vector.mockResolvedValue([]);
    collab.mockResolvedValue([]);
    content.mockResolvedValue([]);

    const result = await hybridRanker({ domainId: 'domain-123', limit: 5 });
    expect(result).toEqual([]);
  });
});
