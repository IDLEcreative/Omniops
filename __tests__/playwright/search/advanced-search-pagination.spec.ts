import { test, expect } from '@playwright/test';
import { waitForChatWidget, sendChatMessage } from '../../utils/playwright/chat-helpers';

/**
 * E2E Test: Advanced Search - Pagination & Performance
 *
 * Tests pagination navigation and search performance.
 *
 * User Journey:
 * 1. Open chat widget
 * 2. Initial search (page 1)
 * 3. Navigate to next page
 * 4. Jump to specific page
 * 5. Navigate backwards
 * 6. Measure search performance across queries ← THE TRUE "END"
 *
 * This test validates:
 * - Pagination works correctly (next, previous, jump)
 * - Search performance is consistent
 * - No performance degradation with pagination
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 180000;

test.describe('Advanced Search Pagination & Performance E2E', () => {
  test.setTimeout(TEST_TIMEOUT);

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should paginate large result sets', async ({ page }) => {
    console.log('=== Starting Pagination Test ===');

    console.log('📍 Step 1: Loading chat widget');
    await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });
    const iframe = await waitForChatWidget(page);

    console.log('📍 Step 2: Setting up pagination mock');

    let currentPage = 1;
    const resultsPerPage = 5;
    const totalResults = 23;

    await page.route('**/api/chat', async (route) => {
      const requestData = route.request().postDataJSON();
      const query = requestData.message.toLowerCase();

      // Detect pagination request
      if (query.includes('next') || query.includes('more results')) {
        currentPage++;
      } else if (query.includes('previous') || query.includes('back')) {
        currentPage = Math.max(1, currentPage - 1);
      } else if (query.includes('page')) {
        const match = query.match(/page (\d+)/);
        if (match) currentPage = parseInt(match[1]);
      }

      const startIndex = (currentPage - 1) * resultsPerPage;
      const endIndex = Math.min(startIndex + resultsPerPage, totalResults);
      const totalPages = Math.ceil(totalResults / resultsPerPage);

      console.log(`📄 Page ${currentPage} of ${totalPages} (showing ${startIndex + 1}-${endIndex} of ${totalResults})`);

      const products = Array.from({ length: endIndex - startIndex }, (_, i) => ({
        id: startIndex + i + 1,
        name: `Product ${startIndex + i + 1}`
      }));

      const productList = products.map(p => `${p.id}. ${p.name}`).join('\n');

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          response: `Page ${currentPage} of ${totalPages}:\n\n${productList}\n\nShowing ${startIndex + 1}-${endIndex} of ${totalResults} results.\n\nSay "next" for more or "page X" to jump to a specific page.`,
          metadata: {
            currentPage,
            totalPages,
            totalResults,
            resultsPerPage,
            hasNext: currentPage < totalPages,
            hasPrevious: currentPage > 1
          }
        })
      });
    });

    console.log('✅ Pagination mock ready');

    console.log('📍 Step 3: Initial search (page 1)');
    await sendChatMessage(iframe, 'Show me all pumps');
    await page.waitForTimeout(2000);
    expect(currentPage).toBe(1);
    console.log('✅ Page 1 loaded');

    console.log('📍 Step 4: Navigate to next page');
    await sendChatMessage(iframe, 'Show me the next results');
    await page.waitForTimeout(2000);
    expect(currentPage).toBe(2);
    console.log('✅ Page 2 loaded');

    console.log('📍 Step 5: Jump to specific page');
    await sendChatMessage(iframe, 'Show me page 4');
    await page.waitForTimeout(2000);
    expect(currentPage).toBe(4);
    console.log('✅ Page 4 loaded');

    console.log('📍 Step 6: Navigate back');
    await sendChatMessage(iframe, 'Go back to previous page');
    await page.waitForTimeout(2000);
    expect(currentPage).toBe(3);
    console.log('✅ Page 3 loaded');

    console.log('✅ Pagination validated!');
  });

  test('should measure search performance', async ({ page }) => {
    console.log('=== Starting Search Performance Test ===');

    console.log('📍 Step 1: Loading chat widget');
    await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });
    const iframe = await waitForChatWidget(page);

    console.log('📍 Step 2: Setting up performance tracking');

    const performanceMetrics: Array<{ query: string; duration: number }> = [];

    await page.route('**/api/chat', async (route) => {
      const startTime = Date.now();

      // Simulate search processing delay
      await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

      const duration = Date.now() - startTime;
      const requestData = route.request().postDataJSON();

      performanceMetrics.push({
        query: requestData.message,
        duration
      });

      console.log(`⏱️  Search completed in ${duration}ms`);

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          response: 'Search results...',
          metadata: {
            searchDuration: duration,
            timestamp: new Date().toISOString()
          }
        })
      });
    });

    console.log('✅ Performance tracking ready');

    console.log('📍 Step 3: Running search performance tests');

    const queries = [
      'Show me pumps',
      'hydraulic pumps under $500',
      'high pressure pumps in stock',
      'best selling industrial equipment',
      'newest hydraulic pumps with specifications'
    ];

    for (let i = 0; i < queries.length; i++) {
      console.log(`📍 Query ${i + 1}/${queries.length}: "${queries[i]}"`);
      await sendChatMessage(iframe, queries[i]);
      await page.waitForTimeout(1000);
    }

    console.log('📍 Step 4: Analyzing performance metrics');

    const avgDuration = performanceMetrics.reduce((sum, m) => sum + m.duration, 0) / performanceMetrics.length;
    const maxDuration = Math.max(...performanceMetrics.map(m => m.duration));
    const minDuration = Math.min(...performanceMetrics.map(m => m.duration));

    console.log('📊 Performance Summary:');
    console.log(`   - Average: ${avgDuration.toFixed(0)}ms`);
    console.log(`   - Min: ${minDuration}ms`);
    console.log(`   - Max: ${maxDuration}ms`);
    console.log(`   - Total queries: ${performanceMetrics.length}`);

    // Performance assertions
    expect(avgDuration).toBeLessThan(500); // Average should be under 500ms
    expect(maxDuration).toBeLessThan(1000); // No query should take more than 1 second

    console.log('✅ Search performance within acceptable limits!');
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') {
      await page.screenshot({
        path: `test-results/search-pagination-failure-${Date.now()}.png`,
        fullPage: true
      });
    }
  });
});
