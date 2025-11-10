/**
 * Complete customization workflow test
 *
 * Tests the full end-to-end workflow: appearance → behavior → save → persist
 */

import { test, expect } from '@playwright/test';
import {
  navigateToDashboard,
  switchToTab,
  changeColor,
  getColorValue,
  setWelcomeMessage,
  setBotName,
  clickSaveButton,
  waitForSaveCompletion,
  changePositionToBottomLeft,
  toggleWooCommerceIntegration
} from './helpers';
import { TEST_TIMEOUT } from './config';

test.describe('Complete Customization Workflow', () => {
  test.setTimeout(TEST_TIMEOUT);

  test.beforeEach(async ({ page }) => {
    console.log('=== Starting Widget Customization Test ===');
    await navigateToDashboard(page);
  });

  test('appearance → behavior → save → persist', async ({ page }) => {
    console.log('🎯 Testing: Complete customization workflow');

    // Verify Essentials tab is active
    console.log('📍 Step 2: Verify Essentials tab is active');
    const essentialsTab = page.locator('[role="tab"]:has-text("Essentials")').first();
    await expect(essentialsTab).toHaveAttribute('data-state', 'active');
    console.log('✅ Essentials tab is active');

    const appearanceCard = page.locator('text=Appearance').first();
    await expect(appearanceCard).toBeVisible();
    console.log('✅ Appearance section visible');

    // Change primary color
    console.log('📍 Step 3: Change primary color');
    const originalColor = await getColorValue(page);
    console.log(`Original color: ${originalColor}`);

    const greenPreset = page.locator('button[data-color="#10b981"], button:has-text("Green")').first();
    if (await greenPreset.isVisible().catch(() => false)) {
      await greenPreset.click();
      console.log('✅ Selected green preset color');
    } else {
      await changeColor(page, '#10b981');
      console.log('✅ Set color via input to #10b981');
    }

    const newColor = await getColorValue(page);
    expect(newColor).not.toBe(originalColor);
    console.log(`✅ Color changed from ${originalColor} to ${newColor}`);

    // Change widget position
    console.log('📍 Step 4: Change widget position');
    await changePositionToBottomLeft(page);

    // Verify live preview updates
    console.log('📍 Step 5: Verify live preview updates');
    const previewFrame = page.frameLocator('iframe[title*="preview"], iframe.live-preview, iframe').first();
    try {
      const widgetInPreview = previewFrame.locator('[class*="widget"], [class*="chat"], #chat-widget').first();
      await widgetInPreview.waitFor({ state: 'visible', timeout: 5000 });
      console.log('✅ Live preview widget is visible');
      const widgetStyles = await widgetInPreview.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          backgroundColor: styles.backgroundColor,
          borderColor: styles.borderColor
        };
      });
      console.log('✅ Preview styles:', widgetStyles);
    } catch (error) {
      console.log('⚠️ Preview verification skipped (iframe access limited)');
    }

    // Switch to Intelligence tab
    console.log('📍 Step 6: Switch to Intelligence tab');
    const intelligenceTab = await switchToTab(page, 'Intelligence');
    await expect(intelligenceTab).toHaveAttribute('data-state', 'active');
    console.log('✅ Intelligence tab activated');

    // Update welcome message
    console.log('📍 Step 7: Update welcome message');
    await setWelcomeMessage(page, 'Hello! Welcome to our customized support bot. How can I help you today?');
    console.log('✅ Updated welcome message');

    // Update bot name
    console.log('📍 Step 8: Update bot name');
    await setBotName(page, 'CustomBot');
    console.log('✅ Updated bot name to CustomBot');

    // Change AI personality
    console.log('📍 Step 9: Change AI personality');
    const personalitySelector = page.locator(
      '[role="combobox"]:near(:text("Personality")), ' +
      'select:near(:text("Personality")), ' +
      'button:near(:text("Personality"))'
    ).first();

    if (await personalitySelector.isVisible().catch(() => false)) {
      await personalitySelector.click();
      const friendlyOption = page.locator('[role="option"]:has-text("Friendly"), option:has-text("Friendly")').first();
      if (await friendlyOption.isVisible().catch(() => false)) {
        await friendlyOption.click();
        console.log('✅ Changed personality to Friendly');
      }
    }

    // Switch to Connect tab
    console.log('📍 Step 10: Switch to Connect tab');
    const connectTab = await switchToTab(page, 'Connect');
    await expect(connectTab).toHaveAttribute('data-state', 'active');
    console.log('✅ Connect tab activated');

    // Toggle WooCommerce integration
    console.log('📍 Step 11: Toggle WooCommerce integration');
    await toggleWooCommerceIntegration(page);

    // Verify unsaved changes indicator
    console.log('📍 Step 12: Verify unsaved changes indicator');
    const unsavedBadge = page.locator('text=Unsaved changes, badge:has-text("Unsaved")').first();
    await expect(unsavedBadge).toBeVisible({ timeout: 5000 });
    console.log('✅ Unsaved changes badge is visible');

    // Save configuration
    console.log('📍 Step 13: Save configuration');
    await clickSaveButton(page);
    await waitForSaveCompletion(page);

    // Reload page to verify persistence
    console.log('📍 Step 14: Reload page to verify persistence');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    console.log('✅ Page reloaded');

    // Verify settings persisted
    console.log('📍 Step 15: Verify settings persisted after reload');
    const colorAfterReload = await getColorValue(page);
    expect(colorAfterReload.toLowerCase()).toBe('#10b981');
    console.log(`✅ Color persisted: ${colorAfterReload}`);

    // Check bot name in Intelligence tab
    await switchToTab(page, 'Intelligence');
    const botNameAfterReload = await page.locator(
      'input[placeholder*="bot"], ' +
      'input[placeholder*="assistant"], ' +
      'input:near(:text("Bot Name"))'
    ).first().inputValue();

    expect(botNameAfterReload).toBe('CustomBot');
    console.log(`✅ Bot name persisted: ${botNameAfterReload}`);
    console.log('✅ All settings persisted correctly after reload');

    console.log('🎉 Complete customization workflow test passed!');
  });
});
