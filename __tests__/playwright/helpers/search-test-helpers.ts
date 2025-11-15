import { Page } from '@playwright/test';
import { SPECIAL_SEARCH_QUERIES } from './test-data';

/**
 * Test special characters in search
 */
export async function testSpecialCharacterSearch(
  page: Page,
  searchInput: any
): Promise<void> {
  for (const testCase of SPECIAL_SEARCH_QUERIES) {
    console.log(`📍 Testing search with ${testCase.description}: "${testCase.query}"`);

    await searchInput.clear();
    await searchInput.fill(testCase.query);
    await page.waitForTimeout(1500);

    const hasError = await page.locator('[role="alert"], .error-message').isVisible().catch(() => false);

    if (hasError) {
      console.log(`⚠️ Error occurred with query: ${testCase.query}`);
    } else {
      const resultCount = await page.locator('[role="article"], .conversation-item').count();
      console.log(`✅ Search handled "${testCase.query}" - found ${resultCount} results`);
    }
  }
}

/**
 * Verify search results contain expected content
 */
export async function verifyConversationContent(
  page: Page,
  searchTerm: string
): Promise<boolean> {
  const conversationContent = await page.locator('main, [role="main"], .conversation-content').textContent();
  const hasSearchTerm = conversationContent?.toLowerCase().includes(searchTerm.toLowerCase());

  if (hasSearchTerm) {
    console.log(`✅ Search term "${searchTerm}" found in conversation content`);
    return true;
  } else {
    console.log(`⚠️ Search term "${searchTerm}" not visible in current view`);
    return false;
  }
}
