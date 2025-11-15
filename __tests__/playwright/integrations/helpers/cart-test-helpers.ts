/**
 * Cart Test Helpers
 *
 * Shared utilities for WooCommerce cart operation tests.
 */

import { Page, Route } from '@playwright/test';

export interface CartConfig {
  name: string;
  storeAPIEnabled: boolean;
  expectedMode: 'informational' | 'transactional';
}

export const TEST_CONFIGS: CartConfig[] = [
  {
    name: 'Informational Mode (URLs)',
    storeAPIEnabled: false,
    expectedMode: 'informational',
  },
  {
    name: 'Transactional Mode (Direct API)',
    storeAPIEnabled: true,
    expectedMode: 'transactional',
  },
];

export async function setupCartAPIRoute(
  page: Page,
  config: CartConfig
): Promise<void> {
  await page.route('**/api/woocommerce/cart-test', async (route: Route) => {
    const request = route.request();
    const postData = request.postDataJSON();

    console.log('🔍 Cart test API called:', {
      action: postData?.action,
      mode: config.expectedMode,
    });

    if (config.storeAPIEnabled) {
      // Transactional mode response
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          mode: 'transactional',
          message: `Successfully ${postData?.action === 'add' ? 'added item to' : 'retrieved'} cart`,
          cart: {
            items: [
              {
                id: postData?.productId || 123,
                name: 'Test Product',
                quantity: postData?.quantity || 1,
                prices: { price: '2499.00', currency: 'USD' },
              },
            ],
            totals: { total: '2499.00', currency: 'USD' },
          },
        }),
      });
    } else {
      // Informational mode response
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          mode: 'informational',
          message: 'Store API is not enabled. Using informational mode.',
          data: {
            addToCartUrl: `https://test-store.com/?add-to-cart=${postData?.productId || 123}`,
            productId: postData?.productId || 123,
            quantity: postData?.quantity || 1,
          },
        }),
      });
    }
  });
}

export async function setupChatAPIRoute(
  page: Page,
  config: CartConfig
): Promise<void> {
  await page.route('**/api/chat', async (route: Route) => {
    const request = route.request();
    const postData = request.postDataJSON();
    const message = postData.message?.toLowerCase() || '';

    let response = '';

    if (message.includes('add') && message.includes('cart')) {
      response = config.storeAPIEnabled
        ? `✅ I've added the A4VTG90 hydraulic pump to your cart!\n\nCart Summary:\n• A4VTG90 Hydraulic Pump\n• Quantity: 1\n• Price: $2,499.00\n• Cart Total: $2,499.00\n\nYour cart has been updated in real-time.`
        : `🛒 Ready to Add to Cart\n\nProduct: A4VTG90 Hydraulic Pump\nPrice: $2,499.00\nQuantity: 1\n\nTo add this to your cart, please click here:\nhttps://test-store.com/?add-to-cart=123`;
    } else if (message.includes('show cart') || message.includes('view cart')) {
      response = config.storeAPIEnabled
        ? `📦 Your Current Cart:\n\n1. A4VTG90 Hydraulic Pump\n   Quantity: 1\n   Price: $2,499.00\n\nCart Total: $2,499.00`
        : `To view your cart, please visit:\nhttps://test-store.com/cart`;
    } else if (message.includes('coupon')) {
      response = config.storeAPIEnabled
        ? `✅ Coupon "SAVE10" applied successfully!\n\nUpdated Cart Total:\n• Subtotal: $2,499.00\n• Discount: -$249.90 (10% off)\n• New Total: $2,249.10`
        : `To apply a coupon, please:\n1. Go to your cart: https://test-store.com/cart\n2. Enter coupon code: SAVE10\n3. Click "Apply Coupon"`;
    } else {
      response = 'How can I help you with your shopping today?';
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        response,
        mode: config.expectedMode,
      }),
    });
  });
}
