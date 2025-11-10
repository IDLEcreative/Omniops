/**
 * Purchase Flow Test Helpers
 *
 * Reusable utilities for testing complete purchase journeys
 */

import { Page } from '@playwright/test';

export interface TestCustomer {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postcode: string;
  country: string;
  state: string;
}

export const DEFAULT_TEST_CUSTOMER: TestCustomer = {
  firstName: 'Test',
  lastName: 'Customer',
  email: 'test.customer@example.com',
  phone: '555-0123',
  address: '123 Test Street',
  city: 'Test City',
  postcode: '12345',
  country: 'US',
  state: 'CA'
};

/**
 * Fill form field with multiple selector fallbacks
 */
export async function fillFormField(page: Page, selectors: string[], value: string): Promise<void> {
  for (const selector of selectors) {
    try {
      const field = page.locator(selector).first();
      if (await field.isVisible({ timeout: 1000 })) {
        await field.fill(value);
        return;
      }
    } catch {
      continue;
    }
  }
  console.warn(`⚠️  Could not find field with selectors: ${selectors.join(', ')}`);
}

/**
 * Find and click product link in chat
 */
export async function clickProductLink(page: Page): Promise<{ hasProducts: boolean; productPage: Page | null }> {
  const productLinks = page.locator('a[href*="product"], a[href*="/shop/"], a[href*="item"]');
  const linkCount = await productLinks.count();

  if (linkCount === 0) {
    return { hasProducts: false, productPage: null };
  }

  const firstProductLink = productLinks.first();
  const [productPage] = await Promise.all([
    page.waitForEvent('popup').catch(() => null),
    firstProductLink.click()
  ]);

  const activePage = productPage || page;
  await activePage.waitForLoadState('networkidle');

  return { hasProducts: true, productPage: activePage };
}

/**
 * Add product to cart
 */
export async function addToCart(page: Page) {
  const addToCartButton = page.locator(
    'button:has-text("Add to cart"), button:has-text("Add to Cart"), button.add-to-cart, button.single_add_to_cart_button, .add-to-cart-button, [name="add-to-cart"]'
  ).first();

  await addToCartButton.waitFor({ state: 'visible', timeout: 5000 });
  await addToCartButton.click();
  await page.waitForTimeout(2000);
}

/**
 * Navigate to cart
 */
export async function navigateToCart(page: Page, currentUrl: string) {
  const cartLink = page.locator(
    'a[href*="/cart"], a:has-text("Cart"), .cart-link, [aria-label*="cart" i]'
  ).first();

  try {
    await cartLink.waitFor({ state: 'visible', timeout: 5000 });
    await cartLink.click();
  } catch (error) {
    const baseUrl = new URL(currentUrl).origin;
    await page.goto(`${baseUrl}/cart`);
  }

  await page.waitForLoadState('networkidle');
}

/**
 * Fill checkout form
 */
export async function fillCheckoutForm(page: Page, customer: TestCustomer = DEFAULT_TEST_CUSTOMER) {
  try {
    await fillFormField(page, ['#billing_first_name', '[name="billing_first_name"]'], customer.firstName);
    await fillFormField(page, ['#billing_last_name', '[name="billing_last_name"]'], customer.lastName);
    await fillFormField(page, ['#billing_email', '[name="billing_email"]'], customer.email);
    await fillFormField(page, ['#billing_phone', '[name="billing_phone"]'], customer.phone);
    await fillFormField(page, ['#billing_address_1', '[name="billing_address_1"]'], customer.address);
    await fillFormField(page, ['#billing_city', '[name="billing_city"]'], customer.city);
    await fillFormField(page, ['#billing_postcode', '[name="billing_postcode"]'], customer.postcode);
  } catch (error) {
    console.warn('⚠️  Could not fill all checkout fields');
  }
}

/**
 * Select test payment method
 */
export async function selectTestPaymentMethod(page: Page) {
  const testPaymentMethods = page.locator(
    '#payment_method_cod, #payment_method_bacs, input[value="cod"], input[value="bacs"]'
  );

  if (await testPaymentMethods.count() > 0) {
    await testPaymentMethods.first().check();
  }
}

/**
 * Place order
 */
export async function placeOrder(page: Page) {
  const placeOrderButton = page.locator(
    '#place_order, button:has-text("Place order"), button:has-text("Place Order"), .place-order-button'
  ).first();

  await placeOrderButton.waitFor({ state: 'visible', timeout: 5000 });
  await placeOrderButton.click();
  await page.waitForLoadState('networkidle');
}

/**
 * Verify order confirmation
 */
export async function verifyOrderConfirmation(page: Page): Promise<boolean> {
  const confirmationIndicators = page.locator(
    '.woocommerce-order-received, .order-confirmation, text=/thank you/i, text=/order received/i, text=/order confirmation/i'
  );

  try {
    await confirmationIndicators.first().waitFor({ state: 'visible', timeout: 10000 });
    return true;
  } catch (error) {
    return false;
  }
}
