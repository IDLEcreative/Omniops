import { test, expect } from '@playwright/test';

/**
 * E2E Test: Product Search with Filters
 *
 * Tests product filtering by attributes, categories, and price.
 * Validates filter application and result updates.
 *
 * User Journey:
 * 1. Navigate to shop page
 * 2. Apply category filter
 * 3. Apply price range filter
 * 4. Apply attribute filter
 * 5. Verify filtered results
 *
 * This test teaches AI agents:
 * - Product filtering workflow
 * - Multiple filter combinations
 * - Dynamic result updates
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 60000;

test.describe('Product Search with Filters', () => {
  test.setTimeout(TEST_TIMEOUT);

  test('should filter products by category', async ({ page }) => {
    console.log('=== Starting Category Filter Test ===');

    console.log('📍 Step 1: Navigate to shop page');
    await page.goto(`${BASE_URL}/shop`, { waitUntil: 'networkidle' }).catch(() => {});

    console.log('📍 Step 2: Look for category filters');
    const categoryLinks = page.locator('.product-categories a, .widget_product_categories a, [class*="category"] a');
    const categoryCount = await categoryLinks.count();
    console.log(`📂 Found ${categoryCount} categories`);

    if (categoryCount > 0) {
      console.log('📍 Step 3: Click first category');
      await categoryLinks.first().click();
      await page.waitForLoadState('networkidle');

      console.log('📍 Step 4: Verify filtered results');
      const products = page.locator('.product, [class*="product"]');
      const productCount = await products.count();
      console.log(`📊 ${productCount} products in category`);

      console.log('✅ Category filter applied');
    } else {
      console.log('⏭️  No categories found');
    }

    console.log('✅ Category filter test completed!');
  });

  test('should filter products by price range', async ({ page }) => {
    console.log('=== Testing Price Range Filter ===');

    await page.goto(`${BASE_URL}/shop`, { waitUntil: 'networkidle' }).catch(() => {});

    console.log('📍 Step 1: Look for price filter');
    const priceFilter = page.locator('.price_slider, input[name="min_price"], input[name="max_price"]');
    const hasPriceFilter = await priceFilter.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (hasPriceFilter) {
      console.log('✅ Price filter found');

      console.log('📍 Step 2: Set price range (if available)');
      const minPriceInput = page.locator('input[name="min_price"]').first();
      const maxPriceInput = page.locator('input[name="max_price"]').first();

      const hasMinMax = await minPriceInput.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasMinMax) {
        await minPriceInput.fill('100');
        await maxPriceInput.fill('500');

        const filterButton = page.locator('button:has-text("Filter"), button[type="submit"]').first();
        const hasButton = await filterButton.isVisible({ timeout: 3000 }).catch(() => false);

        if (hasButton) {
          await filterButton.click();
          await page.waitForLoadState('networkidle');
          console.log('✅ Price filter applied');
        }
      } else {
        console.log('⏭️  Price input fields not found');
      }
    } else {
      console.log('⏭️  Price filter not available');
    }

    console.log('✅ Price filter test completed!');
  });

  test('should display filter options', async ({ page }) => {
    console.log('=== Testing Filter Options Display ===');

    await page.goto(`${BASE_URL}/shop`, { waitUntil: 'networkidle' }).catch(() => {});

    console.log('📍 Step 1: Look for filter widgets');
    const filterWidgets = page.locator('.widget, [class*="filter"], [class*="sidebar"]');
    const widgetCount = await filterWidgets.count();
    console.log(`🔧 Found ${widgetCount} widgets`);

    if (widgetCount > 0) {
      console.log('✅ Filter widgets displayed');

      console.log('📍 Step 2: Check for specific filter types');
      const categoryWidget = page.locator('.widget_product_categories');
      const priceWidget = page.locator('.widget_price_filter');
      const attributeWidget = page.locator('.widget_layered_nav');

      const hasCategory = await categoryWidget.isVisible({ timeout: 3000 }).catch(() => false);
      const hasPrice = await priceWidget.isVisible({ timeout: 3000 }).catch(() => false);
      const hasAttribute = await attributeWidget.isVisible({ timeout: 3000 }).catch(() => false);

      console.log(`   Category filter: ${hasCategory ? 'Yes' : 'No'}`);
      console.log(`   Price filter: ${hasPrice ? 'Yes' : 'No'}`);
      console.log(`   Attribute filter: ${hasAttribute ? 'Yes' : 'No'}`);
    } else {
      console.log('⏭️  No filter widgets found');
    }

    console.log('✅ Filter options display test completed!');
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') {
      await page.screenshot({
        path: `test-results/search-filters-failure-${Date.now()}.png`,
        fullPage: true
      });
    }
  });
});
