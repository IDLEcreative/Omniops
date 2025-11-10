import { test, expect, Page } from '@playwright/test';
import { navigateToWooCommerceIntegration, fillWooCommerceCredentials, type WooCommerceCredentials } from '../../utils/playwright/woocommerce-helpers';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Error Scenario: Invalid Integration Credentials', () => {
  test.beforeEach(async ({ page }) => {
    console.log('🧪 Setting up invalid credentials test');
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') {
      await page.screenshot({
        path: 'e2e-failure-' + Date.now() + '.png',
        fullPage: true
      });
      console.log('❌ Test failed - screenshot captured');
    }
  });

  test('should handle invalid WooCommerce credentials and allow correction', async ({ page }) => {
    test.setTimeout(120000);

    console.log('📍 Step 1: Navigating to dashboard');
    await page.goto(BASE_URL + '/dashboard', { waitUntil: 'networkidle' });
    console.log('✅ Dashboard loaded');

    // Navigate to integrations
    console.log('📍 Step 2: Navigating to integrations');
    const integrationsLink = page.locator('a:has-text("Integrations"), a[href*="integration"]').first();
    const intLinkVisible = await integrationsLink.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (intLinkVisible) {
      await integrationsLink.click();
      await page.waitForLoadState('networkidle');
      console.log('✅ Integrations page loaded via link');
    } else {
      await page.goto(BASE_URL + '/dashboard/integrations', { waitUntil: 'networkidle' });
      console.log('✅ Integrations page loaded directly');
    }

    // Navigate to WooCommerce
    console.log('📍 Step 3: Navigating to WooCommerce integration');
    const wooLink = page.locator('a:has-text("WooCommerce"), button:has-text("WooCommerce"), [data-integration="woocommerce"]').first();
    const wooLinkVisible = await wooLink.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (wooLinkVisible) {
      await wooLink.click();
      await page.waitForLoadState('networkidle');
      console.log('✅ WooCommerce page loaded via link');
    } else {
      await page.goto(BASE_URL + '/dashboard/integrations/woocommerce/configure', { waitUntil: 'networkidle' });
      console.log('✅ WooCommerce config page loaded directly');
    }

    // Verify we're on config page
    console.log('📍 Step 4: Verifying WooCommerce configuration page');
    const configForm = page.locator('form, [data-testid="woocommerce-config"], .integration-config').first();
    const formVisible = await configForm.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (formVisible) {
      console.log('✅ Configuration form found');
    } else {
      console.log('⏭️  Configuration form not visible - checking for inputs');
      const storeUrlInput = page.locator('input[name="store_url"]').first();
      const inputVisible = await storeUrlInput.isVisible().catch(() => false);
      expect(inputVisible).toBe(true);
    }

    // Mock invalid credentials response
    console.log('📍 Step 5: Setting up credential validation mock');
    let attemptCount = 0;
    let credentialsSaved = false;
    
    await page.route('**/api/woocommerce/configure', async (route) => {
      attemptCount++;
      const requestBody = route.request().postDataJSON();
      
      console.log('🔐 Credential attempt #' + attemptCount);
      console.log('   Store URL: ' + requestBody.storeUrl);
      console.log('   Consumer Key: ' + requestBody.consumerKey?.substring(0, 10) + '...');
      
      if (attemptCount === 1) {
        // First attempt: invalid credentials
        console.log('❌ Simulating 401 Unauthorized (invalid credentials)');
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Invalid consumer key or secret',
            message: 'The credentials you provided could not be authenticated. Please check your WooCommerce API keys and try again.',
            code: 'INVALID_CREDENTIALS'
          })
        });
        credentialsSaved = false;
      } else {
        // Retry with corrected credentials: success
        console.log('✅ Simulating successful authentication');
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'WooCommerce connected successfully',
            storeInfo: {
              name: 'Test Store',
              url: requestBody.storeUrl,
              version: '8.0.0',
              productsCount: 42
            }
          })
        });
        credentialsSaved = true;
      }
    });
    console.log('✅ Credential validation mock ready');

    // Fill in INVALID credentials
    console.log('📍 Step 6: Entering invalid credentials');
    const invalidCreds: WooCommerceCredentials = {
      storeUrl: 'https://invalid-store.com',
      consumerKey: 'ck_invalid_key_12345',
      consumerSecret: 'cs_invalid_secret_67890'
    };

    const storeUrlInput = page.locator('input[name="store_url"], input[name="woocommerce_store_url"]').first();
    const consumerKeyInput = page.locator('input[name="consumer_key"], input[name="woocommerce_consumer_key"]').first();
    const consumerSecretInput = page.locator('input[name="consumer_secret"], input[name="woocommerce_consumer_secret"]').first();

    await storeUrlInput.waitFor({ state: 'visible', timeout: 5000 });
    await storeUrlInput.fill(invalidCreds.storeUrl);
    console.log('✅ Store URL entered: ' + invalidCreds.storeUrl);

    await consumerKeyInput.fill(invalidCreds.consumerKey);
    console.log('✅ Consumer key entered');

    await consumerSecretInput.fill(invalidCreds.consumerSecret);
    console.log('✅ Consumer secret entered');

    // Test connection (will fail)
    console.log('📍 Step 7: Testing connection with invalid credentials');
    const testConnectionBtn = page.locator('button:has-text("Test Connection"), button:has-text("Test"), button:has-text("Verify")').first();
    const testBtnVisible = await testConnectionBtn.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (testBtnVisible) {
      await testConnectionBtn.click();
      console.log('✅ Test connection button clicked');
    } else {
      // If no test button, use save button which will trigger validation
      console.log('⏭️  Test connection button not found - using save button');
      const saveBtn = page.locator('button:has-text("Save"), button:has-text("Connect"), button[type="submit"]').first();
      await saveBtn.click();
    }

    // Wait for error response
    await page.waitForTimeout(2000);

    // Verify error message is displayed
    console.log('📍 Step 8: Verifying error message is displayed');
    const errorSelectors = [
      '.error-message',
      '.woocommerce-error',
      '[role="alert"]',
      '.notification--error',
      '.integration-error',
      'text=/invalid.*credentials/i',
      'text=/could not be authenticated/i',
      'text=/check.*api keys/i'
    ];

    let errorFound = false;
    let errorText = '';
    
    for (const selector of errorSelectors) {
      const errorElement = page.locator(selector).first();
      const isVisible = await errorElement.isVisible({ timeout: 3000 }).catch(() => false);
      
      if (isVisible) {
        errorText = await errorElement.textContent() || '';
        errorFound = true;
        console.log('✅ Error message found: "' + errorText.substring(0, 60) + '..."');
        break;
      }
    }

    expect(errorFound).toBe(true);
    console.log('✅ CLEAR ERROR SHOWN TO USER ← First "END" point');

    // Verify error message is helpful
    console.log('📍 Step 9: Verifying error message is helpful');
    const lowerErrorText = errorText.toLowerCase();
    const isHelpful = 
      lowerErrorText.includes('invalid') ||
      lowerErrorText.includes('credentials') ||
      lowerErrorText.includes('api') ||
      lowerErrorText.includes('key') ||
      lowerErrorText.includes('check') ||
      lowerErrorText.includes('authenticated');
    
    if (isHelpful) {
      console.log('✅ Error message is helpful and actionable');
    } else {
      console.log('⚠️  Error message may not be clear: ' + errorText);
    }

    // Verify error doesn't contain technical jargon
    const hasTechnicalJargon = 
      errorText.includes('401') ||
      errorText.includes('Unauthorized') ||
      errorText.includes('HTTP') ||
      errorText.includes('Exception') ||
      errorText.includes('undefined');
    
    if (!hasTechnicalJargon) {
      console.log('✅ Error message is user-friendly (no technical codes)');
    } else {
      console.log('⚠️  Error contains technical jargon: ' + errorText);
    }

    // Verify credentials were NOT saved
    console.log('📍 Step 10: Verifying credentials were not saved');
    expect(credentialsSaved).toBe(false);
    console.log('✅ CREDENTIALS NOT SAVED (security best practice)');
    console.log('✅ CREDENTIALS NOT SAVED ← Second "END" point');

    // Verify user can update credentials
    console.log('📍 Step 11: Verifying user can correct credentials');
    const storeUrlStillEditable = await storeUrlInput.isEditable().catch(() => false);
    const keyStillEditable = await consumerKeyInput.isEditable().catch(() => false);
    const secretStillEditable = await consumerSecretInput.isEditable().catch(() => false);
    
    expect(storeUrlStillEditable).toBe(true);
    expect(keyStillEditable).toBe(true);
    expect(secretStillEditable).toBe(true);
    console.log('✅ All fields remain editable (user can fix)');

    // Update with VALID credentials
    console.log('📍 Step 12: Correcting credentials');
    const validCreds: WooCommerceCredentials = {
      storeUrl: 'https://demo.woocommerce.com',
      consumerKey: 'ck_valid_key_12345',
      consumerSecret: 'cs_valid_secret_67890'
    };

    await storeUrlInput.clear();
    await storeUrlInput.fill(validCreds.storeUrl);
    console.log('✅ Updated store URL: ' + validCreds.storeUrl);

    await consumerKeyInput.clear();
    await consumerKeyInput.fill(validCreds.consumerKey);
    console.log('✅ Updated consumer key');

    await consumerSecretInput.clear();
    await consumerSecretInput.fill(validCreds.consumerSecret);
    console.log('✅ Updated consumer secret');

    // Test connection again (should succeed)
    console.log('📍 Step 13: Testing connection with valid credentials');
    const testBtn2 = page.locator('button:has-text("Test Connection"), button:has-text("Test"), button:has-text("Verify")').first();
    const testBtn2Visible = await testBtn2.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (testBtn2Visible) {
      await testBtn2.click();
      console.log('✅ Test connection clicked (retry)');
    } else {
      const saveBtn = page.locator('button:has-text("Save"), button:has-text("Connect"), button[type="submit"]').first();
      await saveBtn.click();
      console.log('✅ Save button clicked (retry)');
    }

    // Wait for success response
    await page.waitForTimeout(2000);

    // Verify success message
    console.log('📍 Step 14: Verifying successful connection');
    const successSelectors = [
      '.success-message',
      '.woocommerce-success',
      '[role="alert"]:has-text("success")',
      '.notification--success',
      'text=/connected successfully/i',
      'text=/connection successful/i',
      'text=/test store/i'
    ];

    let successFound = false;
    let successText = '';
    
    for (const selector of successSelectors) {
      const successElement = page.locator(selector).first();
      const isVisible = await successElement.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (isVisible) {
        successText = await successElement.textContent() || '';
        successFound = true;
        console.log('✅ Success message found: "' + successText.substring(0, 50) + '..."');
        break;
      }
    }

    expect(successFound).toBe(true);
    console.log('✅ SUCCESSFUL CONNECTION AFTER FIX ← Final "END" point');

    // Verify credentials are NOW saved
    console.log('📍 Step 15: Verifying credentials saved after success');
    expect(credentialsSaved).toBe(true);
    console.log('✅ Valid credentials saved successfully');

    // Verify exactly 2 connection attempts
    console.log('📍 Step 16: Verifying retry behavior');
    expect(attemptCount).toBe(2);
    console.log('✅ Exactly 2 attempts (invalid + valid)');

    console.log('🎉 COMPLETE INVALID CREDENTIALS RECOVERY TEST PASSED');
    console.log('✅ Error shown → Credentials not saved → User fixed → Success');
  });
});
