import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen } from '@/__tests__/utils/test-utils';
import TelemetryPage from '@/app/dashboard/telemetry/page';

const mockRefresh = jest.fn();

jest.mock('@/hooks/use-dashboard-telemetry', () => {
  const originalModule = jest.requireActual('@/hooks/use-dashboard-telemetry');
  return {
    ...originalModule,
    useDashboardTelemetry: jest.fn(),
  };
});

const { useDashboardTelemetry } = jest.requireMock('@/hooks/use-dashboard-telemetry');

function createMockPayload() {
  return {
    overview: {
      totalRequests: 12,
      successfulRequests: 10,
      failedRequests: 2,
      successRate: 83,
      errorRate: 17,
      activeSessions: 4,
      timeRange: 'Last 24 hours',
    },
    cost: {
      total: '3.4567',
      average: '0.123400',
      projectedDaily: '8.00',
      projectedMonthly: '120.00',
      perHour: '0.14',
      trend: 'stable' as const,
    },
    tokens: {
      totalInput: 5200,
      totalOutput: 1600,
      total: 6800,
      avgPerRequest: 567,
    },
    performance: {
      avgResponseTime: 1400,
      totalSearches: 18,
      avgSearchesPerRequest: '1.5',
      avgIterations: '2.1',
    },
    modelUsage: [
      { model: 'gpt-5-mini', count: 8, cost: '2.3456', tokens: 4200, percentage: 67 },
      { model: 'gpt-4.1', count: 4, cost: '1.1111', tokens: 2600, percentage: 33 },
    ],
    domainBreakdown: [
      { domain: 'acme.com', requests: 7, cost: '1.2345' },
      { domain: 'globex.com', requests: 5, cost: '2.2222' },
    ],
    hourlyTrend: [
      { hour: '2025-09-20T12:00:00Z', cost: 0.2, requests: 3 },
      { hour: '2025-09-20T13:00:00Z', cost: 0.15, requests: 4 },
    ],
    live: {
      activeSessions: 3,
      currentCost: '0.004321',
      sessionsData: [
        { id: 'sess-1', uptime: 45, cost: '0.000321', model: 'gpt-5-mini' },
        { id: 'sess-2', uptime: 90, cost: '0.000654', model: 'gpt-4.1' },
      ],
    },
    health: {
      rollupFreshnessMinutes: 8,
      rollupSource: 'rollup' as const,
      stale: false,
    },
  };
}

describe('TelemetryPage', () => {
  beforeEach(() => {
    mockRefresh.mockReset();
    (useDashboardTelemetry as jest.Mock).mockReturnValue({
      data: createMockPayload(),
      loading: false,
      error: null,
      refresh: mockRefresh,
    });
  });

  it('renders key telemetry metrics and rollup health indicator', () => {
    render(<TelemetryPage />);

    expect(screen.getByText('Telemetry & Cost Control')).toBeInTheDocument();
    expect(screen.getByText('Rollups fresh')).toBeInTheDocument();
    expect(screen.getByText(/Last rollup/i)).toBeInTheDocument();

    expect(screen.getByText('Total Requests')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();

    expect(screen.getByText('Active Sessions')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();

    expect(screen.getByText('Average Response Time')).toBeInTheDocument();
    expect(screen.getByText('1.4 s')).toBeInTheDocument();

    expect(screen.getByText('Cost Trend')).toBeInTheDocument();
    expect(screen.getByText('$3.46')).toBeInTheDocument();

    expect(screen.getByText('Domain breakdown')).toBeInTheDocument();
    expect(screen.getByText('acme.com')).toBeInTheDocument();
    expect(screen.getByText('$1.23')).toBeInTheDocument();
    expect(screen.getByText('globex.com')).toBeInTheDocument();
    expect(screen.getByText('$2.22')).toBeInTheDocument();

    expect(screen.getByText('Model Usage')).toBeInTheDocument();
    expect(screen.getByText('gpt-5-mini')).toBeInTheDocument();
    expect(screen.getByText('gpt-4.1')).toBeInTheDocument();
  });

  it('renders error alert when hook returns an error', () => {
    (useDashboardTelemetry as jest.Mock).mockReturnValueOnce({
      data: null,
      loading: false,
      error: new Error('Failed to load telemetry (500)'),
      refresh: mockRefresh,
    });

    render(<TelemetryPage />);

    expect(
      screen.getByText(/Unable to load telemetry metrics/i),
    ).toBeInTheDocument();
  });
});
