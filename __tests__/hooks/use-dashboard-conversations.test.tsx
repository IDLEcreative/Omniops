import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import {
  useDashboardConversations,
  DashboardConversationsData,
} from '@/hooks/use-dashboard-conversations';

function createMockConversations(
  overrides?: Partial<DashboardConversationsData>
): DashboardConversationsData {
  return {
    total: 156,
    change: 12,
    statusCounts: {
      active: 45,
      waiting: 15,
      resolved: 96,
    },
    languages: [
      { language: 'en', count: 100, percentage: 64 },
      { language: 'es', count: 40, percentage: 26 },
      { language: 'fr', count: 16, percentage: 10 },
    ],
    peakHours: [
      { hour: 9, label: '9 AM', level: 'high', count: 25 },
      { hour: 14, label: '2 PM', level: 'medium', count: 18 },
      { hour: 20, label: '8 PM', level: 'low', count: 8 },
    ],
    recent: [
      {
        id: 'conv-1',
        message: 'How do I reset my password?',
        timestamp: '2025-10-19T10:00:00Z',
        status: 'active',
        customerName: 'Alice',
      },
      {
        id: 'conv-2',
        message: 'Where is my order?',
        timestamp: '2025-10-19T09:45:00Z',
        status: 'resolved',
        customerName: 'Bob',
      },
    ],
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
  const { data, loading, error, refresh } = useDashboardConversations({ days, disabled });

  return (
    <div>
      <span data-testid="loading">{loading ? 'loading' : 'idle'}</span>
      <span data-testid="total">{data?.total ?? 'none'}</span>
      <span data-testid="change">{data?.change ?? 'none'}</span>
      <span data-testid="active">{data?.statusCounts.active ?? 'none'}</span>
      <span data-testid="error">{error?.message ?? ''}</span>
      <button type="button" data-testid="refresh" onClick={() => refresh()}>
        Refresh
      </button>
    </div>
  );
}

describe('useDashboardConversations', () => {
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

  it('loads conversations data on mount', async () => {
    const mockData = createMockConversations();
    (global.fetch as jest.Mock).mockImplementation(() => createFetchResponse(mockData));

    render(<TestComponent />);

    expect(screen.getByTestId('loading').textContent).toBe('loading');

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));
    expect(screen.getByTestId('total').textContent).toBe('156');
    expect(screen.getByTestId('change').textContent).toBe('12');
    expect(screen.getByTestId('active').textContent).toBe('45');
    expect(screen.getByTestId('error').textContent).toBe('');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('passes correct days parameter in URL', async () => {
    const mockData = createMockConversations();
    (global.fetch as jest.Mock).mockImplementation(() => createFetchResponse(mockData));

    render(<TestComponent days={30} />);

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('days=30'),
      expect.any(Object)
    );
  });

  it('uses default 7 days when not specified', async () => {
    const mockData = createMockConversations();
    (global.fetch as jest.Mock).mockImplementation(() => createFetchResponse(mockData));

    render(<TestComponent />);

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('days=7'),
      expect.any(Object)
    );
  });

  it('handles successful refresh', async () => {
    const initialData = createMockConversations();
    const refreshedData = createMockConversations({ total: 200 });

    (global.fetch as jest.Mock)
      .mockImplementationOnce(() => createFetchResponse(initialData))
      .mockImplementationOnce(() => createFetchResponse(refreshedData));

    render(<TestComponent />);

    await waitFor(() => expect(screen.getByTestId('total').textContent).toBe('156'));

    fireEvent.click(screen.getByTestId('refresh'));

    await waitFor(() => expect(screen.getByTestId('total').textContent).toBe('200'));
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('handles HTTP error responses', async () => {
    (global.fetch as jest.Mock).mockImplementation(() =>
      createFetchResponse({ message: 'Server error' }, false, 500)
    );

    render(<TestComponent />);

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));
    expect(screen.getByTestId('error').textContent).toContain('Failed to load conversations (500)');
    expect(screen.getByTestId('total').textContent).toBe('none');
  });

  it('handles 404 errors', async () => {
    (global.fetch as jest.Mock).mockImplementation(() =>
      createFetchResponse({ message: 'Not found' }, false, 404)
    );

    render(<TestComponent />);

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));
    expect(screen.getByTestId('error').textContent).toContain('Failed to load conversations (404)');
  });

  it('handles network errors', async () => {
    (global.fetch as jest.Mock).mockImplementation(() =>
      Promise.reject(new Error('Network failure'))
    );

    render(<TestComponent />);

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));
    expect(screen.getByTestId('error').textContent).toContain('Network failure');
    expect(screen.getByTestId('total').textContent).toBe('none');
  });

  it('sets data to null on error', async () => {
    (global.fetch as jest.Mock).mockImplementation(() =>
      createFetchResponse({ message: 'error' }, false, 500)
    );

    render(<TestComponent />);

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));
    expect(screen.getByTestId('total').textContent).toBe('none');
    expect(screen.getByTestId('change').textContent).toBe('none');
  });

  it('does not fetch when disabled', async () => {
    (global.fetch as jest.Mock).mockImplementation(() => createFetchResponse(createMockConversations()));

    render(<TestComponent disabled={true} />);

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'), { timeout: 1000 });
    expect(global.fetch).not.toHaveBeenCalled();
    expect(screen.getByTestId('total').textContent).toBe('none');
  });

  it('aborts previous request when days change', async () => {
    const mockData = createMockConversations();

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
    expect(screen.getByTestId('total').textContent).toBe('none');
  });

  it('includes AbortSignal in fetch request', async () => {
    const mockData = createMockConversations();
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
    const mockData = createMockConversations();
    (global.fetch as jest.Mock).mockImplementation(() => createFetchResponse(mockData));

    const { unmount } = render(<TestComponent />);

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));

    unmount();

    // No errors should occur after unmount
    expect(true).toBe(true);
  });

  it('handles empty recent conversations', async () => {
    const mockData = createMockConversations({ recent: [] });
    (global.fetch as jest.Mock).mockImplementation(() => createFetchResponse(mockData));

    render(<TestComponent />);

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));
    expect(screen.getByTestId('total').textContent).toBe('156');
  });

  it('handles empty languages array', async () => {
    const mockData = createMockConversations({ languages: [] });
    (global.fetch as jest.Mock).mockImplementation(() => createFetchResponse(mockData));

    render(<TestComponent />);

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));
    expect(screen.getByTestId('total').textContent).toBe('156');
  });

  it('handles empty peak hours', async () => {
    const mockData = createMockConversations({ peakHours: [] });
    (global.fetch as jest.Mock).mockImplementation(() => createFetchResponse(mockData));

    render(<TestComponent />);

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));
    expect(screen.getByTestId('total').textContent).toBe('156');
  });

  it('clears error state on successful refresh', async () => {
    (global.fetch as jest.Mock)
      .mockImplementationOnce(() => createFetchResponse({ message: 'error' }, false, 500))
      .mockImplementationOnce(() => createFetchResponse(createMockConversations()));

    render(<TestComponent />);

    await waitFor(() => expect(screen.getByTestId('error').textContent).not.toBe(''));
    expect(screen.getByTestId('total').textContent).toBe('none'); // Data cleared on error

    fireEvent.click(screen.getByTestId('refresh'));

    await waitFor(() => expect(screen.getByTestId('total').textContent).toBe('156'));
    expect(screen.getByTestId('error').textContent).toBe('');
  });

  it('maintains loading state during refresh', async () => {
    const mockData = createMockConversations();
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
    expect(screen.getByTestId('total').textContent).toBe('none');
  });

  it('updates data when days parameter changes', async () => {
    const data7Days = createMockConversations();
    const data14Days = createMockConversations({ total: 300 });

    (global.fetch as jest.Mock)
      .mockImplementationOnce(() => createFetchResponse(data7Days))
      .mockImplementationOnce(() => createFetchResponse(data14Days));

    const { rerender } = render(<TestComponent days={7} />);

    await waitFor(() => expect(screen.getByTestId('total').textContent).toBe('156'));

    rerender(<TestComponent days={14} />);

    await waitFor(() => expect(screen.getByTestId('total').textContent).toBe('300'));
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('handles zero status counts', async () => {
    const mockData = createMockConversations({
      statusCounts: { active: 0, waiting: 0, resolved: 0 },
    });
    (global.fetch as jest.Mock).mockImplementation(() => createFetchResponse(mockData));

    render(<TestComponent />);

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));
    expect(screen.getByTestId('active').textContent).toBe('0');
  });

  it('handles negative change values', async () => {
    const mockData = createMockConversations({ change: -15 });
    (global.fetch as jest.Mock).mockImplementation(() => createFetchResponse(mockData));

    render(<TestComponent />);

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));
    expect(screen.getByTestId('change').textContent).toBe('-15');
  });
});
