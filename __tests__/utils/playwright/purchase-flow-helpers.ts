import { Page } from '@playwright/test';

export async function clickProductLink(page: Page): Promise<{ hasProducts: boolean; productPage: Page | null }> {
  console.log('📍 Looking for product links...');
  const productLinks = page.locator('a[href*="/product/"], a[href*="/shop/"], a.product-link, [data-product-id]');
  const count = await productLinks.count();
  if (count === 0) {
    console.log('⏭️  No product links found');
    return { hasProducts: false, productPage: null };
  }
  console.log(`✅ Found ${count} product link(s)`);
  const [productPage] = await Promise.all([
    page.context().waitForEvent('page'),
    productLinks.first().click()
  ]);
  await productPage.waitForLoadState('networkidle');
  console.log('✅ Product page opened');
  return { hasProducts: true, productPage };
}

export async function addToCart(page: Page): Promise<void> {
  console.log('📍 Adding product to cart...');
  const addToCartButton = page.locator('button:has-text("Add to cart"), button:has-text("Add to Cart"), button.add-to-cart, button[name="add-to-cart"]').first();
  await addToCartButton.waitFor({ state: 'visible', timeout: 5000 });
  await addToCartButton.click();
  await page.waitForTimeout(2000);
  console.log('✅ Product added to cart');
}

export async function navigateToCart(page: Page, currentUrl: string): Promise<void> {
  console.log('📍 Navigating to cart...');
  const cartLink = page.locator('a:has-text("View cart"), a:has-text("Cart"), a[href*="/cart"]').first();
  const cartLinkVisible = await cartLink.isVisible({ timeout: 3000 }).catch(() => false);
  if (cartLinkVisible) {
    await cartLink.click();
  } else {
    const baseUrl = new URL(currentUrl).origin;
    await page.goto(`${baseUrl}/cart`, { waitUntil: 'networkidle' });
  }
  await page.waitForLoadState('networkidle');
  console.log('✅ Cart page loaded');
}

export async function fillCheckoutForm(page: Page): Promise<void> {
  console.log('📍 Filling checkout form...');
  const formFields = [
    { name: 'billing_first_name', value: 'Test' },
    { name: 'billing_last_name', value: 'User' },
    { name: 'billing_email', value: 'test@example.com' },
    { name: 'billing_phone', value: '1234567890' },
    { name: 'billing_address_1', value: '123 Test Street' },
    { name: 'billing_city', value: 'Test City' },
    { name: 'billing_postcode', value: '12345' }
  ];
  for (const field of formFields) {
    const input = page.locator(`input[name="${field.name}"]`).first();
    const isVisible = await input.isVisible({ timeout: 2000 }).catch(() => false);
    if (isVisible) await input.fill(field.value);
  }
  const countrySelect = page.locator('select[name="billing_country"]').first();
  if (await countrySelect.isVisible({ timeout: 2000 }).catch(() => false)) {
    await countrySelect.selectOption('US');
  }
  console.log('✅ Checkout form filled');
}

export async function selectTestPaymentMethod(page: Page): Promise<void> {
  console.log('📍 Selecting payment method...');
  const paymentMethods = ['input[value="cod"]', 'input[value="bacs"]', 'input[value="test"]', 'input[type="radio"][name="payment_method"]'];
  for (const selector of paymentMethods) {
    const paymentInput = page.locator(selector).first();
    const isVisible = await paymentInput.isVisible({ timeout: 2000 }).catch(() => false);
    if (isVisible) {
      await paymentInput.check();
      console.log('✅ Payment method selected');
      return;
    }
  }
  console.log('⏭️  No test payment method found (may use default)');
}

export async function placeOrder(page: Page): Promise<void> {
  console.log('📍 Placing order...');
  const placeOrderButton = page.locator('button:has-text("Place order"), button:has-text("Complete purchase"), button[name="woocommerce_checkout_place_order"], button#place_order').first();
  await placeOrderButton.waitFor({ state: 'visible', timeout: 5000 });
  await placeOrderButton.click();
  console.log('⏳ Waiting for order processing...');
  await page.waitForTimeout(5000);
}

export async function verifyOrderConfirmation(page: Page): Promise<boolean> {
  console.log('📍 Verifying order confirmation...');
  const confirmationIndicators = page.locator('.woocommerce-order-received, .order-confirmation, text=/thank you/i, text=/order received/i, text=/order complete/i');
  try {
    await confirmationIndicators.first().waitFor({ state: 'visible', timeout: 10000 });
    console.log('✅ Order confirmation page loaded');
    return true;
  } catch (error) {
    console.log('❌ Order confirmation not found');
    return false;
  }
}
