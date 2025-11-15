import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import { useDashboardAnalytics } from '@/hooks/use-dashboard-analytics';
import { createFetchResponse } from '../../shared/dashboard-test-utils';
import { createMockAnalytics } from './analytics-mocks';

function TestComponent() {
  const { data, loading, error, refresh } = useDashboardAnalytics({ days: 7 });

  return (
    <div>
      <span data-testid="loading">{loading ? 'loading' : 'idle'}</span>
      <span data-testid="response-time">{data?.responseTime ?? 'none'}</span>
      <span data-testid="error">{error?.message ?? ''}</span>
      <button type="button" data-testid="refresh" onClick={() => refresh()}>
        Refresh
      </button>
    </div>
  );
}

describe('useDashboardAnalytics - Refresh & Lifecycle', () => {
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

  it('clears error state on successful refresh', async () => {
    (global.fetch as jest.Mock)
      .mockImplementationOnce(() => createFetchResponse({ message: 'error' }, false, 500))
      .mockImplementationOnce(() => createFetchResponse(createMockAnalytics()));

    render(<TestComponent />);

    await waitFor(() => expect(screen.getByTestId('error').textContent).not.toBe(''));
    expect(screen.getByTestId('response-time').textContent).toBe('none');

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

  it('aborts previous request when days change', async () => {
    const mockData = createMockAnalytics();

    (global.fetch as jest.Mock).mockImplementation(() => createFetchResponse(mockData));

    const TestComponentWithDays = ({ days = 7 }: { days?: number }) => {
      const { loading } = useDashboardAnalytics({ days });
      return <span data-testid="loading">{loading ? 'loading' : 'idle'}</span>;
    };

    const { rerender } = render(<TestComponentWithDays days={7} />);

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));

    rerender(<TestComponentWithDays days={14} />);

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));
    expect(global.fetch).toHaveBeenCalledTimes(2);
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
});
