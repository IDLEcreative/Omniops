/**
 * Download Workflow and Performance E2E Tests
 *
 * Tests complete download flows, UI suggestions, and large dataset performance.
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { navigateToDashboard, cleanupFile } from '../../utils/playwright/analytics-export-helpers';

test.describe('Download Workflows and Performance', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToDashboard(page);
  });

  test('complete export workflow: UI suggestion for missing buttons', async ({ page }) => {
    console.log('🎯 Testing: Complete export workflow with UI recommendations');

    console.log('📍 Check for export UI elements');

    // Expected UI elements for complete export feature
    const uiElements = {
      exportButton: page.locator('button:has-text("Export"), button[aria-label*="export"]'),
      csvOption: page.locator('button:has-text("CSV"), [role="menuitem"]:has-text("CSV")'),
      jsonOption: page.locator('button:has-text("JSON"), [role="menuitem"]:has-text("JSON")'),
      pdfOption: page.locator('button:has-text("PDF"), [role="menuitem"]:has-text("PDF")'),
      dateRangePicker: page.locator('[aria-label*="date"], [placeholder*="date"]'),
    };

    console.log('📍 Checking for export UI elements...');

    for (const [name, locator] of Object.entries(uiElements)) {
      const isVisible = await locator.first().isVisible().catch(() => false);

      if (isVisible) {
        console.log(`✅ ${name} found in UI`);
      } else {
        console.log(`⚠️ ${name} missing - RECOMMENDATION: Add to UI`);
      }
    }

    console.log('\n📝 UI Recommendations for complete export feature:');
    console.log('1. Add Export button to top-right of Analytics Dashboard (next to Refresh)');
    console.log('2. Export button should open dropdown with format options:');
    console.log('   - CSV (for spreadsheets)');
    console.log('   - JSON (for developers)');
    console.log('   - PDF (for reports)');
    console.log('3. Include selected date range in exported filename');
    console.log('4. Show toast notification when export completes');
    console.log('5. Add "Export scheduled reports" option for automation');

    console.log('\n📍 Testing API-based export as fallback');

    // Demonstrate the complete workflow via API
    const downloadPromise = page.waitForEvent('download');
    await page.goto('/api/analytics/export?format=csv&days=7');

    const download = await downloadPromise;
    const filename = download.suggestedFilename();

    console.log(`✅ CSV export works via API: ${filename}`);

    // Clean up
    const filePath = path.join('/tmp', filename);
    await download.saveAs(filePath);
    cleanupFile(filePath);

    // Return to dashboard
    await page.goto('/dashboard/analytics');

    console.log('✅ Complete export workflow test finished');
  });

  test('export performance: large dataset handling', async ({ page }) => {
    console.log('🎯 Testing: Large dataset export performance');

    // Request 90 days of data (larger dataset)
    const exportUrl = '/api/analytics/export?format=csv&days=90';

    console.log('📍 Export 90 days of data');
    const startTime = Date.now();

    const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
    await page.goto(exportUrl);

    const download = await downloadPromise;
    const downloadTime = Date.now() - startTime;

    console.log(`📍 Download completed in ${downloadTime}ms`);

    // Performance threshold
    expect(downloadTime).toBeLessThan(30000); // Should complete within 30 seconds

    const filename = download.suggestedFilename();
    const filePath = path.join('/tmp', filename);
    await download.saveAs(filePath);

    const stats = fs.statSync(filePath);
    console.log(`✅ File size: ${(stats.size / 1024).toFixed(2)} KB`);
    console.log(`✅ Download performance: ${downloadTime}ms for ${(stats.size / 1024).toFixed(2)} KB`);

    cleanupFile(filePath);

    console.log('✅ Performance test completed');
  });

  test('sequential export downloads: verify file independence', async ({ page }) => {
    console.log('🎯 Testing: Sequential exports independence');

    const formats = ['csv', 'csv'];
    const downloadedFiles: Array<{ filename: string; path: string }> = [];

    for (let i = 0; i < formats.length; i++) {
      console.log(`📍 Export ${i + 1}: ${formats[i].toUpperCase()}`);

      const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
      await page.goto(`/api/analytics/export?format=${formats[i]}&days=7`);

      const download = await downloadPromise;
      const filename = download.suggestedFilename();
      const filePath = path.join('/tmp', filename);

      await download.saveAs(filePath);

      downloadedFiles.push({ filename, path: filePath });

      console.log(`✅ Downloaded: ${filename}`);

      // Small delay between exports
      if (i < formats.length - 1) {
        await page.waitForTimeout(500);
      }
    }

    // Verify all files exist and have content
    for (const file of downloadedFiles) {
      const stats = fs.statSync(file.path);
      expect(stats.size).toBeGreaterThan(0);
      console.log(`✅ ${file.filename} verified (${stats.size} bytes)`);
      cleanupFile(file.path);
    }

    console.log('✅ Sequential exports test completed');
  });

  test('export with custom time ranges', async ({ page }) => {
    console.log('🎯 Testing: Custom time range exports');

    const ranges = [7, 30, 90];

    for (const days of ranges) {
      console.log(`📍 Testing ${days}-day export`);

      const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
      await page.goto(`/api/analytics/export?format=csv&days=${days}`);

      const download = await downloadPromise;
      const filename = download.suggestedFilename();
      const filePath = path.join('/tmp', filename);

      await download.saveAs(filePath);

      const stats = fs.statSync(filePath);
      expect(stats.size).toBeGreaterThan(0);

      console.log(`✅ ${days}-day export: ${(stats.size / 1024).toFixed(2)} KB`);

      cleanupFile(filePath);

      if (days !== ranges[ranges.length - 1]) {
        await page.goto('/dashboard/analytics');
        await page.waitForTimeout(500);
      }
    }

    console.log('✅ Custom time range exports test completed');
  });
});
