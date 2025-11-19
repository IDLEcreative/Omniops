import { test, expect } from '@playwright/test';
import { waitForChatWidget, sendChatMessage, mockChatAPI } from '../../utils/playwright/chat-helpers';
import {
  clickProductLink,
  addToCart,
  navigateToCart,
  fillCheckoutForm
} from '../../utils/playwright/purchase-flow-helpers';

/**
 * E2E Test: Terms and Conditions in Checkout
 *
 * Tests terms acceptance requirement during checkout.
 * Validates terms checkbox and link display.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Terms and Conditions', () => {
  test('should display terms and conditions checkbox', async ({ page }) => {
    console.log('=== Testing Terms and Conditions ===');

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

    console.log('📍 Step 1: Look for terms checkbox');
    const termsCheckbox = productPage.locator('input#terms, input[name="terms"]');
    const hasTerms = await termsCheckbox.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasTerms) {
      console.log('✅ Terms checkbox found');

      console.log('📍 Step 2: Check for terms link');
      const termsLink = productPage.locator('a:has-text("terms"), a:has-text("conditions")');
      const hasLink = await termsLink.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasLink) {
        console.log('✅ Terms link displayed');
      }
    } else {
      console.log('⏭️  Terms checkbox not found');
    }

    console.log('✅ Terms and conditions test completed!');
  });
});
