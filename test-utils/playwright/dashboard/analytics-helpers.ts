/**
 * Shared test helpers for Analytics Dashboard E2E tests
 */

import { Page, expect } from '@playwright/test';

/**
 * Navigate to analytics dashboard and wait for hydration
 */
export async function setupAnalyticsDashboard(page: Page) {
  console.log('📍 Setting up test environment');

  // Set viewport for consistent testing
  await page.setViewportSize({ width: 1280, height: 720 });

  // Navigate to analytics dashboard
  console.log('📍 Navigating to /dashboard/analytics');
  await page.goto('/dashboard/analytics', {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });

  // Wait for React hydration
  console.log('📍 Waiting for page hydration');
  await page.waitForSelector('h1:has-text("Analytics Dashboard")', {
    state: 'visible',
    timeout: 10000
  });
  console.log('✅ Page loaded and hydrated');
}

/**
 * Wait for analytics API response
 */
export async function waitForAnalyticsAPI(page: Page, timeout = 3000) {
  await page.waitForTimeout(timeout);
}

/**
 * Check if element exists without throwing
 */
export async function elementExists(page: Page, selector: string): Promise<boolean> {
  return await page.locator(selector).count().then(count => count > 0);
}

/**
 * Track API calls for verification
 */
export function setupAPITracking(page: Page) {
  const apiCalls: string[] = [];

  page.on('request', request => {
    const url = request.url();
    if (url.includes('/api/dashboard/analytics') || url.includes('/api/analytics/intelligence')) {
      apiCalls.push(url);
      console.log(`📡 API called: ${url.split('?')[0]}`);
    }
  });

  return apiCalls;
}

/**
 * Mock analytics response with empty data
 */
export async function mockEmptyAnalyticsResponse(page: Page) {
  await page.route('**/api/dashboard/analytics**', async (route) => {
    console.log('📡 Intercepting analytics API - returning empty data');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        responseTime: 0,
        satisfactionScore: 0,
        resolutionRate: 0,
        topQueries: [],
        failedSearches: [],
        languageDistribution: [],
        dailySentiment: [],
        metrics: {
          totalMessages: 0,
          userMessages: 0,
          avgMessagesPerDay: 0,
          positiveMessages: 0,
          negativeMessages: 0
        },
        userMetrics: {
          dailyActiveUsers: 0,
          totalUniqueUsers: 0,
          growthRate: 0,
          growthAbsolute: 0,
        },
        sessionMetrics: {
          avgDuration: 0,
          medianDuration: 0,
          totalSessions: 0,
          bounceRate: 0,
        },
        pageViews: {
          total: 0,
          uniquePages: 0,
          avgPerSession: 0,
          topPages: [],
        },
        shoppingBehavior: {
          productViews: 0,
          uniqueProducts: 0,
          cartViews: 0,
          checkoutViews: 0,
          conversionRate: 0,
          avgProductsPerSession: 0,
        },
        dailyUsers: [],
      }),
    });
  });
}

/**
 * Mock analytics response with error
 */
export async function mockErrorAnalyticsResponse(page: Page) {
  await page.route('**/api/dashboard/analytics**', async (route) => {
    console.log('📡 Intercepting analytics API - returning error');
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({
        error: 'Internal server error',
        message: 'Failed to load analytics data'
      }),
    });
  });
}

/**
 * Verify page header controls
 */
export async function verifyHeaderControls(page: Page) {
  const checks = {
    title: false,
    description: false,
    connectionIndicator: false,
    exportButton: false,
    timeRangeSelector: false,
    refreshButton: false,
    autoRefreshToggle: false
  };

  // Title
  const pageTitle = page.getByRole('heading', { name: 'Analytics Dashboard', level: 1 });
  await expect(pageTitle).toBeVisible({ timeout: 5000 });
  checks.title = true;

  // Description
  const description = page.getByText('Comprehensive insights into your chat performance');
  await expect(description).toBeVisible({ timeout: 5000 });
  checks.description = true;

  // Connection indicator
  const connectionIndicator = page.locator('[title*="Live"], [title*="Offline"]').first();
  await expect(connectionIndicator).toBeVisible({ timeout: 5000 });
  checks.connectionIndicator = true;

  // Export button
  const exportButton = page.getByRole('button', { name: /export data/i });
  await expect(exportButton).toBeVisible({ timeout: 5000 });
  checks.exportButton = true;

  // Time range selector
  const timeRangeSelector = page.getByRole('combobox').filter({ hasText: /Last \d+ days/ });
  await expect(timeRangeSelector).toBeVisible({ timeout: 5000 });
  checks.timeRangeSelector = true;

  // Refresh button
  const refreshButton = page.locator('button').filter({ has: page.locator('svg.lucide-refresh-cw') }).first();
  await expect(refreshButton).toBeVisible({ timeout: 5000 });
  checks.refreshButton = true;

  // Auto-refresh toggle
  const autoRefreshLabel = page.getByText('Auto-refresh every 5 minutes');
  await expect(autoRefreshLabel).toBeVisible({ timeout: 5000 });
  const autoRefreshSwitch = page.locator('#auto-refresh');
  await expect(autoRefreshSwitch).toBeVisible({ timeout: 5000 });
  checks.autoRefreshToggle = true;

  return checks;
}

/**
 * Test time range selector
 */
export async function testTimeRangeSelection(page: Page, option: string) {
  const timeRangeSelector = page.getByRole('combobox').filter({ hasText: /Last \d+ days/ });
  await timeRangeSelector.click();
  await page.waitForTimeout(300);

  const optionElement = page.getByRole('option', { name: option });
  await expect(optionElement).toBeVisible({ timeout: 5000 });
  await optionElement.click();
  console.log(`✅ Selected "${option}"`);
}

/**
 * Toggle auto-refresh
 */
export async function toggleAutoRefresh(page: Page, enable: boolean) {
  const autoRefreshSwitch = page.locator('#auto-refresh');
  await expect(autoRefreshSwitch).toBeVisible({ timeout: 5000 });

  const currentState = await autoRefreshSwitch.getAttribute('data-state');
  const isChecked = currentState === 'checked';

  if ((enable && !isChecked) || (!enable && isChecked)) {
    await autoRefreshSwitch.click();
    await page.waitForTimeout(500);
  }

  const newState = await autoRefreshSwitch.getAttribute('data-state');
  expect(newState).toBe(enable ? 'checked' : 'unchecked');
  console.log(`✅ Auto-refresh ${enable ? 'enabled' : 'disabled'}`);
}

/**
 * Click refresh button
 */
export async function clickRefreshButton(page: Page) {
  // Scroll to top first to ensure button is in viewport
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);

  const refreshButton = page.locator('button[data-slot="button"]').filter({
    has: page.locator('svg.lucide-refresh-cw')
  }).first();

  await expect(refreshButton).toBeVisible({ timeout: 5000 });
  await refreshButton.evaluate((el: HTMLElement) => el.click());
  console.log('✅ Refresh button clicked');
}

/**
 * Switch between tabs
 */
export async function switchTab(page: Page, tabName: string) {
  const tab = page.getByRole('tab', { name: new RegExp(tabName, 'i') });
  await tab.click();
  await expect(tab).toHaveAttribute('data-state', 'active');
  console.log(`✅ Switched to ${tabName} tab`);
}

/**
 * Verify metric cards visibility
 */
export async function verifyMetricCards(page: Page, metrics: string[]) {
  const results: { [key: string]: boolean } = {};

  for (const metric of metrics) {
    const card = page.getByText(metric, { exact: false }).first();
    const isVisible = await card.isVisible().catch(() => false);
    results[metric] = isVisible;
    console.log(`  ${isVisible ? '✅' : '⚠️'} ${metric} card ${isVisible ? 'visible' : 'not visible'}`);
  }

  return results;
}

/**
 * Open and verify export dropdown
 */
export async function testExportDropdown(page: Page) {
  const exportButton = page.getByRole('button', { name: /export data/i });
  await exportButton.click();
  console.log('✅ Export button clicked');

  await page.waitForTimeout(500);

  // Verify dropdown options
  const exportFormatLabel = page.getByText('Export Format', { exact: true });
  await expect(exportFormatLabel).toBeVisible({ timeout: 5000 });

  const csvOption = page.getByText('Export as CSV', { exact: false });
  await expect(csvOption).toBeVisible({ timeout: 5000 });

  const excelOption = page.getByText('Export as Excel', { exact: false });
  await expect(excelOption).toBeVisible({ timeout: 5000 });

  const pdfOption = page.getByText('Export as PDF', { exact: false });
  await expect(pdfOption).toBeVisible({ timeout: 5000 });

  // Close dropdown
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
}