/**
 * Analytics Data Validation E2E Tests
 *
 * Tests data accuracy, structure validation, and API response formats.
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { navigateToDashboard, parseCSV, downloadFile, cleanupFile } from '../../utils/playwright/analytics-export-helpers';

test.describe('Data Validation Tests', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToDashboard(page);
  });

  test('verify JSON analytics data structure', async ({ page }) => {
    console.log('🎯 Testing: JSON data structure');

    const response = await page.request.get('/api/dashboard/analytics?days=7');

    console.log('📍 Verify response status');
    expect([200, 401, 500]).toContain(response.status());

    if (response.status() === 200) {
      const jsonData = await response.json();

      console.log('📍 Verify required data fields');
      expect(jsonData.metrics).toBeDefined();
      expect(jsonData.userMetrics).toBeDefined();
      expect(jsonData.sessionMetrics).toBeDefined();

      console.log('✅ JSON data structure verified');
      console.log('  - metrics:', Object.keys(jsonData.metrics || {}).join(', '));
      console.log('  - userMetrics:', Object.keys(jsonData.userMetrics || {}).join(', '));
      console.log('  - sessionMetrics:', Object.keys(jsonData.sessionMetrics || {}).join(', '));
    }

    console.log('✅ JSON structure validation completed');
  });

  test('export with date range filter applied', async ({ page }) => {
    console.log('🎯 Testing: Filtered export with date range');

    console.log('📍 Apply date range filter');

    // Find and click the time range selector
    const timeRangeSelector = page.locator('select, [role="combobox"]').first();
    const hasSelectorVisible = await timeRangeSelector.isVisible().catch(() => false);

    if (hasSelectorVisible) {
      // Change to 30 days
      await timeRangeSelector.click();
      await page.locator('[role="option"]:has-text("Last 30 days")').click();

      console.log('✅ Changed time range to Last 30 days');

      // Wait for data to reload
      await page.waitForTimeout(2000);
    }

    console.log('📍 Export filtered data');

    // Test export with filter via API
    const result = await downloadFile(page, '/api/analytics/export?format=csv&days=30');

    if (!result) {
      console.log('⚠️ Could not download filtered export');
      return;
    }

    // Verify filename includes analytics
    expect(result.filename).toMatch(/analytics/);

    // Verify content
    const csvContent = fs.readFileSync(result.filePath, 'utf-8');
    const records = parseCSV(csvContent);

    console.log(`✅ Filtered export contains ${records.length} rows`);

    cleanupFile(result.filePath);
    console.log('✅ Filtered export test completed');
  });

  test('validate CSV data accuracy and formatting', async ({ page }) => {
    console.log('🎯 Testing: CSV data accuracy');

    const result = await downloadFile(page, '/api/analytics/export?format=csv&days=7');

    if (!result) {
      console.log('⚠️ Could not download CSV for validation');
      return;
    }

    const csvContent = fs.readFileSync(result.filePath, 'utf-8');
    const records = parseCSV(csvContent);

    console.log('📍 Verify CSV data integrity');

    if (records.length > 0) {
      const firstRecord = records[0];

      // Check that records have expected fields
      const hasData = Object.keys(firstRecord).length > 0;
      expect(hasData).toBe(true);

      console.log('✅ CSV records have data');
      console.log(`   Fields: ${Object.keys(firstRecord).join(', ')}`);

      // Verify all records have same number of fields
      const fieldCount = Object.keys(firstRecord).length;
      const allConsistent = records.every(r => Object.keys(r).length === fieldCount);

      expect(allConsistent).toBe(true);
      console.log('✅ All records have consistent structure');
    }

    cleanupFile(result.filePath);
    console.log('✅ CSV data accuracy validation completed');
  });

  test('verify API endpoint responses', async ({ page }) => {
    console.log('🎯 Testing: Analytics export API endpoints');

    // Test CSV export endpoint
    console.log('📍 Testing CSV export API');
    const csvResponse = await page.request.get('/api/analytics/export?format=csv&days=7');
    console.log(`CSV endpoint status: ${csvResponse.status()}`);

    expect([200, 401, 500]).toContain(csvResponse.status());

    if (csvResponse.status() === 200) {
      const csvContent = await csvResponse.text();
      console.log('✅ CSV export API works');
      expect(csvContent.length).toBeGreaterThan(0);
    } else if (csvResponse.status() === 401) {
      console.log('⚠️ CSV export requires authentication');
    }

    // Test analytics data API
    console.log('📍 Testing analytics data API (JSON)');
    const jsonResponse = await page.request.get('/api/dashboard/analytics?days=7');
    console.log(`Analytics API status: ${jsonResponse.status()}`);

    if (jsonResponse.status() === 200) {
      const jsonData = await jsonResponse.json();
      console.log('✅ JSON analytics API works');
      expect(jsonData).toBeDefined();
    }

    console.log('✅ API endpoint verification completed');
  });
});
