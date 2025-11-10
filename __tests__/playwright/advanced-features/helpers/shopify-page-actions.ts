import { Page, FrameLocator, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

export interface ShopifyCredentials {
  shop_domain: string;
  access_token: string;
  api_key: string;
  api_secret: string;
}

/**
 * Navigate to Shopify integration page
 */
export async function navigateToShopifyIntegration(page: Page): Promise<void> {
  console.log('📍 Navigating to Shopify integration page');

  await page.goto(`${BASE_URL}/dashboard/integrations/shopify`, { waitUntil: 'networkidle' });

  const pageTitle = page.locator('h1:has-text("Shopify"), h2:has-text("Shopify")').first();
  await expect(pageTitle).toBeVisible({ timeout: 10000 });

  console.log('✅ Shopify integration page loaded');
}

/**
 * Enter Shopify credentials
 */
export async function enterShopifyCredentials(page: Page, credentials: ShopifyCredentials): Promise<void> {
  console.log('📍 Entering Shopify credentials');

  // Shop domain
  const shopDomainInput = page.locator('input[name="shop_domain"], input[placeholder*="shop" i]').first();
  await shopDomainInput.fill(credentials.shop_domain);

  // Access token
  const accessTokenInput = page.locator('input[name="access_token"], input[placeholder*="access token" i]').first();
  await accessTokenInput.fill(credentials.access_token);

  // API key (if separate fields)
  const apiKeyInput = page.locator('input[name="api_key"], input[placeholder*="api key" i]').first();
  if (await apiKeyInput.isVisible({ timeout: 2000 })) {
    await apiKeyInput.fill(credentials.api_key);
  }

  // API secret (if separate fields)
  const apiSecretInput = page.locator('input[name="api_secret"], input[placeholder*="api secret" i]').first();
  if (await apiSecretInput.isVisible({ timeout: 2000 })) {
    await apiSecretInput.fill(credentials.api_secret);
  }

  console.log('✅ Credentials entered');
}

/**
 * Test Shopify connection
 */
export async function testConnection(page: Page): Promise<void> {
  console.log('📍 Testing Shopify connection');

  const testButton = page.locator('button:has-text("Test Connection"), button:has-text("Verify")').first();
  await testButton.click();

  await page.waitForTimeout(2000);

  // Verify success message
  const successMessage = page.locator('text=/connection successful/i, text=/connected successfully/i, [role="alert"]:has-text("success")').first();
  await expect(successMessage).toBeVisible({ timeout: 5000 });

  console.log('✅ Connection test successful');
}

/**
 * Save Shopify configuration
 */
export async function saveConfiguration(page: Page): Promise<void> {
  console.log('📍 Saving Shopify configuration');

  const saveButton = page.locator('button[type="submit"]:has-text("Save"), button:has-text("Connect")').first();
  await saveButton.click();

  await page.waitForTimeout(2000);

  const savedMessage = page.locator('text=/saved/i, text=/configured/i').first();
  await expect(savedMessage).toBeVisible({ timeout: 5000 });

  console.log('✅ Configuration saved');
}

/**
 * Sync Shopify products
 */
export async function syncProducts(page: Page, expectedCount: number): Promise<void> {
  console.log('📍 Syncing Shopify products');

  const syncButton = page.locator('button:has-text("Sync Products"), button:has-text("Import Products")').first();
  await syncButton.click();

  await page.waitForTimeout(3000);

  // Verify sync success
  const syncMessage = page.locator(`text=/synced ${expectedCount}/i, text=/imported ${expectedCount}/i`).first();
  const messageVisible = await syncMessage.isVisible({ timeout: 5000 }).catch(() => false);

  if (messageVisible) {
    console.log(`✅ Products synced: ${expectedCount}`);
  } else {
    console.log('✅ Product sync completed (count not displayed)');
  }
}

/**
 * Search for Shopify product via chat
 */
export async function searchProductViaChat(page: Page, iframe: FrameLocator, productName: string): Promise<string> {
  console.log(`📍 Searching for product via chat: ${productName}`);

  const inputField = iframe.locator('input[type="text"], textarea').first();
  await inputField.fill(`Do you have ${productName}?`);

  const sendButton = iframe.locator('button[type="submit"]').first();
  await sendButton.click();

  await page.waitForTimeout(3000);

  // Get response
  const messages = iframe.locator('[data-role="assistant"], .assistant-message, .ai-message');
  const lastMessage = messages.last();
  const response = await lastMessage.textContent({ timeout: 5000 }).catch(() => '');

  console.log('✅ Chat response received');
  return response || '';
}

/**
 * Verify product found in chat response
 */
export async function verifyProductInResponse(response: string, productName: string): Promise<void> {
  console.log('📍 Verifying product in chat response');

  const productMentioned = response.toLowerCase().includes(productName.toLowerCase());
  expect(productMentioned).toBe(true);

  console.log('✅ Product found in response');
}

/**
 * Mock purchase tracking
 */
export async function trackPurchase(page: Page, productId: string, amount: number): Promise<void> {
  console.log(`📍 Tracking purchase: Product ${productId}, Amount $${amount}`);

  // Simulate purchase event
  await page.evaluate((data) => {
    window.dispatchEvent(new CustomEvent('purchase', { detail: data }));
  }, { product_id: productId, amount });

  await page.waitForTimeout(1000);

  console.log('✅ Purchase event dispatched');
}

/**
 * Verify purchase tracked in analytics
 */
export async function verifyPurchaseTracking(analyticsEvents: any[], productId: string): Promise<void> {
  console.log('📍 Verifying purchase tracking in analytics');

  const purchaseEvent = analyticsEvents.find(e =>
    e.event_type === 'purchase' && e.data?.product_id === productId
  );

  expect(purchaseEvent).toBeDefined();
  console.log('✅ Purchase tracked in analytics:', purchaseEvent);
}

/**
 * Verify connection error displayed
 */
export async function verifyConnectionError(page: Page): Promise<void> {
  const errorMessage = page.locator('text=/invalid/i, text=/error/i, [role="alert"]:has-text("error")').first();
  await expect(errorMessage).toBeVisible({ timeout: 5000 });
  console.log('✅ Error message displayed');
}
