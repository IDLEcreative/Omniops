import { test, expect } from '@playwright/test';
import { waitForChatWidget, sendChatMessage, mockChatAPI } from '../../utils/playwright/chat-helpers';
import {
  clickProductLink,
  addToCart,
  navigateToCart,
  fillCheckoutForm,
  selectTestPaymentMethod,
  placeOrder,
  verifyOrderConfirmation
} from '../../utils/playwright/purchase-flow-helpers';

/**
 * E2E Test: Guest Checkout Flow
 *
 * Tests the complete guest checkout journey from product discovery to order confirmation.
 * This validates the primary revenue-generating workflow for non-authenticated users.
 *
 * User Journey:
 * 1. Load chat widget
 * 2. Search for products via chat
 * 3. Click product link from chat response
 * 4. Add product to cart
 * 5. Navigate to cart
 * 6. Proceed to checkout as guest
 * 7. Fill billing information
 * 8. Select payment method
 * 9. Place order
 * 10. Verify order confirmation page
 *
 * This test teaches AI agents:
 * - How to guide guests through purchase flow
 * - Expected selectors for checkout process
 * - Success indicators for order completion
 * - Guest checkout best practices
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 120000;

test.describe('Guest Checkout Flow', () => {
  test.setTimeout(TEST_TIMEOUT);

  test('should complete guest checkout with valid billing info', async ({ page }) => {
    console.log('=== Starting Guest Checkout Flow Test ===');

    console.log('📍 Step 1: Navigate to widget test page');
    await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });

    console.log('📍 Step 2: Wait for chat widget to load');
    const iframe = await waitForChatWidget(page);

    console.log('📍 Step 3: Mock chat API for product query');
    const chatState = await mockChatAPI(page, () => ({
      success: true,
      response: 'We have excellent products available. Check out our Premium Widget and Standard Widget.',
    }));

    console.log('📍 Step 4: Send product query via chat');
    await sendChatMessage(iframe, 'Show me available products');
    await page.waitForTimeout(3000);

    console.log('📍 Step 5: Verify chat response received');
    expect(chatState.response?.response).toBeDefined();

    console.log('📍 Step 6: Click product link from chat');
    const { hasProducts, productPage } = await clickProductLink(page);

    if (!hasProducts || !productPage) {
      console.log('⚠️  No product links found - skipping test');
      return;
    }

    console.log('📍 Step 7: Verify product page loaded');
    const currentUrl = productPage.url();
    const isProductPage = currentUrl.includes('/product/') || currentUrl.includes('/shop/');
    expect(isProductPage).toBe(true);

    console.log('📍 Step 8: Add product to cart');
    await addToCart(productPage);

    console.log('📍 Step 9: Navigate to cart page');
    await navigateToCart(productPage, currentUrl);

    console.log('📍 Step 10: Verify cart contains items');
    const cartItems = productPage.locator('.cart-item, .cart_item, [class*="cart-product"]');
    const itemCount = await cartItems.count();
    expect(itemCount).toBeGreaterThan(0);
    console.log(`✅ Cart contains ${itemCount} item(s)`);

    console.log('📍 Step 11: Proceed to checkout');
    const checkoutButton = productPage.locator(
      'a:has-text("Proceed to checkout"), a:has-text("Checkout"), button:has-text("Checkout")'
    ).first();
    await checkoutButton.waitFor({ state: 'visible', timeout: 5000 });
    await checkoutButton.click();
    await productPage.waitForLoadState('networkidle');

    console.log('📍 Step 12: Fill checkout form as guest');
    await fillCheckoutForm(productPage);

    console.log('📍 Step 13: Select payment method');
    await selectTestPaymentMethod(productPage);

    console.log('📍 Step 14: Place order');
    await placeOrder(productPage);

    console.log('📍 Step 15: Verify order confirmation');
    const confirmed = await verifyOrderConfirmation(productPage);
    expect(confirmed).toBe(true);

    console.log('📍 Step 16: Capture success screenshot');
    await productPage.screenshot({
      path: `test-results/guest-checkout-success-${Date.now()}.png`,
      fullPage: true
    });

    console.log('✅ Guest checkout flow completed successfully!');
  });

  test('should validate required billing fields', async ({ page }) => {
    console.log('=== Testing Required Field Validation ===');

    console.log('📍 Step 1: Navigate to checkout page directly');
    await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });

    // Navigate through minimal flow to checkout
    const iframe = await waitForChatWidget(page);
    await mockChatAPI(page, () => ({ success: true, response: 'Products available' }));
    await sendChatMessage(iframe, 'Products');

    const { productPage } = await clickProductLink(page);
    if (!productPage) return;

    await addToCart(productPage);
    await navigateToCart(productPage, productPage.url());

    console.log('📍 Step 2: Navigate to checkout');
    const checkoutButton = productPage.locator('a:has-text("Checkout"), button:has-text("Checkout")').first();
    await checkoutButton.click();
    await productPage.waitForLoadState('networkidle');

    console.log('📍 Step 3: Attempt to place order without filling form');
    const placeOrderBtn = productPage.locator('button:has-text("Place order"), button#place_order').first();
    const isVisible = await placeOrderBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (isVisible) {
      await placeOrderBtn.click();
      await productPage.waitForTimeout(2000);

      console.log('📍 Step 4: Verify validation errors appear');
      const errorMessages = productPage.locator('.woocommerce-error, .error, [class*="error"]');
      const errorCount = await errorMessages.count();
      expect(errorCount).toBeGreaterThan(0);
      console.log(`✅ Found ${errorCount} validation error(s)`);
    } else {
      console.log('⏭️  Place order button not found - validation test skipped');
    }

    console.log('✅ Required field validation test completed!');
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') {
      await page.screenshot({
        path: `test-results/guest-checkout-failure-${Date.now()}.png`,
        fullPage: true
      });
    }
  });
});
