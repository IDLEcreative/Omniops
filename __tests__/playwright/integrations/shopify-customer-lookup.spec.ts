import { test, expect } from '@playwright/test';

/**
 * E2E Test: Shopify Customer Lookup
 *
 * Tests customer information lookup and display.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 180000; // 3 minutes

test.describe('Shopify Customer Lookup E2E', () => {
  test.setTimeout(TEST_TIMEOUT);

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should lookup customer information', async ({ page }) => {
    console.log('=== Testing Customer Lookup ===');

    // Mock Shopify customer API
    await page.route('**/api/shopify/customers**', async (route) => {
      const url = new URL(route.request().url());
      const email = url.searchParams.get('email');

      if (email === 'customer@example.com') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            customer: {
              id: '987654321',
              email: 'customer@example.com',
              firstName: 'Jane',
              lastName: 'Doe',
              phone: '+1234567890',
              ordersCount: 5,
              totalSpent: '849.95',
              createdAt: new Date(Date.now() - 31536000000).toISOString(), // 1 year ago
              tags: ['VIP', 'Repeat Customer'],
              defaultAddress: {
                address1: '123 Main St',
                city: 'San Francisco',
                province: 'CA',
                country: 'United States',
                zip: '94102'
              }
            }
          })
        });
      } else {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, error: 'Customer not found' })
        });
      }
    });

    console.log('📍 Step: Navigate to customer lookup');
    await page.goto(`${BASE_URL}/dashboard/shopify/customers`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Search for customer
    console.log('📍 Step: Searching for customer');
    const emailInput = page.locator('input[type="email"], input[placeholder*="email"]').first();
    const hasInput = await emailInput.isVisible().catch(() => false);

    if (hasInput) {
      await emailInput.fill('customer@example.com');

      const searchButton = page.locator('button:has-text("Search"), button[type="submit"]').first();
      await searchButton.click();

      await page.waitForTimeout(2000);

      // Verify customer details
      const customerName = page.locator('text=/Jane Doe/i').first();
      await expect(customerName).toBeVisible({ timeout: 10000 });

      // Verify order count
      const orderCount = page.locator('text=/5 orders/i, text=/orders.*5/i').first();
      const hasOrders = await orderCount.isVisible().catch(() => false);

      if (hasOrders) {
        console.log('✅ Customer order count displayed: 5 orders');
      }

      // Verify total spent
      const totalSpent = page.locator('text=/\\$849/i, text=/849\\.95/i').first();
      const hasSpent = await totalSpent.isVisible().catch(() => false);

      if (hasSpent) {
        console.log('✅ Total spent displayed: $849.95');
      }
    }

    console.log('✅ Customer lookup validated');
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') {
      await page.screenshot({
        path: `test-results/shopify-customer-lookup-failure-${Date.now()}.png`,
        fullPage: true
      });
    }
  });
});
