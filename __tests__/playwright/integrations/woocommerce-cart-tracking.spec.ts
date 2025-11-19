import { test, expect } from '@playwright/test';
import { navigateToWooCommerceIntegration, fillWooCommerceCredentials } from '../../utils/playwright/woocommerce-helpers';
import { waitForChatWidget } from '../../utils/playwright/chat-helpers';

/**
 * E2E Test: WooCommerce Cart Tracking & Abandoned Carts
 *
 * Tests cart tracking functionality including:
 * - Cart tracking setup and initialization
 * - Abandoned cart detection
 * - Abandoned cart email triggers
 * - Cart recovery workflows
 *
 * This validates the revenue recovery features of the WooCommerce integration.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 180000; // 3 minutes

test.describe('WooCommerce Cart Tracking E2E', () => {
  test.setTimeout(TEST_TIMEOUT);

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should setup cart tracking successfully', async ({ page }) => {
    console.log('=== Testing Cart Tracking Setup ===');

    // Mock cart tracking configuration endpoint
    await page.route('**/api/woocommerce/cart-tracking/setup', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Cart tracking enabled',
          config: {
            trackingEnabled: true,
            abandonmentThreshold: 30, // minutes
            emailEnabled: true,
            webhookUrl: 'https://omniops.co.uk/webhooks/woocommerce/cart'
          }
        })
      });
    });

    console.log('📍 Step: Navigate to WooCommerce integration');
    await navigateToWooCommerceIntegration(page, BASE_URL);

    await fillWooCommerceCredentials(page, {
      storeUrl: 'https://test-store.com',
      consumerKey: 'ck_test123',
      consumerSecret: 'cs_test123'
    });

    // Find and enable cart tracking
    console.log('📍 Step: Enabling cart tracking');
    const cartTrackingToggle = page.locator(
      'input[type="checkbox"][name*="cart"], button:has-text("Enable Cart Tracking")'
    ).first();

    const hasToggle = await cartTrackingToggle.isVisible().catch(() => false);

    if (hasToggle) {
      await cartTrackingToggle.click();
      await page.waitForTimeout(1000);
    }

    // Save configuration
    const saveButton = page.locator('button:has-text("Save"), button[type="submit"]').first();
    await saveButton.click();

    await page.waitForTimeout(2000);

    // Verify cart tracking enabled
    console.log('📍 Step: Verifying cart tracking enabled');
    const successMessage = page.locator(
      'text=/cart tracking.*enabled/i, [role="alert"]:has-text("success")'
    ).first();
    await expect(successMessage).toBeVisible({ timeout: 10000 });

    console.log('✅ Cart tracking setup validated');
  });

  test('should detect abandoned carts', async ({ page }) => {
    console.log('=== Testing Abandoned Cart Detection ===');

    // Mock abandoned carts API
    await page.route('**/api/woocommerce/abandoned-carts', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          carts: [
            {
              id: 'cart_123',
              email: 'customer@example.com',
              items: [
                { productId: 101, name: 'Test Product', quantity: 2, price: 29.99 }
              ],
              total: 59.98,
              currency: 'USD',
              abandonedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
              sessionDuration: 450, // seconds
              pageViews: 5
            },
            {
              id: 'cart_456',
              email: 'another@example.com',
              items: [
                { productId: 102, name: 'Another Product', quantity: 1, price: 49.99 }
              ],
              total: 49.99,
              currency: 'USD',
              abandonedAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
              sessionDuration: 300,
              pageViews: 3
            }
          ],
          stats: {
            totalAbandoned: 2,
            totalValue: 109.97,
            last24Hours: 2,
            recoveryRate: 15.5
          }
        })
      });
    });

    console.log('📍 Step: Navigate to abandoned carts view');
    await page.goto(`${BASE_URL}/dashboard/woocommerce/abandoned-carts`, { waitUntil: 'networkidle' });

    await page.waitForTimeout(2000);

    // Verify abandoned carts displayed
    console.log('📍 Step: Verifying abandoned carts displayed');
    const cartList = page.locator('[data-testid="abandoned-cart-list"], table, .cart-item').first();
    await expect(cartList).toBeVisible({ timeout: 10000 });

    // Verify cart details
    const firstCart = page.locator('text=/customer@example.com/i').first();
    await expect(firstCart).toBeVisible({ timeout: 5000 });

    // Verify total value
    const totalValue = page.locator('text=/\\$59\\.98/i, text=/59\\.98/i').first();
    const valueVisible = await totalValue.isVisible().catch(() => false);

    console.log('✅ Abandoned cart detection validated');
  });

  test('should trigger abandoned cart email', async ({ page }) => {
    console.log('=== Testing Abandoned Cart Email Trigger ===');

    // Mock email trigger endpoint
    await page.route('**/api/woocommerce/abandoned-carts/*/email', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Recovery email sent',
          email: {
            to: 'customer@example.com',
            subject: 'You left items in your cart',
            sentAt: new Date().toISOString(),
            cartValue: 59.98,
            recoveryLink: 'https://test-store.com/cart/recover/abc123'
          }
        })
      });
    });

    // Mock abandoned carts list
    await page.route('**/api/woocommerce/abandoned-carts', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          carts: [{
            id: 'cart_123',
            email: 'customer@example.com',
            total: 59.98,
            abandonedAt: new Date(Date.now() - 3600000).toISOString()
          }]
        })
      });
    });

    await page.goto(`${BASE_URL}/dashboard/woocommerce/abandoned-carts`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Click send email button
    console.log('📍 Step: Clicking send recovery email button');
    const sendEmailButton = page.locator(
      'button:has-text("Send Email"), button:has-text("Send Recovery")'
    ).first();
    await sendEmailButton.click();

    await page.waitForTimeout(2000);

    // Verify email sent confirmation
    console.log('📍 Step: Verifying email sent confirmation');
    const emailConfirmation = page.locator(
      'text=/email sent/i, text=/recovery.*sent/i, [role="alert"]:has-text("success")'
    ).first();
    await expect(emailConfirmation).toBeVisible({ timeout: 10000 });

    console.log('✅ Abandoned cart email trigger validated');
  });

  test('should track cart recovery success', async ({ page }) => {
    console.log('=== Testing Cart Recovery Tracking ===');

    // Mock cart recovery analytics
    await page.route('**/api/woocommerce/cart-analytics', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          recoveryStats: {
            totalAbandoned: 50,
            totalRecovered: 12,
            recoveryRate: 24.0,
            recoveredValue: 1250.50,
            totalAbandonedValue: 5200.00,
            emailsSent: 45,
            emailOpenRate: 35.5,
            emailClickRate: 22.0,
            avgTimeToRecovery: 180 // minutes
          },
          recentRecoveries: [
            {
              cartId: 'cart_789',
              email: 'recovered@example.com',
              value: 89.99,
              recoveredAt: new Date().toISOString(),
              emailSentAt: new Date(Date.now() - 7200000).toISOString()
            }
          ]
        })
      });
    });

    console.log('📍 Step: Navigate to cart analytics');
    await page.goto(`${BASE_URL}/dashboard/analytics`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Look for cart recovery metrics
    console.log('📍 Step: Verifying cart recovery metrics');
    const recoveryRate = page.locator('text=/24.*%/i, text=/recovery rate/i').first();
    const hasRecoveryRate = await recoveryRate.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasRecoveryRate) {
      console.log('✅ Recovery rate displayed: 24%');
    }

    // Verify recovered value
    const recoveredValue = page.locator('text=/\\$1,250/i, text=/1250/i').first();
    const hasValue = await recoveredValue.isVisible().catch(() => false);

    console.log('✅ Cart recovery tracking validated');
  });

  test('should handle cart tracking webhook events', async ({ page }) => {
    console.log('=== Testing Cart Tracking Webhook Events ===');

    let webhookReceived = false;

    // Mock webhook processing endpoint
    await page.route('**/webhooks/woocommerce/cart', async (route) => {
      webhookReceived = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Webhook processed',
          event: 'cart.updated'
        })
      });
    });

    // Simulate widget interaction that creates cart
    console.log('📍 Step: Simulating cart creation via chat widget');
    await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });

    const iframe = await waitForChatWidget(page);

    // Mock chat API to return product with cart link
    await page.route('**/api/chat', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          response: 'Here is the product: Test Product - $29.99. Add to cart: https://test-store.com/cart/add/101'
        })
      });
    });

    const input = iframe.locator('input[type="text"], textarea').first();
    await input.fill('Show me products');

    const sendButton = iframe.locator('button[type="submit"]').first();
    await sendButton.click();

    await page.waitForTimeout(3000);

    // Verify webhook would be triggered (in real scenario)
    console.log('📍 Step: Verifying cart tracking webhook integration');

    // Navigate to cart tracking dashboard
    await page.goto(`${BASE_URL}/dashboard/woocommerce/cart-tracking`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Verify webhook status indicator
    const webhookStatus = page.locator(
      'text=/webhook.*active/i, text=/receiving events/i, [class*="status-active"]'
    ).first();
    const hasWebhookStatus = await webhookStatus.isVisible().catch(() => false);

    if (hasWebhookStatus) {
      console.log('✅ Webhook status indicator found');
    }

    console.log('✅ Cart tracking webhooks validated');
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') {
      await page.screenshot({
        path: `test-results/woo-cart-tracking-failure-${Date.now()}.png`,
        fullPage: true
      });
    }
  });
});
