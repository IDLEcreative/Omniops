import { Page, Locator } from '@playwright/test';

/**
 * Helper functions for finding elements with fallback selectors
 */

/**
 * Common selector patterns for search inputs
 */
export const SEARCH_SELECTORS = [
  '[aria-label="Search conversations by message content or customer name"]',
  'input[placeholder*="Search"]',
  'input[type="search"]',
  'input[placeholder*="conversation"]',
  '.search-input',
  '[data-testid="search-input"]'
];

/**
 * Common selector patterns for empty states
 */
export const EMPTY_STATE_SELECTORS = [
  'text=/no conversations found/i',
  'text=/no results/i',
  'text=/try a different search/i',
  '[data-testid="empty-state"]'
];

/**
 * Common selector patterns for conversation items
 */
export const CONVERSATION_ITEM_SELECTORS = [
  '[role="article"]',
  '.conversation-item'
];

/**
 * Find an element using multiple selector strategies
 */
export async function findElement(
  page: Page,
  selectors: string[],
  timeout = 5000
): Promise<Locator | null> {
  for (const selector of selectors) {
    try {
      const element = page.locator(selector).first();
      const isVisible = await element.isVisible({ timeout: 3000 }).catch(() => false);
      if (isVisible) {
        console.log(`✅ Found element with selector: ${selector}`);
        return element;
      }
    } catch {
      // Try next selector
    }
  }
  return null;
}

/**
 * Check if any of the provided selectors is visible
 */
export async function isAnyVisible(
  page: Page,
  selectors: string[],
  timeout = 3000
): Promise<{ found: boolean; selector?: string; element?: Locator }> {
  for (const selector of selectors) {
    const element = page.locator(selector).first();
    const isVisible = await element.isVisible({ timeout }).catch(() => false);

    if (isVisible) {
      return { found: true, selector, element };
    }
  }
  return { found: false };
}

/**
 * Get text content from first matching element
 */
export async function getTextFromSelectors(
  page: Page,
  selectors: string[]
): Promise<string | null> {
  const result = await isAnyVisible(page, selectors);
  if (result.found && result.element) {
    return await result.element.textContent();
  }
  return null;
}
