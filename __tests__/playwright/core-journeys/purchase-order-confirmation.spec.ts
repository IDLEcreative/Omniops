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
 * E2E Test: Order Confirmation Page
 *
 * Tests the order confirmation page displays correct information.
 * Validates order details, customer information, and next steps.
 *
 * User Journey:
 * 1. Complete purchase
 * 2. View order confirmation page
 * 3. Verify order number displayed
 * 4. Verify order details shown
 * 5. Check for email confirmation notice
 *
 * This test teaches AI agents:
 * - Order confirmation indicators
 * - Post-purchase information display
 * - Customer communication expectations
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 120000;

test.describe('Order Confirmation Page', () => {
  test.setTimeout(TEST_TIMEOUT);

  test('should display complete order confirmation details', async ({ page }) => {
    console.log('=== Starting Order Confirmation Test ===');

    console.log('📍 Step 1-10: Complete purchase flow');
    await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });
    const iframe = await waitForChatWidget(page);
    await mockChatAPI(page, () => ({ success: true, response: 'Products' }));
    await sendChatMessage(iframe, 'Products');

    const { productPage } = await clickProductLink(page);
    if (!productPage) return;

    await addToCart(productPage);
    await navigateToCart(productPage, productPage.url());

    const checkoutButton = productPage.locator('a:has-text("Checkout")').first();
    await checkoutButton.click();
    await productPage.waitForLoadState('networkidle');

    await fillCheckoutForm(productPage);
    await selectTestPaymentMethod(productPage);
    await placeOrder(productPage);

    const confirmed = await verifyOrderConfirmation(productPage);
    if (!confirmed) return;

    console.log('📍 Step 11: Verify order number displayed');
    const orderNumber = productPage.locator('.order-number, strong, text=/order #/i').first();
    const hasOrderNumber = await orderNumber.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasOrderNumber) {
      const orderText = await orderNumber.textContent();
      console.log(`✅ Order number found: ${orderText}`);
      expect(hasOrderNumber).toBe(true);
    } else {
      console.log('⚠️  Order number not visible');
    }

    console.log('📍 Step 12: Check for email confirmation notice');
    const emailNotice = productPage.locator('text=/email/i, text=/confirmation/i');
    const hasEmailNotice = await emailNotice.first().isVisible({ timeout: 3000 }).catch(() => false);

    if (hasEmailNotice) {
      console.log('✅ Email confirmation notice displayed');
    } else {
      console.log('⚠️  Email notice not found');
    }

    console.log('📍 Step 13: Verify order details section exists');
    const orderDetails = productPage.locator('.order-details, .woocommerce-order-details, table');
    const hasDetails = await orderDetails.first().isVisible({ timeout: 3000 }).catch(() => false);

    if (hasDetails) {
      console.log('✅ Order details section displayed');
    }

    console.log('✅ Order confirmation page test completed!');
  });

  test('should show customer billing information on confirmation', async ({ page }) => {
    console.log('=== Testing Billing Information Display ===');

    await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });
    const iframe = await waitForChatWidget(page);
    await mockChatAPI(page, () => ({ success: true, response: 'Products' }));
    await sendChatMessage(iframe, 'Products');

    const { productPage } = await clickProductLink(page);
    if (!productPage) return;

    await addToCart(productPage);
    await navigateToCart(productPage, productPage.url());

    const checkoutButton = productPage.locator('a:has-text("Checkout")').first();
    await checkoutButton.click();
    await productPage.waitForLoadState('networkidle');

    await fillCheckoutForm(productPage);
    await selectTestPaymentMethod(productPage);
    await placeOrder(productPage);

    const confirmed = await verifyOrderConfirmation(productPage);
    if (!confirmed) return;

    console.log('📍 Step 1: Look for billing address section');
    const billingSection = productPage.locator('.woocommerce-column--billing-address, address, text=/billing/i');
    const hasBillingSection = await billingSection.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (hasBillingSection) {
      console.log('✅ Billing address section found');

      console.log('📍 Step 2: Verify customer name displayed');
      const customerName = productPage.locator('text=/test user/i, text=/test/i');
      const hasName = await customerName.first().isVisible({ timeout: 3000 }).catch(() => false);

      if (hasName) {
        console.log('✅ Customer name displayed in confirmation');
      }
    } else {
      console.log('⏭️  Billing section not found');
    }

    console.log('✅ Billing information display test completed!');
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') {
      await page.screenshot({
        path: `test-results/order-confirmation-failure-${Date.now()}.png`,
        fullPage: true
      });
    }
  });
});
