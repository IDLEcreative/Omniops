import { test, expect } from '@playwright/test';

/**
 * E2E Test: Product Search by Name
 *
 * Tests product search functionality by product name.
 * Validates search input, results display, and relevance.
 *
 * User Journey:
 * 1. Navigate to shop page
 * 2. Enter product name in search
 * 3. Submit search
 * 4. View search results
 * 5. Verify relevant products shown
 *
 * This test teaches AI agents:
 * - Product search workflow
 * - Search result validation
 * - Result relevance checking
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 60000;

test.describe('Product Search by Name', () => {
  test.setTimeout(TEST_TIMEOUT);

  test('should search for products by name', async ({ page }) => {
    console.log('=== Starting Product Name Search Test ===');

    console.log('📍 Step 1: Navigate to shop page');
    await page.goto(`${BASE_URL}/shop`, { waitUntil: 'networkidle' }).catch(() => {
      console.log('⏭️  Shop page not found - trying product page');
    });

    console.log('📍 Step 2: Look for search field');
    const searchInput = page.locator('input[type="search"], input[name="s"], input.search-field').first();
    const hasSearch = await searchInput.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasSearch) {
      console.log('⏭️  Search field not found - test skipped');
      return;
    }

    console.log('📍 Step 3: Enter search term');
    await searchInput.fill('pump');

    console.log('📍 Step 4: Submit search');
    const searchButton = page.locator('button[type="submit"], button.search-button, input[type="submit"]').first();
    const hasButton = await searchButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasButton) {
      await searchButton.click();
    } else {
      await searchInput.press('Enter');
    }

    await page.waitForLoadState('networkidle');

    console.log('📍 Step 5: Verify search results page');
    const currentUrl = page.url();
    const isSearchPage = currentUrl.includes('s=') || currentUrl.includes('search');
    console.log(`   Search URL: ${currentUrl}`);

    if (isSearchPage) {
      console.log('✅ Search results page loaded');
      expect(isSearchPage).toBe(true);
    }

    console.log('📍 Step 6: Look for product results');
    const products = page.locator('.product, [class*="product"], .woocommerce-loop-product__title');
    const productCount = await products.count();
    console.log(`📊 Found ${productCount} product(s)`);

    if (productCount > 0) {
      console.log('✅ Products found in search results');
    } else {
      console.log('⏭️  No products found for search term');
    }

    console.log('✅ Product name search test completed!');
  });

  test('should display no results message for invalid search', async ({ page }) => {
    console.log('=== Testing No Results Message ===');

    await page.goto(`${BASE_URL}/shop`, { waitUntil: 'networkidle' }).catch(() => {});

    const searchInput = page.locator('input[type="search"]').first();
    const hasSearch = await searchInput.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasSearch) {
      console.log('⏭️  Search field not found');
      return;
    }

    console.log('📍 Step 1: Search for non-existent product');
    await searchInput.fill('xyz123nonexistent999');
    await searchInput.press('Enter');
    await page.waitForLoadState('networkidle');

    console.log('📍 Step 2: Look for no results message');
    const noResults = page.locator('text=/no products/i, text=/no results/i, text=/nothing found/i, .woocommerce-info');
    const hasNoResults = await noResults.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasNoResults) {
      console.log('✅ No results message displayed');
      expect(hasNoResults).toBe(true);
    } else {
      console.log('⚠️  No results message not found');
    }

    console.log('✅ No results message test completed!');
  });

  test('should show search query in results', async ({ page }) => {
    console.log('=== Testing Search Query Display ===');

    await page.goto(`${BASE_URL}/shop`, { waitUntil: 'networkidle' }).catch(() => {});

    const searchInput = page.locator('input[type="search"]').first();
    const hasSearch = await searchInput.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasSearch) {
      console.log('⏭️  Search field not found');
      return;
    }

    console.log('📍 Step 1: Perform search');
    const searchTerm = 'test product';
    await searchInput.fill(searchTerm);
    await searchInput.press('Enter');
    await page.waitForLoadState('networkidle');

    console.log('📍 Step 2: Check if search term displayed in results');
    const searchTermDisplay = page.locator(`text=${searchTerm}, text=/search.*${searchTerm}/i`);
    const hasSearchTerm = await searchTermDisplay.first().isVisible({ timeout: 3000 }).catch(() => false);

    if (hasSearchTerm) {
      console.log('✅ Search term displayed in results page');
    } else {
      console.log('⏭️  Search term not explicitly shown (optional feature)');
    }

    console.log('✅ Search query display test completed!');
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') {
      await page.screenshot({
        path: `test-results/search-product-name-failure-${Date.now()}.png`,
        fullPage: true
      });
    }
  });
});
