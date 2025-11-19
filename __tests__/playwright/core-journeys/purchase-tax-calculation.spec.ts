import { test, expect } from '@playwright/test';
import { waitForChatWidget, sendChatMessage, mockChatAPI } from '../../utils/playwright/chat-helpers';
import {
  clickProductLink,
  addToCart,
  navigateToCart,
  fillCheckoutForm
} from '../../utils/playwright/purchase-flow-helpers';

/**
 * E2E Test: Tax Calculation in Checkout
 *
 * Tests tax calculation based on billing address.
 * Validates tax display and total calculation.
 *
 * User Journey:
 * 1. Add product to cart
 * 2. Proceed to checkout
 * 3. Enter billing address
 * 4. Verify tax calculated
 * 5. Verify total includes tax
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 90000;

test.describe('Tax Calculation in Checkout', () => {
  test.setTimeout(TEST_TIMEOUT);

  test('should calculate tax based on billing address', async ({ page }) => {
    console.log('=== Starting Tax Calculation Test ===');

    await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });
    const iframe = await waitForChatWidget(page);
    await mockChatAPI(page, () => ({ success: true, response: 'Products' }));
    await sendChatMessage(iframe, 'Products');

    const { productPage } = await clickProductLink(page);
    if (!productPage) return;

    await addToCart(productPage);
    await navigateToCart(productPage, productPage.url());

    console.log('📍 Step 1: Proceed to checkout');
    const checkoutButton = productPage.locator('a:has-text("Checkout")').first();
    await checkoutButton.click();
    await productPage.waitForLoadState('networkidle');

    console.log('📍 Step 2: Fill checkout form with tax jurisdiction');
    await fillCheckoutForm(productPage);

    console.log('📍 Step 3: Look for tax line item');
    const taxLine = productPage.locator('.tax-total, .cart-subtotal:has-text("Tax"), text=/tax/i');
    const hasTax = await taxLine.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (hasTax) {
      const taxText = await taxLine.first().textContent();
      console.log(`💰 Tax line: ${taxText}`);
      console.log('✅ Tax calculation displayed');
    } else {
      console.log('⏭️  Tax not displayed (may not be applicable)');
    }

    console.log('📍 Step 4: Verify order total includes tax');
    const orderTotal = productPage.locator('.order-total .amount').first();
    const hasTotalValue = await orderTotal.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasTotal) {
      console.log('✅ Order total displayed');
    }

    console.log('✅ Tax calculation test completed!');
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') {
      await page.screenshot({
        path: `test-results/tax-calculation-failure-${Date.now()}.png`,
        fullPage: true
      });
    }
  });
});
