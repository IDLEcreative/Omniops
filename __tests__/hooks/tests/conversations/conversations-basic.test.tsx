import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { useDashboardConversations } from '@/hooks/use-dashboard-conversations';
import { createFetchResponse } from '../../shared/dashboard-test-utils';
import { createMockConversations } from './conversations-mocks';

function TestComponent({ days = 7, disabled = false }: { days?: number; disabled?: boolean }) {
  const { data, loading, error } = useDashboardConversations({ days, disabled });

  return (
    <div>
      <span data-testid="loading">{loading ? 'loading' : 'idle'}</span>
      <span data-testid="total">{data?.total ?? 'none'}</span>
      <span data-testid="change">{data?.change ?? 'none'}</span>
      <span data-testid="active">{data?.statusCounts.active ?? 'none'}</span>
      <span data-testid="error">{error?.message ?? ''}</span>
    </div>
  );
}

describe('useDashboardConversations - Basic Loading', () => {
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

  it('does not fetch when disabled', async () => {
    (global.fetch as jest.Mock).mockImplementation(() => createFetchResponse(createMockConversations()));

    render(<TestComponent disabled={true} />);

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'), { timeout: 1000 });
    expect(global.fetch).not.toHaveBeenCalled();
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
});
