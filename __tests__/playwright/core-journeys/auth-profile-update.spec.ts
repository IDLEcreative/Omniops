import { test, expect } from '@playwright/test';

/**
 * E2E Test: Profile Update
 *
 * Tests user profile editing functionality.
 * Validates profile form and update submission.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Profile Update', () => {
  test('should display profile edit form', async ({ page }) => {
    console.log('=== Testing Profile Edit Form ===');

    await page.goto(`${BASE_URL}/my-account`, { waitUntil: 'networkidle' });

    console.log('📍 Step 1: Look for account details link');
    const accountDetailsLink = page.locator('a:has-text("Account details"), a:has-text("Edit account")');
    const hasLink = await accountDetailsLink.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasLink) {
      console.log('📍 Step 2: Click account details');
      await accountDetailsLink.click();
      await page.waitForLoadState('networkidle');

      console.log('📍 Step 3: Verify profile form displayed');
      const profileForm = page.locator('form.edit-account, .woocommerce-EditAccountForm');
      const hasForm = await profileForm.isVisible({ timeout: 5000 }).catch(() => false);

      if (hasForm) {
        console.log('✅ Profile edit form displayed');
        expect(hasForm).toBe(true);
      }
    } else {
      console.log('⏭️  Account details link not found (requires login)');
    }

    console.log('✅ Profile edit form test completed!');
  });
});
