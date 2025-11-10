import { Page } from '@playwright/test';

export interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  variants: Array<{
    id: string;
    price: string;
    inventory_quantity: number;
  }>;
  images: Array<{ src: string }>;
}

/**
 * Mock Shopify API
 */
export async function mockShopifyAPI(page: Page, products: ShopifyProduct[]): Promise<void> {
  console.log('🔧 Setting up Shopify API mock');

  // Mock connection test
  await page.route('**/api/shopify/test-connection', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        message: 'Successfully connected to Shopify store',
        shop_info: {
          name: 'Test Store',
          domain: 'test-store.myshopify.com'
        }
      })
    });
  });

  // Mock products sync
  await page.route('**/api/shopify/sync-products', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        synced_count: products.length,
        products: products.map(p => ({ id: p.id, title: p.title }))
      })
    });
  });

  // Mock products list
  await page.route('**/api/shopify/products**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        products
      })
    });
  });

  console.log('✅ Shopify API mock ready');
}

/**
 * Mock analytics tracking for Shopify events
 */
export async function mockShopifyAnalytics(page: Page): Promise<{ getEvents: () => any[] }> {
  console.log('🔧 Setting up Shopify analytics mock');

  const analyticsState = { events: [] as any[] };

  await page.route('**/api/analytics/track', async (route) => {
    const requestData = route.request().postDataJSON();
    console.log('📊 Analytics event:', requestData.event_type);

    analyticsState.events.push({
      event_type: requestData.event_type,
      timestamp: new Date().toISOString(),
      data: requestData.data
    });

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true })
    });
  });

  console.log('✅ Shopify analytics mock ready');
  return {
    getEvents: () => analyticsState.events
  };
}

/**
 * Mock Shopify connection error
 */
export async function mockShopifyConnectionError(page: Page): Promise<void> {
  await page.route('**/api/shopify/test-connection', async (route) => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({
        success: false,
        error: 'Invalid access token'
      })
    });
  });
}

/**
 * Mock chat API for Shopify product search
 */
export async function mockShopifyChatAPI(page: Page, products: ShopifyProduct[]): Promise<void> {
  await page.route('**/api/chat', async (route) => {
    const requestData = route.request().postDataJSON();
    const message = requestData.message?.toLowerCase() || '';

    // Find matching product
    const matchedProduct = products.find(p =>
      message.includes(p.title.toLowerCase()) ||
      message.includes(p.handle)
    );

    if (matchedProduct) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          response: `Yes! We have the ${matchedProduct.title} available for $${matchedProduct.variants[0].price}. It is a great choice and currently in stock.`,
          products: [matchedProduct]
        })
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          response: 'How can I help you find a product today?'
        })
      });
    }
  });
}
