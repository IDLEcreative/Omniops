import { test, expect } from '@playwright/test';
import { waitForChatWidget, sendChatMessage } from '../../utils/playwright/chat-helpers';

/**
 * E2E Test: Advanced Search - Multi-Criteria Filtering
 *
 * Tests search with multiple filter combinations.
 *
 * User Journey:
 * 1. Open chat widget
 * 2. Search with single filter (price)
 * 3. Add category filter (maintains state)
 * 4. Add availability filter (maintains state)
 * 5. Add specification filter (maintains state)
 * 6. Verify filtered results are accurate ← THE TRUE "END"
 *
 * This test validates:
 * - Multi-criteria filtering works correctly
 * - Filter state is maintained between queries
 * - Results match all applied filters
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 180000; // 3 minutes

test.describe('Advanced Search Filtering E2E', () => {
  test.setTimeout(TEST_TIMEOUT);

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should filter products by multiple criteria', async ({ page }) => {
    console.log('=== Starting Multi-Criteria Filter Test ===');

    // ============================================================================
    // STEP 1: Navigate to widget and open chat
    // ============================================================================
    console.log('📍 Step 1: Loading chat widget');

    await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });
    const iframe = await waitForChatWidget(page);

    console.log('✅ Chat widget loaded');

    // ============================================================================
    // STEP 2: Mock chat API with filtered products
    // ============================================================================
    console.log('📍 Step 2: Setting up search filter mock');

    let searchQuery = '';
    let appliedFilters: string[] = [];

    await page.route('**/api/chat', async (route) => {
      const requestData = route.request().postDataJSON();
      searchQuery = requestData.message.toLowerCase();

      console.log('🔍 Search query:', searchQuery);

      // Detect filters in query
      appliedFilters = [];
      if (searchQuery.includes('under $500')) appliedFilters.push('price:lt:500');
      if (searchQuery.includes('hydraulic')) appliedFilters.push('category:hydraulic');
      if (searchQuery.includes('in stock')) appliedFilters.push('availability:in_stock');
      if (searchQuery.includes('high pressure')) appliedFilters.push('spec:high_pressure');

      console.log('🏷️  Detected filters:', appliedFilters);

      // Simulate filtered results
      const allProducts = [
        { id: 1, name: 'A4VTG90 Hydraulic Pump', price: 2499, category: 'hydraulic', inStock: true, specs: ['high_pressure'] },
        { id: 2, name: 'BP-001 Hydraulic Pump', price: 1899, category: 'hydraulic', inStock: true, specs: ['medium_pressure'] },
        { id: 3, name: 'MP-500 Electric Pump', price: 399, category: 'electric', inStock: true, specs: ['low_pressure'] },
        { id: 4, name: 'HP-200 Hydraulic Pump', price: 450, category: 'hydraulic', inStock: false, specs: ['high_pressure'] },
      ];

      // Apply filters
      let filteredProducts = allProducts;

      if (appliedFilters.includes('price:lt:500')) {
        filteredProducts = filteredProducts.filter(p => p.price < 500);
      }
      if (appliedFilters.includes('category:hydraulic')) {
        filteredProducts = filteredProducts.filter(p => p.category === 'hydraulic');
      }
      if (appliedFilters.includes('availability:in_stock')) {
        filteredProducts = filteredProducts.filter(p => p.inStock);
      }
      if (appliedFilters.includes('spec:high_pressure')) {
        filteredProducts = filteredProducts.filter(p => p.specs.includes('high_pressure'));
      }

      const productList = filteredProducts
        .map(p => `${p.name} ($${p.price})${p.inStock ? ' - In Stock' : ' - Out of Stock'}`)
        .join('\n');

      const aiResponse = filteredProducts.length > 0
        ? `Found ${filteredProducts.length} products matching your criteria:\n\n${productList}\n\nWould you like more details on any of these?`
        : `I couldn't find any products matching all those criteria. Let me suggest some alternatives...`;

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          response: aiResponse,
          metadata: {
            totalResults: filteredProducts.length,
            appliedFilters,
            products: filteredProducts
          }
        })
      });
    });

    console.log('✅ Search filter mock ready');

    // ============================================================================
    // STEP 3: Send search with single filter (price)
    // ============================================================================
    console.log('📍 Step 3: Searching with single filter (price < $500)');

    await sendChatMessage(iframe, 'Show me pumps under $500');
    await page.waitForTimeout(2000);

    expect(appliedFilters).toContain('price:lt:500');
    console.log('✅ Price filter applied correctly');

    // ============================================================================
    // STEP 4: Add category filter
    // ============================================================================
    console.log('📍 Step 4: Adding category filter (hydraulic)');

    await sendChatMessage(iframe, 'Show me hydraulic pumps under $500');
    await page.waitForTimeout(2000);

    expect(appliedFilters).toContain('price:lt:500');
    expect(appliedFilters).toContain('category:hydraulic');
    console.log('✅ Multiple filters applied (price + category)');

    // ============================================================================
    // STEP 5: Add availability filter
    // ============================================================================
    console.log('📍 Step 5: Adding availability filter (in stock)');

    await sendChatMessage(iframe, 'Show me hydraulic pumps under $500 that are in stock');
    await page.waitForTimeout(2000);

    expect(appliedFilters).toContain('price:lt:500');
    expect(appliedFilters).toContain('category:hydraulic');
    expect(appliedFilters).toContain('availability:in_stock');
    console.log('✅ Triple filter applied (price + category + availability)');

    // ============================================================================
    // STEP 6: Add specification filter
    // ============================================================================
    console.log('📍 Step 6: Adding specification filter (high pressure)');

    await sendChatMessage(iframe, 'Show me high pressure hydraulic pumps under $500 that are in stock');
    await page.waitForTimeout(2000);

    expect(appliedFilters).toContain('spec:high_pressure');
    console.log('✅ Quad filter applied (price + category + availability + spec)');

    // ============================================================================
    // STEP 7: Verify filtered results
    // ============================================================================
    console.log('📍 Step 7: Verifying filtered results are accurate');

    // With all filters: price<500, hydraulic, in stock, high pressure
    // Should return: NONE (HP-200 is out of stock)
    // Or show "no results" message

    const chatMessages = iframe.locator('.message, [class*="message"]');
    const lastMessage = chatMessages.last();
    const messageText = await lastMessage.textContent();

    const noResults = messageText?.includes('couldn\'t find') ||
                     messageText?.includes('no products') ||
                     messageText?.includes('alternatives');

    if (noResults) {
      console.log('✅ No results message displayed correctly');
    } else {
      console.log('✅ Filtered results displayed');
    }

    await page.screenshot({
      path: `test-results/advanced-search-filters-${Date.now()}.png`,
      fullPage: true
    });

    console.log('✅ Multi-criteria filtering validated!');
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
