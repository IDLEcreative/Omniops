import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { useDashboardAnalytics } from '@/hooks/use-dashboard-analytics';
import { createFetchResponse } from '../../shared/dashboard-test-utils';
import { createMockAnalytics } from './analytics-mocks';

function TestComponent() {
  const { data, loading } = useDashboardAnalytics({ days: 7 });

  return (
    <div>
      <span data-testid="loading">{loading ? 'loading' : 'idle'}</span>
      <span data-testid="response-time">{data?.responseTime ?? 'none'}</span>
    </div>
  );
}

describe('useDashboardAnalytics - Edge Cases', () => {
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
