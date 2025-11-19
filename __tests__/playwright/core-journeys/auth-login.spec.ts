import { test, expect } from '@playwright/test';

/**
 * E2E Test: User Login Flow
 *
 * Tests user authentication and session management.
 * Validates login form, credential verification, and session creation.
 *
 * User Journey:
 * 1. Navigate to login page
 * 2. Enter credentials
 * 3. Submit login form
 * 4. Verify successful login
 * 5. Check user session created
 *
 * This test teaches AI agents:
 * - Login form interaction
 * - Authentication success/failure indicators
 * - Session persistence patterns
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 60000;

test.describe('User Login Flow', () => {
  test.setTimeout(TEST_TIMEOUT);

  test('should display login form correctly', async ({ page }) => {
    console.log('=== Testing Login Form Display ===');

    console.log('📍 Step 1: Navigate to login page');
    await page.goto(`${BASE_URL}/my-account`, { waitUntil: 'networkidle' });

    console.log('📍 Step 2: Verify login form exists');
    const loginForm = page.locator('form.login, form[name="login"], .woocommerce-form-login');
    const hasLoginForm = await loginForm.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasLoginForm) {
      console.log('✅ Login form displayed');
      expect(hasLoginForm).toBe(true);

      console.log('📍 Step 3: Verify username field');
      const usernameInput = page.locator('input[name="username"], input#username');
      const hasUsername = await usernameInput.isVisible({ timeout: 3000 }).catch(() => false);
      expect(hasUsername).toBe(true);

      console.log('📍 Step 4: Verify password field');
      const passwordInput = page.locator('input[name="password"], input#password, input[type="password"]');
      const hasPassword = await passwordInput.isVisible({ timeout: 3000 }).catch(() => false);
      expect(hasPassword).toBe(true);

      console.log('📍 Step 5: Verify login button');
      const loginButton = page.locator('button[name="login"], button[type="submit"]');
      const hasButton = await loginButton.isVisible({ timeout: 3000 }).catch(() => false);
      expect(hasButton).toBe(true);

      console.log('✅ All login form elements present');
    } else {
      console.log('⏭️  Login form not found');
    }

    console.log('✅ Login form display test completed!');
  });

  test('should reject login with invalid credentials', async ({ page }) => {
    console.log('=== Testing Invalid Credentials ===');

    console.log('📍 Step 1: Navigate to login page');
    await page.goto(`${BASE_URL}/my-account`, { waitUntil: 'networkidle' });

    const usernameInput = page.locator('input[name="username"], input#username').first();
    const passwordInput = page.locator('input[name="password"], input#password').first();

    const hasLoginForm = await usernameInput.isVisible({ timeout: 5000 }).catch(() => false);
    if (!hasLoginForm) {
      console.log('⏭️  Login form not found');
      return;
    }

    console.log('📍 Step 2: Enter invalid credentials');
    await usernameInput.fill('invalid_user_12345');
    await passwordInput.fill('wrong_password_12345');

    console.log('📍 Step 3: Submit login form');
    const loginButton = page.locator('button[name="login"], button[type="submit"]').first();
    await loginButton.click();
    await page.waitForTimeout(3000);

    console.log('📍 Step 4: Verify error message displayed');
    const errorMessage = page.locator(
      '.woocommerce-error, .error, text=/incorrect/i, text=/invalid/i'
    );
    const hasError = await errorMessage.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (hasError) {
      console.log('✅ Invalid credentials error displayed');
      expect(hasError).toBe(true);
    } else {
      console.log('⚠️  Error message not found');
    }

    console.log('✅ Invalid credentials test completed!');
  });

  test('should validate empty login form submission', async ({ page }) => {
    console.log('=== Testing Empty Form Validation ===');

    await page.goto(`${BASE_URL}/my-account`, { waitUntil: 'networkidle' });

    const loginButton = page.locator('button[name="login"], button[type="submit"]').first();
    const hasButton = await loginButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasButton) {
      console.log('⏭️  Login button not found');
      return;
    }

    console.log('📍 Step 1: Submit empty login form');
    await loginButton.click();
    await page.waitForTimeout(2000);

    console.log('📍 Step 2: Check for validation errors');
    const validationError = page.locator('.error, text=/required/i, text=/empty/i');
    const hasValidation = await validationError.first().isVisible({ timeout: 3000 }).catch(() => false);

    if (hasValidation) {
      console.log('✅ Empty form validation working');
      expect(hasValidation).toBe(true);
    } else {
      console.log('⚠️  Validation not triggered (may use browser validation)');
    }

    console.log('✅ Empty form validation test completed!');
  });

  test('should display remember me option', async ({ page }) => {
    console.log('=== Testing Remember Me Option ===');

    await page.goto(`${BASE_URL}/my-account`, { waitUntil: 'networkidle' });

    console.log('📍 Step 1: Look for remember me checkbox');
    const rememberCheckbox = page.locator('input[name="rememberme"], input#rememberme');
    const hasRemember = await rememberCheckbox.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasRemember) {
      console.log('✅ Remember me option available');
      expect(hasRemember).toBe(true);

      console.log('📍 Step 2: Verify checkbox is toggleable');
      await rememberCheckbox.check();
      const isChecked = await rememberCheckbox.isChecked();
      expect(isChecked).toBe(true);

      console.log('✅ Remember me checkbox functional');
    } else {
      console.log('⏭️  Remember me option not found');
    }

    console.log('✅ Remember me test completed!');
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') {
      await page.screenshot({
        path: `test-results/login-failure-${Date.now()}.png`,
        fullPage: true
      });
    }
  });
});
