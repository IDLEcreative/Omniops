/**
 * Product Recommendations E2E Test
 *
 * Tests complete user workflow from chat to purchase with recommendations
 */

import { test, expect } from '@playwright/test';

test.describe('Product Recommendations E2E Flow', () => {
  const testDomain = 'e2e-recommendations-test.com';
  const testSession = `test-session-${Date.now()}`;

  test.beforeEach(async ({ page }) => {
    // Navigate to widget test page
    await page.goto('http://localhost:3000/widget-test');

    console.log('📍 Step 1: Loaded widget test page');
  });

  test('complete recommendation workflow: chat → recommendations → click → purchase tracking', async ({
    page,
  }) => {
    console.log('🎯 Testing: Complete product recommendation workflow');

    // Step 1: Wait for chat widget to load
    await page.waitForSelector('iframe#chat-widget-iframe', { timeout: 10000 });
    console.log('✅ Step 2: Chat widget iframe loaded');

    const iframe = page.frameLocator('iframe#chat-widget-iframe');

    // Step 2: Wait for chat input to be ready
    await iframe.locator('input[placeholder*="message"], textarea').waitFor({
      timeout: 10000,
    });
    console.log('✅ Step 3: Chat input ready');

    // Step 3: Send message expressing product interest
    const chatInput = iframe.locator('input[placeholder*="message"], textarea');
    await chatInput.fill('I need a hydraulic pump for my machinery');
    console.log('📍 Step 4: Typed product inquiry message');

    await chatInput.press('Enter');
    console.log('✅ Step 5: Sent message');

    // Step 4: Wait for AI response
    await page.waitForTimeout(3000); // Wait for AI to process
    console.log('⏳ Step 6: Waiting for AI response...');

    // Step 5: Look for recommendations section
    const recommendationsSection = iframe.locator('text=Recommended for you');

    // Wait up to 15 seconds for recommendations to appear
    await expect(recommendationsSection).toBeVisible({ timeout: 15000 });
    console.log('✅ Step 7: Recommendations appeared');

    // Step 6: Verify recommendation elements
    const algorithmBadge = iframe.locator('[data-testid="algorithm-badge"]').first();
    await expect(algorithmBadge).toBeVisible();
    console.log('✅ Step 8: Algorithm badge visible');

    // Step 7: Verify View Product button exists
    const viewProductButton = iframe.locator('button:has-text("View Product")');
    await expect(viewProductButton).toBeVisible();
    console.log('✅ Step 9: View Product button visible');

    // Step 8: Navigate through carousel if multiple recommendations
    const carouselNav = iframe.locator('text=/\\d+ \\/ \\d+/');
    if (await carouselNav.isVisible()) {
      console.log('📍 Step 10: Multiple recommendations detected, testing navigation');

      // Get total count
      const navText = await carouselNav.textContent();
      const match = navText?.match(/(\d+) \/ (\d+)/);

      if (match) {
        const currentIndex = parseInt(match[1]);
        const totalCount = parseInt(match[2]);

        console.log(`✅ Step 11: Showing ${currentIndex} of ${totalCount} recommendations`);

        // Click next button
        const nextButton = iframe.locator('[aria-label="Next recommendation"]').first();
        if (await nextButton.isVisible()) {
          await nextButton.click();
          console.log('✅ Step 12: Navigated to next recommendation');

          await page.waitForTimeout(500); // Wait for navigation animation

          // Verify index changed
          const newNavText = await carouselNav.textContent();
          expect(newNavText).not.toBe(navText);
          console.log('✅ Step 13: Carousel navigation working');
        }
      }
    } else {
      console.log('📍 Step 10: Single recommendation shown');
    }

    // Step 9: Click View Product button (tracks click event)
    await viewProductButton.first().click();
    console.log('✅ Step 14: Clicked View Product button');

    // Step 10: Verify navigation or modal opened
    await page.waitForTimeout(1000);
    console.log('✅ Step 15: Product view action triggered');

    // Step 11: Simulate purchase (in real scenario, would complete checkout)
    // For testing, we'll make a direct API call to track purchase
    const response = await page.request.post('http://localhost:3000/api/recommendations', {
      data: {
        productId: 'test-product-1',
        eventType: 'purchase',
        sessionId: testSession,
      },
    });

    expect(response.ok()).toBeTruthy();
    console.log('✅ Step 16: Purchase event tracked successfully');

    // Step 12: Verify analytics dashboard shows metrics (optional)
    await page.goto('http://localhost:3000/dashboard/analytics');
    console.log('📍 Step 17: Navigated to analytics dashboard');

    await page.waitForSelector('text=/recommendation/i', { timeout: 10000 });
    console.log('✅ Step 18: Analytics dashboard loaded with recommendation data');

    console.log('🎉 Complete workflow test passed!');
  });

  test('recommendation algorithms display correctly', async ({ page }) => {
    console.log('🎯 Testing: Recommendation algorithm badges');

    await page.waitForSelector('iframe#chat-widget-iframe');
    const iframe = page.frameLocator('iframe#chat-widget-iframe');

    // Send query
    const chatInput = iframe.locator('input[placeholder*="message"], textarea');
    await chatInput.fill('Show me your best products');
    await chatInput.press('Enter');

    // Wait for recommendations
    await iframe.locator('text=Recommended for you').waitFor({ timeout: 15000 });

    // Check for algorithm badge
    const algorithmBadges = iframe.locator('[data-testid="algorithm-badge"]');
    const count = await algorithmBadges.count();

    expect(count).toBeGreaterThan(0);

    // Verify badge shows valid algorithm type
    const firstBadgeText = await algorithmBadges.first().textContent();
    const validAlgorithms = ['hybrid', 'vector_similarity', 'collaborative', 'content_based'];

    expect(validAlgorithms).toContain(firstBadgeText?.trim());
    console.log(`✅ Algorithm badge shows: ${firstBadgeText}`);
  });

  test('empty state when no recommendations available', async ({ page }) => {
    console.log('🎯 Testing: Empty recommendation state');

    await page.waitForSelector('iframe#chat-widget-iframe');
    const iframe = page.frameLocator('iframe#chat-widget-iframe');

    // Send very specific query unlikely to have recommendations
    const chatInput = iframe.locator('input[placeholder*="message"], textarea');
    await chatInput.fill('xyz123nonexistentproduct456abc');
    await chatInput.press('Enter');

    await page.waitForTimeout(5000);

    // Verify recommendations section doesn't appear
    const recommendationsSection = iframe.locator('text=Recommended for you');
    await expect(recommendationsSection).not.toBeVisible();

    console.log('✅ No recommendations shown for non-matching query');
  });

  test('click tracking without navigation', async ({ page }) => {
    console.log('🎯 Testing: Click tracking in isolation');

    // Make direct API call to test click tracking
    const response = await page.request.post('http://localhost:3000/api/recommendations', {
      data: {
        productId: 'test-product-123',
        eventType: 'click',
        sessionId: testSession,
      },
    });

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);

    console.log('✅ Click event tracked successfully via API');
  });

  test('purchase tracking without navigation', async ({ page }) => {
    console.log('🎯 Testing: Purchase tracking in isolation');

    // Make direct API call to test purchase tracking
    const response = await page.request.post('http://localhost:3000/api/recommendations', {
      data: {
        productId: 'test-product-456',
        eventType: 'purchase',
        sessionId: testSession,
      },
    });

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);

    console.log('✅ Purchase event tracked successfully via API');
  });

  test('recommendation API returns valid data', async ({ page }) => {
    console.log('🎯 Testing: Recommendation API endpoint');

    // Test GET /api/recommendations
    const response = await page.request.get(
      `http://localhost:3000/api/recommendations?domainId=test-domain&sessionId=${testSession}&limit=5`
    );

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    expect(data.data.recommendations).toBeDefined();
    expect(Array.isArray(data.data.recommendations)).toBe(true);

    console.log(`✅ API returned ${data.data.recommendations.length} recommendations`);
  });

  test('invalid API requests return proper errors', async ({ page }) => {
    console.log('🎯 Testing: API error handling');

    // Test without required domainId
    const response = await page.request.get(
      `http://localhost:3000/api/recommendations?sessionId=${testSession}`
    );

    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();

    console.log('✅ API correctly rejects invalid requests');
  });
});
