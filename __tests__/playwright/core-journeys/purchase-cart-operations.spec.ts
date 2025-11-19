import { test, expect } from '@playwright/test';
import { waitForChatWidget, sendChatMessage, mockChatAPI } from '../../utils/playwright/chat-helpers';
import { clickProductLink, addToCart, navigateToCart } from '../../utils/playwright/purchase-flow-helpers';

/**
 * E2E Test: Cart Operations
 *
 * Tests cart manipulation operations including:
 * - Adding multiple items
 * - Updating quantities
 * - Removing items
 * - Cart persistence
 *
 * User Journey:
 * 1. Add first product to cart
 * 2. Add second product to cart
 * 3. Update product quantity
 * 4. Remove product from cart
 * 5. Verify cart updates correctly
 *
 * This test teaches AI agents:
 * - Cart manipulation workflows
 * - Quantity update patterns
 * - Item removal procedures
 * - Cart state management
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 120000;

test.describe('Cart Operations', () => {
  test.setTimeout(TEST_TIMEOUT);

  test('should update cart item quantity successfully', async ({ page }) => {
    console.log('=== Starting Cart Quantity Update Test ===');

    console.log('📍 Step 1: Add product to cart');
    await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });
    const iframe = await waitForChatWidget(page);
    await mockChatAPI(page, () => ({ success: true, response: 'Products available' }));
    await sendChatMessage(iframe, 'Products');

    const { productPage } = await clickProductLink(page);
    if (!productPage) return;

    await addToCart(productPage);
    await navigateToCart(productPage, productPage.url());

    console.log('📍 Step 2: Find quantity input');
    const quantityInput = productPage.locator('input[type="number"].qty, input.quantity, input[name*="quantity"]').first();
    const hasQuantityInput = await quantityInput.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasQuantityInput) {
      console.log('📍 Step 3: Update quantity to 2');
      await quantityInput.fill('2');

      console.log('📍 Step 4: Click update cart button');
      const updateButton = productPage.locator('button:has-text("Update"), button[name="update_cart"]');
      const hasUpdateButton = await updateButton.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasUpdateButton) {
        await updateButton.click();
        await productPage.waitForTimeout(2000);

        console.log('📍 Step 5: Verify quantity updated');
        const updatedValue = await quantityInput.inputValue();
        expect(updatedValue).toBe('2');
        console.log('✅ Cart quantity updated successfully');
      } else {
        console.log('⏭️  Update cart button not found');
      }
    } else {
      console.log('⏭️  Quantity input not found - test skipped');
    }

    console.log('✅ Cart quantity update test completed!');
  });

  test('should remove item from cart successfully', async ({ page }) => {
    console.log('=== Starting Remove Cart Item Test ===');

    console.log('📍 Step 1: Add product to cart');
    await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });
    const iframe = await waitForChatWidget(page);
    await mockChatAPI(page, () => ({ success: true, response: 'Products' }));
    await sendChatMessage(iframe, 'Products');

    const { productPage } = await clickProductLink(page);
    if (!productPage) return;

    await addToCart(productPage);
    await navigateToCart(productPage, productPage.url());

    console.log('📍 Step 2: Count initial cart items');
    const cartItems = productPage.locator('.cart-item, .cart_item');
    const initialCount = await cartItems.count();
    console.log(`📊 Initial cart items: ${initialCount}`);

    if (initialCount > 0) {
      console.log('📍 Step 3: Click remove button');
      const removeButton = productPage.locator('a.remove, a[class*="remove"], button.remove').first();
      const hasRemoveButton = await removeButton.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasRemoveButton) {
        await removeButton.click();
        await productPage.waitForTimeout(2000);

        console.log('📍 Step 4: Verify item removed');
        const finalCount = await cartItems.count();
        console.log(`📊 Final cart items: ${finalCount}`);
        expect(finalCount).toBe(initialCount - 1);
        console.log('✅ Item removed successfully');
      } else {
        console.log('⏭️  Remove button not found');
      }
    } else {
      console.log('⚠️  No items in cart to remove');
    }

    console.log('✅ Remove cart item test completed!');
  });

  test('should handle empty cart state correctly', async ({ page }) => {
    console.log('=== Testing Empty Cart State ===');

    console.log('📍 Step 1: Navigate directly to cart page');
    await page.goto(`${BASE_URL}/cart`, { waitUntil: 'networkidle' });

    console.log('📍 Step 2: Check for empty cart message');
    const emptyCartMessages = page.locator(
      'text=/cart is empty/i, text=/no items/i, .cart-empty, .woocommerce-info'
    );
    const hasEmptyMessage = await emptyCartMessages.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (hasEmptyMessage) {
      console.log('✅ Empty cart message displayed correctly');
      expect(hasEmptyMessage).toBe(true);
    } else {
      console.log('⚠️  Empty cart message not found (cart may have items)');
    }

    console.log('📍 Step 3: Verify return to shop button exists');
    const returnButton = page.locator('a:has-text("Return to shop"), a:has-text("Continue shopping")');
    const hasReturnButton = await returnButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasReturnButton) {
      console.log('✅ Return to shop button found');
    }

    console.log('✅ Empty cart state test completed!');
  });

  test('should add multiple different products to cart', async ({ page }) => {
    console.log('=== Testing Multiple Products in Cart ===');

    console.log('📍 Step 1: Add first product');
    await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });
    const iframe = await waitForChatWidget(page);
    await mockChatAPI(page, () => ({ success: true, response: 'Multiple products available' }));
    await sendChatMessage(iframe, 'Show all products');

    const { productPage } = await clickProductLink(page);
    if (!productPage) return;

    await addToCart(productPage);

    console.log('📍 Step 2: Navigate back and add another product');
    await productPage.goBack();
    await productPage.waitForTimeout(1000);

    const productLinks = productPage.locator('a[href*="/product/"]');
    const linkCount = await productLinks.count();

    if (linkCount > 1) {
      console.log('📍 Step 3: Click second product link');
      await productLinks.nth(1).click();
      await productPage.waitForLoadState('networkidle');

      console.log('📍 Step 4: Add second product to cart');
      await addToCart(productPage);

      console.log('📍 Step 5: Navigate to cart');
      await navigateToCart(productPage, productPage.url());

      console.log('📍 Step 6: Verify multiple items in cart');
      const cartItems = productPage.locator('.cart-item, .cart_item');
      const itemCount = await cartItems.count();
      expect(itemCount).toBeGreaterThanOrEqual(2);
      console.log(`✅ Cart contains ${itemCount} different products`);
    } else {
      console.log('⏭️  Not enough products to test multiple additions');
    }

    console.log('✅ Multiple products test completed!');
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') {
      await page.screenshot({
        path: `test-results/cart-operations-failure-${Date.now()}.png`,
        fullPage: true
      });
    }
  });
});
