/**
 * Playwright helpers for analytics export testing
 *
 * Shared utilities for CSV/PDF export tests including parsing, navigation,
 * and file operations.
 */

import * as fs from 'fs';
import * as path from 'path';
import type { Page } from '@playwright/test';

/**
 * Parse CSV content into array of records
 */
export function parseCSV(csvContent: string): Record<string, string>[] {
  const lines = csvContent.trim().split('\n');
  if (lines.length === 0) return [];

  // Parse headers
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

  // Parse data rows
  const records: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = values[index] || '';
    });
    records.push(record);
  }

  return records;
}

/**
 * Navigate to analytics dashboard with retry logic
 *
 * NOTE: This function assumes the user is already authenticated.
 * Authentication is handled by the global setup (auth.setup.ts) which
 * runs before tests and saves authentication state.
 */
export async function navigateToDashboard(page: Page): Promise<void> {
  console.log('📍 Navigate to analytics dashboard');

  // Set viewport for consistent testing
  await page.setViewportSize({ width: 1280, height: 720 });

  // Navigate with retry
  await page.goto('/dashboard/analytics', { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(async (error) => {
    console.log('Initial navigation failed, retrying...');
    await page.goto('/dashboard/analytics', { waitUntil: 'load' });
  });

  await page.waitForLoadState('domcontentloaded');

  // Check if we were redirected to login (auth failed)
  if (page.url().includes('/login')) {
    throw new Error('Not authenticated - redirected to login page. Run: npx playwright test --project=setup');
  }

  // Wait for spinner to disappear
  await page.waitForSelector('[class*="animate-spin"]', { state: 'hidden', timeout: 15000 }).catch(() => {
    console.log('No loading spinner found');
  });

  // Verify we're on analytics page
  const analyticsIndicator = await Promise.race([
    page.getByText('Analytics Dashboard').isVisible().catch(() => false),
    page.getByText('Analytics').isVisible().catch(() => false),
    page.locator('h1:has-text("Analytics")').isVisible().catch(() => false),
  ]);

  if (!analyticsIndicator) {
    console.log('⚠️ Analytics page not loaded - waiting additional time');
    await page.waitForTimeout(3000);
  }
}

/**
 * Download file from page and return path
 */
export async function downloadFile(
  page: Page,
  exportUrl: string,
): Promise<{ filePath: string; filename: string } | null> {
  const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
  await page.goto(exportUrl);

  const download = await downloadPromise;
  if (!download) return null;

  const filename = download.suggestedFilename();
  const filePath = path.join('/tmp', filename);

  await download.saveAs(filePath);
  return { filePath, filename };
}

/**
 * Clean up downloaded file
 */
export function cleanupFile(filePath: string): void {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

/**
 * Verify file exists and has content
 */
export function verifyFileContent(filePath: string, minSize: number = 0): boolean {
  if (!fs.existsSync(filePath)) return false;

  const stats = fs.statSync(filePath);
  return stats.size > minSize;
}

/**
 * Return to dashboard after export test
 */
export async function returnToDashboard(page: Page): Promise<void> {
  await page.goto('/dashboard/analytics');
  await page.waitForTimeout(500);
}
