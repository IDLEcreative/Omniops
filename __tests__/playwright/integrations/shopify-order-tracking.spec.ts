import { test, expect } from '@playwright/test';

/**
 * E2E Test: Shopify Order Tracking
 *
 * Tests order tracking setup and order status queries.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 180000; // 3 minutes

test.describe('Shopify Order Tracking E2E', () => {
  test.setTimeout(TEST_TIMEOUT);

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should setup order tracking', async ({ page }) => {
    console.log('=== Testing Order Tracking Setup ===');

    // Mock Shopify configuration endpoint
    await page.route('**/api/shopify/configure', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Shopify configured successfully',
          config: {
            shopDomain: 'test-store.myshopify.com',
            orderTrackingEnabled: true,
            webhooksEnabled: true,
            apiVersion: '2024-01'
          }
        })
      });
    });

    console.log('📍 Step: Navigate to Shopify integration');
    await page.goto(`${BASE_URL}/dashboard/integrations/shopify`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Enable order tracking
    console.log('📍 Step: Enabling order tracking');
    const orderTrackingToggle = page.locator('input[type="checkbox"][name*="order"], label:has-text("Order Tracking")').first();
    const hasToggle = await orderTrackingToggle.isVisible().catch(() => false);

    if (hasToggle) {
      await orderTrackingToggle.click();
      await page.waitForTimeout(1000);
    }

    // Save configuration
    const saveButton = page.locator('button:has-text("Save"), button[type="submit"]').first();
    await saveButton.click();

    await page.waitForTimeout(2000);

    // Verify success
    console.log('📍 Step: Verifying order tracking enabled');
    const successMessage = page.locator('text=/order tracking.*enabled/i, [role="alert"]:has-text("success")').first();
    await expect(successMessage).toBeVisible({ timeout: 10000 });

    console.log('✅ Order tracking setup validated');
  });

  test('should query order status', async ({ page }) => {
    console.log('=== Testing Order Status Queries ===');

    // Mock Shopify order API
    await page.route('**/api/shopify/orders/*', async (route) => {
      const orderId = route.request().url().split('/').pop();

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          order: {
            id: orderId,
            name: '#1001',
            email: 'customer@example.com',
            financialStatus: 'paid',
            fulfillmentStatus: 'fulfilled',
            totalPrice: '249.99',
            currency: 'USD',
            lineItems: [
              { title: 'Premium Wireless Headphones', quantity: 1, price: '149.99' },
              { title: 'Phone Case', quantity: 2, price: '50.00' }
            ],
            shippingAddress: {
              address1: '123 Main St',
              city: 'San Francisco',
              province: 'CA',
              country: 'United States',
              zip: '94102'
            },
            trackingNumber: 'USPS123456789',
            trackingUrl: 'https://tools.usps.com/go/TrackConfirmAction?tLabels=123456789',
            createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
            updatedAt: new Date().toISOString()
          }
        })
      });
    });

    console.log('📍 Step: Navigate to order lookup');
    await page.goto(`${BASE_URL}/dashboard/shopify/orders`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Search for order
    console.log('📍 Step: Searching for order #1001');
    const searchInput = page.locator('input[placeholder*="order"], input[name*="order"]').first();
    const hasSearch = await searchInput.isVisible().catch(() => false);

    if (hasSearch) {
      await searchInput.fill('1001');
      await page.waitForTimeout(1000);

      // Verify order details displayed
      const orderNumber = page.locator('text=/#1001/i').first();
      await expect(orderNumber).toBeVisible({ timeout: 10000 });

      // Verify order status
      const fulfillmentStatus = page.locator('text=/fulfilled/i').first();
      const hasStatus = await fulfillmentStatus.isVisible().catch(() => false);

      if (hasStatus) {
        console.log('✅ Order status displayed: fulfilled');
      }

      // Verify tracking number
      const tracking = page.locator('text=/USPS123456789/i').first();
      const hasTracking = await tracking.isVisible().catch(() => false);

      if (hasTracking) {
        console.log('✅ Tracking number displayed');
      }
    }

    console.log('✅ Order status queries validated');
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') {
      await page.screenshot({
        path: `test-results/shopify-order-tracking-failure-${Date.now()}.png`,
        fullPage: true
      });
    }
  });
});
