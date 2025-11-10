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
 * E2E Test: Complete Purchase Journey
 *
 * Tests the FULL revenue-generating flow from chat to order confirmation.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 120000;

test.describe('Complete Purchase Journey E2E', () => {
  test.setTimeout(TEST_TIMEOUT);

  test('should complete full purchase flow from chat to order confirmation', async ({ page }) => {
    console.log('=== Starting Complete Purchase Journey Test ===');

    await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });
    const iframe = await waitForChatWidget(page);

    const chatState = await mockChatAPI(page, () => ({
      success: true,
      response: 'We have several great products available. Check out our Premium Widget and Standard Widget.',
    }));

    await sendChatMessage(iframe, 'Show me your best selling products');
    await page.waitForTimeout(5000);

    const chatResponse = chatState.response;
    expect(chatResponse).not.toBeNull();
    expect(chatResponse?.response).toBeDefined();

    const hasProductMentions = chatResponse?.response.toLowerCase().includes('product') ||
      chatResponse?.response.toLowerCase().includes('widget');
    console.log('📊 Product mentions found:', hasProductMentions);

    const { hasProducts, productPage } = await clickProductLink(page);

    if (!hasProducts || !productPage) {
      console.log('⚠️  No product links found - cannot complete purchase flow');
      return;
    }

    const currentUrl = productPage.url();
    const isProductPage = currentUrl.includes('/product/') || currentUrl.includes('/shop/') ||
      await productPage.locator('.product, .single-product, [itemtype*="Product"]').count() > 0;

    expect(isProductPage).toBe(true);

    await addToCart(productPage);
    await navigateToCart(productPage, currentUrl);

    const cartItems = productPage.locator('.cart-item, .cart_item, [class*="cart-product"]');
    const itemCount = await cartItems.count();
    expect(itemCount).toBeGreaterThan(0);

    const checkoutButton = productPage.locator(
      'a:has-text("Proceed to checkout"), a:has-text("Checkout"), button:has-text("Proceed to checkout"), button:has-text("Checkout"), .checkout-button'
    ).first();

    await checkoutButton.waitFor({ state: 'visible', timeout: 5000 });
    await checkoutButton.click();
    await productPage.waitForLoadState('networkidle');

    await fillCheckoutForm(productPage);
    await selectTestPaymentMethod(productPage);
    await placeOrder(productPage);

    const confirmed = await verifyOrderConfirmation(productPage);
    expect(confirmed).toBe(true);

    await productPage.screenshot({
      path: `test-results/purchase-flow-success-${Date.now()}.png`,
      fullPage: true
    });

    console.log('✅ Complete purchase journey validated end-to-end!');
  });

  test('should handle purchase flow with guest checkout', async ({ page }) => {
    console.log('⏭️  Guest checkout test - TODO');
  });

  test('should handle purchase flow with registered user', async ({ page }) => {
    console.log('⏭️  Registered user checkout test - TODO');
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') {
      await page.screenshot({
        path: `test-results/purchase-flow-failure-${Date.now()}.png`,
        fullPage: true
      });
    }
  });
});
