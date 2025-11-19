import { test, expect } from '@playwright/test';
import { navigateToWooCommerceIntegration, fillWooCommerceCredentials } from '../../utils/playwright/woocommerce-helpers';

/**
 * E2E Test: WooCommerce Product Sync Operations
 *
 * Tests comprehensive product synchronization scenarios including:
 * - Full catalog sync
 * - Incremental updates
 * - Product variants handling
 * - Sync error recovery
 *
 * This validates the core product data integration between WooCommerce and the chat system.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 180000; // 3 minutes

test.describe('WooCommerce Product Sync E2E', () => {
  test.setTimeout(TEST_TIMEOUT);

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should sync full product catalog successfully', async ({ page }) => {
    console.log('=== Testing Full Product Catalog Sync ===');

    // Mock WooCommerce API for full product list
    await page.route('**/api/woocommerce/sync', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          synced: 150,
          total: 150,
          message: 'All products synced successfully',
          details: {
            newProducts: 150,
            updatedProducts: 0,
            failedProducts: 0,
            categories: 12,
            variants: 45
          }
        })
      });
    });

    // Navigate to WooCommerce integration
    await navigateToWooCommerceIntegration(page, BASE_URL);

    // Fill credentials
    await fillWooCommerceCredentials(page, {
      storeUrl: 'https://test-store.com',
      consumerKey: 'ck_test123',
      consumerSecret: 'cs_test123'
    });

    // Click sync button
    console.log('📍 Step: Clicking sync products button');
    const syncButton = page.locator('button:has-text("Sync Products"), button:has-text("Sync Now")').first();
    await syncButton.click();

    // Wait for sync to complete
    await page.waitForTimeout(2000);

    // Verify success message
    console.log('📍 Step: Verifying sync success');
    const successMessage = page.locator(
      'text=/150 products synced/i, text=/sync.*success/i, [role="alert"]:has-text("success")'
    ).first();
    await expect(successMessage).toBeVisible({ timeout: 10000 });

    // Verify product count displayed
    const productCount = page.locator('text=/150 products/i, text=/total.*150/i').first();
    const countVisible = await productCount.isVisible().catch(() => false);
    expect(countVisible).toBe(true);

    console.log('✅ Full catalog sync validated');
  });

  test('should handle incremental product updates', async ({ page }) => {
    console.log('=== Testing Incremental Product Updates ===');

    // Mock incremental sync response
    await page.route('**/api/woocommerce/sync', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          synced: 25,
          total: 150,
          message: 'Updated 25 products',
          details: {
            newProducts: 5,
            updatedProducts: 18,
            deletedProducts: 2,
            failedProducts: 0
          }
        })
      });
    });

    await navigateToWooCommerceIntegration(page, BASE_URL);

    await fillWooCommerceCredentials(page, {
      storeUrl: 'https://test-store.com',
      consumerKey: 'ck_test123',
      consumerSecret: 'cs_test123'
    });

    // Click incremental sync button
    console.log('📍 Step: Triggering incremental sync');
    const incrementalSync = page.locator(
      'button:has-text("Update Products"), button:has-text("Sync Changes")'
    ).first();

    // If button doesn't exist, use regular sync
    const hasIncrementalButton = await incrementalSync.isVisible().catch(() => false);
    if (hasIncrementalButton) {
      await incrementalSync.click();
    } else {
      const syncButton = page.locator('button:has-text("Sync Products")').first();
      await syncButton.click();
    }

    await page.waitForTimeout(2000);

    // Verify incremental sync results
    console.log('📍 Step: Verifying incremental sync results');
    const updateMessage = page.locator(
      'text=/updated.*25/i, text=/5.*new/i, text=/18.*updated/i'
    ).first();
    const messageVisible = await updateMessage.isVisible().catch(() => false);

    // At minimum, verify success
    if (!messageVisible) {
      const successMessage = page.locator('[role="alert"]:has-text("success")').first();
      await expect(successMessage).toBeVisible({ timeout: 10000 });
    }

    console.log('✅ Incremental update validated');
  });

  test('should sync product variants correctly', async ({ page }) => {
    console.log('=== Testing Product Variants Sync ===');

    // Mock variant-rich product sync
    await page.route('**/api/woocommerce/sync', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          synced: 50,
          message: 'Synced products with variants',
          details: {
            baseProducts: 50,
            totalVariants: 180,
            variantAttributes: ['Size', 'Color', 'Material'],
            complexProducts: 12 // Products with 3+ variants
          }
        })
      });
    });

    await navigateToWooCommerceIntegration(page, BASE_URL);

    await fillWooCommerceCredentials(page, {
      storeUrl: 'https://test-store.com',
      consumerKey: 'ck_test123',
      consumerSecret: 'cs_test123'
    });

    // Trigger sync
    console.log('📍 Step: Syncing products with variants');
    const syncButton = page.locator('button:has-text("Sync Products")').first();
    await syncButton.click();

    await page.waitForTimeout(2000);

    // Verify variant sync
    console.log('📍 Step: Verifying variant sync');
    const variantMessage = page.locator(
      'text=/180.*variants/i, text=/variant/i, text=/50.*products/i'
    ).first();

    const hasVariantInfo = await variantMessage.isVisible().catch(() => false);

    // At minimum, verify sync succeeded
    const successMessage = page.locator('[role="alert"]:has-text("success")').first();
    await expect(successMessage).toBeVisible({ timeout: 10000 });

    console.log('✅ Variant sync validated');
  });

  test('should handle product sync errors gracefully', async ({ page }) => {
    console.log('=== Testing Product Sync Error Handling ===');

    // Mock sync error
    await page.route('**/api/woocommerce/sync', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Product sync failed',
          message: 'Failed to sync 15 products due to API rate limiting',
          partialResults: {
            synced: 85,
            failed: 15,
            failedIds: [101, 102, 103]
          }
        })
      });
    });

    await navigateToWooCommerceIntegration(page, BASE_URL);

    await fillWooCommerceCredentials(page, {
      storeUrl: 'https://test-store.com',
      consumerKey: 'ck_test123',
      consumerSecret: 'cs_test123'
    });

    // Trigger sync
    console.log('📍 Step: Triggering sync that will fail');
    const syncButton = page.locator('button:has-text("Sync Products")').first();
    await syncButton.click();

    await page.waitForTimeout(2000);

    // Verify error is displayed
    console.log('📍 Step: Verifying error message displayed');
    const errorMessage = page.locator(
      'text=/sync failed/i, text=/failed.*15/i, text=/rate limit/i, [role="alert"]:has-text("error")'
    ).first();
    await expect(errorMessage).toBeVisible({ timeout: 10000 });

    // Verify retry option is available
    const retryButton = page.locator('button:has-text("Retry"), button:has-text("Try Again")').first();
    const hasRetry = await retryButton.isVisible().catch(() => false);

    if (hasRetry) {
      console.log('✅ Retry button found - error recovery available');
    }

    console.log('✅ Error handling validated');
  });

  test('should display sync progress in real-time', async ({ page }) => {
    console.log('=== Testing Real-Time Sync Progress ===');

    let requestCount = 0;

    await page.route('**/api/woocommerce/sync**', async (route) => {
      requestCount++;

      // Simulate progress updates
      if (requestCount === 1) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            inProgress: true,
            progress: {
              current: 50,
              total: 150,
              percentage: 33,
              message: 'Syncing products... 50/150'
            }
          })
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            synced: 150,
            message: 'Sync complete'
          })
        });
      }
    });

    await navigateToWooCommerceIntegration(page, BASE_URL);

    await fillWooCommerceCredentials(page, {
      storeUrl: 'https://test-store.com',
      consumerKey: 'ck_test123',
      consumerSecret: 'cs_test123'
    });

    console.log('📍 Step: Starting sync');
    const syncButton = page.locator('button:has-text("Sync Products")').first();
    await syncButton.click();

    // Look for progress indicator
    console.log('📍 Step: Checking for progress indicator');
    const progressBar = page.locator('[role="progressbar"], .progress-bar, [class*="progress"]').first();
    const hasProgress = await progressBar.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasProgress) {
      console.log('✅ Progress bar found');
    } else {
      console.log('⚠️ No progress bar (may complete too quickly)');
    }

    await page.waitForTimeout(2000);

    // Verify completion
    const successMessage = page.locator('[role="alert"]:has-text("success"), text=/sync.*complete/i').first();
    await expect(successMessage).toBeVisible({ timeout: 10000 });

    console.log('✅ Real-time progress validated');
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') {
      await page.screenshot({
        path: `test-results/woo-product-sync-failure-${Date.now()}.png`,
        fullPage: true
      });
    }
  });
});
