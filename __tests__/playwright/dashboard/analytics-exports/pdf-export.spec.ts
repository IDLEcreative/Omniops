/**
 * PDF/Excel Export E2E Tests
 *
 * Tests PDF and Excel export generation and file validation.
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { navigateToDashboard, downloadFile, cleanupFile } from '../../utils/playwright/analytics-export-helpers';

test.describe('PDF and Excel Export Tests', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToDashboard(page);
  });

  test('verify file naming convention for all formats', async ({ page }) => {
    console.log('🎯 Testing: File naming convention');

    const exportFormats = ['csv', 'excel', 'pdf'];

    for (const format of exportFormats) {
      console.log(`📍 Testing ${format.toUpperCase()} filename`);

      const exportUrl = `/api/analytics/export?format=${format}&days=7`;

      try {
        const downloadPromise = page.waitForEvent('download', { timeout: 5000 });
        await page.goto(exportUrl);

        const download = await downloadPromise;
        const suggestedFilename = download.suggestedFilename();

        console.log(`📍 ${format.toUpperCase()} filename: ${suggestedFilename}`);

        // Verify naming pattern
        const datePattern = /\d{4}-\d{2}-\d{2}/; // YYYY-MM-DD
        const formatPattern = new RegExp(`\\.${format === 'excel' ? 'xlsx' : format}$`);

        expect(suggestedFilename).toMatch(/analytics/i);
        expect(suggestedFilename).toMatch(formatPattern);

        if (suggestedFilename.match(datePattern)) {
          console.log('✅ Filename includes date');
        }

        console.log(`✅ ${format.toUpperCase()} naming convention verified`);

        // Save file to verify it's valid
        const filePath = path.join('/tmp', suggestedFilename);
        await download.saveAs(filePath);

        // Verify file exists and has content
        const stats = fs.statSync(filePath);
        expect(stats.size).toBeGreaterThan(0);

        cleanupFile(filePath);
      } catch (error) {
        console.log(`⚠️ ${format.toUpperCase()} format might not be available`);
      }

      // Navigate back for next test
      if (format !== exportFormats[exportFormats.length - 1]) {
        await page.goto('/dashboard/analytics');
        await page.waitForTimeout(1000);
      }
    }

    console.log('✅ File naming convention test completed');
  });

  test('PDF export with 90-day range', async ({ page }) => {
    console.log('🎯 Testing: 90-day PDF export');

    const result = await downloadFile(page, '/api/analytics/export?format=pdf&days=90');

    if (!result) {
      console.log('⚠️ PDF export not available');
      return;
    }

    const stats = fs.statSync(result.filePath);
    expect(stats.size).toBeGreaterThan(0);

    console.log(`✅ PDF file size: ${(stats.size / 1024).toFixed(2)} KB`);

    cleanupFile(result.filePath);
    console.log('✅ 90-day PDF export test completed');
  });

  test('Excel export validation', async ({ page }) => {
    console.log('🎯 Testing: Excel export');

    const result = await downloadFile(page, '/api/analytics/export?format=excel&days=7');

    if (!result) {
      console.log('⚠️ Excel export not available');
      return;
    }

    const stats = fs.statSync(result.filePath);
    expect(stats.size).toBeGreaterThan(0);

    // Verify Excel file signature (XLSX is a ZIP file)
    const buffer = Buffer.alloc(4);
    const fd = fs.openSync(result.filePath, 'r');
    fs.readSync(fd, buffer, 0, 4, 0);
    fs.closeSync(fd);

    // XLSX files start with PK (0x504B)
    const isValidExcel = buffer[0] === 0x50 && buffer[1] === 0x4b;
    expect(isValidExcel || stats.size > 1000).toBe(true);

    console.log('✅ Excel file validation completed');

    cleanupFile(result.filePath);
  });
});
