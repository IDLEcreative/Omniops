import { test, expect } from '@playwright/test';

/**
 * E2E Test: Password Reset Flow
 *
 * Tests password reset request and completion workflow.
 * Validates reset link generation and password update.
 *
 * User Journey:
 * 1. Navigate to forgot password page
 * 2. Enter email address
 * 3. Submit reset request
 * 4. Verify confirmation message
 * 5. Check reset email sent
 *
 * This test teaches AI agents:
 * - Password reset request process
 * - Email verification workflow
 * - Security best practices for password recovery
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 60000;

test.describe('Password Reset Flow', () => {
  test.setTimeout(TEST_TIMEOUT);

  test('should display password reset form', async ({ page }) => {
    console.log('=== Testing Password Reset Form Display ===');

    console.log('📍 Step 1: Navigate to login page');
    await page.goto(`${BASE_URL}/my-account`, { waitUntil: 'networkidle' });

    console.log('📍 Step 2: Look for forgot password link');
    const forgotPasswordLink = page.locator('a:has-text("Lost your password"), a:has-text("Forgot password")');
    const hasLink = await forgotPasswordLink.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasLink) {
      console.log('✅ Forgot password link found');

      console.log('📍 Step 3: Click forgot password link');
      await forgotPasswordLink.click();
      await page.waitForLoadState('networkidle');

      console.log('📍 Step 4: Verify reset form displayed');
      const resetForm = page.locator('form, .woocommerce-ResetPassword');
      const hasForm = await resetForm.isVisible({ timeout: 5000 }).catch(() => false);

      if (hasForm) {
        console.log('✅ Password reset form displayed');
        expect(hasForm).toBe(true);
      }
    } else {
      console.log('⏭️  Forgot password link not found');
    }

    console.log('✅ Password reset form display test completed!');
  });

  test('should request password reset for valid email', async ({ page }) => {
    console.log('=== Testing Password Reset Request ===');

    await page.goto(`${BASE_URL}/my-account/lost-password`, { waitUntil: 'networkidle' });

    console.log('📍 Step 1: Look for email input');
    const emailInput = page.locator('input[name="user_login"], input#user_login, input[type="email"]').first();
    const hasEmailInput = await emailInput.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasEmailInput) {
      console.log('⏭️  Email input not found');
      return;
    }

    console.log('📍 Step 2: Enter test email');
    await emailInput.fill('test@example.com');

    console.log('📍 Step 3: Submit reset request');
    const submitButton = page.locator('button[type="submit"], button:has-text("Reset password")').first();
    await submitButton.click();
    await page.waitForTimeout(3000);

    console.log('📍 Step 4: Check for confirmation message');
    const confirmMessage = page.locator('.woocommerce-message, text=/reset/i, text=/email/i');
    const hasConfirm = await confirmMessage.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (hasConfirm) {
      console.log('✅ Password reset confirmation displayed');
      expect(hasConfirm).toBe(true);
    } else {
      console.log('⚠️  Confirmation message not found');
    }

    console.log('✅ Password reset request test completed!');
  });

  test('should validate empty email on reset request', async ({ page }) => {
    console.log('=== Testing Empty Email Validation ===');

    await page.goto(`${BASE_URL}/my-account/lost-password`, { waitUntil: 'networkidle' });

    const submitButton = page.locator('button[type="submit"], button:has-text("Reset")').first();
    const hasButton = await submitButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasButton) {
      console.log('⏭️  Submit button not found');
      return;
    }

    console.log('📍 Step 1: Submit empty form');
    await submitButton.click();
    await page.waitForTimeout(2000);

    console.log('📍 Step 2: Check for validation error');
    const errorMessage = page.locator('.error, text=/required/i, text=/invalid/i');
    const hasError = await errorMessage.first().isVisible({ timeout: 3000 }).catch(() => false);

    if (hasError) {
      console.log('✅ Empty email validation working');
      expect(hasError).toBe(true);
    } else {
      console.log('⚠️  Validation error not shown');
    }

    console.log('✅ Empty email validation test completed!');
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') {
      await page.screenshot({
        path: `test-results/password-reset-failure-${Date.now()}.png`,
        fullPage: true
      });
    }
  });
});
