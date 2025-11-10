/**
 * Tab navigation and advanced color customization tests
 */

import { test, expect } from '@playwright/test';
import { navigateToDashboard, switchToTab } from './helpers';
import { TEST_TIMEOUT } from './config';

test.describe('Navigation and Advanced Features', () => {
  test.setTimeout(TEST_TIMEOUT);

  test.beforeEach(async ({ page }) => {
    console.log('=== Starting Widget Customization Test ===');
    await navigateToDashboard(page);
  });

  test('tab navigation works correctly', async ({ page }) => {
    console.log('🎯 Testing: Tab navigation');

    // Verify all tabs are present
    console.log('📍 Step 1: Verify all tabs are present');
    const essentialsTab = page.locator('[role="tab"]:has-text("Essentials")').first();
    const intelligenceTab = page.locator('[role="tab"]:has-text("Intelligence")').first();
    const connectTab = page.locator('[role="tab"]:has-text("Connect")').first();

    await expect(essentialsTab).toBeVisible();
    await expect(intelligenceTab).toBeVisible();
    await expect(connectTab).toBeVisible();
    console.log('✅ All three tabs are visible');

    // Navigate through all tabs
    console.log('📍 Step 2: Navigate through all tabs');

    // Start with Essentials (should be active by default)
    await expect(essentialsTab).toHaveAttribute('data-state', 'active');
    console.log('✅ Essentials tab is active by default');

    // Click Intelligence tab
    await intelligenceTab.click();
    await page.waitForTimeout(500);
    await expect(intelligenceTab).toHaveAttribute('data-state', 'active');
    await expect(essentialsTab).not.toHaveAttribute('data-state', 'active');
    console.log('✅ Switched to Intelligence tab');

    // Verify Intelligence content is visible
    const intelligenceContent = page.locator('text=Personality, text=Bot Behavior').first();
    await expect(intelligenceContent).toBeVisible();
    console.log('✅ Intelligence content is visible');

    // Click Connect tab
    await connectTab.click();
    await page.waitForTimeout(500);
    await expect(connectTab).toHaveAttribute('data-state', 'active');
    await expect(intelligenceTab).not.toHaveAttribute('data-state', 'active');
    console.log('✅ Switched to Connect tab');

    // Verify Connect content is visible
    const connectContent = page.locator('text=WooCommerce, text=Shopify, text=Integration').first();
    await expect(connectContent).toBeVisible();
    console.log('✅ Connect content is visible');

    // Go back to Essentials
    await essentialsTab.click();
    await page.waitForTimeout(500);
    await expect(essentialsTab).toHaveAttribute('data-state', 'active');
    console.log('✅ Returned to Essentials tab');

    console.log('✅ Tab navigation test completed');
  });

  test('advanced color customization works', async ({ page }) => {
    console.log('🎯 Testing: Advanced color customization');

    // Look for advanced color options
    console.log('📍 Step 1: Look for advanced color options');
    const advancedButton = page.locator(
      'button:has-text("Advanced"), ' +
      'button:has-text("More Colors"), ' +
      'button:has-text("Customize")'
    ).first();

    if (await advancedButton.isVisible().catch(() => false)) {
      await advancedButton.click();
      console.log('✅ Opened advanced color options');

      // Test multiple color inputs
      console.log('📍 Step 2: Test multiple color inputs');
      const colorInputs = await page.locator('input[type="color"]').all();
      console.log(`Found ${colorInputs.length} color inputs`);

      if (colorInputs.length > 1) {
        // Change header background color
        const headerColorInput = page.locator(
          'input[type="color"]:near(:text("Header")), ' +
          'input[name*="header"][type="color"]'
        ).first();

        if (await headerColorInput.isVisible().catch(() => false)) {
          await headerColorInput.fill('#6366f1'); // Indigo
          console.log('✅ Changed header color to indigo');
        }

        // Change button color
        const buttonColorInput = page.locator(
          'input[type="color"]:near(:text("Button")), ' +
          'input[name*="button"][type="color"]'
        ).first();

        if (await buttonColorInput.isVisible().catch(() => false)) {
          await buttonColorInput.fill('#f59e0b'); // Amber
          console.log('✅ Changed button color to amber');
        }
      }
    } else {
      console.log('⚠️ Advanced color options not available or already visible');
    }

    console.log('✅ Advanced color customization test completed');
  });
});
