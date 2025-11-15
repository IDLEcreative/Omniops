import { Page } from '@playwright/test';

/**
 * Helper functions for keyboard navigation testing
 */

/**
 * Test keyboard shortcut focusing on element
 */
export async function testKeyboardShortcut(
  page: Page,
  key: string,
  elementSelectors: string[]
): Promise<boolean> {
  await page.keyboard.press(key);

  for (const selector of elementSelectors) {
    const element = page.locator(selector).first();
    const isVisible = await element.isVisible({ timeout: 2000 }).catch(() => false);

    if (isVisible) {
      const isFocused = await element.evaluate(el => el === document.activeElement);
      if (isFocused) {
        console.log(`✅ Element focused with "${key}" shortcut`);
        return true;
      }
    }
  }

  console.log(`⚠️ "${key}" shortcut did not focus expected element`);
  return false;
}

/**
 * Clear input using Escape key
 */
export async function clearWithEscape(page: Page, inputElement: any): Promise<boolean> {
  await inputElement.focus();
  await page.keyboard.press('Escape');

  const searchValue = await inputElement.inputValue();
  if (searchValue === '') {
    console.log('✅ Escape key cleared input');
    return true;
  }

  console.log('⚠️ Escape key did not clear input - clearing manually');
  await inputElement.clear();
  return false;
}
