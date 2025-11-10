import { renderHook } from '@testing-library/react';
import { useRecommendations } from '@/hooks/useRecommendations';

export const defaultOptions = {
  sessionId: 'test-session',
  conversationId: 'test-conversation',
  domainId: 'test-domain',
  limit: 5,
};

export const mockRecommendations = [
  {
    productId: 'product-1',
    score: 0.95,
    algorithm: 'hybrid',
    reason: 'Highly recommended',
    metadata: {},
  },
  {
    productId: 'product-2',
    score: 0.85,
    algorithm: 'vector_similarity',
    reason: 'Similar products',
    metadata: {},
  },
];

const originalFetch = global.fetch;

export function setupRecommendationsTest() {
  const fetchMock = jest.fn();
  global.fetch = fetchMock as unknown as typeof fetch;
  jest.useFakeTimers();

  const cleanup = () => {
    jest.useRealTimers();
    fetchMock.mockReset();
    global.fetch = originalFetch;
  };

  return { fetchMock, cleanup };
}

export function renderRecommendationsHook(options = defaultOptions) {
  return renderHook(() => useRecommendations(options));
}
