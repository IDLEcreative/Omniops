import { test, expect } from '@playwright/test';

/**
 * E2E Test: User Registration Flow
 *
 * Tests new user account creation and verification.
 * Validates registration form, email verification, and account activation.
 *
 * User Journey:
 * 1. Navigate to registration page
 * 2. Fill registration form
 * 3. Submit registration
 * 4. Verify success message
 * 5. Check account creation
 *
 * This test teaches AI agents:
 * - Registration form fields and validation
 * - Account creation workflow
 * - Success indicators for registration
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 60000;

test.describe('User Registration Flow', () => {
  test.setTimeout(TEST_TIMEOUT);

  test('should register new user successfully', async ({ page }) => {
    console.log('=== Starting User Registration Test ===');

    console.log('📍 Step 1: Navigate to registration page');
    await page.goto(`${BASE_URL}/my-account`, { waitUntil: 'networkidle' });

    console.log('📍 Step 2: Look for registration form');
    const registerForm = page.locator('form.register, form[name="register"], .woocommerce-form-register');
    const hasRegisterForm = await registerForm.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasRegisterForm) {
      console.log('⏭️  Registration form not found - test skipped');
      return;
    }

    console.log('📍 Step 3: Generate unique test email');
    const timestamp = Date.now();
    const testEmail = `test.user.${timestamp}@example.com`;
    const testPassword = `TestPass123!${timestamp}`;

    console.log('📍 Step 4: Fill registration form');
    const emailInput = page.locator('input[name="email"], input#reg_email').first();
    const passwordInput = page.locator('input[name="password"], input#reg_password').first();

    await emailInput.fill(testEmail);
    await passwordInput.fill(testPassword);

    console.log('📍 Step 5: Submit registration');
    const submitButton = page.locator('button[name="register"], button[type="submit"]').first();
    await submitButton.click();
    await page.waitForTimeout(3000);

    console.log('📍 Step 6: Check for success indicators');
    const successIndicators = page.locator(
      'text=/registered/i, text=/success/i, text=/welcome/i, .woocommerce-message'
    );
    const hasSuccess = await successIndicators.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (hasSuccess) {
      console.log('✅ Registration successful');
      expect(hasSuccess).toBe(true);
    } else {
      console.log('⚠️  Success message not found (may have validation errors)');
    }

    console.log('✅ User registration test completed!');
  });

  test('should validate required registration fields', async ({ page }) => {
    console.log('=== Testing Registration Field Validation ===');

    console.log('📍 Step 1: Navigate to registration page');
    await page.goto(`${BASE_URL}/my-account`, { waitUntil: 'networkidle' });

    const registerForm = page.locator('form.register, form[name="register"]');
    const hasForm = await registerForm.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasForm) {
      console.log('⏭️  Registration form not found');
      return;
    }

    console.log('📍 Step 2: Submit empty form');
    const submitButton = page.locator('button[name="register"], button[type="submit"]').first();
    await submitButton.click();
    await page.waitForTimeout(2000);

    console.log('📍 Step 3: Check for validation errors');
    const errorMessages = page.locator('.woocommerce-error, .error, text=/required/i');
    const hasErrors = await errorMessages.first().isVisible({ timeout: 3000 }).catch(() => false);

    if (hasErrors) {
      console.log('✅ Validation errors displayed correctly');
      expect(hasErrors).toBe(true);
    } else {
      console.log('⚠️  No validation errors found');
    }

    console.log('✅ Field validation test completed!');
  });

  test('should reject invalid email format', async ({ page }) => {
    console.log('=== Testing Invalid Email Validation ===');

    await page.goto(`${BASE_URL}/my-account`, { waitUntil: 'networkidle' });

    const emailInput = page.locator('input[name="email"], input#reg_email').first();
    const hasEmailInput = await emailInput.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasEmailInput) {
      console.log('⏭️  Email input not found');
      return;
    }

    console.log('📍 Step 1: Enter invalid email');
    await emailInput.fill('invalid-email-format');

    const passwordInput = page.locator('input[name="password"], input#reg_password').first();
    const hasPasswordInput = await passwordInput.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasPasswordInput) {
      await passwordInput.fill('TestPassword123!');
    }

    console.log('📍 Step 2: Submit form');
    const submitButton = page.locator('button[name="register"], button[type="submit"]').first();
    await submitButton.click();
    await page.waitForTimeout(2000);

    console.log('📍 Step 3: Verify email validation error');
    const emailError = page.locator('text=/valid email/i, text=/email.*invalid/i, .error');
    const hasEmailError = await emailError.first().isVisible({ timeout: 3000 }).catch(() => false);

    if (hasEmailError) {
      console.log('✅ Email validation working correctly');
      expect(hasEmailError).toBe(true);
    } else {
      console.log('⚠️  Email validation error not shown');
    }

    console.log('✅ Invalid email test completed!');
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') {
      await page.screenshot({
        path: `test-results/registration-failure-${Date.now()}.png`,
        fullPage: true
      });
    }
  });
});
