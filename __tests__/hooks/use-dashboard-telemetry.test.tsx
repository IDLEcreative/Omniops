import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import { useDashboardTelemetry } from '@/hooks/use-dashboard-telemetry';

const createPayload = (overrides?: Partial<ReturnType<typeof buildMockPayload>>) => ({
  overview: {
    totalRequests: 4,
    successfulRequests: 3,
    failedRequests: 1,
    successRate: 75,
    errorRate: 25,
    activeSessions: 2,
    timeRange: 'Last 7 days',
  },
  cost: {
    total: '1.2345',
    average: '0.123000',
    projectedDaily: '2.00',
    projectedMonthly: '60.00',
    perHour: '0.05',
    trend: 'stable',
  },
  tokens: {
    totalInput: 1200,
    totalOutput: 400,
    total: 1600,
    avgPerRequest: 400,
  },
  performance: {
    avgResponseTime: 1200,
    totalSearches: 6,
    avgSearchesPerRequest: '1.5',
    avgIterations: '2.0',
  },
  modelUsage: [
    { model: 'gpt-5-mini', count: 3, cost: '0.9', tokens: 900, percentage: 75 },
  ],
  domainBreakdown: [
    { domain: 'acme.com', requests: 2, cost: '0.5000' },
  ],
  hourlyTrend: [
    { hour: '2025-09-20T10:00:00Z', cost: 0.1, requests: 2 },
  ],
  live: {
    activeSessions: 1,
    currentCost: '0.000123',
    sessionsData: [{ id: 'sess-1', uptime: 60, cost: '0.000001', model: 'gpt-5-mini' }],
  },
  health: {
    rollupFreshnessMinutes: 5,
    rollupSource: 'rollup',
    stale: false,
  },
  ...(overrides ?? {}),
});

function buildMockPayload(overrides?: Parameters<typeof createPayload>[0]) {
  return createPayload(overrides);
}

function createFetchResponse(body: unknown, ok = true, status = 200) {
  return Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(body),
  } as Response);
}

function TestComponent() {
  const { data, loading, error, refresh } = useDashboardTelemetry({ days: 7 });

  return (
    <div>
      <span data-testid="loading">{loading ? 'loading' : 'idle'}</span>
      <span data-testid="total">{data?.overview.totalRequests ?? 'none'}</span>
      <span data-testid="error">{error?.message ?? ''}</span>
      <button type="button" data-testid="refresh" onClick={() => refresh()}>
        Refresh
      </button>
    </div>
  );
}

describe('useDashboardTelemetry', () => {
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

  it('loads telemetry data on mount and handles refresh', async () => {
    const payload = buildMockPayload();
    (global.fetch as jest.Mock)
      .mockImplementationOnce(() => createFetchResponse(payload))
      .mockImplementationOnce(() =>
        createFetchResponse(
          buildMockPayload({
            overview: {
              ...payload.overview,
              totalRequests: 10,
            },
          }),
        ),
      );

    render(<TestComponent />);

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));
    expect(screen.getByTestId('total').textContent).toBe('4');
    expect(screen.getByTestId('error').textContent).toBe('');

    fireEvent.click(screen.getByTestId('refresh'));

    await waitFor(() => expect(screen.getByTestId('total').textContent).toBe('10'));
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('captures fetch errors and clears data', async () => {
    (global.fetch as jest.Mock).mockImplementation(() =>
      createFetchResponse({ message: 'error' }, false, 500),
    );

    render(<TestComponent />);

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('idle'));
    expect(screen.getByTestId('total').textContent).toBe('none');
    expect(screen.getByTestId('error').textContent).toContain('Failed to load telemetry (500)');
  });
});
