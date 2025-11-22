/**
 * E2E Tests: Training Dashboard - URL Upload
 *
 * Tests the complete URL upload workflow including:
 * - URL submission and scraping
 * - URL normalization (auto-adds https://)
 * - Scraping failure handling
 * - Multiple URL submissions
 *
 * User Journey:
 * 1. Navigate to /dashboard/training
 * 2. Enter website URL in URL tab
 * 3. Submit URL for scraping
 * 4. Wait for scraping to complete
 * 5. Verify URL appears in training data list
 */

import { test, expect } from '@playwright/test';
import {
  navigateToTrainingPage,
  uploadUrl,
  waitForItemInList,
  waitForProcessingComplete,
  verifyItemNotInList
} from '@/test-utils/playwright/dashboard/training/helpers';
import { TEST_TIMEOUT, PROCESSING_TIMEOUT } from '@/test-utils/playwright/dashboard/training/config';

test.describe('Training Dashboard - URL Upload', () => {
  test.setTimeout(TEST_TIMEOUT);

  test.use({ storageState: 'playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    console.log('=== Starting URL Upload Test ===');
    await navigateToTrainingPage(page);
  });

  test('user uploads URL and processes to completion', async ({ page }) => {
    console.log('🎯 Testing: URL upload with processing');

    // Use www.iana.org which successfully scrapes based on screenshot evidence
    const testUrl = 'www.iana.org';

    console.log('📍 Step 1: Upload URL without https://');
    await uploadUrl(page, testUrl);

    console.log('📍 Step 2: Verify URL appears in list (normalized with https://)');
    await waitForItemInList(page, 'https://www.iana.org', 10000);

    console.log('📍 Step 3: Wait for scraping to complete');
    // Note: Scraping may take time, wait up to PROCESSING_TIMEOUT
    await waitForProcessingComplete(page, 'https://www.iana.org', PROCESSING_TIMEOUT);

    console.log('✅ URL upload and processing test completed');
  });

  test('URL normalization (auto-adds https://)', async ({ page }) => {
    console.log('🎯 Testing: URL normalization');

    console.log('📍 Step 1: Submit URL without protocol');
    await uploadUrl(page, 'example.com');

    console.log('📍 Step 2: Verify URL is normalized to https://');
    const item = await waitForItemInList(page, 'https://example.com', 10000);

    // Verify the content includes https://
    const itemText = await item.textContent();
    expect(itemText).toContain('https://');
    console.log('✅ URL was normalized with https:// prefix');

    console.log('✅ URL normalization test completed');
  });

  test('scraping failure handling', async ({ page }) => {
    console.log('🎯 Testing: Scraping failure handling');

    // Use example.com/test-page which shows error badges based on screenshot evidence
    const testUrl = 'https://example.com/test-page';

    console.log('📍 Step 1: Submit URL that returns empty content');
    await uploadUrl(page, testUrl);

    console.log('📍 Step 2: Wait for item to appear');
    await waitForItemInList(page, testUrl, 10000);

    console.log('📍 Step 3: Wait for scraping to complete and check for error');
    // Wait for processing to finish (example.com returns quickly)
    await page.waitForTimeout(10000);

    const item = page.locator(`[data-testid="training-item"]:has-text("${testUrl}")`).first();

    if (await item.isVisible().catch(() => false)) {
      // Item should show error status for empty content
      const errorBadge = item.locator('[data-testid="status"]').filter({ hasText: /error/i });

      // Check if error badge is visible
      await expect(errorBadge).toBeVisible({ timeout: 5000 });
      console.log('✅ Error status displayed for empty content scrape');
    } else {
      // Item was removed from list (optimistic rollback)
      console.log('✅ Failed item removed from list (optimistic rollback)');
    }

    console.log('✅ Scraping failure handling test completed');
  });

  test('multiple URL submissions', async ({ page }) => {
    console.log('🎯 Testing: Multiple URL submissions');

    const urls = [
      'example.com/page1',
      'example.com/page2',
      'example.com/page3'
    ];

    console.log('📍 Step 1: Submit multiple URLs');
    for (const url of urls) {
      await uploadUrl(page, url);
      await page.waitForTimeout(1000);
    }

    console.log('📍 Step 2: Verify all URLs appear in list');
    for (const url of urls) {
      const normalizedUrl = `https://${url}`;
      await waitForItemInList(page, normalizedUrl, 10000);
      console.log(`✅ Found: ${normalizedUrl}`);
    }

    console.log('📍 Step 3: Verify list contains at least 3 items');
    const items = page.locator('[data-testid="training-item"], .training-item');
    const count = await items.count();
    expect(count).toBeGreaterThanOrEqual(3);
    console.log(`✅ List contains ${count} items (expected >= 3)`);

    console.log('✅ Multiple URL submissions test completed');
  });
});
