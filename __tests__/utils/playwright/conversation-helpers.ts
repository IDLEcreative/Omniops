import { Page, Locator } from '@playwright/test';

/**
 * Helper functions for conversation/chat history search tests
 */

/**
 * Find the search input using multiple possible selectors
 */
export async function findSearchInput(page: Page): Promise<Locator | null> {
  const searchSelectors = [
    '[aria-label="Search conversations by message content or customer name"]',
    'input[placeholder*="Search conversations"]',
    'input[placeholder*="Search"]',
    'input[type="search"]',
    '.search-input',
    '[data-testid="search-input"]',
    '[data-testid="conversation-search"]',
    'input[name="search"]',
    'input[id*="search"]'
  ];

  for (const selector of searchSelectors) {
    try {
      const element = page.locator(selector).first();
      const isVisible = await element.isVisible({ timeout: 1000 }).catch(() => false);
      if (isVisible) {
        console.log(`✅ Found search input with selector: ${selector}`);
        return element;
      }
    } catch {
      // Try next selector
    }
  }

  return null;
}

/**
 * Wait for conversations page to load
 */
export async function waitForConversationsPage(page: Page): Promise<boolean> {
  // Try multiple indicators that the page has loaded
  const pageIndicators = [
    'h1:has-text("Conversations")',
    'h2:has-text("Conversations")',
    '[data-testid="conversations-page"]',
    '.conversations-container',
    '[role="main"]:has([role="article"])',
    'text=/conversations/i'
  ];

  for (const indicator of pageIndicators) {
    try {
      await page.waitForSelector(indicator, { timeout: 3000 });
      console.log(`✅ Conversations page loaded (found: ${indicator})`);
      return true;
    } catch {
      // Try next indicator
    }
  }

  // If no indicators found, check if we're on a login page
  const isLoginPage = await page.locator('input[type="password"], button:has-text("Sign in"), button:has-text("Log in")').first().isVisible().catch(() => false);
  if (isLoginPage) {
    console.log('⚠️ Redirected to login page - authentication may be required');
    return false;
  }

  return false;
}

/**
 * Search for conversations
 */
export async function searchConversations(page: Page, query: string): Promise<boolean> {
  const searchInput = await findSearchInput(page);

  if (!searchInput) {
    console.log('⚠️ Could not find search input');
    return false;
  }

  await searchInput.click();
  await searchInput.clear();
  await searchInput.fill(query);

  // Wait for search to process (usually debounced)
  await page.waitForTimeout(1500);

  console.log(`✅ Searched for: "${query}"`);
  return true;
}

/**
 * Get conversation items from the page
 */
export async function getConversationItems(page: Page): Promise<Locator> {
  // Try multiple selectors for conversation items
  const itemSelectors = [
    '[role="article"]',
    '.conversation-item',
    '[data-conversation-id]',
    '.conversation-list-item',
    '[data-testid="conversation-item"]'
  ];

  for (const selector of itemSelectors) {
    const items = page.locator(selector);
    const count = await items.count();
    if (count > 0) {
      console.log(`✅ Found ${count} conversations using selector: ${selector}`);
      return items;
    }
  }

  console.log('⚠️ No conversation items found');
  return page.locator('.non-existent-selector'); // Return empty locator
}

/**
 * Click on a conversation to view details
 */
export async function viewConversation(page: Page, index: number = 0): Promise<boolean> {
  const items = await getConversationItems(page);
  const count = await items.count();

  if (count === 0) {
    console.log('⚠️ No conversations to click');
    return false;
  }

  if (index >= count) {
    console.log(`⚠️ Conversation index ${index} out of range (${count} items)`);
    return false;
  }

  await items.nth(index).click();
  await page.waitForTimeout(2000); // Wait for details to load

  console.log(`✅ Clicked on conversation ${index + 1} of ${count}`);
  return true;
}

/**
 * Check if search results contain expected content
 */
export async function verifySearchResults(page: Page, expectedContent: string): Promise<boolean> {
  // Wait a bit for results to update
  await page.waitForTimeout(1000);

  // Check conversation items for content
  const items = await getConversationItems(page);
  const count = await items.count();

  if (count === 0) {
    console.log('⚠️ No search results found');
    return false;
  }

  // Check if any item contains the expected content
  for (let i = 0; i < count; i++) {
    const itemText = await items.nth(i).textContent();
    if (itemText?.toLowerCase().includes(expectedContent.toLowerCase())) {
      console.log(`✅ Found "${expectedContent}" in result ${i + 1}`);
      return true;
    }
  }

  console.log(`⚠️ "${expectedContent}" not found in ${count} results`);
  return false;
}

/**
 * Apply conversation filters
 */
export async function applyFilters(page: Page, filters: {
  dateRange?: string;
  status?: string;
  language?: string;
}): Promise<boolean> {
  // Open filters
  const filterButton = page.locator('button:has-text("Filters"), button[aria-label*="filter"], [data-testid="filters-button"]').first();

  const isFilterVisible = await filterButton.isVisible({ timeout: 2000 }).catch(() => false);
  if (!isFilterVisible) {
    console.log('⚠️ Filter button not found');
    return false;
  }

  await filterButton.click();
  console.log('✅ Opened filters');

  // Apply date range if provided
  if (filters.dateRange) {
    const dateSelect = page.locator('select[name="dateRange"], [data-testid="date-range"]').first();
    if (await dateSelect.isVisible({ timeout: 1000 })) {
      await dateSelect.selectOption({ label: filters.dateRange });
      console.log(`✅ Applied date range: ${filters.dateRange}`);
    }
  }

  // Apply status filter if provided
  if (filters.status) {
    const statusCheckbox = page.locator(`input[value="${filters.status}"], label:has-text("${filters.status}") input`).first();
    if (await statusCheckbox.isVisible({ timeout: 1000 })) {
      await statusCheckbox.check();
      console.log(`✅ Applied status filter: ${filters.status}`);
    }
  }

  // Apply filters
  const applyButton = page.locator('button:has-text("Apply"), button:has-text("Search"), button[type="submit"]').first();
  if (await applyButton.isVisible({ timeout: 1000 })) {
    await applyButton.click();
    await page.waitForTimeout(1500); // Wait for filters to apply
    console.log('✅ Filters applied');
    return true;
  }

  return false;
}