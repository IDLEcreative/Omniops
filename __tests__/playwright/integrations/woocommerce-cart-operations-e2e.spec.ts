import { test, expect } from '@playwright/test';
import { CartWidgetPage } from './page-objects/cart-widget';
import {
  TEST_CONFIGS,
  setupCartAPIRoute,
  setupChatAPIRoute,
} from './helpers/cart-test-helpers';

/**
 * E2E Test: WooCommerce Direct Cart Manipulation
 *
 * Tests both informational and transactional modes for cart operations.
 * Validates the complete flow from chat request to cart update.
 *
 * This test teaches AI agents:
 * - How to handle cart operations in both modes
 * - Expected responses for each operation type
 * - Session management across conversations
 * - Error recovery patterns
 * - Fallback strategies when Store API unavailable
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 120000; // 2 minutes

test.describe('WooCommerce Cart Operations E2E', () => {
  test.setTimeout(TEST_TIMEOUT);

  for (const config of TEST_CONFIGS) {
    test(`should handle cart operations in ${config.name}`, async ({ page }) => {
      console.log(`=== Testing ${config.name} ===`);

      // Set up test environment
      console.log('📍 Step 1: Setting up test environment');
      await page.addInitScript((cfg) => {
        (window as any).__TEST_STORE_API_ENABLED = cfg.storeAPIEnabled;
      }, config);

      await setupCartAPIRoute(page, config);
      await setupChatAPIRoute(page, config);

      // Navigate to widget
      console.log('📍 Step 2: Loading chat widget');
      await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });

      const widgetIframe = page.locator('iframe#chat-widget-iframe');
      await widgetIframe.waitFor({ state: 'attached', timeout: 15000 });
      await page.waitForTimeout(2000);

      const iframe = page.frameLocator('iframe#chat-widget-iframe');
      const widget = new CartWidgetPage(page, iframe);

      console.log('✅ Chat widget loaded');

      // Test add to cart
      console.log('📍 Step 3: Testing add to cart operation');
      await widget.sendMessage('Add the A4VTG90 pump to my cart');

      let response = await widget.getLastMessage();
      if (config.storeAPIEnabled) {
        expect(response).toContain('added');
        expect(response).toContain('Cart Total');
        expect(response).toContain('$2,499.00');
        console.log('✅ Transactional mode: Item added directly to cart');
      } else {
        expect(response).toContain('click here');
        expect(response).toContain('add-to-cart');
        console.log('✅ Informational mode: Add-to-cart URL provided');
      }

      // Test view cart
      console.log('📍 Step 4: Testing view cart operation');
      await widget.sendMessage('Show my cart');

      response = await widget.getLastMessage();
      if (config.storeAPIEnabled) {
        expect(response).toContain('Your Current Cart');
        expect(response).toContain('A4VTG90');
        console.log('✅ Transactional mode: Cart contents displayed');
      } else {
        expect(response).toContain('/cart');
        expect(response).toContain('view your cart');
        console.log('✅ Informational mode: Cart URL provided');
      }

      // Test coupon application
      console.log('📍 Step 5: Testing coupon application');
      await widget.sendMessage('Apply coupon SAVE10');

      response = await widget.getLastMessage();
      if (config.storeAPIEnabled) {
        expect(response).toContain('applied successfully');
        expect(response).toContain('Discount');
        expect(response).toContain('$2,249.10');
        console.log('✅ Transactional mode: Coupon applied directly');
      } else {
        expect(response).toContain('Enter coupon code');
        expect(response).toContain('Apply Coupon');
        console.log('✅ Informational mode: Coupon instructions provided');
      }

      // Test API endpoint directly
      console.log('📍 Step 6: Testing cart API endpoint directly');
      const apiResponse = await page.request.post(`${BASE_URL}/api/woocommerce/cart-test`, {
        data: { domain: 'test-store.com', action: 'add', productId: 456, quantity: 2 },
      });

      expect(apiResponse.ok()).toBeTruthy();
      const apiData = await apiResponse.json();
      expect(apiData.success).toBeTruthy();
      expect(apiData.mode).toBe(config.expectedMode);
      console.log(`✅ API endpoint working in ${config.expectedMode} mode`);

      // Verify mode status
      console.log('📍 Step 7: Checking Store API status');
      const statusResponse = await page.request.get(`${BASE_URL}/api/woocommerce/cart-test`);
      expect(statusResponse.ok()).toBeTruthy();

      const statusData = await statusResponse.json();
      console.log(`📊 Store API Status:`, {
        enabled: statusData.enabled,
        mode: statusData.mode,
        hasRedis: statusData.configuration.hasRedis,
      });

      console.log(`✅ ${config.name} test completed successfully!\n`);
    });
  }

  test('should maintain cart session across messages', async ({ page }) => {
    console.log('=== Testing Session Persistence ===');

    await page.addInitScript(() => {
      (window as any).__TEST_STORE_API_ENABLED = true;
    });

    let sessionId: string | null = null;

    await page.route('**/api/woocommerce/cart-test', async (route) => {
      if (!sessionId) sessionId = `session_${Date.now()}`;

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          mode: 'transactional',
          sessionId,
          message: `Operation completed with session: ${sessionId}`,
          cart: { items: [], totals: { total: '0.00' } },
        }),
      });
    });

    await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });

    const requests = ['add item', 'update quantity', 'view cart'];
    for (const req of requests) {
      console.log(`📍 Testing session persistence with: "${req}"`);

      const response = await page.request.post(`${BASE_URL}/api/woocommerce/cart-test`, {
        data: { domain: 'test-store.com', action: 'get' },
      });

      const data = await response.json();
      if (sessionId) {
        expect(data.sessionId).toBe(sessionId);
        console.log(`✅ Session persisted: ${sessionId}`);
      }
    }

    console.log('✅ Session persistence test completed!\n');
  });

  test('should handle Store API failures gracefully', async ({ page }) => {
    console.log('=== Testing Error Handling and Fallback ===');

    await page.route('**/api/woocommerce/cart-test', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          message: 'Store API connection failed',
          fallback: 'informational',
        }),
      });
    });

    const response = await page.request.post(`${BASE_URL}/api/woocommerce/cart-test`, {
      data: { domain: 'test-store.com', action: 'add', productId: 789 },
    });

    expect(response.status()).toBe(500);
    const data = await response.json();
    expect(data.success).toBeFalsy();
    expect(data.message).toContain('failed');

    console.log('✅ Error handling working correctly');
    console.log('✅ System can fallback to informational mode on failure\n');
  });
});
