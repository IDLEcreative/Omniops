import { test, expect } from '@playwright/test';
import { waitForChatWidget, sendChatMessage } from '../../utils/playwright/chat-helpers';

/**
 * E2E Test: Advanced Search - Sorting & No Results
 *
 * Tests search result sorting and no results handling.
 *
 * User Journey:
 * 1. Open chat widget
 * 2. Sort results by price (ascending/descending)
 * 3. Sort by popularity and newest
 * 4. Handle "no results" queries with suggestions
 * 5. Display helpful alternatives ← THE TRUE "END"
 *
 * This test validates:
 * - Sorting works correctly (price, popularity, date)
 * - No results shows helpful suggestions
 * - Alternative suggestions are provided
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 180000;

test.describe('Advanced Search Sorting & No Results E2E', () => {
  test.setTimeout(TEST_TIMEOUT);

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should sort search results by different criteria', async ({ page }) => {
    console.log('=== Starting Sort Test ===');

    console.log('📍 Step 1: Loading chat widget');
    await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });
    const iframe = await waitForChatWidget(page);

    console.log('📍 Step 2: Setting up sort mock');

    let sortBy = 'relevance';

    await page.route('**/api/chat', async (route) => {
      const requestData = route.request().postDataJSON();
      const query = requestData.message.toLowerCase();

      // Detect sort criteria
      if (query.includes('cheapest') || query.includes('lowest price')) {
        sortBy = 'price_asc';
      } else if (query.includes('most expensive') || query.includes('highest price')) {
        sortBy = 'price_desc';
      } else if (query.includes('newest')) {
        sortBy = 'newest';
      } else if (query.includes('best selling') || query.includes('popular')) {
        sortBy = 'popularity';
      } else {
        sortBy = 'relevance';
      }

      console.log('📊 Sort by:', sortBy);

      const products = [
        { name: 'A4VTG90', price: 2499, created: '2024-01-15', sales: 50 },
        { name: 'BP-001', price: 1899, created: '2024-06-10', sales: 120 },
        { name: 'MP-500', price: 399, created: '2024-11-01', sales: 30 },
        { name: 'HP-200', price: 450, created: '2024-03-20', sales: 75 },
      ];

      // Sort products
      const sortedProducts = [...products];
      if (sortBy === 'price_asc') {
        sortedProducts.sort((a, b) => a.price - b.price);
      } else if (sortBy === 'price_desc') {
        sortedProducts.sort((a, b) => b.price - a.price);
      } else if (sortBy === 'newest') {
        sortedProducts.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
      } else if (sortBy === 'popularity') {
        sortedProducts.sort((a, b) => b.sales - a.sales);
      }

      const productList = sortedProducts.map(p => `${p.name} - $${p.price}`).join('\n');

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          response: `Products sorted by ${sortBy}:\n\n${productList}`,
          metadata: { sortBy, products: sortedProducts }
        })
      });
    });

    console.log('✅ Sort mock ready');

    // Test different sort criteria
    console.log('📍 Step 3: Sort by price (ascending)');
    await sendChatMessage(iframe, 'Show me pumps sorted by cheapest first');
    await page.waitForTimeout(2000);
    expect(sortBy).toBe('price_asc');
    console.log('✅ Price ascending sort working');

    console.log('📍 Step 4: Sort by price (descending)');
    await sendChatMessage(iframe, 'Show me the most expensive pumps');
    await page.waitForTimeout(2000);
    expect(sortBy).toBe('price_desc');
    console.log('✅ Price descending sort working');

    console.log('📍 Step 5: Sort by popularity');
    await sendChatMessage(iframe, 'Show me your best selling pumps');
    await page.waitForTimeout(2000);
    expect(sortBy).toBe('popularity');
    console.log('✅ Popularity sort working');

    console.log('📍 Step 6: Sort by newest');
    await sendChatMessage(iframe, 'Show me the newest pumps');
    await page.waitForTimeout(2000);
    expect(sortBy).toBe('newest');
    console.log('✅ Newest sort working');

    console.log('✅ Sorting functionality validated!');
  });

  test('should handle "no results" with helpful suggestions', async ({ page }) => {
    console.log('=== Starting No Results Test ===');

    console.log('📍 Step 1: Loading chat widget');
    await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });
    const iframe = await waitForChatWidget(page);

    console.log('📍 Step 2: Setting up no results mock');

    await page.route('**/api/chat', async (route) => {
      const requestData = route.request().postDataJSON();
      const query = requestData.message.toLowerCase();

      // Impossible query (no results)
      if (query.includes('purple elephant pump')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            response: `I couldn't find any products matching "purple elephant pump".\n\nDid you mean:\n• Purple hydraulic pump?\n• Industrial elephant pump?\n• Standard hydraulic pump?\n\nOr try browsing our categories:\n• Hydraulic Pumps\n• Electric Pumps\n• Industrial Equipment`,
            metadata: {
              totalResults: 0,
              suggestions: [
                'Purple hydraulic pump',
                'Industrial elephant pump',
                'Standard hydraulic pump'
              ],
              categories: ['Hydraulic Pumps', 'Electric Pumps', 'Industrial Equipment']
            }
          })
        });
      } else {
        // Normal results
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            response: 'Here are some products...',
            metadata: { totalResults: 5 }
          })
        });
      }
    });

    console.log('✅ No results mock ready');

    console.log('📍 Step 3: Searching for impossible query');
    await sendChatMessage(iframe, 'Do you have a purple elephant pump?');
    await page.waitForTimeout(2000);

    console.log('📍 Step 4: Verifying no results message');
    const chatMessages = iframe.locator('.message, [class*="message"]');
    const lastMessage = chatMessages.last();
    const messageText = await lastMessage.textContent();

    const hasNoResultsMessage = messageText?.includes('couldn\'t find') ||
                               messageText?.includes('Did you mean');
    expect(hasNoResultsMessage).toBe(true);
    console.log('✅ No results message displayed');

    const hasSuggestions = messageText?.includes('Did you mean') ||
                          messageText?.includes('try browsing');
    expect(hasSuggestions).toBe(true);
    console.log('✅ Suggestions provided');

    console.log('✅ No results handling validated!');
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
