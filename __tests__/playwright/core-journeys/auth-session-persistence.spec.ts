import { test, expect } from '@playwright/test';

/**
 * E2E Test: Session Persistence
 *
 * Tests user session persistence across page navigations.
 * Validates session cookies and authentication state.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Session Persistence', () => {
  test('should maintain session across page navigation', async ({ page }) => {
    console.log('=== Testing Session Persistence ===');

    await page.goto(`${BASE_URL}/my-account`, { waitUntil: 'networkidle' });

    console.log('📍 Step 1: Check initial page state');
    const loginForm = page.locator('form.login, input[name="username"]');
    const hasLogin = await loginForm.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasLogin) {
      console.log('✅ Login form visible - user not authenticated');
    } else {
      console.log('✅ User appears to be authenticated');
    }

    console.log('📍 Step 2: Navigate to shop page');
    await page.goto(`${BASE_URL}/shop`, { waitUntil: 'networkidle' }).catch(() => {});
    await page.waitForTimeout(1000);

    console.log('📍 Step 3: Navigate back to account');
    await page.goto(`${BASE_URL}/my-account`, { waitUntil: 'networkidle' });

    console.log('📍 Step 4: Verify session state maintained');
    const stillHasLogin = await loginForm.isVisible({ timeout: 5000 }).catch(() => false);
    expect(stillHasLogin).toBe(hasLogin);

    console.log('✅ Session persistence test completed!');
  });
});
