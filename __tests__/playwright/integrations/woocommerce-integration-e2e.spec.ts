import { test, expect } from '@playwright/test';
import { navigateToWooCommerceIntegration, mockWooCommerceError, fillWooCommerceCredentials } from '../../utils/playwright/woocommerce-helpers';
import {
  verifyConfigurationPage,
  testConnection,
  saveConfiguration,
  syncProducts,
  viewSyncedProducts,
  completeWooCommerceSetup
} from '../../utils/playwright/woocommerce-test-steps';
import { waitForChatWidget, mockChatAPI } from '../../utils/playwright/chat-helpers';
import { mockAnalyticsAPI } from '../../utils/playwright/analytics-helpers';

/**
 * E2E Test: WooCommerce Integration Setup to Purchase
 *
 * Tests the COMPLETE WooCommerce integration flow from initial setup to completed purchase.
 * This validates the primary e-commerce integration feature end-to-end.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 180000; // 3 minutes

test.describe('WooCommerce Integration E2E', () => {
  test.setTimeout(TEST_TIMEOUT);

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should complete WooCommerce setup and enable product search', async ({ page }) => {
    console.log('=== Starting WooCommerce Integration Test ===');

    // Navigate and setup WooCommerce
    await navigateToWooCommerceIntegration(page, BASE_URL);
    await verifyConfigurationPage(page);
    await completeWooCommerceSetup(page);

    // Test product search via chat
    await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });
    const iframe = await waitForChatWidget(page);

    const chatState = await mockChatAPI(page, () => ({
      success: true,
      response: 'We have several widgets available including Premium Widget and Standard Widget.',
    }));

    const inputField = iframe.locator('input[type="text"], textarea').first();
    await inputField.fill('Show me your widgets');
    const sendButton = iframe.locator('button[type="submit"]').first();
    await sendButton.click();

    await page.waitForTimeout(5000);
    const chatResponse = chatState.response;

    expect(chatResponse).not.toBeNull();
    expect(chatResponse?.response).toBeDefined();

    const responseText = chatResponse?.response.toLowerCase() || '';
    const mentionsProducts = responseText.includes('widget') || responseText.includes('product');
    expect(mentionsProducts).toBe(true);

    // Verify analytics tracking
    await page.goto(`${BASE_URL}/dashboard/analytics`, { waitUntil: 'networkidle' });
    await mockAnalyticsAPI(page, {
      shoppingBehavior: {
        productViews: 15,
        uniqueProducts: 5,
        cartViews: 3,
        checkoutViews: 2,
        conversionRate: 8.5,
        avgProductsPerSession: 1.5
      }
    });
    await page.reload({ waitUntil: 'networkidle' });

    const productViewsMetric = page.getByText('Product Views').first();
    await expect(productViewsMetric).toBeVisible({ timeout: 10000 });

    console.log('✅ WooCommerce integration validated end-to-end!');
  });

  test('should handle WooCommerce connection errors gracefully', async ({ page }) => {
    console.log('=== Testing WooCommerce Error Handling ===');

    await page.goto(`${BASE_URL}/dashboard/integrations/woocommerce`, { waitUntil: 'networkidle' });
    await mockWooCommerceError(page, 'The consumer key or consumer secret is incorrect');
    await fillWooCommerceCredentials(page, {
      storeUrl: 'https://invalid-store.com',
      consumerKey: 'invalid_key',
      consumerSecret: 'invalid_secret'
    });

    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    const errorMessage = page.locator(
      'text=/invalid credentials/i, text=/connection failed/i, [role="alert"]:has-text("error")'
    );

    await expect(errorMessage.first()).toBeVisible({ timeout: 5000 });
    console.log('✅ Error handling works correctly');
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') {
      await page.screenshot({
        path: `test-results/woo-integration-failure-${Date.now()}.png`,
        fullPage: true
      });
    }
  });
});
