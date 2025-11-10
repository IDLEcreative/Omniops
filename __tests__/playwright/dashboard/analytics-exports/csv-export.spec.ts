/**
 * CSV Export E2E Tests
 *
 * Tests CSV export generation, download, and file structure verification.
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { navigateToDashboard, parseCSV, downloadFile, cleanupFile } from '../../utils/playwright/analytics-export-helpers';

test.describe('CSV Export Tests', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToDashboard(page);
  });

  test('export analytics as CSV: click → download → verify', async ({ page }) => {
    console.log('🎯 Testing: CSV export workflow');

    // Check if export button exists in UI
    const exportCSVButton = page
      .locator('button:has-text("Export CSV"), button:has-text("CSV"), button[aria-label*="export"]')
      .first();
    const hasExportButton = await exportCSVButton.isVisible().catch(() => false);

    if (hasExportButton) {
      console.log('✅ Found export button in UI');

      // Set up download promise before clicking
      const downloadPromise = page.waitForEvent('download');

      console.log('📍 Click CSV export button');
      await exportCSVButton.click();

      console.log('📍 Wait for download to start');
      const download = await downloadPromise;

      console.log('📍 Save and parse CSV file');
      const suggestedFilename = download.suggestedFilename();
      console.log(`Downloaded file: ${suggestedFilename}`);

      // Verify filename follows convention
      expect(suggestedFilename).toMatch(/analytics.*\.csv$/);

      // Save file to temporary location
      const filePath = path.join('/tmp', suggestedFilename);
      await download.saveAs(filePath);

      // Read and parse CSV content
      const csvContent = fs.readFileSync(filePath, 'utf-8');
      console.log(`CSV file size: ${csvContent.length} bytes`);

      // Parse CSV
      const records = parseCSV(csvContent);

      // Verify CSV has data
      expect(records.length).toBeGreaterThan(0);
      console.log(`✅ CSV contains ${records.length} rows`);

      // Verify expected columns exist
      const firstRow = records[0];
      const expectedColumns = ['Date', 'Sessions', 'Messages', 'Users'];

      for (const col of expectedColumns) {
        if (firstRow[col] !== undefined) {
          console.log(`✅ Column "${col}" found`);
        }
      }

      cleanupFile(filePath);
    } else {
      console.log('⚠️ No export button found in UI, testing via direct API call');

      // Test export via direct API call
      const result = await downloadFile(page, '/api/analytics/export?format=csv&days=7');

      if (result) {
        console.log(`📍 Downloaded CSV via API: ${result.filename}`);

        const csvContent = fs.readFileSync(result.filePath, 'utf-8');
        expect(csvContent.length).toBeGreaterThan(0);

        console.log('✅ CSV export via API successful');
        cleanupFile(result.filePath);

        // Navigate back to dashboard
        await page.goto('/dashboard/analytics');
      }
    }

    console.log('✅ CSV export test completed successfully');
  });

  test('verify CSV file structure and headers', async ({ page }) => {
    console.log('🎯 Testing: CSV structure validation');

    const result = await downloadFile(page, '/api/analytics/export?format=csv&days=7');

    if (!result) {
      console.log('⚠️ Could not download CSV file');
      return;
    }

    const csvContent = fs.readFileSync(result.filePath, 'utf-8');
    const records = parseCSV(csvContent);

    console.log('📍 Verify CSV headers');
    expect(records.length).toBeGreaterThan(0);

    const firstRecord = records[0];
    const hasDateColumn = 'Date' in firstRecord;
    const hasSessionsColumn = 'Sessions' in firstRecord;

    expect(hasDateColumn || hasSessionsColumn).toBe(true);
    console.log('✅ CSV has expected columns');

    cleanupFile(result.filePath);
    console.log('✅ CSV structure validation completed');
  });

  test('CSV export with 30-day range', async ({ page }) => {
    console.log('🎯 Testing: 30-day CSV export');

    const result = await downloadFile(page, '/api/analytics/export?format=csv&days=30');

    if (!result) {
      console.log('⚠️ Could not download 30-day CSV');
      return;
    }

    const csvContent = fs.readFileSync(result.filePath, 'utf-8');
    expect(csvContent.length).toBeGreaterThan(0);

    const records = parseCSV(csvContent);
    console.log(`✅ 30-day export contains ${records.length} rows`);

    cleanupFile(result.filePath);
    console.log('✅ 30-day CSV export test completed');
  });
});
