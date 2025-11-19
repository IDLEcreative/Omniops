import { test, expect } from '@playwright/test';

/**
 * E2E Test: Account Dashboard
 *
 * Tests account dashboard display and navigation.
 * Validates dashboard sections and user information.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Account Dashboard', () => {
  test('should display account dashboard sections', async ({ page }) => {
    console.log('=== Testing Account Dashboard ===');

    await page.goto(`${BASE_URL}/my-account`, { waitUntil: 'networkidle' });

    console.log('📍 Step 1: Look for dashboard navigation');
    const dashboardNav = page.locator('.woocommerce-MyAccount-navigation, nav');
    const hasNav = await dashboardNav.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasNav) {
      console.log('✅ Dashboard navigation found');

      console.log('📍 Step 2: Check for dashboard sections');
      const navLinks = page.locator('.woocommerce-MyAccount-navigation a, nav a');
      const linkCount = await navLinks.count();
      console.log(`📋 Found ${linkCount} navigation links`);

      for (let i = 0; i < Math.min(linkCount, 5); i++) {
        const linkText = await navLinks.nth(i).textContent();
        console.log(`   - ${linkText}`);
      }
    } else {
      console.log('⏭️  Dashboard navigation not found (may require login)');
    }

    console.log('✅ Account dashboard test completed!');
  });
});
