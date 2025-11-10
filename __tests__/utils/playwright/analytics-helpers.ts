import { Page } from '@playwright/test';

export interface AnalyticsData {
  shoppingBehavior?: {
    productViews: number;
    uniqueProducts: number;
    cartViews: number;
    checkoutViews: number;
    conversionRate: number;
    avgProductsPerSession: number;
  };
  userMetrics?: {
    totalSessions: number;
    uniqueUsers: number;
    avgSessionDuration: number;
    bounceRate: number;
  };
  revenueMetrics?: {
    totalRevenue: number;
    averageOrderValue: number;
    ordersCount: number;
  };
}

export async function mockAnalyticsAPI(page: Page, data: AnalyticsData): Promise<void> {
  console.log('🔧 Setting up analytics API mock');
  await page.route('**/api/analytics**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data, timestamp: new Date().toISOString() }) });
  });
  await page.route('**/api/dashboard/analytics**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, ...data, period: '30d' }) });
  });
  console.log('✅ Analytics API mock ready');
}

export async function verifyMetricDisplayed(page: Page, metricName: string, expectedValue?: string | number): Promise<boolean> {
  console.log('📍 Verifying metric: ' + metricName);
  const metricElement = page.locator('text=' + metricName + ', [data-metric="' + metricName + '"], .metric:has-text("' + metricName + '")').first();
  const isVisible = await metricElement.isVisible({ timeout: 5000 }).catch(() => false);
  if (!isVisible) {
    console.log('⚠️  Metric "' + metricName + '" not visible');
    return false;
  }
  if (expectedValue !== undefined) {
    const text = await metricElement.textContent();
    const hasValue = text?.includes(String(expectedValue));
    if (hasValue) {
      console.log('✅ Metric "' + metricName + '" displays expected value: ' + expectedValue);
    } else {
      console.log('⚠️  Metric "' + metricName + '" visible but value does not match');
    }
    return hasValue || false;
  }
  console.log('✅ Metric "' + metricName + '" is visible');
  return true;
}

export async function mockRealtimeAnalytics(page: Page): Promise<void> {
  console.log('🔧 Setting up real-time analytics mock');
  let updateCount = 0;
  await page.route('**/api/analytics/realtime**', async (route) => {
    updateCount++;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, activeUsers: 10 + updateCount, activeSessions: 15 + updateCount, recentEvents: [{ type: 'page_view', timestamp: Date.now() - 1000 }, { type: 'product_view', timestamp: Date.now() - 2000 }], timestamp: new Date().toISOString() })
    });
  });
  console.log('✅ Real-time analytics mock ready');
}
