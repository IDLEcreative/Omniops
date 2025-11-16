import { Page, FrameLocator } from '@playwright/test';

/**
 * Setup Helper Functions for Mobile Shopping Tests
 * Handles viewport configuration, mobile features, and API mocking
 */

/**
 * Set mobile viewport for iPhone X dimensions
 */
export async function setMobileViewport(page: Page): Promise<void> {
  console.log('📱 Setting mobile viewport (iPhone X: 375x812)');
  await page.setViewportSize({ width: 375, height: 812 });
  console.log('✅ Mobile viewport set');
}

/**
 * Enable touch events and disable reduced motion
 */
export async function enableMobileFeatures(page: Page): Promise<void> {
  console.log('📍 Enabling mobile features (touch events, animations)');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  console.log('✅ Mobile features enabled');
}

/**
 * Mock shopping product search API
 * Returns realistic product data for testing
 */
export async function mockShoppingAPI(page: Page): Promise<void> {
  console.log('🔧 Setting up shopping API mock...');

  await page.route('**/api/chat', async (route) => {
    const requestData = route.request().postDataJSON();
    console.log('🔍 Shopping request:', requestData.message?.substring(0, 50));

    const responseData = {
      message: 'Here are some great products for you!',
      conversation_id: 'test-conversation-123',
      shoppingMetadata: {
        products: [
        {
          id: 'prod-001',
          name: 'Premium Wireless Headphones',
          price: 299.99,
          salePrice: 249.99,
          image: 'https://picsum.photos/seed/headphones/800/1200',
          images: [
            'https://picsum.photos/seed/headphones1/800/1200',
            'https://picsum.photos/seed/headphones2/800/1200',
            'https://picsum.photos/seed/headphones3/800/1200',
          ],
          permalink: 'https://example.com/product/headphones',
          stockStatus: 'instock',
          shortDescription: 'High-quality wireless headphones with noise cancellation',
          variants: [
            {
              id: 'var-color',
              name: 'Color',
              options: ['Black', 'White', 'Silver'],
              selected: 'Black',
            },
          ],
        },
        {
          id: 'prod-002',
          name: 'Smart Watch Pro',
          price: 399.99,
          image: 'https://picsum.photos/seed/watch/800/1200',
          permalink: 'https://example.com/product/watch',
          stockStatus: 'instock',
          shortDescription: 'Advanced fitness tracking and notifications',
        },
        {
          id: 'prod-003',
          name: 'Portable Speaker',
          price: 149.99,
          salePrice: 129.99,
          image: 'https://picsum.photos/seed/speaker/800/1200',
          permalink: 'https://example.com/product/speaker',
          stockStatus: 'outofstock',
          shortDescription: 'Waterproof Bluetooth speaker',
        },
      ],
        context: 'Search results for "headphones"',
        productCount: 3,
      },
      sources: [],
      searchMetadata: {
        iterations: 1,
        totalSearches: 1,
        searchLog: [],
      },
    };

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(responseData),
    });
  });

  console.log('✅ Shopping API mock ready');
}

/**
 * Wait for shopping feed to appear
 * Returns true if shopping mode activated
 */
export async function waitForShoppingFeed(
  iframe: FrameLocator,
  timeout = 10000
): Promise<boolean> {
  console.log('📍 Waiting for shopping feed to appear...');

  try {
    const shoppingFeed = iframe.locator('[data-testid="shopping-feed"], .shopping-feed');
    await shoppingFeed.waitFor({ state: 'visible', timeout });
    console.log('✅ Shopping feed visible');
    return true;
  } catch {
    console.log('⚠️ Shopping feed did not appear');
    return false;
  }
}

/**
 * Get count of product cards in shopping feed
 */
export async function getProductCardCount(iframe: FrameLocator): Promise<number> {
  console.log('📍 Counting product cards...');
  const productCards = iframe.locator('[data-testid="product-card"], .product-story');
  const count = await productCards.count();
  console.log(`✅ Found ${count} product card(s)`);
  return count;
}
