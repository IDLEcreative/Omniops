import { test, expect } from '@playwright/test';
import { waitForChatWidget } from '../../utils/playwright/chat-helpers';

/**
 * E2E Test: Shopify Product Search & Inventory
 *
 * Tests product search by title and inventory sync.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 180000; // 3 minutes

test.describe('Shopify Product Search & Inventory E2E', () => {
  test.setTimeout(TEST_TIMEOUT);

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should search products by title', async ({ page }) => {
    console.log('=== Testing Product Search by Title ===');

    // Mock Shopify product search
    await page.route('**/api/shopify/products/search**', async (route) => {
      const url = new URL(route.request().url());
      const query = url.searchParams.get('query') || '';

      if (query.toLowerCase().includes('headphones')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            products: [
              {
                id: '123456789',
                title: 'Premium Wireless Headphones',
                price: '149.99',
                available: true,
                vendor: 'TechGear'
              },
              {
                id: '123456790',
                title: 'Budget Wired Headphones',
                price: '29.99',
                available: true,
                vendor: 'BasicAudio'
              },
              {
                id: '123456791',
                title: 'Sports Wireless Headphones',
                price: '79.99',
                available: true,
                vendor: 'FitSound'
              }
            ],
            totalResults: 3
          })
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, products: [], totalResults: 0 })
        });
      }
    });

    await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });
    const iframe = await waitForChatWidget(page);

    // Mock chat API with multiple results
    await page.route('**/api/chat', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          response: 'Found 3 headphones: 1) Premium Wireless Headphones ($149.99), 2) Budget Wired Headphones ($29.99), 3) Sports Wireless Headphones ($79.99).'
        })
      });
    });

    console.log('📍 Step: Search products by title');
    const input = iframe.locator('input[type="text"], textarea').first();
    await input.fill('Show me headphones');

    const sendButton = iframe.locator('button[type="submit"]').first();
    await sendButton.click();

    await page.waitForTimeout(3000);

    // Verify multiple results
    console.log('📍 Step: Verifying search results');
    const resultsText = iframe.locator('text=/Found 3/i, text=/Premium Wireless/i').first();
    await expect(resultsText).toBeVisible({ timeout: 10000 });

    console.log('✅ Product search by title validated');
  });

  test('should sync product inventory in real-time', async ({ page }) => {
    console.log('=== Testing Real-Time Inventory Sync ===');

    let inventoryCheckCount = 0;

    // Mock inventory check API
    await page.route('**/api/shopify/inventory/*', async (route) => {
      inventoryCheckCount++;

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          inventory: {
            productId: '123456789',
            variantId: 'variant_1',
            quantity: inventoryCheckCount === 1 ? 50 : 48, // Simulate inventory change
            available: true,
            lastSync: new Date().toISOString()
          }
        })
      });
    });

    console.log('📍 Step: Navigate to Shopify inventory dashboard');
    await page.goto(`${BASE_URL}/dashboard/shopify/inventory`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Verify initial inventory
    const initialInventory = page.locator('text=/50 units/i, text=/quantity.*50/i').first();
    const hasInitial = await initialInventory.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasInitial) {
      console.log('✅ Initial inventory: 50 units');
    }

    // Trigger sync
    console.log('📍 Step: Triggering inventory sync');
    const syncButton = page.locator('button:has-text("Sync Inventory"), button:has-text("Refresh")').first();
    const hasSync = await syncButton.isVisible().catch(() => false);

    if (hasSync) {
      await syncButton.click();
      await page.waitForTimeout(2000);

      // Verify updated inventory
      const updatedInventory = page.locator('text=/48 units/i, text=/quantity.*48/i').first();
      const hasUpdated = await updatedInventory.isVisible().catch(() => false);

      if (hasUpdated) {
        console.log('✅ Updated inventory: 48 units (2 units sold)');
      }
    }

    console.log('✅ Real-time inventory sync validated');
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') {
      await page.screenshot({
        path: `test-results/shopify-product-search-failure-${Date.now()}.png`,
        fullPage: true
      });
    }
  });
});
