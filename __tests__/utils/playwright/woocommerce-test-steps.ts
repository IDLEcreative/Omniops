/**
 * WooCommerce Test Step Functions
 *
 * High-level test step implementations for WooCommerce E2E tests
 */

import { Page, expect } from '@playwright/test';
import {
  fillWooCommerceCredentials,
  mockWooCommerceConfigureAPI,
  mockWooCommerceProductsAPI,
  TEST_WOOCOMMERCE
} from './woocommerce-helpers';

/**
 * Verify on WooCommerce configuration page and open form if needed
 */
export async function verifyConfigurationPage(page: Page) {
  const currentUrl = page.url();
  expect(currentUrl).toContain('/woocommerce');

  const configForm = page.locator('form, [role="form"]').first();
  const formExists = await configForm.isVisible().catch(() => false);

  if (!formExists) {
    const configureButton = page.locator(
      'button:has-text("Configure"), button:has-text("Add Store"), button:has-text("Connect Store")'
    ).first();

    if (await configureButton.isVisible().catch(() => false)) {
      await configureButton.click();
      await page.waitForTimeout(1000);
    }
  }
}

/**
 * Test WooCommerce connection
 */
export async function testConnection(page: Page) {
  const testConnectionButton = page.locator(
    'button:has-text("Test Connection"), button:has-text("Verify"), button:has-text("Test")'
  ).first();

  if (await testConnectionButton.isVisible().catch(() => false)) {
    await testConnectionButton.click();
    await page.waitForTimeout(2000);

    const successMessage = page.locator(
      'text=/connected successfully/i, text=/connection successful/i, .success, [role="alert"]:has-text("success")'
    );

    await expect(successMessage.first()).toBeVisible({ timeout: 10000 });
    console.log('✅ Connection test successful');
  } else {
    console.log('⏭️  No separate "Test Connection" button');
  }
}

/**
 * Save WooCommerce configuration
 */
export async function saveConfiguration(page: Page) {
  const saveButton = page.locator(
    'button:has-text("Save"), button:has-text("Connect"), button[type="submit"]'
  ).first();

  await saveButton.click();
  await page.waitForTimeout(2000);

  const confirmationMessage = page.locator(
    'text=/saved successfully/i, text=/connected successfully/i, text=/configuration updated/i'
  );

  const confirmed = await confirmationMessage.first().isVisible({ timeout: 5000 }).catch(() => false);
  if (!confirmed) {
    console.warn('⚠️  Save confirmation not visible');
  }
}

/**
 * Initiate and monitor product sync
 */
export async function syncProducts(page: Page) {
  const syncButton = page.locator(
    'button:has-text("Sync Products"), button:has-text("Import Products"), button:has-text("Refresh Products")'
  ).first();

  if (await syncButton.isVisible().catch(() => false)) {
    await syncButton.click();
    await page.waitForTimeout(3000);

    const syncComplete = page.locator(
      'text=/sync complete/i, text=/products imported/i, text=/\\d+ products/i'
    );

    const syncSuccess = await syncComplete.first().isVisible({ timeout: 15000 }).catch(() => false);
    if (syncSuccess) {
      const syncText = await syncComplete.first().textContent();
      console.log('✅ Product sync completed:', syncText);
    }
  } else {
    console.log('⏭️  No manual sync required');
  }
}

/**
 * View synced products in dashboard
 */
export async function viewSyncedProducts(page: Page): Promise<number> {
  const productsTab = page.locator(
    'a:has-text("Products"), button:has-text("Products"), [role="tab"]:has-text("Products")'
  ).first();

  if (await productsTab.isVisible().catch(() => false)) {
    await productsTab.click();
    await page.waitForTimeout(1000);
  }

  const productsList = page.locator(
    '.product-item, [data-testid="product"], table tbody tr, [role="row"]'
  );

  const productCount = await productsList.count();
  console.log(`📊 Found ${productCount} product(s) in dashboard`);

  return productCount;
}

/**
 * Complete WooCommerce setup workflow
 */
export async function completeWooCommerceSetup(page: Page) {
  await mockWooCommerceConfigureAPI(page);
  await fillWooCommerceCredentials(page);
  await testConnection(page);
  await saveConfiguration(page);
  await mockWooCommerceProductsAPI(page, TEST_WOOCOMMERCE.storeUrl);
  await syncProducts(page);
  await viewSyncedProducts(page);
}
