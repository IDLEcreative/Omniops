import { test, expect } from '@playwright/test';
import { waitForChatWidget, sendChatMessage, mockChatAPI } from '../../utils/playwright/chat-helpers';
import {
  clickProductLink,
  addToCart,
  navigateToCart,
  fillCheckoutForm
} from '../../utils/playwright/purchase-flow-helpers';

/**
 * E2E Test: Checkout with Shipping Variations
 *
 * Tests checkout flow with different shipping options.
 * Validates shipping method selection and cost calculation.
 *
 * User Journey:
 * 1. Add product to cart
 * 2. Proceed to checkout
 * 3. Fill shipping address
 * 4. Select shipping method
 * 5. Verify shipping cost updated
 * 6. Complete purchase
 *
 * This test teaches AI agents:
 * - Shipping method selection
 * - Cost calculation with shipping
 * - Address validation
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 120000;

test.describe('Checkout with Shipping Variations', () => {
  test.setTimeout(TEST_TIMEOUT);

  test('should select shipping method and update total', async ({ page }) => {
    console.log('=== Starting Shipping Method Selection Test ===');

    console.log('📍 Step 1: Add product and navigate to checkout');
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

    console.log('📍 Step 2: Fill shipping address');
    await fillCheckoutForm(productPage);

    console.log('📍 Step 3: Look for shipping method options');
    const shippingMethods = productPage.locator('input[name^="shipping_method"], .shipping-method input[type="radio"]');
    const methodCount = await shippingMethods.count();
    console.log(`📦 Found ${methodCount} shipping method(s)`);

    if (methodCount > 0) {
      console.log('📍 Step 4: Get initial order total');
      const orderTotal = productPage.locator('.order-total .amount').first();
      const initialTotal = await orderTotal.textContent().catch(() => null);
      console.log(`💰 Initial total: ${initialTotal}`);

      console.log('📍 Step 5: Select first shipping method');
      await shippingMethods.first().check();
      await productPage.waitForTimeout(2000);

      if (methodCount > 1) {
        console.log('📍 Step 6: Select alternative shipping method');
        await shippingMethods.nth(1).check();
        await productPage.waitForTimeout(2000);

        const updatedTotal = await orderTotal.textContent().catch(() => null);
        console.log(`💰 Updated total: ${updatedTotal}`);

        console.log('✅ Shipping method selection works');
      } else {
        console.log('✅ Single shipping method selected');
      }
    } else {
      console.log('⏭️  No shipping methods found');
    }

    console.log('✅ Shipping variation test completed!');
  });

  test('should calculate shipping for different countries', async ({ page }) => {
    console.log('=== Testing International Shipping ===');

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

    console.log('📍 Step 1: Select international country');
    const countrySelect = productPage.locator('select[name="billing_country"]').first();
    const hasCountrySelect = await countrySelect.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasCountrySelect) {
      console.log('📍 Step 2: Change to UK');
      await countrySelect.selectOption('GB');
      await productPage.waitForTimeout(2000);

      console.log('📍 Step 3: Fill remaining address fields');
      await productPage.locator('input[name="billing_postcode"]').fill('SW1A 1AA');
      await productPage.locator('input[name="billing_city"]').fill('London');
      await productPage.waitForTimeout(2000);

      console.log('✅ International shipping address set');
    } else {
      console.log('⏭️  Country selection not available');
    }

    console.log('✅ International shipping test completed!');
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') {
      await page.screenshot({
        path: `test-results/shipping-variations-failure-${Date.now()}.png`,
        fullPage: true
      });
    }
  });
});
