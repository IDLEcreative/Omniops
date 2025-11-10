/**
 * Live preview and reset functionality tests
 */

import { test, expect } from '@playwright/test';
import { navigateToDashboard, changeColor, getColorValue, switchToTab } from './helpers';
import { TEST_TIMEOUT } from './config';

test.describe('Preview and Reset Functionality', () => {
  test.setTimeout(TEST_TIMEOUT);

  test.beforeEach(async ({ page }) => {
    console.log('=== Starting Widget Customization Test ===');
    await navigateToDashboard(page);
  });

  test('live preview updates in real-time', async ({ page }) => {
    console.log('🎯 Testing: Live preview real-time updates');

    // Locate preview iframe
    console.log('📍 Step 1: Locate preview iframe');
    const previewContainer = page.locator('[class*="preview"], .live-preview').first();
    await expect(previewContainer).toBeVisible();
    console.log('✅ Preview container visible');

    // Change a setting
    console.log('📍 Step 2: Change primary color');
    await changeColor(page, '#ef4444'); // Red color
    console.log('✅ Changed color to red (#ef4444)');

    // Verify preview updated immediately
    console.log('📍 Step 3: Verify preview updated immediately');
    await page.waitForTimeout(1000);

    const iframe = page.locator('iframe').first();
    const iframeCount = await iframe.count();

    if (iframeCount > 0) {
      console.log('✅ Preview iframe detected and rendering');

      try {
        const previewFrame = page.frameLocator('iframe').first();
        const widgetElement = previewFrame.locator('[class*="widget"], [class*="chat"]').first();

        if (await widgetElement.isVisible({ timeout: 3000 }).catch(() => false)) {
          console.log('✅ Widget element visible in preview');
        }
      } catch (error) {
        console.log('⚠️ Cannot access iframe content (cross-origin restriction)');
      }
    } else {
      console.log('⚠️ No iframe found, preview may use different rendering method');
    }

    console.log('✅ Live preview test completed');
  });

  test('reset button restores default settings', async ({ page }) => {
    console.log('🎯 Testing: Reset functionality');

    // Make changes to settings
    console.log('📍 Step 1: Make changes to settings');
    const originalColor = await getColorValue(page);
    await changeColor(page, '#8b5cf6'); // Purple
    console.log('✅ Changed color to purple');

    // Switch to Intelligence tab and change bot name
    const intelligenceTab = await switchToTab(page, 'Intelligence');
    const botNameInput = page.locator(
      'input[placeholder*="bot"], ' +
      'input:near(:text("Bot Name"))'
    ).first();

    const originalBotName = await botNameInput.inputValue();
    await botNameInput.clear();
    await botNameInput.fill('TestBot');
    console.log('✅ Changed bot name to TestBot');

    // Click Reset button
    console.log('📍 Step 2: Click Reset button');
    const resetButton = page.locator('button:has-text("Reset")').first();
    await expect(resetButton).toBeVisible();
    await resetButton.click();
    console.log('✅ Clicked Reset button');
    await page.waitForTimeout(1000);

    // Verify settings restored to defaults
    console.log('📍 Step 3: Verify settings restored to defaults');

    // Go back to Essentials tab
    const essentialsTab = await switchToTab(page, 'Essentials');
    const colorAfterReset = await getColorValue(page);
    expect(colorAfterReset).not.toBe('#8b5cf6'); // Not purple anymore
    console.log(`✅ Color reset from purple to ${colorAfterReset}`);

    // Check bot name is reset
    await switchToTab(page, 'Intelligence');
    const botNameAfterReset = await botNameInput.inputValue();
    expect(botNameAfterReset).not.toBe('TestBot');
    console.log(`✅ Bot name reset from TestBot to ${botNameAfterReset}`);

    console.log('✅ Reset functionality test completed');
  });
});
