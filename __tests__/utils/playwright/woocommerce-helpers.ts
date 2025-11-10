import { Page } from '@playwright/test';

export interface WooCommerceCredentials {
  storeUrl: string;
  consumerKey: string;
  consumerSecret: string;
}

export async function navigateToWooCommerceIntegration(page: Page, baseUrl: string): Promise<void> {
  console.log('📍 Navigating to WooCommerce integration');
  await page.goto(baseUrl + '/dashboard', { waitUntil: 'networkidle' });
  const integrationsLink = page.locator('a:has-text("Integrations"), a[href*="integration"]').first();
  const linkVisible = await integrationsLink.isVisible({ timeout: 5000 }).catch(() => false);
  if (linkVisible) {
    await integrationsLink.click();
    await page.waitForLoadState('networkidle');
  } else {
    await page.goto(baseUrl + '/dashboard/integrations', { waitUntil: 'networkidle' });
  }
  const wooLink = page.locator('a:has-text("WooCommerce"), button:has-text("WooCommerce"), [data-integration="woocommerce"]').first();
  await wooLink.click();
  await page.waitForLoadState('networkidle');
  console.log('✅ WooCommerce integration page loaded');
}

export async function fillWooCommerceCredentials(page: Page, credentials: WooCommerceCredentials): Promise<void> {
  console.log('📍 Filling WooCommerce credentials');
  const fields = [
    { name: 'store_url', value: credentials.storeUrl },
    { name: 'consumer_key', value: credentials.consumerKey },
    { name: 'consumer_secret', value: credentials.consumerSecret }
  ];
  for (const field of fields) {
    const input = page.locator('input[name="' + field.name + '"], input[name="woocommerce_' + field.name + '"]').first();
    await input.waitFor({ state: 'visible', timeout: 5000 });
    await input.fill(field.value);
  }
  console.log('✅ Credentials filled');
}

export async function mockWooCommerceError(page: Page, errorMessage: string): Promise<void> {
  console.log('🔧 Setting up WooCommerce error mock');
  await page.route('**/api/woocommerce/configure', async (route) => {
    await route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ success: false, error: errorMessage, message: errorMessage }) });
  });
  console.log('✅ WooCommerce error mock ready');
}

export async function mockWooCommerceSuccess(page: Page): Promise<void> {
  console.log('🔧 Setting up WooCommerce success mocks');
  await page.route('**/api/woocommerce/configure', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, message: 'WooCommerce connected successfully', storeInfo: { name: 'Test Store', url: 'https://test-store.com', productsCount: 25, version: '8.0.0' } }) });
  });
  await page.route('**/api/woocommerce/sync', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, synced: 25, message: 'Products synced successfully' }) });
  });
  console.log('✅ WooCommerce success mocks ready');
}
