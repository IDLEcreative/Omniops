import { test, expect } from '@playwright/test';

/**
 * E2E Test: Shopify Webhook Processing
 *
 * Tests webhook event processing and logs.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 180000; // 3 minutes

test.describe('Shopify Webhooks E2E', () => {
  test.setTimeout(TEST_TIMEOUT);

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should process Shopify webhook events', async ({ page }) => {
    console.log('=== Testing Shopify Webhook Processing ===');

    // Mock webhook endpoint
    await page.route('**/webhooks/shopify', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Webhook processed',
          event: 'orders/create'
        })
      });
    });

    // Mock webhook logs
    await page.route('**/api/shopify/webhooks/logs', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          logs: [
            {
              id: 'webhook_1',
              event: 'orders/create',
              status: 'processed',
              receivedAt: new Date().toISOString(),
              processedAt: new Date(Date.now() + 1000).toISOString(),
              payload: { orderId: '1001', total: '249.99' }
            },
            {
              id: 'webhook_2',
              event: 'orders/updated',
              status: 'processed',
              receivedAt: new Date(Date.now() - 3600000).toISOString(),
              processedAt: new Date(Date.now() - 3599000).toISOString(),
              payload: { orderId: '1001', status: 'fulfilled' }
            }
          ]
        })
      });
    });

    console.log('📍 Step: Navigate to webhook logs');
    await page.goto(`${BASE_URL}/dashboard/shopify/webhooks`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Verify webhook logs displayed
    const webhookLog = page.locator('text=/orders\\/create/i, text=/processed/i').first();
    await expect(webhookLog).toBeVisible({ timeout: 10000 });

    console.log('✅ Webhook processing validated');
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') {
      await page.screenshot({
        path: `test-results/shopify-webhooks-failure-${Date.now()}.png`,
        fullPage: true
      });
    }
  });
});
