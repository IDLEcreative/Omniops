import { test, expect, Page } from '@playwright/test';

/**
 * E2E Test: Cart Abandonment and Recovery Journey
 *
 * Tests the COMPLETE cart abandonment flow and restoration.
 * Journey: Add to cart → Leave site → Return → Cart restored with items
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 180000; // 3 minutes

interface CartItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartSession {
  session_id: string;
  items: CartItem[];
  created_at: string;
  abandoned_at?: string;
}

/**
 * Mock cart API for persistence
 */
async function mockCartAPI(page: Page): Promise<{ getCart: () => CartSession | null, setCart: (cart: CartSession) => void }> {
  console.log('🔧 Setting up cart API mock');

  const cartState = {
    cart: null as CartSession | null
  };

  // Mock cart save endpoint
  await page.route('**/api/cart/save', async (route) => {
    const requestData = route.request().postDataJSON();
    console.log('💾 Saving cart:', requestData);

    cartState.cart = {
      session_id: requestData.session_id || `session_${Date.now()}`,
      items: requestData.items || [],
      created_at: new Date().toISOString()
    };

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        cart: cartState.cart
      })
    });
  });

  // Mock cart restore endpoint
  await page.route('**/api/cart/restore**', async (route) => {
    const url = route.request().url();
    const urlObj = new URL(url);
    const sessionId = urlObj.searchParams.get('session_id');

    console.log('🔄 Restoring cart for session:', sessionId);

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        cart: cartState.cart
      })
    });
  });

  // Mock cart abandonment tracking
  await page.route('**/api/cart/abandoned', async (route) => {
    if (cartState.cart) {
      cartState.cart.abandoned_at = new Date().toISOString();
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true })
    });
  });

  console.log('✅ Cart API mock ready');

  return {
    getCart: () => cartState.cart,
    setCart: (cart: CartSession) => { cartState.cart = cart; }
  };
}

/**
 * Mock WooCommerce product API
 */
async function mockProductAPI(page: Page): Promise<void> {
  console.log('🔧 Setting up product API mock');

  const products = [
    {
      id: 'prod-1',
      name: 'Premium Widget',
      price: 99.99,
      stock_status: 'instock',
      images: [{ src: 'https://via.placeholder.com/300' }]
    },
    {
      id: 'prod-2',
      name: 'Standard Widget',
      price: 49.99,
      stock_status: 'instock',
      images: [{ src: 'https://via.placeholder.com/300' }]
    }
  ];

  await page.route('**/api/products**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        products
      })
    });
  });

  console.log('✅ Product API mock ready');
}

/**
 * Navigate to product page
 */
async function navigateToProductPage(page: Page): Promise<void> {
  console.log('📍 Navigating to product page');

  await page.goto(`${BASE_URL}/shop/products`, { waitUntil: 'networkidle' });

  const productPage = page.locator('h1:has-text("Products"), h1:has-text("Shop"), .products-grid').first();
  await expect(productPage).toBeVisible({ timeout: 10000 });

  console.log('✅ Product page loaded');
}

/**
 * Add product to cart
 */
async function addProductToCart(page: Page, productName: string): Promise<string> {
  console.log(`📍 Adding product to cart: ${productName}`);

  // Find product card
  const productCard = page.locator(`.product-card:has-text("${productName}"), [data-product]:has-text("${productName}")`).first();

  if (!await productCard.isVisible({ timeout: 5000 })) {
    // Try direct product link
    const productLink = page.locator(`a:has-text("${productName}")`).first();
    await productLink.click();
    await page.waitForLoadState('networkidle');
  }

  // Add to cart button
  const addToCartButton = page.locator('button:has-text("Add to Cart"), button:has-text("Add to Basket"), [data-testid="add-to-cart"]').first();
  await addToCartButton.waitFor({ state: 'visible', timeout: 5000 });
  await addToCartButton.click();

  await page.waitForTimeout(2000);

  // Verify cart notification or badge update
  const cartBadge = page.locator('.cart-badge, .cart-count, [data-cart-count]').first();
  const badgeVisible = await cartBadge.isVisible({ timeout: 3000 }).catch(() => false);

  if (badgeVisible) {
    const count = await cartBadge.textContent();
    console.log(`✅ Product added to cart. Cart count: ${count}`);
  } else {
    console.log('✅ Product added to cart (no badge visible)');
  }

  // Return session ID (from cookie or localStorage)
  const sessionId = await page.evaluate(() => {
    return localStorage.getItem('cart_session_id') ||
           document.cookie.split('; ').find(row => row.startsWith('cart_session='))?.split('=')[1] ||
           `session_${Date.now()}`;
  });

  return sessionId;
}

/**
 * Verify cart contents
 */
async function verifyCartContents(page: Page, expectedItems: number): Promise<void> {
  console.log('📍 Verifying cart contents');

  await page.goto(`${BASE_URL}/cart`, { waitUntil: 'networkidle' });

  const cartItems = page.locator('.cart-item, .cart_item, [data-cart-item]');
  const itemCount = await cartItems.count();

  expect(itemCount).toBe(expectedItems);
  console.log(`✅ Cart contains ${itemCount} item(s)`);
}

/**
 * Leave site and trigger abandonment tracking
 */
async function leaveSite(page: Page, sessionId: string): Promise<void> {
  console.log('📍 Leaving site (simulating cart abandonment)');

  // Trigger beforeunload or close event
  await page.evaluate(() => {
    window.dispatchEvent(new Event('beforeunload'));
  });

  await page.waitForTimeout(1000);

  // Navigate away from site
  await page.goto('about:blank');
  await page.waitForTimeout(2000);

  console.log('✅ Site abandoned');
}

/**
 * Return to site and verify cart restoration
 */
async function returnToSiteAndRestoreCart(page: Page, sessionId: string): Promise<void> {
  console.log('📍 Returning to site');

  // Set session cookie/storage before returning
  await page.goto(BASE_URL);

  await page.evaluate((sid) => {
    localStorage.setItem('cart_session_id', sid);
  }, sessionId);

  await page.goto(`${BASE_URL}/cart`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  console.log('✅ Returned to site');
}

/**
 * Complete checkout with restored cart
 */
async function completeCheckoutWithRestoredCart(page: Page): Promise<void> {
  console.log('📍 Completing checkout with restored cart');

  // Verify cart items are present
  const cartItems = page.locator('.cart-item, .cart_item, [data-cart-item]');
  const itemCount = await cartItems.count();
  expect(itemCount).toBeGreaterThan(0);
  console.log(`📊 Cart has ${itemCount} item(s) to checkout`);

  // Proceed to checkout
  const checkoutButton = page.locator('button:has-text("Checkout"), a:has-text("Proceed to Checkout")').first();
  await checkoutButton.waitFor({ state: 'visible', timeout: 5000 });
  await checkoutButton.click();

  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Verify on checkout page
  const checkoutHeading = page.locator('h1:has-text("Checkout"), h2:has-text("Billing Details")').first();
  await expect(checkoutHeading).toBeVisible({ timeout: 5000 });

  console.log('✅ Checkout page reached with restored cart');
}

test.describe('Cart Abandonment and Recovery E2E', () => {
  test.setTimeout(TEST_TIMEOUT);

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should restore abandoned cart when customer returns', async ({ page }) => {
    console.log('=== Starting Cart Abandonment Test ===');

    // Setup mocks
    const cartService = await mockCartAPI(page);
    await mockProductAPI(page);

    // Step 1: Navigate to products
    await navigateToProductPage(page);

    // Step 2: Add product to cart
    const sessionId = await addProductToCart(page, 'Premium Widget');
    console.log('🔑 Session ID:', sessionId);

    // Step 3: Verify cart contents
    await verifyCartContents(page, 1);

    // Step 4: Add second product
    await page.goto(`${BASE_URL}/shop/products`, { waitUntil: 'networkidle' });
    await addProductToCart(page, 'Standard Widget');

    // Step 5: Verify updated cart
    await verifyCartContents(page, 2);

    // Capture cart state before leaving
    const cartBeforeLeaving = cartService.getCart();
    console.log('💾 Cart before leaving:', cartBeforeLeaving);

    // Step 6: Leave site
    await leaveSite(page, sessionId);

    // Step 7: Return to site
    await returnToSiteAndRestoreCart(page, sessionId);

    // Step 8: Verify cart was restored
    await verifyCartContents(page, 2);

    const cartAfterReturn = cartService.getCart();
    console.log('🔄 Cart after return:', cartAfterReturn);

    // Verify cart items match
    expect(cartAfterReturn).not.toBeNull();
    expect(cartAfterReturn?.items.length).toBe(2);

    // Step 9: Complete checkout with restored cart
    await completeCheckoutWithRestoredCart(page);

    await page.screenshot({
      path: `test-results/cart-abandonment-success-${Date.now()}.png`,
      fullPage: true
    });

    console.log('✅ Complete cart abandonment and recovery validated end-to-end!');
  });

  test('should track cart abandonment analytics', async ({ page }) => {
    console.log('=== Testing Cart Abandonment Analytics ===');

    const cartService = await mockCartAPI(page);
    await mockProductAPI(page);

    await navigateToProductPage(page);
    const sessionId = await addProductToCart(page, 'Premium Widget');
    await leaveSite(page, sessionId);

    // Verify abandonment was tracked
    const cart = cartService.getCart();
    expect(cart?.abandoned_at).toBeDefined();
    console.log('✅ Abandonment timestamp recorded:', cart?.abandoned_at);
  });

  test('should send abandonment email reminder', async ({ page }) => {
    console.log('⏭️ Abandonment email reminder test - TODO');
  });

  test('should handle expired cart sessions', async ({ page }) => {
    console.log('⏭️ Expired cart session test - TODO');
  });

  test('should merge guest and authenticated user carts', async ({ page }) => {
    console.log('⏭️ Cart merge test - TODO');
  });

  test('should handle out-of-stock items in restored cart', async ({ page }) => {
    console.log('⏭️ Out-of-stock handling test - TODO');
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') {
      await page.screenshot({
        path: `test-results/cart-abandonment-failure-${Date.now()}.png`,
        fullPage: true
      });
    }
  });
});
