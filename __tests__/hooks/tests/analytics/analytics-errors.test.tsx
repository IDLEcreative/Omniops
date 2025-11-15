import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { useDashboardAnalytics } from '@/hooks/use-dashboard-analytics';
import { createFetchResponse, createAbortError, createMalformedJSONResponse } from '../../shared/dashboard-test-utils';

function TestComponent() {
  const { data, loading, error } = useDashboardAnalytics({ days: 7 });

  return (
    <div>
      <span data-testid="loading">{loading ? 'loading' : 'idle'}</span>
      <span data-testid="response-time">{data?.responseTime ?? 'none'}</span>
      <span data-testid="error">{error?.message ?? ''}</span>
    </div>
  );
}

describe('useDashboardAnalytics - Error Handling', () => {
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
  });

  it('handles abort errors silently', async () => {
    (global.fetch as jest.Mock).mockImplementation(() => Promise.reject(createAbortError()));

    render(<TestComponent />);

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));
    expect(screen.getByTestId('error').textContent).toBe('');
    expect(screen.getByTestId('response-time').textContent).toBe('none');
  });

  it('handles malformed JSON response', async () => {
    (global.fetch as jest.Mock).mockImplementation(() => createMalformedJSONResponse());

    render(<TestComponent />);

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));
    expect(screen.getByTestId('error').textContent).toContain('Invalid JSON');
    expect(screen.getByTestId('response-time').textContent).toBe('none');
  });
});
