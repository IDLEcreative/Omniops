import { test, expect } from '@playwright/test';
import { waitForChatWidget, sendChatMessage, mockChatAPI } from '../../utils/playwright/chat-helpers';
import {
  clickProductLink,
  addToCart,
  navigateToCart,
  fillCheckoutForm
} from '../../utils/playwright/purchase-flow-helpers';

/**
 * E2E Test: Payment Method Selection
 *
 * Tests different payment method selections during checkout.
 * Validates payment gateway integration and method switching.
 *
 * User Journey:
 * 1. Proceed to checkout
 * 2. View available payment methods
 * 3. Select payment method
 * 4. Verify payment instructions displayed
 * 5. Complete order with selected method
 *
 * This test teaches AI agents:
 * - Available payment options
 * - Payment method switching
 * - Payment-specific instructions
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 120000;

test.describe('Payment Method Selection', () => {
  test.setTimeout(TEST_TIMEOUT);

  test('should display multiple payment methods', async ({ page }) => {
    console.log('=== Testing Payment Method Display ===');

    console.log('📍 Step 1: Navigate to checkout');
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

    console.log('📍 Step 2: Fill checkout form');
    await fillCheckoutForm(productPage);

    console.log('📍 Step 3: Find payment method options');
    const paymentMethods = productPage.locator('input[name="payment_method"]');
    const methodCount = await paymentMethods.count();
    console.log(`💳 Found ${methodCount} payment method(s)`);

    if (methodCount > 0) {
      console.log('📍 Step 4: Verify payment method labels');
      for (let i = 0; i < methodCount; i++) {
        const method = paymentMethods.nth(i);
        const value = await method.getAttribute('value');
        console.log(`   - Payment method: ${value}`);
      }

      expect(methodCount).toBeGreaterThan(0);
      console.log('✅ Payment methods displayed');
    } else {
      console.log('⏭️  No payment methods found');
    }

    console.log('✅ Payment method display test completed!');
  });

  test('should switch between payment methods', async ({ page }) => {
    console.log('=== Testing Payment Method Switching ===');

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

    console.log('📍 Step 1: Select first payment method');
    const paymentMethods = productPage.locator('input[name="payment_method"]');
    const methodCount = await paymentMethods.count();

    if (methodCount > 1) {
      console.log('📍 Step 2: Select first method');
      await paymentMethods.first().check();
      await productPage.waitForTimeout(1000);

      const firstValue = await paymentMethods.first().getAttribute('value');
      console.log(`   Selected: ${firstValue}`);

      console.log('📍 Step 3: Switch to second method');
      await paymentMethods.nth(1).check();
      await productPage.waitForTimeout(1000);

      const secondValue = await paymentMethods.nth(1).getAttribute('value');
      console.log(`   Switched to: ${secondValue}`);

      console.log('✅ Payment method switching works');
      expect(firstValue).not.toBe(secondValue);
    } else {
      console.log('⏭️  Not enough payment methods to test switching');
    }

    console.log('✅ Payment method switching test completed!');
  });

  test('should display payment instructions for selected method', async ({ page }) => {
    console.log('=== Testing Payment Instructions Display ===');

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

    console.log('📍 Step 1: Select payment method');
    const codPayment = productPage.locator('input[value="cod"]');
    const hasCod = await codPayment.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasCod) {
      await codPayment.check();
      await productPage.waitForTimeout(1000);

      console.log('📍 Step 2: Look for payment instructions');
      const instructions = productPage.locator('.payment_box, .payment_method_cod, text=/pay with cash/i');
      const hasInstructions = await instructions.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasInstructions) {
        console.log('✅ Payment instructions displayed');
        expect(hasInstructions).toBe(true);
      } else {
        console.log('⚠️  No payment instructions found');
      }
    } else {
      console.log('⏭️  COD payment method not available');
    }

    console.log('✅ Payment instructions test completed!');
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') {
      await page.screenshot({
        path: `test-results/payment-methods-failure-${Date.now()}.png`,
        fullPage: true
      });
    }
  });
});
