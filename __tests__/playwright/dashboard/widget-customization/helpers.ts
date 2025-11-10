/**
 * Helper functions for widget customization E2E tests
 */

import { Page } from '@playwright/test';
import { CUSTOMIZE_PAGE } from './config';

export async function navigateToDashboard(page: Page) {
  console.log('📍 Step 1: Navigate to customize dashboard');
  await page.goto(CUSTOMIZE_PAGE, {
    waitUntil: 'networkidle',
    timeout: 30000
  });
  await page.waitForTimeout(1000);
  console.log('✅ Customize dashboard loaded');
}

export async function switchToTab(page: Page, tabName: string) {
  const tab = page.locator(`[role="tab"]:has-text("${tabName}")`).first();
  await tab.click();
  await page.waitForTimeout(500);
  return tab;
}

export async function changeColor(page: Page, colorHex: string) {
  const colorInput = page.locator('input[type="color"]').first();
  await colorInput.fill(colorHex);
  return colorInput;
}

export async function getColorValue(page: Page): Promise<string> {
  const colorInput = page.locator('input[type="color"]').first();
  return await colorInput.inputValue();
}

export async function setBotName(page: Page, name: string) {
  const botNameInput = page.locator(
    'input[placeholder*="bot"], ' +
    'input[placeholder*="assistant"], ' +
    'input:near(:text("Bot Name")), ' +
    'input:near(:text("Assistant Name"))'
  ).first();

  if (await botNameInput.isVisible().catch(() => false)) {
    await botNameInput.clear();
    await botNameInput.fill(name);
    return botNameInput;
  }
  return null;
}

export async function setWelcomeMessage(page: Page, message: string) {
  const welcomeInput = page.locator(
    'textarea[placeholder*="welcome"], ' +
    'input[placeholder*="welcome"], ' +
    'textarea:near(:text("Welcome Message")), ' +
    'input:near(:text("Welcome Message"))'
  ).first();

  if (await welcomeInput.isVisible().catch(() => false)) {
    await welcomeInput.clear();
    await welcomeInput.fill(message);
    return welcomeInput;
  }
  return null;
}

export async function clickSaveButton(page: Page) {
  const saveButton = page.locator('button:has-text("Save Changes"), button:has-text("Save")').first();
  await saveButton.click();
  console.log('✅ Clicked Save Changes button');
  await page.waitForTimeout(2000);
  return saveButton;
}

export async function waitForSaveCompletion(page: Page) {
  const saveButton = page.locator('button:has-text("Save Changes"), button:has-text("Save")').first();

  const successToast = page.locator(
    '[role="status"]:has-text("saved"), ' +
    '[role="status"]:has-text("success"), ' +
    '.toast:has-text("saved"), ' +
    '[class*="toast"]:has-text("Configuration")'
  ).first();

  if (await successToast.isVisible({ timeout: 5000 }).catch(() => false)) {
    console.log('✅ Save success toast appeared');
  } else {
    console.log('⚠️ Success toast not visible, checking button state');
    // Verify save button is disabled after save (indicating save completed)
    await saveButton.evaluate(el => {
      // Wait for disabled state
      return new Promise(resolve => {
        const checkInterval = setInterval(() => {
          if ((el as HTMLButtonElement).disabled) {
            clearInterval(checkInterval);
            resolve(true);
          }
        }, 100);
        setTimeout(() => clearInterval(checkInterval), 5000);
      });
    });
    console.log('✅ Save button disabled (save completed)');
  }
}

export async function changePositionToBottomLeft(page: Page) {
  const positionButtons = page.locator('[aria-label*="position"], button[data-position]');
  const bottomLeftButton = positionButtons.filter({ hasText: /bottom.*left|left.*bottom/i }).first();

  if (await bottomLeftButton.isVisible().catch(() => false)) {
    await bottomLeftButton.click();
    console.log('✅ Changed position to bottom-left');
  } else {
    const positionGrid = page.locator('[role="radiogroup"], .position-grid').first();
    if (await positionGrid.isVisible().catch(() => false)) {
      const bottomLeftOption = positionGrid.locator('[value="bottom-left"], [data-value="bottom-left"]').first();
      await bottomLeftOption.click();
      console.log('✅ Changed position via grid selector');
    }
  }
}

export async function toggleWooCommerceIntegration(page: Page) {
  const wooCommerceToggle = page.locator(
    '[role="switch"]:near(:text("WooCommerce")), ' +
    'input[type="checkbox"]:near(:text("WooCommerce")), ' +
    'button[role="switch"]:near(:text("WooCommerce"))'
  ).first();

  if (await wooCommerceToggle.isVisible().catch(() => false)) {
    const isChecked = await wooCommerceToggle.getAttribute('data-state') || await wooCommerceToggle.isChecked();
    await wooCommerceToggle.click();
    console.log(`✅ Toggled WooCommerce integration (was ${isChecked})`);
  }
}
