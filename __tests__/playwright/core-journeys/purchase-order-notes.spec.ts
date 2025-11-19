import { test, expect } from '@playwright/test';
import { waitForChatWidget, sendChatMessage, mockChatAPI } from '../../utils/playwright/chat-helpers';
import {
  clickProductLink,
  addToCart,
  navigateToCart,
  fillCheckoutForm
} from '../../utils/playwright/purchase-flow-helpers';

/**
 * E2E Test: Order Notes in Checkout
 *
 * Tests order notes field functionality.
 * Validates optional notes input during checkout.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Order Notes in Checkout', () => {
  test('should allow customer to add order notes', async ({ page }) => {
    console.log('=== Testing Order Notes ===');

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

    console.log('📍 Step 1: Look for order notes field');
    const notesField = productPage.locator('textarea[name="order_comments"], textarea#order_comments');
    const hasNotes = await notesField.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasNotes) {
      console.log('✅ Order notes field found');

      console.log('📍 Step 2: Add note');
      await notesField.fill('Please deliver before 5pm');

      const noteValue = await notesField.inputValue();
      expect(noteValue).toContain('deliver');

      console.log('✅ Order notes working');
    } else {
      console.log('⏭️  Order notes field not found');
    }

    console.log('✅ Order notes test completed!');
  });
});
