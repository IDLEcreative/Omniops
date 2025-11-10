import { jest } from '@jest/globals';
import { vectorSimilarityRecommendations } from '@/lib/recommendations/vector-similarity';
import { collaborativeFilterRecommendations } from '@/lib/recommendations/collaborative-filter';
import { contentBasedRecommendations } from '@/lib/recommendations/content-filter';

export function setupHybridMocks() {
  jest.clearAllMocks();
  const vector = jest.mocked(vectorSimilarityRecommendations);
  const collab = jest.mocked(collaborativeFilterRecommendations);
  const content = jest.mocked(contentBasedRecommendations);
  return { vector, collab, content };
}
