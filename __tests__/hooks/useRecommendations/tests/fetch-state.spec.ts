import { waitFor } from '@testing-library/react';
import {
  defaultOptions,
  mockRecommendations,
  renderRecommendationsHook,
  setupRecommendationsTest,
} from '../helpers/test-harness';

describe('useRecommendations – initial fetch & error handling', () => {
  let fetchMock: jest.Mock;
  let cleanup: () => void;

  beforeEach(() => {
    const env = setupRecommendationsTest();
    fetchMock = env.fetchMock;
    cleanup = env.cleanup;
  });

  afterEach(() => {
    cleanup();
  });

  it('exposes loading state before fetch resolves', () => {
    fetchMock.mockImplementation(() => new Promise(() => {}));
    const { result } = renderRecommendationsHook();

    expect(result.current.loading).toBe(true);
    expect(result.current.recommendations).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('loads recommendations on mount', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { recommendations: mockRecommendations } }),
    } as Response);

    const { result } = renderRecommendationsHook();

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.recommendations).toEqual(mockRecommendations);
    expect(result.current.error).toBeNull();
  });

  it('builds correct query parameters', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { recommendations: [] } }),
    } as Response);

    renderRecommendationsHook({
      ...defaultOptions,
      algorithm: 'collaborative',
      context: 'looking for pumps',
      excludeProductIds: ['exclude-1', 'exclude-2'],
    });

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const callUrl = fetchMock.mock.calls[0][0] as string;
    expect(callUrl).toContain('sessionId=test-session');
    expect(callUrl).toContain('conversationId=test-conversation');
    expect(callUrl).toContain('domainId=test-domain');
    expect(callUrl).toContain('limit=5');
    expect(callUrl).toContain('algorithm=collaborative');
    expect(callUrl).toContain('context=looking+for+pumps');
    expect(callUrl).toContain('excludeProductIds=exclude-1%2Cexclude-2');
  });

  it('handles fetch rejections', async () => {
    const mockError = new Error('Network error');
    fetchMock.mockRejectedValue(mockError);

    const { result } = renderRecommendationsHook();

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toEqual(mockError);
    expect(result.current.recommendations).toEqual([]);
  });

  it('handles API failures (non-OK response)', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500 } as Response);
    const { result } = renderRecommendationsHook();

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeTruthy();
    expect(result.current.recommendations).toEqual([]);
  });

  it('handles malformed API payloads', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ success: false, error: 'Invalid domain ID' }),
    } as Response);

    const { result } = renderRecommendationsHook();

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeTruthy();
    expect(result.current.recommendations).toEqual([]);
  });
});
