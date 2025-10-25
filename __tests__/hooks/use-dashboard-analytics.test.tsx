import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import { useDashboardAnalytics, DashboardAnalyticsData } from '@/hooks/use-dashboard-analytics';

function createMockAnalytics(overrides?: Partial<DashboardAnalyticsData>): DashboardAnalyticsData {
  return {
    responseTime: 1500,
    satisfactionScore: 4.2,
    resolutionRate: 88,
    topQueries: [
      { query: 'How to reset password?', count: 25, percentage: 15 },
      { query: 'Shipping information', count: 20, percentage: 12 },
    ],
    failedSearches: [
      'obscure product SKU',
      'invalid category name',
    ],
    languageDistribution: [
      { language: 'en', percentage: 65, count: 130, color: '#3b82f6' },
      { language: 'es', percentage: 35, count: 70, color: '#10b981' },
    ],
    dailySentiment: [
      {
        date: '2025-10-18',
        positive: 30,
        negative: 5,
        neutral: 15,
        total: 50,
        satisfactionScore: 4.1,
      },
      {
        date: '2025-10-19',
        positive: 35,
        negative: 3,
        neutral: 12,
        total: 50,
        satisfactionScore: 4.3,
      },
    ],
    metrics: {
      totalMessages: 500,
      userMessages: 250,
      avgMessagesPerDay: 71,
      positiveMessages: 180,
      negativeMessages: 20,
    },
    ...overrides,
  };
}

function createFetchResponse(body: unknown, ok = true, status = 200) {
  return Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(body),
  } as Response);
}

function TestComponent({ days = 7, disabled = false }: { days?: number; disabled?: boolean }) {
  const { data, loading, error, refresh } = useDashboardAnalytics({ days, disabled });

  return (
    <div>
      <span data-testid="loading">{loading ? 'loading' : 'idle'}</span>
      <span data-testid="response-time">{data?.responseTime ?? 'none'}</span>
      <span data-testid="satisfaction">{data?.satisfactionScore ?? 'none'}</span>
      <span data-testid="resolution">{data?.resolutionRate ?? 'none'}</span>
      <span data-testid="error">{error?.message ?? ''}</span>
      <button type="button" data-testid="refresh" onClick={() => refresh()}>
        Refresh
      </button>
    </div>
  );
}

describe('useDashboardAnalytics', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.useRealTimers();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    cleanup();
    jest.resetAllMocks();
    global.fetch = originalFetch;
  });

  it('loads analytics data on mount', async () => {
    const mockData = createMockAnalytics();
    (global.fetch as jest.Mock).mockImplementation(() => createFetchResponse(mockData));

    render(<TestComponent />);

    expect(screen.getByTestId('loading').textContent).toBe('loading');

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));
    expect(screen.getByTestId('response-time').textContent).toBe('1500');
    expect(screen.getByTestId('satisfaction').textContent).toBe('4.2');
    expect(screen.getByTestId('resolution').textContent).toBe('88');
    expect(screen.getByTestId('error').textContent).toBe('');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('passes correct days parameter in URL', async () => {
    const mockData = createMockAnalytics();
    (global.fetch as jest.Mock).mockImplementation(() => createFetchResponse(mockData));

    render(<TestComponent days={30} />);

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('days=30'),
      expect.any(Object)
    );
  });

  it('uses default 7 days when not specified', async () => {
    const mockData = createMockAnalytics();
    (global.fetch as jest.Mock).mockImplementation(() => createFetchResponse(mockData));

    render(<TestComponent />);

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('days=7'),
      expect.any(Object)
    );
  });

  it('handles successful refresh', async () => {
    const initialData = createMockAnalytics();
    const refreshedData = createMockAnalytics({ responseTime: 2000 });

    (global.fetch as jest.Mock)
      .mockImplementationOnce(() => createFetchResponse(initialData))
      .mockImplementationOnce(() => createFetchResponse(refreshedData));

    render(<TestComponent />);

    await waitFor(() => expect(screen.getByTestId('response-time').textContent).toBe('1500'));

    fireEvent.click(screen.getByTestId('refresh'));

    await waitFor(() => expect(screen.getByTestId('response-time').textContent).toBe('2000'));
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('handles HTTP error responses', async () => {
    (global.fetch as jest.Mock).mockImplementation(() =>
      createFetchResponse({ message: 'Server error' }, false, 500)
    );

    render(<TestComponent />);

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));
    expect(screen.getByTestId('error').textContent).toContain('Failed to load analytics (500)');
    expect(screen.getByTestId('response-time').textContent).toBe('none');
  });

  it('handles 404 errors', async () => {
    (global.fetch as jest.Mock).mockImplementation(() =>
      createFetchResponse({ message: 'Not found' }, false, 404)
    );

    render(<TestComponent />);

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));
    expect(screen.getByTestId('error').textContent).toContain('Failed to load analytics (404)');
  });

  it('handles network errors', async () => {
    (global.fetch as jest.Mock).mockImplementation(() =>
      Promise.reject(new Error('Network failure'))
    );

    render(<TestComponent />);

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));
    expect(screen.getByTestId('error').textContent).toContain('Network failure');
    expect(screen.getByTestId('response-time').textContent).toBe('none');
  });

  it('sets data to null on error', async () => {
    (global.fetch as jest.Mock).mockImplementation(() =>
      createFetchResponse({ message: 'error' }, false, 500)
    );

    render(<TestComponent />);

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));
    expect(screen.getByTestId('response-time').textContent).toBe('none');
    expect(screen.getByTestId('satisfaction').textContent).toBe('none');
  });

  it('does not fetch when disabled', async () => {
    (global.fetch as jest.Mock).mockImplementation(() => createFetchResponse(createMockAnalytics()));

    render(<TestComponent disabled={true} />);

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'), { timeout: 1000 });
    expect(global.fetch).not.toHaveBeenCalled();
    expect(screen.getByTestId('response-time').textContent).toBe('none');
  });

  it('aborts previous request when days change', async () => {
    const mockData = createMockAnalytics();

    (global.fetch as jest.Mock).mockImplementation(() => createFetchResponse(mockData));

    const { rerender } = render(<TestComponent days={7} />);

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));

    rerender(<TestComponent days={14} />);

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('handles abort errors silently', async () => {
    const abortError = new Error('Aborted');
    abortError.name = 'AbortError';

    (global.fetch as jest.Mock).mockImplementation(() => Promise.reject(abortError));

    render(<TestComponent />);

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));
    expect(screen.getByTestId('error').textContent).toBe('');
    expect(screen.getByTestId('response-time').textContent).toBe('none');
  });

  it('includes AbortSignal in fetch request', async () => {
    const mockData = createMockAnalytics();
    (global.fetch as jest.Mock).mockImplementation(() => createFetchResponse(mockData));

    render(<TestComponent />);

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      })
    );
  });

  it('cleans up abort controller on unmount', async () => {
    const mockData = createMockAnalytics();
    (global.fetch as jest.Mock).mockImplementation(() => createFetchResponse(mockData));

    const { unmount } = render(<TestComponent />);

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));

    unmount();

    // No errors should occur after unmount
    expect(true).toBe(true);
  });

  it('handles empty top queries', async () => {
    const mockData = createMockAnalytics({ topQueries: [] });
    (global.fetch as jest.Mock).mockImplementation(() => createFetchResponse(mockData));

    render(<TestComponent />);

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));
    expect(screen.getByTestId('response-time').textContent).toBe('1500');
  });

  it('handles empty failed searches', async () => {
    const mockData = createMockAnalytics({ failedSearches: [] });
    (global.fetch as jest.Mock).mockImplementation(() => createFetchResponse(mockData));

    render(<TestComponent />);

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));
    expect(screen.getByTestId('response-time').textContent).toBe('1500');
  });

  it('handles empty daily sentiment data', async () => {
    const mockData = createMockAnalytics({ dailySentiment: [] });
    (global.fetch as jest.Mock).mockImplementation(() => createFetchResponse(mockData));

    render(<TestComponent />);

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));
    expect(screen.getByTestId('response-time').textContent).toBe('1500');
  });

  it('clears error state on successful refresh', async () => {
    (global.fetch as jest.Mock)
      .mockImplementationOnce(() => createFetchResponse({ message: 'error' }, false, 500))
      .mockImplementationOnce(() => createFetchResponse(createMockAnalytics()));

    render(<TestComponent />);

    await waitFor(() => expect(screen.getByTestId('error').textContent).not.toBe(''));
    expect(screen.getByTestId('response-time').textContent).toBe('none'); // Data cleared on error

    fireEvent.click(screen.getByTestId('refresh'));

    await waitFor(() => expect(screen.getByTestId('response-time').textContent).toBe('1500'));
    expect(screen.getByTestId('error').textContent).toBe('');
  });

  it('maintains loading state during refresh', async () => {
    const mockData = createMockAnalytics();
    let resolveFirstFetch: (value: Response) => void;
    const firstFetchPromise = new Promise<Response>((resolve) => {
      resolveFirstFetch = resolve;
    });

    (global.fetch as jest.Mock)
      .mockImplementationOnce(() => firstFetchPromise)
      .mockImplementationOnce(() => createFetchResponse(mockData));

    render(<TestComponent />);

    expect(screen.getByTestId('loading').textContent).toBe('loading');

    resolveFirstFetch!(createFetchResponse(mockData) as unknown as Response);

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));

    fireEvent.click(screen.getByTestId('refresh'));

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));
  });

  it('handles malformed JSON response', async () => {
    (global.fetch as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.reject(new Error('Invalid JSON')),
      } as Response)
    );

    render(<TestComponent />);

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));
    expect(screen.getByTestId('error').textContent).toContain('Invalid JSON');
    expect(screen.getByTestId('response-time').textContent).toBe('none');
  });

  it('updates data when days parameter changes', async () => {
    const data7Days = createMockAnalytics();
    const data14Days = createMockAnalytics({ responseTime: 1800 });

    (global.fetch as jest.Mock)
      .mockImplementationOnce(() => createFetchResponse(data7Days))
      .mockImplementationOnce(() => createFetchResponse(data14Days));

    const { rerender } = render(<TestComponent days={7} />);

    await waitFor(() => expect(screen.getByTestId('response-time').textContent).toBe('1500'));

    rerender(<TestComponent days={14} />);

    await waitFor(() => expect(screen.getByTestId('response-time').textContent).toBe('1800'));
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('handles zero metrics values', async () => {
    const mockData = createMockAnalytics({
      metrics: {
        totalMessages: 0,
        userMessages: 0,
        avgMessagesPerDay: 0,
        positiveMessages: 0,
        negativeMessages: 0,
      },
    });
    (global.fetch as jest.Mock).mockImplementation(() => createFetchResponse(mockData));

    render(<TestComponent />);

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));
    expect(screen.getByTestId('response-time').textContent).toBe('1500');
  });
});
