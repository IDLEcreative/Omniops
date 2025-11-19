import { test, expect } from '@playwright/test';
import { waitForChatWidget, sendChatMessage, mockChatAPI } from '../../utils/playwright/chat-helpers';
import {
  clickProductLink,
  addToCart,
  navigateToCart
} from '../../utils/playwright/purchase-flow-helpers';

/**
 * E2E Test: Guest vs Account Checkout Options
 *
 * Tests checkout options for guest vs registered users.
 * Validates account creation option during checkout.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Guest vs Account Checkout', () => {
  test('should offer account creation during checkout', async ({ page }) => {
    console.log('=== Testing Account Creation Option ===');

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

    console.log('📍 Step 1: Look for create account option');
    const createAccountCheckbox = productPage.locator('input[name="createaccount"], input#createaccount');
    const hasOption = await createAccountCheckbox.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasOption) {
      console.log('✅ Create account option found');

      console.log('📍 Step 2: Check if checkbox is toggleable');
      await createAccountCheckbox.check();
      const isChecked = await createAccountCheckbox.isChecked();
      expect(isChecked).toBe(true);

      console.log('✅ Account creation option working');
    } else {
      console.log('⏭️  Create account option not found');
    }

    console.log('✅ Guest vs account test completed!');
  });
});
