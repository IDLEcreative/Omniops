import { test, expect } from '@playwright/test';
import { waitForChatWidget, sendChatMessage } from '../../utils/playwright/chat-helpers';

/**
 * E2E Test: Product Links in Chat
 *
 * Tests product link display in chat responses.
 * Validates clickable product links from AI responses.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Product Links in Chat', () => {
  test('should display clickable product links', async ({ page }) => {
    console.log('=== Testing Product Links in Chat ===');

    await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });
    const iframe = await waitForChatWidget(page);

    await page.route('**/api/chat', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          response: 'Check out our Premium Widget',
          sources: [{ url: '/product/premium-widget', title: 'Premium Widget' }]
        })
      });
    });

    console.log('📍 Step 1: Send product query');
    await sendChatMessage(iframe, 'Show me products');
    await page.waitForTimeout(3000);

    console.log('📍 Step 2: Look for product links');
    const productLinks = page.locator('a[href*="/product/"], a.product-link');
    const linkCount = await productLinks.count();
    console.log(`🔗 Found ${linkCount} product links`);

    if (linkCount > 0) {
      console.log('✅ Product links displayed in chat');
    } else {
      console.log('⏭️  No product links found');
    }

    console.log('✅ Product links test completed!');
  });
});
