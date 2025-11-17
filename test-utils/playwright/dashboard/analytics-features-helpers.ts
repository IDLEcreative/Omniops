/**
 * Test helpers for Analytics Dashboard New Features
 */

import { Page, expect } from '@playwright/test';

/**
 * Mock anomaly data in analytics response
 */
export async function mockAnalyticsWithAnomalies(page: Page) {
  await page.route('**/api/dashboard/analytics**', async (route) => {
    console.log('📡 Intercepting analytics API - injecting anomaly data');

    const response = await route.fetch();
    const data = await response.json();

    // Inject anomalies
    data.anomalies = [
      {
        metric: 'response_time',
        severity: 'critical',
        message: 'Response time has increased significantly',
        currentValue: 2500,
        expectedValue: 1200,
        percentChange: 108.3,
        detectedAt: new Date().toISOString(),
        recommendation: 'Check server load and optimize database queries',
      },
      {
        metric: 'conversion_rate',
        severity: 'warning',
        message: 'Conversion rate is below expected range',
        currentValue: 2.1,
        expectedValue: 3.5,
        percentChange: -40.0,
        detectedAt: new Date().toISOString(),
        recommendation: 'Review checkout flow for potential issues',
      },
      {
        metric: 'daily_active_users',
        severity: 'info',
        message: 'Daily active users showing positive trend',
        currentValue: 520,
        expectedValue: 450,
        percentChange: 15.6,
        detectedAt: new Date().toISOString(),
      },
    ];

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(data),
    });
  });
}

/**
 * Test date range preset selector
 */
export async function testDateRangePreset(page: Page, preset: string) {
  const presetSelector = page.locator('select, [role="combobox"]').filter({
    hasText: /Last \d+ days|This Month|This Quarter/i
  }).first();

  await expect(presetSelector).toBeVisible({ timeout: 5000 });
  await presetSelector.click();
  await page.waitForTimeout(300);

  const option = page.getByRole('option', { name: preset });
  await expect(option).toBeVisible({ timeout: 3000 });
  await option.click();
  console.log(`✅ Selected "${preset}"`);

  return presetSelector;
}

/**
 * Toggle comparison mode
 */
export async function toggleComparisonMode(page: Page, enable: boolean) {
  const comparisonSwitch = page.locator('#comparison-mode');
  await expect(comparisonSwitch).toBeVisible({ timeout: 10000 });

  const currentState = await comparisonSwitch.getAttribute('data-state');
  const isChecked = currentState === 'checked';

  if ((enable && !isChecked) || (!enable && isChecked)) {
    await comparisonSwitch.click();
    await page.waitForTimeout(500);
  }

  const newState = await comparisonSwitch.getAttribute('data-state');
  expect(newState).toBe(enable ? 'checked' : 'unchecked');
  console.log(`✅ Comparison mode ${enable ? 'enabled' : 'disabled'}`);

  return comparisonSwitch;
}

/**
 * Create a metric goal
 */
export async function createMetricGoal(page: Page, metric: string, target: string, period = 'monthly') {
  // Open goals dialog
  const setGoalsButton = page.getByRole('button', { name: /set goals/i });
  await expect(setGoalsButton).toBeVisible({ timeout: 5000 });
  await setGoalsButton.click();
  await page.waitForTimeout(500);

  // Verify dialog opened
  const dialogTitle = page.getByRole('heading', { name: 'Metric Goals', exact: true });
  await expect(dialogTitle).toBeVisible({ timeout: 10000 });

  // Select metric
  const metricSelect = page.locator('#metric');
  await metricSelect.click();
  await page.waitForTimeout(300);

  const metricOption = page.getByRole('option', { name: metric });
  await expect(metricOption).toBeVisible({ timeout: 3000 });
  await metricOption.click();
  console.log(`✅ Selected "${metric}" metric`);

  // Enter target value
  const targetInput = page.locator('#target');
  await targetInput.fill(target);
  console.log(`✅ Set target value: ${target}`);

  // Submit goal
  const createButton = page.getByRole('button', { name: /create goal/i });
  await createButton.click();
  await page.waitForTimeout(2000);
  console.log('✅ Goal creation submitted');

  // Close dialog
  const cancelButton = page.getByRole('button', { name: /cancel/i });
  await cancelButton.click();
  await page.waitForTimeout(500);
}

/**
 * Add a chart annotation
 */
export async function addChartAnnotation(
  page: Page,
  title: string,
  description: string,
  category = 'campaign',
  daysAgo = 1
) {
  // Click Add Note button
  const addNoteButton = page.getByRole('button', { name: /add note/i });
  await expect(addNoteButton).toBeVisible({ timeout: 10000 });
  await addNoteButton.click();
  await page.waitForTimeout(500);

  // Verify dialog opened
  const dialogTitle = page.getByRole('heading', { name: /add chart annotation/i });
  await expect(dialogTitle).toBeVisible({ timeout: 10000 });

  // Set date
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() - daysAgo);
  const dateString = targetDate.toISOString().split('T')[0];

  const dateInput = page.locator('#date');
  await dateInput.fill(dateString);
  console.log(`✅ Set date: ${dateString}`);

  // Select category
  const categorySelect = page.locator('#category');
  await categorySelect.click();
  await page.waitForTimeout(300);

  const categoryOption = page.getByRole('option').filter({ hasText: new RegExp(category, 'i') }).first();
  await categoryOption.click();
  console.log(`✅ Selected "${category}" category`);

  // Enter title and description
  const titleInput = page.locator('#title');
  await titleInput.fill(title);
  console.log('✅ Entered title');

  const descriptionInput = page.locator('#description');
  await descriptionInput.fill(description);
  console.log('✅ Entered description');

  // Submit annotation
  const addButton = page.getByRole('button', { name: /add annotation/i });
  await addButton.click();
  await page.waitForTimeout(2000);
  console.log('✅ Annotation submitted');
}

/**
 * Verify anomaly alerts are displayed
 */
export async function verifyAnomalyAlerts(page: Page) {
  const anomalyAlerts = page.locator('[role="alert"]');
  const alertCount = await anomalyAlerts.count();

  const results = {
    alertCount,
    criticalAlert: false,
    warningAlert: false,
    alertMessage: false,
    recommendation: false
  };

  if (alertCount > 0) {
    console.log(`✅ Found ${alertCount} anomaly alert(s)`);

    // Check for severity badges
    const criticalAlert = page.getByText('Critical Alert', { exact: false }).first();
    results.criticalAlert = await criticalAlert.isVisible().catch(() => false);

    const warningAlert = page.getByText('Warning', { exact: false }).first();
    results.warningAlert = await warningAlert.isVisible().catch(() => false);

    // Check content
    const alertMessage = page.getByText('Response time has increased', { exact: false }).first();
    results.alertMessage = await alertMessage.isVisible().catch(() => false);

    const recommendation = page.getByText('Recommendation:', { exact: false }).first();
    results.recommendation = await recommendation.isVisible().catch(() => false);
  }

  return results;
}

/**
 * Look for comparison indicators
 */
export async function verifyComparisonIndicators(page: Page) {
  // Look for percentage change indicators
  const percentageIndicators = page.locator('text=/[+-]?\\d+\\.\\d+%/').first();
  const percentageVisible = await percentageIndicators.isVisible().catch(() => false);

  // Look for trend icons
  const trendIcons = page.locator('svg.lucide-trending-up, svg.lucide-trending-down, svg.lucide-arrow-up, svg.lucide-arrow-down').first();
  const trendVisible = await trendIcons.isVisible().catch(() => false);

  return {
    percentageIndicators: percentageVisible,
    trendIcons: trendVisible
  };
}

/**
 * Test goal deletion
 */
export async function deleteMetricGoal(page: Page) {
  const setGoalsButton = page.getByRole('button', { name: /set goals/i });
  await setGoalsButton.click();
  await page.waitForTimeout(500);

  const deleteButton = page.locator('button').filter({
    has: page.locator('svg.lucide-trash-2')
  }).first();

  const deleteVisible = await deleteButton.isVisible().catch(() => false);

  if (deleteVisible) {
    await deleteButton.click();
    await page.waitForTimeout(1500);
    console.log('✅ Goal deleted');
  }

  const cancelButton = page.getByRole('button', { name: /cancel/i });
  await cancelButton.click();

  return deleteVisible;
}

/**
 * Verify progress indicators on metric cards
 */
export async function verifyProgressIndicators(page: Page) {
  // Look for progress bars
  const progressBars = page.locator('[role="progressbar"], .progress-bar').first();
  const progressVisible = await progressBars.isVisible().catch(() => false);

  // Look for "% to goal" text
  const percentToGoal = page.getByText(/\d+% to goal/i).first();
  const percentVisible = await percentToGoal.isVisible().catch(() => false);

  return {
    progressBar: progressVisible,
    percentToGoal: percentVisible
  };
}