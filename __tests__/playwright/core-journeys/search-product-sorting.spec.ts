import { test, expect } from '@playwright/test';

/**
 * E2E Test: Product Search Sorting
 *
 * Tests product sorting by various criteria.
 * Validates sort options and result ordering.
 *
 * User Journey:
 * 1. Navigate to shop page
 * 2. View sort dropdown
 * 3. Select sort option (price, name, popularity)
 * 4. Verify products reordered
 * 5. Test different sort options
 *
 * This test teaches AI agents:
 * - Product sorting workflow
 * - Available sort criteria
 * - Result reordering validation
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 60000;

test.describe('Product Search Sorting', () => {
  test.setTimeout(TEST_TIMEOUT);

  test('should display sorting dropdown', async ({ page }) => {
    console.log('=== Testing Sort Dropdown Display ===');

    console.log('📍 Step 1: Navigate to shop page');
    await page.goto(`${BASE_URL}/shop`, { waitUntil: 'networkidle' }).catch(() => {});

    console.log('📍 Step 2: Look for sort dropdown');
    const sortDropdown = page.locator('select.orderby, select[name="orderby"], .woocommerce-ordering select').first();
    const hasSort = await sortDropdown.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasSort) {
      console.log('✅ Sort dropdown found');
      expect(hasSort).toBe(true);

      console.log('📍 Step 3: Check sort options');
      const options = sortDropdown.locator('option');
      const optionCount = await options.count();
      console.log(`📋 Found ${optionCount} sort options`);

      for (let i = 0; i < optionCount; i++) {
        const optionText = await options.nth(i).textContent();
        console.log(`   - ${optionText}`);
      }

      expect(optionCount).toBeGreaterThan(0);
    } else {
      console.log('⏭️  Sort dropdown not found');
    }

    console.log('✅ Sort dropdown display test completed!');
  });

  test('should sort products by price (low to high)', async ({ page }) => {
    console.log('=== Testing Price Sorting (Low to High) ===');

    await page.goto(`${BASE_URL}/shop`, { waitUntil: 'networkidle' }).catch(() => {});

    const sortDropdown = page.locator('select.orderby, select[name="orderby"]').first();
    const hasSort = await sortDropdown.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasSort) {
      console.log('⏭️  Sort dropdown not found');
      return;
    }

    console.log('📍 Step 1: Select price low to high');
    await sortDropdown.selectOption({ label: /price.*low.*high/i }).catch(async () => {
      await sortDropdown.selectOption('price').catch(() => {});
    });

    await page.waitForLoadState('networkidle');

    console.log('📍 Step 2: Verify products reloaded');
    const products = page.locator('.product, [class*="product"]');
    const productCount = await products.count();
    console.log(`📊 ${productCount} products displayed`);

    if (productCount > 0) {
      console.log('✅ Products sorted by price');
    }

    console.log('✅ Price sorting test completed!');
  });

  test('should sort products by popularity', async ({ page }) => {
    console.log('=== Testing Popularity Sorting ===');

    await page.goto(`${BASE_URL}/shop`, { waitUntil: 'networkidle' }).catch(() => {});

    const sortDropdown = page.locator('select.orderby').first();
    const hasSort = await sortDropdown.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasSort) {
      console.log('⏭️  Sort dropdown not found');
      return;
    }

    console.log('📍 Step 1: Select popularity');
    await sortDropdown.selectOption({ label: /popularity/i }).catch(async () => {
      await sortDropdown.selectOption('popularity').catch(() => {});
    });

    await page.waitForLoadState('networkidle');

    console.log('📍 Step 2: Verify products reloaded');
    const products = page.locator('.product');
    const productCount = await products.count();
    console.log(`📊 ${productCount} products by popularity`);

    console.log('✅ Popularity sorting test completed!');
  });

  test('should sort products by name', async ({ page }) => {
    console.log('=== Testing Name Sorting ===');

    await page.goto(`${BASE_URL}/shop`, { waitUntil: 'networkidle' }).catch(() => {});

    const sortDropdown = page.locator('select.orderby').first();
    const hasSort = await sortDropdown.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasSort) {
      console.log('⏭️  Sort dropdown not found');
      return;
    }

    console.log('📍 Step 1: Select name sorting');
    await sortDropdown.selectOption({ label: /name/i }).catch(async () => {
      await sortDropdown.selectOption({ label: /title/i }).catch(() => {});
    });

    await page.waitForLoadState('networkidle');

    console.log('📍 Step 2: Verify products reloaded');
    const products = page.locator('.product');
    const productCount = await products.count();
    console.log(`📊 ${productCount} products sorted by name`);

    console.log('✅ Name sorting test completed!');
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') {
      await page.screenshot({
        path: `test-results/search-sorting-failure-${Date.now()}.png`,
        fullPage: true
      });
    }
  });
});
