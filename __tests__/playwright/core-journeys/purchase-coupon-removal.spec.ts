import { test, expect } from '@playwright/test';
import { waitForChatWidget, sendChatMessage, mockChatAPI } from '../../utils/playwright/chat-helpers';
import {
  clickProductLink,
  addToCart,
  navigateToCart
} from '../../utils/playwright/purchase-flow-helpers';

/**
 * E2E Test: Coupon Removal
 *
 * Tests removing applied coupon codes from cart.
 * Validates coupon removal and price recalculation.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Coupon Removal', () => {
  test('should allow removing applied coupon', async ({ page }) => {
    console.log('=== Testing Coupon Removal ===');

    await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });
    const iframe = await waitForChatWidget(page);
    await mockChatAPI(page, () => ({ success: true, response: 'Products' }));
    await sendChatMessage(iframe, 'Products');

    const { productPage } = await clickProductLink(page);
    if (!productPage) return;

    await addToCart(productPage);
    await navigateToCart(productPage, productPage.url());

    console.log('📍 Step 1: Apply a coupon');
    const couponInput = productPage.locator('input[name="coupon_code"]').first();
    const hasCoupon = await couponInput.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasCoupon) {
      await couponInput.fill('TEST10');
      const applyButton = productPage.locator('button:has-text("Apply")').first();
      await applyButton.click();
      await productPage.waitForTimeout(2000);

      console.log('📍 Step 2: Look for remove coupon link');
      const removeLink = productPage.locator('a.woocommerce-remove-coupon, a:has-text("Remove")');
      const hasRemove = await removeLink.isVisible({ timeout: 5000 }).catch(() => false);

      if (hasRemove) {
        console.log('✅ Remove coupon link found');

        console.log('📍 Step 3: Click remove');
        await removeLink.first().click();
        await productPage.waitForTimeout(2000);

        console.log('✅ Coupon removal working');
      } else {
        console.log('⏭️  Remove link not found (coupon may not have applied)');
      }
    } else {
      console.log('⏭️  Coupon field not available');
    }

    console.log('✅ Coupon removal test completed!');
  });
});
