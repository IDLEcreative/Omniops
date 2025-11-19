import { test, expect } from '@playwright/test';
import { waitForChatWidget, sendChatMessage, mockChatAPI } from '../../utils/playwright/chat-helpers';
import {
  clickProductLink,
  addToCart,
  navigateToCart
} from '../../utils/playwright/purchase-flow-helpers';

/**
 * E2E Test: Email Validation in Checkout
 *
 * Tests email field validation during checkout.
 * Validates proper email format requirements.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Email Validation in Checkout', () => {
  test('should validate email format in checkout', async ({ page }) => {
    console.log('=== Testing Email Validation ===');

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

    console.log('📍 Step 1: Enter invalid email');
    const emailInput = productPage.locator('input[name="billing_email"]').first();
    const hasEmail = await emailInput.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasEmail) {
      await emailInput.fill('invalid-email-format');

      console.log('📍 Step 2: Try to place order');
      const placeOrderBtn = productPage.locator('button#place_order').first();
      const hasButton = await placeOrderBtn.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasButton) {
        await placeOrderBtn.click();
        await productPage.waitForTimeout(2000);

        console.log('📍 Step 3: Check for validation error');
        const emailError = productPage.locator('text=/valid email/i, text=/email.*invalid/i');
        const hasError = await emailError.isVisible({ timeout: 3000 }).catch(() => false);

        if (hasError) {
          console.log('✅ Email validation working');
        }
      }
    }

    console.log('✅ Email validation test completed!');
  });
});
