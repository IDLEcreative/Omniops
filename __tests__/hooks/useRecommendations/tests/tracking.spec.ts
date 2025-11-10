import { waitFor } from '@testing-library/react';
import {
  defaultOptions,
  mockRecommendations,
  renderRecommendationsHook,
  setupRecommendationsTest,
} from '../helpers/test-harness';

describe('useRecommendations – tracking events', () => {
  let fetchMock: jest.Mock;
  let cleanup: () => void;

  beforeEach(() => {
    ({ fetchMock, cleanup } = setupRecommendationsTest());
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { recommendations: mockRecommendations } }),
    } as Response);
  });

  afterEach(() => cleanup());

  it('tracks click events', async () => {
    const { result } = renderRecommendationsHook();
    await waitFor(() => expect(result.current.loading).toBe(false));

    fetchMock.mockClear();
    await result.current.trackClick('product-1');

    expect(fetchMock).toHaveBeenCalledWith('/api/recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: 'product-1',
        eventType: 'click',
        sessionId: 'test-session',
        conversationId: 'test-conversation',
      }),
    });
  });

  it('tracks purchase events', async () => {
    const { result } = renderRecommendationsHook();
    await waitFor(() => expect(result.current.loading).toBe(false));

    fetchMock.mockClear();
    await result.current.trackPurchase('product-1');

    expect(fetchMock).toHaveBeenCalledWith('/api/recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: 'product-1',
        eventType: 'purchase',
        sessionId: 'test-session',
        conversationId: 'test-conversation',
      }),
    });
  });

  it('swallows tracking errors', async () => {
    const { result } = renderRecommendationsHook();
    await waitFor(() => expect(result.current.loading).toBe(false));

    fetchMock.mockRejectedValue(new Error('Network error'));
    await expect(result.current.trackClick('product-1')).resolves.not.toThrow();
  });
});
