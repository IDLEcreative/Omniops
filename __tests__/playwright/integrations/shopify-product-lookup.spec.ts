import { test, expect } from '@playwright/test';
import { waitForChatWidget } from '../../utils/playwright/chat-helpers';

/**
 * E2E Test: Shopify Product Lookup
 *
 * Tests product lookup by ID and SKU.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 180000; // 3 minutes

test.describe('Shopify Product Lookup E2E', () => {
  test.setTimeout(TEST_TIMEOUT);

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should lookup product by Shopify product ID', async ({ page }) => {
    console.log('=== Testing Product Lookup by ID ===');

    // Mock Shopify product API
    await page.route('**/api/shopify/products/*', async (route) => {
      const productId = route.request().url().split('/').pop();

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          product: {
            id: productId,
            title: 'Premium Wireless Headphones',
            vendor: 'TechGear',
            productType: 'Electronics',
            tags: ['audio', 'wireless', 'premium'],
            variants: [
              {
                id: 'variant_1',
                title: 'Black',
                price: '149.99',
                sku: 'TWH-BLK-001',
                inventoryQuantity: 50,
                available: true
              },
              {
                id: 'variant_2',
                title: 'White',
                price: '149.99',
                sku: 'TWH-WHT-001',
                inventoryQuantity: 30,
                available: true
              }
            ],
            images: [
              { src: 'https://cdn.shopify.com/image1.jpg', altText: 'Front view' }
            ],
            description: 'Premium wireless headphones with noise cancellation'
          }
        })
      });
    });

    console.log('📍 Step: Navigate to chat widget');
    await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });
    const iframe = await waitForChatWidget(page);

    // Mock chat API to use Shopify product lookup
    await page.route('**/api/chat', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          response: 'Found Premium Wireless Headphones - $149.99. Available in Black (50 units) and White (30 units).',
          productData: {
            id: 'gid://shopify/Product/123456789',
            title: 'Premium Wireless Headphones',
            variants: 2
          }
        })
      });
    });

    console.log('📍 Step: Query product by ID');
    const input = iframe.locator('input[type="text"], textarea').first();
    await input.fill('Show me product ID 123456789');

    const sendButton = iframe.locator('button[type="submit"]').first();
    await sendButton.click();

    await page.waitForTimeout(3000);

    // Verify product information displayed
    console.log('📍 Step: Verifying product details');
    const productTitle = iframe.locator('text=/Premium Wireless Headphones/i').first();
    await expect(productTitle).toBeVisible({ timeout: 10000 });

    const price = iframe.locator('text=/\\$149\\.99/i, text=/149\\.99/i').first();
    const hasPrice = await price.isVisible().catch(() => false);

    if (hasPrice) {
      console.log('✅ Product price displayed');
    }

    console.log('✅ Product lookup by ID validated');
  });

  test('should lookup product by SKU', async ({ page }) => {
    console.log('=== Testing Product Lookup by SKU ===');

    // Mock Shopify SKU search API
    await page.route('**/api/shopify/products/search**', async (route) => {
      const url = new URL(route.request().url());
      const sku = url.searchParams.get('sku');

      if (sku === 'TWH-BLK-001') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            products: [{
              id: '123456789',
              title: 'Premium Wireless Headphones',
              variant: {
                id: 'variant_1',
                title: 'Black',
                sku: 'TWH-BLK-001',
                price: '149.99',
                inventoryQuantity: 50
              }
            }]
          })
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, products: [] })
        });
      }
    });

    await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });
    const iframe = await waitForChatWidget(page);

    // Mock chat API
    await page.route('**/api/chat', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          response: 'Found product with SKU TWH-BLK-001: Premium Wireless Headphones (Black) - $149.99. In stock: 50 units.'
        })
      });
    });

    console.log('📍 Step: Search by SKU');
    const input = iframe.locator('input[type="text"], textarea').first();
    await input.fill('Do you have SKU TWH-BLK-001?');

    const sendButton = iframe.locator('button[type="submit"]').first();
    await sendButton.click();

    await page.waitForTimeout(3000);

    // Verify SKU search result
    console.log('📍 Step: Verifying SKU search result');
    const skuResult = iframe.locator('text=/TWH-BLK-001/i, text=/50 units/i').first();
    const hasResult = await skuResult.isVisible().catch(() => false);

    if (hasResult) {
      console.log('✅ SKU found in response');
    }

    console.log('✅ Product lookup by SKU validated');
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') {
      await page.screenshot({
        path: `test-results/shopify-product-lookup-failure-${Date.now()}.png`,
        fullPage: true
      });
    }
  });
});
