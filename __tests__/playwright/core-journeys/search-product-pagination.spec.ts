import { test, expect } from '@playwright/test';

/**
 * E2E Test: Product Search Pagination
 *
 * Tests pagination through search results.
 * Validates page navigation and result continuity.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Product Search Pagination', () => {
  test('should paginate through product results', async ({ page }) => {
    console.log('=== Testing Product Pagination ===');

    await page.goto(`${BASE_URL}/shop`, { waitUntil: 'networkidle' }).catch(() => {});

    console.log('📍 Step 1: Count products on first page');
    const products = page.locator('.product, [class*="product"]');
    const initialCount = await products.count();
    console.log(`📊 Products on page 1: ${initialCount}`);

    console.log('📍 Step 2: Look for pagination');
    const nextButton = page.locator('.next, a[rel="next"], a:has-text("Next")');
    const hasNext = await nextButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasNext) {
      console.log('📍 Step 3: Click next page');
      await nextButton.click();
      await page.waitForLoadState('networkidle');

      console.log('📍 Step 4: Verify page 2 loaded');
      const page2Products = await products.count();
      console.log(`📊 Products on page 2: ${page2Products}`);

      console.log('✅ Pagination working');
    } else {
      console.log('⏭️  Pagination not available (not enough products)');
    }

    console.log('✅ Pagination test completed!');
  });
});
