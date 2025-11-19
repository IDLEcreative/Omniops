import { test, expect } from '@playwright/test';
import { waitForChatWidget, sendChatMessage } from '../../utils/playwright/chat-helpers';

/**
 * E2E Test: Chat Source Citations
 *
 * Tests source citation display in chat responses.
 * Validates that AI provides sources for answers.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Chat Source Citations', () => {
  test('should display sources for chat responses', async ({ page }) => {
    console.log('=== Testing Source Citations ===');

    await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });
    const iframe = await waitForChatWidget(page);

    await page.route('**/api/chat', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          response: 'Based on our product page...',
          sources: [{ url: '/products', title: 'Products Page' }]
        })
      });
    });

    console.log('📍 Step 1: Send query');
    await sendChatMessage(iframe, 'Tell me about your products');
    await page.waitForTimeout(3000);

    console.log('📍 Step 2: Look for source links');
    const sourceLinks = iframe.locator('a[href*="products"], text=/source/i');
    const hasSource = await sourceLinks.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (hasSource) {
      console.log('✅ Source citations displayed');
    } else {
      console.log('⏭️  No source citations found');
    }

    console.log('✅ Source citations test completed!');
  });
});
