import { test, expect } from '@playwright/test';
import { waitForChatWidget } from '../../utils/playwright/chat-helpers';

/**
 * E2E Test: Shopify Product Variants
 *
 * Tests product variant handling and selection.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 180000; // 3 minutes

test.describe('Shopify Product Variants E2E', () => {
  test.setTimeout(TEST_TIMEOUT);

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should handle product variant selection', async ({ page }) => {
    console.log('=== Testing Product Variant Handling ===');

    // Mock product with multiple variants
    await page.route('**/api/shopify/products/*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          product: {
            id: '123456789',
            title: 'T-Shirt',
            variants: [
              { id: 'var_1', title: 'Small / Red', price: '29.99', sku: 'TS-S-RED', available: true, inventory: 10 },
              { id: 'var_2', title: 'Small / Blue', price: '29.99', sku: 'TS-S-BLU', available: true, inventory: 15 },
              { id: 'var_3', title: 'Medium / Red', price: '29.99', sku: 'TS-M-RED', available: true, inventory: 20 },
              { id: 'var_4', title: 'Medium / Blue', price: '29.99', sku: 'TS-M-BLU', available: false, inventory: 0 },
              { id: 'var_5', title: 'Large / Red', price: '29.99', sku: 'TS-L-RED', available: true, inventory: 12 },
              { id: 'var_6', title: 'Large / Blue', price: '29.99', sku: 'TS-L-BLU', available: true, inventory: 8 }
            ],
            options: [
              { name: 'Size', values: ['Small', 'Medium', 'Large'] },
              { name: 'Color', values: ['Red', 'Blue'] }
            ]
          }
        })
      });
    });

    await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });
    const iframe = await waitForChatWidget(page);

    // Mock chat API with variant information
    await page.route('**/api/chat', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          response: 'T-Shirt is available in sizes Small, Medium, Large and colors Red, Blue. Note: Medium/Blue is currently out of stock.'
        })
      });
    });

    console.log('📍 Step: Query product with variants');
    const input = iframe.locator('input[type="text"], textarea').first();
    await input.fill('Do you have T-Shirts?');

    const sendButton = iframe.locator('button[type="submit"]').first();
    await sendButton.click();

    await page.waitForTimeout(3000);

    // Verify variant information
    console.log('📍 Step: Verifying variant details');
    const variantInfo = iframe.locator('text=/Small, Medium, Large/i, text=/out of stock/i').first();
    await expect(variantInfo).toBeVisible({ timeout: 10000 });

    console.log('✅ Product variant handling validated');
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') {
      await page.screenshot({
        path: `test-results/shopify-product-variants-failure-${Date.now()}.png`,
        fullPage: true
      });
    }
  });
});
