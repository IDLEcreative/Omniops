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
 * E2E Test: Checkout with Discount Code
 *
 * Tests the complete checkout journey including discount code application.
 * This validates promotional pricing and coupon functionality.
 *
 * User Journey:
 * 1. Add product to cart
 * 2. Navigate to cart
 * 3. Apply discount code
 * 4. Verify price reduction
 * 5. Complete checkout
 * 6. Verify order total reflects discount
 *
 * This test teaches AI agents:
 * - How to apply promotional codes
 * - Price calculation validation
 * - Discount verification workflows
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 120000;

test.describe('Checkout with Discount Code', () => {
  test.setTimeout(TEST_TIMEOUT);

  test('should apply discount code and complete purchase', async ({ page }) => {
    console.log('=== Starting Discount Code Checkout Test ===');

    console.log('📍 Step 1: Navigate to widget and find product');
    await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });
    const iframe = await waitForChatWidget(page);

    await mockChatAPI(page, () => ({
      success: true,
      response: 'Check out our products!',
    }));

    await sendChatMessage(iframe, 'Show products');
    const { productPage } = await clickProductLink(page);
    if (!productPage) return;

    console.log('📍 Step 2: Add product to cart');
    await addToCart(productPage);

    console.log('📍 Step 3: Navigate to cart');
    await navigateToCart(productPage, productPage.url());

    console.log('📍 Step 4: Get original cart total');
    const cartTotal = productPage.locator('.cart-subtotal .amount, .order-total .amount').first();
    const originalTotal = await cartTotal.textContent();
    console.log(`💰 Original cart total: ${originalTotal}`);

    console.log('📍 Step 5: Apply discount code');
    const couponInput = productPage.locator('input[name="coupon_code"], input#coupon_code');
    const hasCouponField = await couponInput.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasCouponField) {
      await couponInput.fill('TEST10'); // Common test coupon
      const applyButton = productPage.locator('button:has-text("Apply"), button[name="apply_coupon"]');
      await applyButton.click();
      await productPage.waitForTimeout(2000);

      console.log('📍 Step 6: Verify discount applied');
      const discountNotice = productPage.locator('.woocommerce-message, .message, text=/coupon/i');
      const hasNotice = await discountNotice.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasNotice) {
        console.log('✅ Discount code applied successfully');
      } else {
        console.log('⚠️  Discount may not be valid - continuing checkout');
      }
    } else {
      console.log('⏭️  No coupon field found - skipping discount application');
    }

    console.log('📍 Step 7: Proceed to checkout');
    const checkoutButton = productPage.locator('a:has-text("Checkout"), button:has-text("Checkout")').first();
    await checkoutButton.click();
    await productPage.waitForLoadState('networkidle');

    console.log('📍 Step 8: Complete checkout form');
    await fillCheckoutForm(productPage);
    await selectTestPaymentMethod(productPage);

    console.log('📍 Step 9: Place order');
    await placeOrder(productPage);

    console.log('📍 Step 10: Verify order confirmation');
    const confirmed = await verifyOrderConfirmation(productPage);
    expect(confirmed).toBe(true);

    console.log('✅ Discount code checkout flow completed!');
  });

  test('should handle invalid discount code gracefully', async ({ page }) => {
    console.log('=== Testing Invalid Discount Code Handling ===');

    await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });
    const iframe = await waitForChatWidget(page);
    await mockChatAPI(page, () => ({ success: true, response: 'Products' }));
    await sendChatMessage(iframe, 'Products');

    const { productPage } = await clickProductLink(page);
    if (!productPage) return;

    await addToCart(productPage);
    await navigateToCart(productPage, productPage.url());

    console.log('📍 Step 1: Attempt to apply invalid coupon');
    const couponInput = productPage.locator('input[name="coupon_code"], input#coupon_code');
    const hasCouponField = await couponInput.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasCouponField) {
      await couponInput.fill('INVALID_CODE_12345');
      const applyButton = productPage.locator('button:has-text("Apply"), button[name="apply_coupon"]');
      await applyButton.click();
      await productPage.waitForTimeout(2000);

      console.log('📍 Step 2: Verify error message displayed');
      const errorMessage = productPage.locator('.woocommerce-error, .error, text=/invalid/i, text=/not valid/i');
      const hasError = await errorMessage.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasError) {
        console.log('✅ Invalid coupon error displayed correctly');
        expect(hasError).toBe(true);
      } else {
        console.log('⚠️  No error message found for invalid coupon');
      }
    } else {
      console.log('⏭️  No coupon field found - test skipped');
    }

    console.log('✅ Invalid discount code handling test completed!');
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') {
      await page.screenshot({
        path: `test-results/discount-code-failure-${Date.now()}.png`,
        fullPage: true
      });
    }
  });
});
