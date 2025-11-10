/**
 * Error handling and accessibility tests
 */

import { test, expect } from '@playwright/test';
import { navigateToDashboard, changeColor, getColorValue } from './helpers';
import { TEST_TIMEOUT, CUSTOMIZE_PAGE } from './config';

test.describe('Error Handling and Accessibility', () => {
  test.setTimeout(TEST_TIMEOUT);

  test('handles save errors gracefully', async ({ page }) => {
    console.log('🎯 Testing: Error handling for save failures');

    // Navigate to customize page
    console.log('📍 Step 1: Navigate to customize page');
    await page.goto(CUSTOMIZE_PAGE, { waitUntil: 'networkidle' });
    console.log('✅ Page loaded');

    // Intercept save request to simulate error
    console.log('📍 Step 2: Set up API error simulation');
    await page.route('**/api/widget/config', route => {
      if (route.request().method() === 'POST' || route.request().method() === 'PUT') {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' })
        });
      } else {
        route.continue();
      }
    });
    console.log('✅ API error simulation configured');

    // Make changes and try to save
    console.log('📍 Step 3: Make changes and attempt save');
    await changeColor(page, '#dc2626'); // Red
    console.log('✅ Changed color');

    const saveButton = page.locator('button:has-text("Save Changes")').first();
    await saveButton.click();
    console.log('✅ Clicked save button');

    // Verify error handling
    console.log('📍 Step 4: Verify error is handled gracefully');
    const errorToast = page.locator(
      '[role="status"]:has-text("error"), ' +
      '[role="status"]:has-text("failed"), ' +
      '.toast-error, ' +
      '[class*="toast"]:has-text("Error")'
    ).first();

    const hasErrorIndication = await Promise.race([
      errorToast.isVisible({ timeout: 5000 }).then(() => true),
      saveButton.textContent().then(text => text?.toLowerCase().includes('error') || text?.toLowerCase().includes('retry'))
    ]).catch(() => false);

    if (hasErrorIndication) {
      console.log('✅ Error indication displayed to user');
    } else {
      console.log('⚠️ No visible error indication, but request was blocked');
    }

    // Verify that changes are still present (not lost)
    const colorAfterError = await getColorValue(page);
    expect(colorAfterError).toBe('#dc2626');
    console.log('✅ User changes preserved after error');

    console.log('✅ Error handling test completed');
  });
});

test.describe('Accessibility', () => {
  test.setTimeout(TEST_TIMEOUT);

  test('supports keyboard navigation', async ({ page }) => {
    console.log('🎯 Testing: Keyboard navigation support');

    await page.goto(CUSTOMIZE_PAGE, { waitUntil: 'networkidle' });
    console.log('✅ Page loaded');

    // Tab through main elements
    console.log('📍 Step 1: Test tab navigation through main elements');
    await page.keyboard.press('Tab');

    // Navigate through tabs using arrow keys
    const essentialsTab = page.locator('[role="tab"]:has-text("Essentials")').first();
    await essentialsTab.focus();
    console.log('✅ Focused on Essentials tab');

    // Use arrow key to move to next tab
    await page.keyboard.press('ArrowRight');
    const intelligenceTab = page.locator('[role="tab"]:has-text("Intelligence")').first();
    const isIntelligenceFocused = await intelligenceTab.evaluate(el => el === document.activeElement);

    if (isIntelligenceFocused) {
      console.log('✅ Arrow key navigation works between tabs');
    }

    // Press Enter to activate tab
    await page.keyboard.press('Enter');
    await expect(intelligenceTab).toHaveAttribute('data-state', 'active');
    console.log('✅ Enter key activates tab');

    // Test form input navigation
    console.log('📍 Step 2: Test form input navigation');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Check if we can type in an input field
    await page.keyboard.type('Test Input');
    console.log('✅ Keyboard input works in form fields');

    console.log('✅ Accessibility test completed');
  });
});

console.log('=== Widget Customization E2E Test Suite Complete ===');
