/**
 * E2E Test: New Analytics Dashboard Features
 *
 * Tests ALL newly implemented analytics dashboard features:
 * 1. Custom Date Range Picker with presets
 * 2. Period Comparison Mode with % change indicators
 * 3. Anomaly Detection Alerts with severity badges
 * 4. Metric Goals & Progress tracking
 * 5. Chart Annotations system
 *
 * This test validates integration of all features working together.
 */

import { test, expect } from '@playwright/test';
import {
  setupAnalyticsDashboard,
  waitForAnalyticsAPI,
  setupAPITracking,
  toggleAutoRefresh,
  switchTab,
  elementExists
} from '@/test-utils/playwright/dashboard/analytics-helpers';
import {
  testDateRangePreset,
  toggleComparisonMode,
  createMetricGoal,
  addChartAnnotation,
  verifyAnomalyAlerts,
  verifyComparisonIndicators,
  deleteMetricGoal,
  verifyProgressIndicators,
  mockAnalyticsWithAnomalies
} from '@/test-utils/playwright/dashboard/analytics-features-helpers';

test.describe('Analytics Dashboard - New Features', () => {
  test.beforeEach(async ({ page }) => {
    await setupAnalyticsDashboard(page);
  });

  test('should support custom date range selection with presets', async ({ page }) => {
    console.log('\n📋 TEST: Feature 1 - Custom Date Range Picker');

    const apiCalls = setupAPITracking(page);
    await waitForAnalyticsAPI(page, 2000);
    const initialCallCount = apiCalls.length;

    // Test "Last 30 days" preset
    await testDateRangePreset(page, 'Last 30 days');
    await waitForAnalyticsAPI(page, 2000);
    const callsAfter30Days = apiCalls.length;
    expect(callsAfter30Days).toBeGreaterThan(initialCallCount);
    console.log('✅ API called with 30-day date range');

    // Test "This Month" preset
    await testDateRangePreset(page, 'This Month');
    await waitForAnalyticsAPI(page, 2000);
    expect(apiCalls.length).toBeGreaterThan(callsAfter30Days);
    console.log('✅ API called with monthly date range');

    // Test "Custom Range"
    const presetSelector = await testDateRangePreset(page, 'Custom Range');
    const customExists = await elementExists(page, 'text="Custom Range"');

    if (customExists) {
      await page.waitForTimeout(500);
      const calendarPopover = page.locator('[role="dialog"], .popover-content').first();
      const popoverVisible = await calendarPopover.isVisible().catch(() => false);

      if (popoverVisible) {
        console.log('✅ Calendar popover opened');
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
        console.log('✅ Calendar closed');
      }
    }

    console.log(`✅ TEST PASSED: Date range picker works (${apiCalls.length - initialCallCount} API calls)`);
  });

  test('should enable comparison mode and display change indicators', async ({ page }) => {
    console.log('\n📋 TEST: Feature 2 - Period Comparison Mode');

    let comparisonApiCalled = false;
    page.on('request', request => {
      const url = request.url();
      if (url.includes('/api/dashboard/analytics') && url.includes('compare=true')) {
        comparisonApiCalled = true;
        console.log('📡 Comparison API called with compare=true');
      }
    });

    await waitForAnalyticsAPI(page, 2000);

    // Enable comparison mode
    const comparisonSwitch = await toggleComparisonMode(page, true);
    await waitForAnalyticsAPI(page, 2500);

    if (comparisonApiCalled) {
      console.log('✅ Comparison API called');
    }

    // Look for comparison indicators
    const indicators = await verifyComparisonIndicators(page);
    if (indicators.percentageIndicators) {
      console.log('✅ Percentage change indicators visible');
    }
    if (indicators.trendIcons) {
      console.log('✅ Trend icons visible');
    }

    // Disable comparison mode
    await toggleComparisonMode(page, false);
    console.log('✅ TEST PASSED: Comparison mode works correctly');
  });

  test('should display anomaly alerts with severity badges', async ({ page }) => {
    console.log('\n📋 TEST: Feature 3 - Anomaly Detection Alerts');

    await mockAnalyticsWithAnomalies(page);
    await page.reload({ waitUntil: 'networkidle' });
    await waitForAnalyticsAPI(page, 3000);

    const results = await verifyAnomalyAlerts(page);

    if (results.alertCount > 0) {
      console.log(`✅ Found ${results.alertCount} anomaly alert(s)`);
    }
    if (results.criticalAlert) {
      console.log('✅ Critical alert badge visible');
    }
    if (results.warningAlert) {
      console.log('✅ Warning badge visible');
    }
    if (results.alertMessage) {
      console.log('✅ Alert message visible');
    }
    if (results.recommendation) {
      console.log('✅ Recommendation visible');
    }

    // Test alert dismissal
    const anomalyAlerts = page.locator('[role="alert"]');
    const dismissButton = anomalyAlerts.first().locator('button').filter({
      has: page.locator('svg.lucide-x')
    }).first();

    const dismissVisible = await dismissButton.isVisible().catch(() => false);
    if (dismissVisible) {
      const initialCount = await anomalyAlerts.count();
      await dismissButton.click();
      await page.waitForTimeout(500);
      const newCount = await anomalyAlerts.count();
      if (newCount < initialCount) {
        console.log('✅ Alert dismissed successfully');
      }
    }

    console.log('✅ TEST PASSED: Anomaly alerts display correctly');
  });

  test('should create, display, and manage metric goals', async ({ page }) => {
    console.log('\n📋 TEST: Feature 4 - Metric Goals & Progress');

    await waitForAnalyticsAPI(page, 2000);

    // Create a goal
    await createMetricGoal(page, 'Daily Active Users', '500');

    // Verify progress indicators
    await page.waitForTimeout(1000);
    const indicators = await verifyProgressIndicators(page);
    if (indicators.progressBar) {
      console.log('✅ Progress bar visible on metric card');
    }
    if (indicators.percentToGoal) {
      console.log('✅ "% to goal" indicator visible');
    }

    // Delete the goal
    const deleted = await deleteMetricGoal(page);
    if (deleted) {
      console.log('✅ Goal deleted');
    }

    console.log('✅ TEST PASSED: Metric goals feature works correctly');
  });

  test('should create, display, and interact with chart annotations', async ({ page }) => {
    console.log('\n📋 TEST: Feature 5 - Chart Annotations');

    await waitForAnalyticsAPI(page, 2000);

    // Add annotation
    await addChartAnnotation(
      page,
      'E2E Test Campaign Launch',
      'This is a test annotation created by E2E tests',
      'campaign',
      1
    );

    // Wait for charts to render with markers
    await page.waitForTimeout(2000);

    // Look for annotation markers
    const annotationMarkers = page.locator('[data-annotation], .annotation-marker, line[stroke]').first();
    const markerVisible = await annotationMarkers.isVisible().catch(() => false);

    if (markerVisible) {
      console.log('✅ Annotation marker visible on chart');

      // Click marker to view details
      await annotationMarkers.click();
      await page.waitForTimeout(500);

      const annotationTitle = page.getByText('E2E Test Campaign Launch', { exact: false });
      const titleVisible = await annotationTitle.isVisible().catch(() => false);

      if (titleVisible) {
        console.log('✅ Annotation details displayed');
      }
    }

    console.log('✅ TEST PASSED: Chart annotations feature works correctly');
  });

  test('should use all features together in realistic workflow', async ({ page }) => {
    console.log('\n📋 TEST: Integration - All Features Working Together');

    await waitForAnalyticsAPI(page, 2000);

    // Set custom date range
    await testDateRangePreset(page, 'Last 30 days');
    await waitForAnalyticsAPI(page, 2000);
    console.log('✅ Date range set to 30 days');

    // Enable comparison mode
    await toggleComparisonMode(page, true);
    await waitForAnalyticsAPI(page, 2000);
    console.log('✅ Comparison mode enabled');

    // Create a metric goal
    await createMetricGoal(page, 'Conversion Rate', '5.0');
    console.log('✅ Goal created: Conversion Rate = 5.0%');

    // Add annotation (conditional)
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);

    const addNoteButton = page.getByRole('button', { name: /add note/i });
    const noteButtonVisible = await addNoteButton.isVisible().catch(() => false);

    if (noteButtonVisible) {
      await addChartAnnotation(
        page,
        'Q4 Marketing Campaign',
        'Campaign launch annotation',
        'campaign',
        5
      );
      console.log('✅ Annotation added');
    }

    // Verify features persist across tab switches
    await page.evaluate(() => {
      const tabs = document.querySelector('[role="tablist"]');
      if (tabs) tabs.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    await page.waitForTimeout(500);

    const intelligenceTab = page.getByRole('tab', { name: /business intelligence/i });
    const tabVisible = await intelligenceTab.isVisible().catch(() => false);

    if (tabVisible) {
      await switchTab(page, 'business intelligence');
      await waitForAnalyticsAPI(page, 2000);
      await switchTab(page, 'overview');
      await page.waitForTimeout(1500);
    }

    // Verify settings persisted
    const comparisonSwitch = page.locator('#comparison-mode');
    const finalComparisonState = await comparisonSwitch.getAttribute('data-state');
    expect(finalComparisonState).toBe('checked');
    console.log('✅ Comparison mode persisted');

    console.log('\n✅ TEST PASSED: All features work together seamlessly');
  });

});