/**
 * WooCommerce E2E Test Helpers
 *
 * Reusable utilities for WooCommerce integration testing
 */

import { Page, Route } from '@playwright/test';

export const TEST_WOOCOMMERCE = {
  storeUrl: process.env.TEST_WOOCOMMERCE_URL || 'https://demo.woocommerce.com',
  consumerKey: process.env.TEST_WOOCOMMERCE_KEY || 'ck_test_xxx',
  consumerSecret: process.env.TEST_WOOCOMMERCE_SECRET || 'cs_test_xxx',
};

export interface WooCommerceProduct {
  id: string;
  name: string;
  price: number;
  inStock: boolean;
  url: string;
}

/**
 * Setup WooCommerce configuration API mock
 */
export async function mockWooCommerceConfigureAPI(page: Page) {
  await page.route('**/api/woocommerce/configure', async (route: Route) => {
    const request = route.request();
    if (request.method() === 'POST') {
      const postData = request.postDataJSON();
      console.log('🔍 WooCommerce configure request:', {
        storeUrl: postData.storeUrl,
        hasKeys: !!(postData.consumerKey && postData.consumerSecret)
      });

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'WooCommerce store connected successfully',
          storeInfo: {
            name: 'Test Store',
            version: '8.0.0',
            productsCount: 25
          }
        })
      });
    } else {
      await route.continue();
    }
  });
}

/**
 * Setup WooCommerce products API mock
 */
export async function mockWooCommerceProductsAPI(page: Page, storeUrl: string) {
  await page.route('**/api/woocommerce/products*', async (route: Route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Product sync initiated',
          productsToSync: 25,
          estimatedTime: 30
        })
      });
    } else if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          products: [
            {
              id: 'prod_1',
              name: 'Premium Widget',
              price: 99.99,
              inStock: true,
              url: `${storeUrl}/product/premium-widget`
            },
            {
              id: 'prod_2',
              name: 'Standard Widget',
              price: 49.99,
              inStock: true,
              url: `${storeUrl}/product/standard-widget`
            }
          ],
          total: 25
        })
      });
    } else {
      await route.continue();
    }
  });
}

/**
 * Setup WooCommerce error mock
 */
export async function mockWooCommerceError(page: Page, errorMessage: string) {
  await page.route('**/api/woocommerce/configure', async (route: Route) => {
    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({
        error: 'Invalid credentials',
        message: errorMessage
      })
    });
  });
}

/**
 * Fill WooCommerce credentials form
 */
export async function fillWooCommerceCredentials(page: Page, credentials = TEST_WOOCOMMERCE) {
  const storeUrlInput = page.locator(
    'input[name="storeUrl"], input[name="store_url"], input[placeholder*="store" i]'
  ).first();
  await storeUrlInput.waitFor({ state: 'visible', timeout: 5000 });
  await storeUrlInput.fill(credentials.storeUrl);

  const consumerKeyInput = page.locator(
    'input[name="consumerKey"], input[name="consumer_key"], input[placeholder*="consumer key" i]'
  ).first();
  await consumerKeyInput.fill(credentials.consumerKey);

  const consumerSecretInput = page.locator(
    'input[name="consumerSecret"], input[name="consumer_secret"], input[placeholder*="consumer secret" i]'
  ).first();
  await consumerSecretInput.fill(credentials.consumerSecret);

  console.log('✅ Entered WooCommerce credentials');
}

/**
 * Navigate to WooCommerce integration page
 */
export async function navigateToWooCommerceIntegration(page: Page, baseUrl: string) {
  await page.goto(`${baseUrl}/dashboard/integrations`, {
    waitUntil: 'networkidle',
    timeout: 15000
  });

  const woocommerceLink = page.locator(
    'a[href*="/integrations/woocommerce"], a:has-text("WooCommerce"), button:has-text("WooCommerce")'
  ).first();

  await woocommerceLink.waitFor({ state: 'visible', timeout: 10000 });
  await woocommerceLink.click();
  await page.waitForLoadState('networkidle');
}
