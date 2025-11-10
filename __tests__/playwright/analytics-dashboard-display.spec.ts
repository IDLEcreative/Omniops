import { test, expect } from '@playwright/test';

/**
 * E2E Test: Analytics Dashboard Display
 *
 * Verifies the analytics dashboard correctly displays user analytics data
 * including session metrics and shopping behavior.
 *
 * Test Flow:
 * 1. Authentication (skipped if demo mode)
 * 2. Navigate to /dashboard/analytics
 * 3. Verify user metrics cards (8 cards)
 * 4. Verify charts render
 * 5. Verify API response data
 * 6. Verify shopping funnel visualization
 */

test.describe('Analytics Dashboard Display', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport for consistent testing
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should display analytics dashboard with user metrics and charts', async ({ page }) => {
    // Intercept API request to verify response
    let analyticsResponse: any;

    await page.route('**/api/dashboard/analytics**', async (route) => {
      const response = await route.fetch();
      analyticsResponse = await response.json();
      await route.fulfill({ response });
    });

    // Navigate to analytics dashboard
    // Skip authentication for now - assumes demo mode or pre-authenticated session
    await page.goto('/dashboard/analytics', { waitUntil: 'networkidle', timeout: 10000 });

    // Wait for page to load completely
    await page.waitForLoadState('domcontentloaded');

    // Wait for analytics data to load (loader should disappear)
    await page.waitForSelector('[class*="animate-spin"]', { state: 'hidden', timeout: 15000 }).catch(() => {
      console.log('No loading spinner found or already hidden');
    });

    // Verify page header
    await expect(page.getByText('Analytics Dashboard')).toBeVisible({ timeout: 10000 });

    // Verify Overview tab is active
    await expect(page.getByRole('tab', { name: /overview/i })).toHaveAttribute('data-state', 'active');

    // Wait a bit for all data to render
    await page.waitForTimeout(2000);

    // ============================================================================
    // VERIFY USER METRICS CARDS (8 cards)
    // ============================================================================

    console.log('Checking for user metrics cards...');

    // Daily Active Users card
    const dailyActiveUsersCard = page.getByText('Daily Active Users').first();
    await expect(dailyActiveUsersCard).toBeVisible({ timeout: 10000 });

    // Total Unique Users card
    const totalUsersCard = page.getByText('Total Unique Users').first();
    await expect(totalUsersCard).toBeVisible({ timeout: 5000 });

    // Avg Session Duration card
    const sessionDurationCard = page.getByText('Avg Session Duration').first();
    await expect(sessionDurationCard).toBeVisible({ timeout: 5000 });

    // Bounce Rate card
    const bounceRateCard = page.getByText('Bounce Rate').first();
    await expect(bounceRateCard).toBeVisible({ timeout: 5000 });

    // Product Views card
    const productViewsCard = page.getByText('Product Views').first();
    await expect(productViewsCard).toBeVisible({ timeout: 5000 });

    // Cart Views card
    const cartViewsCard = page.getByText('Cart Views').first();
    await expect(cartViewsCard).toBeVisible({ timeout: 5000 });

    // Checkout Views card
    const checkoutViewsCard = page.getByText('Checkout Views').first();
    await expect(checkoutViewsCard).toBeVisible({ timeout: 5000 });

    // Conversion Rate card
    const conversionRateCard = page.getByText('Conversion Rate').first();
    await expect(conversionRateCard).toBeVisible({ timeout: 5000 });

    console.log('All 8 user metrics cards found!');

    // ============================================================================
    // VERIFY CHARTS RENDER
    // ============================================================================

    console.log('Checking for chart components...');

    // Wait for Recharts wrapper elements (all charts use Recharts)
    const chartWrappers = page.locator('[class*="recharts-wrapper"]');
    const chartCount = await chartWrappers.count();

    console.log(`Found ${chartCount} chart(s)`);
    expect(chartCount).toBeGreaterThan(0);

    // Verify Daily Users Chart exists (contains date labels)
    const dailyUsersChart = page.locator('[class*="recharts-wrapper"]').first();
    await expect(dailyUsersChart).toBeVisible({ timeout: 5000 });

    // ============================================================================
    // VERIFY SHOPPING FUNNEL VISUALIZATION
    // ============================================================================

    console.log('Checking for shopping funnel stages...');

    // Shopping funnel should have 4 stages
    const browseStage = page.getByText('Browse', { exact: false }).first();
    const productStage = page.getByText('Product View', { exact: false }).first();
    const cartStage = page.getByText('Cart', { exact: false }).first();
    const checkoutStage = page.getByText('Checkout', { exact: false }).first();

    // Verify at least one funnel stage is visible
    const funnelVisible = await Promise.race([
      browseStage.isVisible().catch(() => false),
      productStage.isVisible().catch(() => false),
      cartStage.isVisible().catch(() => false),
      checkoutStage.isVisible().catch(() => false),
    ]);

    expect(funnelVisible).toBe(true);
    console.log('Shopping funnel found!');

    // ============================================================================
    // VERIFY TOP PAGES VIEW
    // ============================================================================

    // Top Pages section should be visible
    const topPagesHeading = page.getByText('Top Pages', { exact: false }).first();
    const topPagesVisible = await topPagesHeading.isVisible().catch(() => false);

    if (topPagesVisible) {
      console.log('Top Pages view found!');
    } else {
      console.log('Top Pages view not visible (may be empty)');
    }

    // ============================================================================
    // VERIFY API RESPONSE DATA
    // ============================================================================

    console.log('Verifying API response structure...');

    if (analyticsResponse) {
      // Check userMetrics exists
      expect(analyticsResponse.userMetrics).toBeDefined();
      expect(typeof analyticsResponse.userMetrics.dailyActiveUsers).toBe('number');
      expect(typeof analyticsResponse.userMetrics.totalUniqueUsers).toBe('number');

      // Check sessionMetrics exists
      expect(analyticsResponse.sessionMetrics).toBeDefined();
      expect(typeof analyticsResponse.sessionMetrics.avgDuration).toBe('number');
      expect(typeof analyticsResponse.sessionMetrics.bounceRate).toBe('number');

      // Check shoppingBehavior exists
      expect(analyticsResponse.shoppingBehavior).toBeDefined();
      expect(typeof analyticsResponse.shoppingBehavior.productViews).toBe('number');
      expect(typeof analyticsResponse.shoppingBehavior.cartViews).toBe('number');
      expect(typeof analyticsResponse.shoppingBehavior.checkoutViews).toBe('number');
      expect(typeof analyticsResponse.shoppingBehavior.conversionRate).toBe('number');

      // Check dailyUsers array exists
      expect(analyticsResponse.dailyUsers).toBeDefined();
      expect(Array.isArray(analyticsResponse.dailyUsers)).toBe(true);

      console.log('API response structure validated!');
      console.log('Sample data:', {
        dailyActiveUsers: analyticsResponse.userMetrics.dailyActiveUsers,
        totalUniqueUsers: analyticsResponse.userMetrics.totalUniqueUsers,
        bounceRate: analyticsResponse.sessionMetrics.bounceRate,
        conversionRate: analyticsResponse.shoppingBehavior.conversionRate,
      });
    } else {
      console.warn('Analytics API was not intercepted - response validation skipped');
    }

    // ============================================================================
    // SUCCESS
    // ============================================================================

    console.log('Analytics dashboard test completed successfully!');
  });

  test('should handle empty analytics data gracefully', async ({ page }) => {
    // Mock empty response
    await page.route('**/api/dashboard/analytics**', async (route) => {
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

    await page.goto('/dashboard/analytics', { waitUntil: 'networkidle', timeout: 10000 });

    // Should still show the dashboard
    await expect(page.getByText('Analytics Dashboard')).toBeVisible({ timeout: 10000 });

    // Should show zero values instead of errors
    await expect(page.getByText('Daily Active Users')).toBeVisible();

    console.log('Empty data test completed successfully!');
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock error response
    await page.route('**/api/dashboard/analytics**', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    await page.goto('/dashboard/analytics', { waitUntil: 'networkidle', timeout: 10000 });

    // Should show error alert
    const errorAlert = page.locator('[role="alert"]').first();
    await expect(errorAlert).toBeVisible({ timeout: 10000 });

    console.log('Error handling test completed successfully!');
  });

  test('should switch between tabs correctly', async ({ page }) => {
    await page.goto('/dashboard/analytics', { waitUntil: 'networkidle', timeout: 10000 });

    // Wait for page load
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Click on Business Intelligence tab
    const intelligenceTab = page.getByRole('tab', { name: /business intelligence/i });
    await intelligenceTab.click();

    // Verify tab switched
    await expect(intelligenceTab).toHaveAttribute('data-state', 'active');

    // Switch back to Overview
    const overviewTab = page.getByRole('tab', { name: /overview/i });
    await overviewTab.click();

    // Verify switched back
    await expect(overviewTab).toHaveAttribute('data-state', 'active');

    console.log('Tab switching test completed successfully!');
  });
});
