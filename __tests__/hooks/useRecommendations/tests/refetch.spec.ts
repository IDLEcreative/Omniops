import { waitFor } from '@testing-library/react';
import {
  defaultOptions,
  mockRecommendations,
  renderRecommendationsHook,
  setupRecommendationsTest,
} from '../helpers/test-harness';

describe('useRecommendations – refetch behavior', () => {
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

  it('refetches on explicit refetch call', async () => {
    const { result } = renderRecommendationsHook();
    await waitFor(() => expect(result.current.loading).toBe(false));

    fetchMock.mockClear();
    await result.current.refetch();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('sets loading state during refetch', async () => {
    const { result } = renderRecommendationsHook();
    await waitFor(() => expect(result.current.loading).toBe(false));

    const refetchPromise = result.current.refetch();
    expect(result.current.loading).toBe(true);

    await refetchPromise;
    await waitFor(() => expect(result.current.loading).toBe(false));
  });
});
