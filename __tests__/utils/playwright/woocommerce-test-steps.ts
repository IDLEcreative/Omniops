import { Page } from '@playwright/test';

export async function verifyConfigurationPage(page: Page): Promise<void> {
  console.log('📍 Verifying configuration page');
  const configForm = page.locator('form, [data-testid="woocommerce-config"], .woocommerce-setup').first();
  await configForm.waitFor({ state: 'visible', timeout: 10000 });
  console.log('✅ Configuration page verified');
}

export async function testConnection(page: Page): Promise<boolean> {
  console.log('📍 Testing WooCommerce connection');
  const testButton = page.locator('button:has-text("Test Connection"), button:has-text("Verify")').first();
  const testButtonVisible = await testButton.isVisible({ timeout: 5000 }).catch(() => false);
  if (!testButtonVisible) {
    console.log('⏭️  Test connection button not found');
    return false;
  }
  await testButton.click();
  await page.waitForTimeout(2000);
  const successIndicator = page.locator('text=/connection successful/i, .success, [role="alert"]:has-text("success")').first();
  const success = await successIndicator.isVisible({ timeout: 5000 }).catch(() => false);
  if (success) {
    console.log('✅ Connection test passed');
  } else {
    console.log('⚠️  Connection test status unclear');
  }
  return success;
}

export async function saveConfiguration(page: Page): Promise<void> {
  console.log('📍 Saving configuration');
  const saveButton = page.locator('button:has-text("Save"), button:has-text("Connect"), button[type="submit"]').first();
  await saveButton.waitFor({ state: 'visible', timeout: 5000 });
  await saveButton.click();
  await page.waitForTimeout(2000);
  console.log('✅ Configuration saved');
}

export async function syncProducts(page: Page): Promise<void> {
  console.log('📍 Syncing products');
  const syncButton = page.locator('button:has-text("Sync Products"), button:has-text("Import Products")').first();
  const syncButtonVisible = await syncButton.isVisible({ timeout: 5000 }).catch(() => false);
  if (syncButtonVisible) {
    await syncButton.click();
    await page.waitForTimeout(3000);
    console.log('✅ Product sync initiated');
  } else {
    console.log('⏭️  Sync button not found (may auto-sync)');
  }
}

export async function viewSyncedProducts(page: Page): Promise<number> {
  console.log('📍 Viewing synced products');
  const productsLink = page.locator('a:has-text("Products"), a[href*="product"]').first();
  const linkVisible = await productsLink.isVisible({ timeout: 5000 }).catch(() => false);
  if (linkVisible) {
    await productsLink.click();
    await page.waitForLoadState('networkidle');
  }
  const productItems = page.locator('.product-item, [data-product-id], tr:has-text("$")');
  const count = await productItems.count();
  console.log('✅ Found ' + count + ' synced product(s)');
  return count;
}

export async function completeWooCommerceSetup(page: Page): Promise<void> {
  console.log('🚀 Starting complete WooCommerce setup');
  await page.route('**/api/woocommerce/configure', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, message: 'WooCommerce connected successfully', storeInfo: { name: 'Test Store', url: 'https://test-store.com', productsCount: 25 } }) });
    } else {
      await route.continue();
    }
  });
  await page.route('**/api/woocommerce/sync', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, synced: 25, message: 'Products synced successfully' }) });
  });
  const storeUrlInput = page.locator('input[name="store_url"]').first();
  await storeUrlInput.waitFor({ state: 'visible', timeout: 10000 });
  await storeUrlInput.fill('https://test-store.com');
  const consumerKeyInput = page.locator('input[name="consumer_key"]').first();
  await consumerKeyInput.fill('ck_test_1234567890');
  const consumerSecretInput = page.locator('input[name="consumer_secret"]').first();
  await consumerSecretInput.fill('cs_test_0987654321');
  console.log('✅ Credentials entered');
  const saveButton = page.locator('button[type="submit"]').first();
  await saveButton.click();
  await page.waitForTimeout(3000);
  console.log('✅ WooCommerce setup complete');
}
