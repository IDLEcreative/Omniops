import { waitFor } from '@testing-library/react';
import {
  defaultOptions,
  mockRecommendations,
  setupRecommendationsTest,
} from '../helpers/test-harness';
import { useRecommendations } from '@/hooks/useRecommendations';
import { renderHook } from '@testing-library/react';

describe('useRecommendations – dependency changes', () => {
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

  it('refetches when sessionId changes', async () => {
    const { rerender } = renderHook(
      ({ sessionId }) => useRecommendations({ ...defaultOptions, sessionId }),
      { initialProps: { sessionId: 'session-1' } },
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    fetchMock.mockClear();

    rerender({ sessionId: 'session-2' });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  });

  it('refetches when context changes', async () => {
    const { rerender } = renderHook(
      ({ context }) => useRecommendations({ ...defaultOptions, context }),
      { initialProps: { context: 'looking for pumps' } },
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    fetchMock.mockClear();

    rerender({ context: 'need hydraulic parts' });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  });
});
