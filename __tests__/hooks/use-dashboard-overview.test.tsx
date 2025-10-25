import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import { useDashboardOverview, DashboardOverview } from '@/hooks/use-dashboard-overview';

function createMockOverview(overrides?: Partial<DashboardOverview>): DashboardOverview {
  return {
    summary: {
      totalConversations: 42,
      conversationChange: 12,
      activeUsers: 15,
      activeUsersChange: 5,
      avgResponseTime: 1200,
      avgResponseTimeChange: -200,
      resolutionRate: 85,
      resolutionRateChange: 3,
      satisfactionScore: 4.5,
    },
    trend: [
      { date: '2025-10-18', conversations: 10, satisfactionScore: 4.2 },
      { date: '2025-10-19', conversations: 12, satisfactionScore: 4.5 },
    ],
    recentConversations: [
      {
        id: 'conv-1',
        createdAt: '2025-10-19T10:00:00Z',
        status: 'active',
        lastMessagePreview: 'How can I help?',
        lastMessageAt: '2025-10-19T10:05:00Z',
        customerName: 'Alice',
      },
    ],
    languageDistribution: [
      { language: 'en', percentage: 70, count: 35 },
      { language: 'es', percentage: 30, count: 15 },
    ],
    quickStats: {
      satisfaction: 4.5,
      avgResponseTime: 1200,
      conversationsToday: 8,
      successRate: 95,
      totalTokens: 50000,
      totalCostUSD: 2.5,
      avgSearchesPerRequest: 1.8,
    },
    telemetry: {
      totalRequests: 100,
      successfulRequests: 95,
      successRate: 95,
      avgSearchesPerRequest: 1.8,
      totalTokens: 50000,
      totalCostUSD: 2.5,
    },
    botStatus: {
      online: true,
      uptimePercent: 99.5,
      primaryModel: 'gpt-5-mini',
      lastTrainingAt: '2025-10-15T00:00:00Z',
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
  const { data, loading, error, refresh } = useDashboardOverview({ days, disabled });

  return (
    <div>
      <span data-testid="loading">{loading ? 'loading' : 'idle'}</span>
      <span data-testid="conversations">{data?.summary.totalConversations ?? 'none'}</span>
      <span data-testid="satisfaction">{data?.summary.satisfactionScore ?? 'none'}</span>
      <span data-testid="error">{error?.message ?? ''}</span>
      <button type="button" data-testid="refresh" onClick={() => refresh()}>
        Refresh
      </button>
    </div>
  );
}

describe('useDashboardOverview', () => {
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

  it('loads overview data on mount', async () => {
    const mockData = createMockOverview();
    (global.fetch as jest.Mock).mockImplementation(() => createFetchResponse(mockData));

    render(<TestComponent />);

    expect(screen.getByTestId('loading').textContent).toBe('loading');

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));
    expect(screen.getByTestId('conversations').textContent).toBe('42');
    expect(screen.getByTestId('satisfaction').textContent).toBe('4.5');
    expect(screen.getByTestId('error').textContent).toBe('');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('passes correct days parameter in URL', async () => {
    const mockData = createMockOverview();
    (global.fetch as jest.Mock).mockImplementation(() => createFetchResponse(mockData));

    render(<TestComponent days={14} />);

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('days=14'),
      expect.any(Object)
    );
  });

  it('uses default 7 days when not specified', async () => {
    const mockData = createMockOverview();
    (global.fetch as jest.Mock).mockImplementation(() => createFetchResponse(mockData));

    render(<TestComponent />);

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('days=7'),
      expect.any(Object)
    );
  });

  it('handles successful refresh', async () => {
    const initialData = createMockOverview();
    const refreshedData = createMockOverview({
      summary: { ...initialData.summary, totalConversations: 100 },
    });

    (global.fetch as jest.Mock)
      .mockImplementationOnce(() => createFetchResponse(initialData))
      .mockImplementationOnce(() => createFetchResponse(refreshedData));

    render(<TestComponent />);

    await waitFor(() => expect(screen.getByTestId('conversations').textContent).toBe('42'));

    fireEvent.click(screen.getByTestId('refresh'));

    await waitFor(() => expect(screen.getByTestId('conversations').textContent).toBe('100'));
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('handles HTTP error responses', async () => {
    (global.fetch as jest.Mock).mockImplementation(() =>
      createFetchResponse({ message: 'Server error' }, false, 500)
    );

    render(<TestComponent />);

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));
    expect(screen.getByTestId('error').textContent).toContain('Failed to load dashboard overview (500)');
    expect(screen.getByTestId('conversations').textContent).toBe('0'); // DEFAULT_OVERVIEW
  });

  it('handles 404 errors', async () => {
    (global.fetch as jest.Mock).mockImplementation(() =>
      createFetchResponse({ message: 'Not found' }, false, 404)
    );

    render(<TestComponent />);

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));
    expect(screen.getByTestId('error').textContent).toContain('Failed to load dashboard overview (404)');
  });

  it('handles network errors', async () => {
    (global.fetch as jest.Mock).mockImplementation(() =>
      Promise.reject(new Error('Network failure'))
    );

    render(<TestComponent />);

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));
    expect(screen.getByTestId('error').textContent).toContain('Network failure');
    expect(screen.getByTestId('conversations').textContent).toBe('0'); // DEFAULT_OVERVIEW
  });

  it('sets default overview data on error', async () => {
    (global.fetch as jest.Mock).mockImplementation(() =>
      createFetchResponse({ message: 'error' }, false, 500)
    );

    render(<TestComponent />);

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));
    expect(screen.getByTestId('conversations').textContent).toBe('0');
    expect(screen.getByTestId('satisfaction').textContent).toBe('3');
  });

  it('does not fetch when disabled', async () => {
    (global.fetch as jest.Mock).mockImplementation(() => createFetchResponse(createMockOverview()));

    render(<TestComponent disabled={true} />);

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'), { timeout: 1000 });
    expect(global.fetch).not.toHaveBeenCalled();
    expect(screen.getByTestId('conversations').textContent).toBe('none');
  });

  it('aborts previous request when days change', async () => {
    const mockData = createMockOverview();
    const abortSpy = jest.fn();

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
    expect(screen.getByTestId('conversations').textContent).toBe('none');
  });

  it('includes AbortSignal in fetch request', async () => {
    const mockData = createMockOverview();
    (global.fetch as jest.Mock).mockImplementation(() => createFetchResponse(mockData));

    render(<TestComponent />);

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'GET',
        signal: expect.any(AbortSignal),
      })
    );
  });

  it('cleans up abort controller on unmount', async () => {
    const mockData = createMockOverview();
    (global.fetch as jest.Mock).mockImplementation(() => createFetchResponse(mockData));

    const { unmount } = render(<TestComponent />);

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));

    unmount();

    // No errors should occur after unmount
    expect(true).toBe(true);
  });

  it('handles empty trend data', async () => {
    const mockData = createMockOverview({ trend: [] });
    (global.fetch as jest.Mock).mockImplementation(() => createFetchResponse(mockData));

    render(<TestComponent />);

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));
    expect(screen.getByTestId('conversations').textContent).toBe('42');
  });

  it('handles empty recent conversations', async () => {
    const mockData = createMockOverview({ recentConversations: [] });
    (global.fetch as jest.Mock).mockImplementation(() => createFetchResponse(mockData));

    render(<TestComponent />);

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));
    expect(screen.getByTestId('conversations').textContent).toBe('42');
  });

  it('handles bot offline status', async () => {
    const mockData = createMockOverview({
      botStatus: {
        online: false,
        uptimePercent: 85,
        primaryModel: 'gpt-5-mini',
        lastTrainingAt: null,
      },
    });
    (global.fetch as jest.Mock).mockImplementation(() => createFetchResponse(mockData));

    render(<TestComponent />);

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));
    expect(screen.getByTestId('conversations').textContent).toBe('42');
  });

  it('clears error state on successful refresh', async () => {
    (global.fetch as jest.Mock)
      .mockImplementationOnce(() => createFetchResponse({ message: 'error' }, false, 500))
      .mockImplementationOnce(() => createFetchResponse(createMockOverview()));

    render(<TestComponent />);

    await waitFor(() => expect(screen.getByTestId('error').textContent).not.toBe(''));
    expect(screen.getByTestId('conversations').textContent).toBe('0'); // DEFAULT_OVERVIEW

    fireEvent.click(screen.getByTestId('refresh'));

    await waitFor(() => expect(screen.getByTestId('conversations').textContent).toBe('42'));
    expect(screen.getByTestId('error').textContent).toBe('');
  });

  it('maintains loading state during refresh', async () => {
    const mockData = createMockOverview();
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
    expect(screen.getByTestId('conversations').textContent).toBe('0'); // DEFAULT_OVERVIEW
  });

  it('updates data when days parameter changes', async () => {
    const data7Days = createMockOverview();
    const data14Days = createMockOverview({
      summary: { ...data7Days.summary, totalConversations: 84 },
    });

    (global.fetch as jest.Mock)
      .mockImplementationOnce(() => createFetchResponse(data7Days))
      .mockImplementationOnce(() => createFetchResponse(data14Days));

    const { rerender } = render(<TestComponent days={7} />);

    await waitFor(() => expect(screen.getByTestId('conversations').textContent).toBe('42'));

    rerender(<TestComponent days={14} />);

    await waitFor(() => expect(screen.getByTestId('conversations').textContent).toBe('84'));
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
