import { test, expect } from '@playwright/test';

const mockTelemetryPayload = {
  overview: {
    totalRequests: 42,
    successfulRequests: 39,
    failedRequests: 3,
    successRate: 93,
    errorRate: 7,
    activeSessions: 5,
    timeRange: 'Last 7 days',
  },
  cost: {
    total: '8.9000',
    average: '0.212000',
    projectedDaily: '12.00',
    projectedMonthly: '180.00',
    perHour: '0.50',
    trend: 'increasing',
  },
  tokens: {
    totalInput: 9000,
    totalOutput: 2400,
    total: 11400,
    avgPerRequest: 271,
  },
  performance: {
    avgResponseTime: 950,
    totalSearches: 30,
    avgSearchesPerRequest: '0.7',
    avgIterations: '1.8',
  },
  modelUsage: [
    { model: 'gpt-5-mini', count: 30, cost: '6.0000', tokens: 8000, percentage: 71 },
    { model: 'gpt-4.1', count: 12, cost: '2.9000', tokens: 3400, percentage: 29 },
  ],
  domainBreakdown: [
    { domain: 'acme.com', requests: 26, cost: '4.5000' },
    { domain: 'globex.com', requests: 16, cost: '4.4000' },
  ],
  hourlyTrend: [
    { hour: '2025-09-20T12:00:00Z', cost: 0.4, requests: 6 },
    { hour: '2025-09-20T13:00:00Z', cost: 0.5, requests: 8 },
  ],
  live: {
    activeSessions: 5,
    currentCost: '0.012345',
    sessionsData: [
      { id: 'sess-1', uptime: 180, cost: '0.001234', model: 'gpt-5-mini' },
      { id: 'sess-2', uptime: 90, cost: '0.000789', model: 'gpt-4.1' },
    ],
  },
  health: {
    rollupFreshnessMinutes: 4,
    rollupSource: 'rollup',
    stale: false,
  },
};

test.describe('Telemetry dashboard smoke', () => {
  test('renders metrics and rollup health badge', async ({ page }) => {
    await page.route('**/api/dashboard/telemetry**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockTelemetryPayload),
      });
    });

    await page.goto('/dashboard/telemetry');

    await expect(page.getByRole('heading', { name: 'Telemetry & Cost Control' })).toBeVisible();
    await expect(page.getByText('Rollups fresh')).toBeVisible();

    await expect(page.getByText('Total Requests')).toBeVisible();
    await expect(page.getByText('42')).toBeVisible();

    await expect(page.getByText('Domain breakdown')).toBeVisible();
    await expect(page.getByText('acme.com')).toBeVisible();
    await expect(page.getByText('$4.50')).toBeVisible();

    await expect(page.getByText('Model Usage')).toBeVisible();
    await expect(page.getByText('gpt-5-mini')).toBeVisible();
  });
});
