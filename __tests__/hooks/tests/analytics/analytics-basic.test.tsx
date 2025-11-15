import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { useDashboardAnalytics } from '@/hooks/use-dashboard-analytics';
import { createFetchResponse } from '../../shared/dashboard-test-utils';
import { createMockAnalytics } from './analytics-mocks';

function TestComponent({ days = 7, disabled = false }: { days?: number; disabled?: boolean }) {
  const { data, loading, error } = useDashboardAnalytics({ days, disabled });

  return (
    <div>
      <span data-testid="loading">{loading ? 'loading' : 'idle'}</span>
      <span data-testid="response-time">{data?.responseTime ?? 'none'}</span>
      <span data-testid="satisfaction">{data?.satisfactionScore ?? 'none'}</span>
      <span data-testid="resolution">{data?.resolutionRate ?? 'none'}</span>
      <span data-testid="error">{error?.message ?? ''}</span>
    </div>
  );
}

describe('useDashboardAnalytics - Basic Loading', () => {
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

  it('does not fetch when disabled', async () => {
    (global.fetch as jest.Mock).mockImplementation(() => createFetchResponse(createMockAnalytics()));

    render(<TestComponent disabled={true} />);

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'), { timeout: 1000 });
    expect(global.fetch).not.toHaveBeenCalled();
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
});
