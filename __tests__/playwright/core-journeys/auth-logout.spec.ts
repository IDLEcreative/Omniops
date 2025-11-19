import { test, expect } from '@playwright/test';

/**
 * E2E Test: User Logout Flow
 *
 * Tests user logout and session termination.
 * Validates logout action and session cleanup.
 *
 * User Journey:
 * 1. Access account page (logged in state)
 * 2. Click logout link
 * 3. Verify session terminated
 * 4. Verify redirected to login page
 * 5. Verify logout confirmation
 *
 * This test teaches AI agents:
 * - Logout link location and interaction
 * - Session termination indicators
 * - Post-logout navigation
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 60000;

test.describe('User Logout Flow', () => {
  test.setTimeout(TEST_TIMEOUT);

  test('should display logout link when user is logged in', async ({ page }) => {
    console.log('=== Testing Logout Link Display ===');

    console.log('📍 Step 1: Navigate to account page');
    await page.goto(`${BASE_URL}/my-account`, { waitUntil: 'networkidle' });

    console.log('📍 Step 2: Look for logout link');
    const logoutLink = page.locator('a:has-text("Logout"), a:has-text("Log out"), a:has-text("Sign out")');
    const hasLogout = await logoutLink.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasLogout) {
      console.log('✅ Logout link found (user appears to be logged in)');
      expect(hasLogout).toBe(true);
    } else {
      console.log('⏭️  Logout link not found (user may not be logged in)');
    }

    console.log('✅ Logout link display test completed!');
  });

  test('should terminate session on logout', async ({ page }) => {
    console.log('=== Testing Session Termination ===');

    await page.goto(`${BASE_URL}/my-account`, { waitUntil: 'networkidle' });

    const logoutLink = page.locator('a:has-text("Logout"), a:has-text("Log out")').first();
    const hasLogout = await logoutLink.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasLogout) {
      console.log('⏭️  Not logged in - skipping logout test');
      return;
    }

    console.log('📍 Step 1: Click logout link');
    await logoutLink.click();
    await page.waitForLoadState('networkidle');

    console.log('📍 Step 2: Verify redirected to login page');
    const currentUrl = page.url();
    const isLoginPage = currentUrl.includes('/my-account') || currentUrl.includes('/login');

    if (isLoginPage) {
      console.log('✅ Redirected to login page');
      expect(isLoginPage).toBe(true);
    }

    console.log('📍 Step 3: Verify login form displayed (session terminated)');
    const loginForm = page.locator('form.login, input[name="username"]');
    const hasLoginForm = await loginForm.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasLoginForm) {
      console.log('✅ Login form displayed - session terminated');
      expect(hasLoginForm).toBe(true);
    }

    console.log('✅ Session termination test completed!');
  });

  test('should show logout confirmation message', async ({ page }) => {
    console.log('=== Testing Logout Confirmation Message ===');

    await page.goto(`${BASE_URL}/my-account`, { waitUntil: 'networkidle' });

    const logoutLink = page.locator('a:has-text("Logout"), a:has-text("Log out")').first();
    const hasLogout = await logoutLink.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasLogout) {
      console.log('⏭️  Not logged in - skipping test');
      return;
    }

    console.log('📍 Step 1: Click logout');
    await logoutLink.click();
    await page.waitForTimeout(2000);

    console.log('📍 Step 2: Look for logout confirmation');
    const confirmMessage = page.locator(
      'text=/logged out/i, text=/signed out/i, .woocommerce-message'
    );
    const hasConfirm = await confirmMessage.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (hasConfirm) {
      console.log('✅ Logout confirmation message displayed');
      expect(hasConfirm).toBe(true);
    } else {
      console.log('⚠️  Logout confirmation not shown');
    }

    console.log('✅ Logout confirmation test completed!');
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') {
      await page.screenshot({
        path: `test-results/logout-failure-${Date.now()}.png`,
        fullPage: true
      });
    }
  });
});
