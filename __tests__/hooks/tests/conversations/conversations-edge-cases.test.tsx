import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { useDashboardConversations } from '@/hooks/use-dashboard-conversations';
import { createFetchResponse } from '../../shared/dashboard-test-utils';
import { createMockConversations } from './conversations-mocks';

function TestComponent() {
  const { data, loading } = useDashboardConversations({ days: 7 });

  return (
    <div>
      <span data-testid="loading">{loading ? 'loading' : 'idle'}</span>
      <span data-testid="total">{data?.total ?? 'none'}</span>
      <span data-testid="change">{data?.change ?? 'none'}</span>
      <span data-testid="active">{data?.statusCounts.active ?? 'none'}</span>
    </div>
  );
}

describe('useDashboardConversations - Edge Cases', () => {
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
