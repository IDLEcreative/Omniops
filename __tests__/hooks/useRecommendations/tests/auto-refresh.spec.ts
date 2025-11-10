import { waitFor } from '@testing-library/react';
import {
  defaultOptions,
  mockRecommendations,
  renderRecommendationsHook,
  setupRecommendationsTest,
} from '../helpers/test-harness';

describe('useRecommendations – auto refresh', () => {
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

  it('auto-refreshes when enabled', async () => {
    renderRecommendationsHook({ ...defaultOptions, autoRefresh: true, refreshInterval: 10000 });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    fetchMock.mockClear();
    jest.advanceTimersByTime(10000);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  });

  it('uses default refresh interval (30s)', async () => {
    renderRecommendationsHook({ ...defaultOptions, autoRefresh: true });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    fetchMock.mockClear();
    jest.advanceTimersByTime(30000);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  });

  it('does not auto-refresh when disabled', async () => {
    renderRecommendationsHook({ ...defaultOptions, autoRefresh: false });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    fetchMock.mockClear();
    jest.advanceTimersByTime(60000);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
