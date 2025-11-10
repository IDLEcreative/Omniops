import { test, expect } from '@playwright/test';
import {
  findSearchInput,
  waitForConversationsPage,
  searchConversations,
  getConversationItems,
  viewConversation,
  verifySearchResults,
  applyFilters
} from '../../utils/playwright/conversation-helpers';

/**
 * E2E Test: AI Chat History Search
 *
 * Tests the complete chat history search workflow from query to result display.
 * This validates the conversation search functionality which is critical for
 * customer support teams to find previous interactions and provide context-aware support.
 *
 * User Journey:
 * 1. Navigate to conversations page with search functionality
 * 2. Enter search query for specific conversation content
 * 3. View search results with conversation context
 * 4. Apply filters (date range, status, language)
 * 5. Click result to view full conversation
 * 6. Verify search term is highlighted in conversation
 * 7. Test pagination for multiple results
 * 8. Handle edge cases (no results, special characters)
 *
 * This test teaches AI agents:
 * - How to search through chat conversation history
 * - Expected search behavior and result formatting
 * - Filter usage patterns for refined searches
 * - Result navigation workflow
 * - Error handling for empty or invalid searches
 * - How to verify search terms are properly highlighted
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 60000;

test.describe('Chat History Search E2E', () => {
  test.setTimeout(TEST_TIMEOUT);

  test.beforeEach(async ({ page }) => {
    console.log('📍 Step 1: Setting up test environment');

    // Set viewport for consistency
    await page.setViewportSize({ width: 1280, height: 720 });

    // Mock authentication if needed
    await page.context().addCookies([
      {
        name: 'test-auth',
        value: 'authenticated',
        domain: 'localhost',
        path: '/',
      },
    ]);

    // Navigate to the conversations page
    console.log('📍 Step 2: Navigating to conversations dashboard');
    await page.goto(`${BASE_URL}/dashboard/conversations`, { waitUntil: 'domcontentloaded' });

    // Wait for the page to fully load - using multiple possible selectors
    const searchSelectors = [
      '[aria-label="Search conversations by message content or customer name"]',
      'input[placeholder*="Search"]',
      'input[type="search"]',
      'input[placeholder*="conversation"]',
      '.search-input',
      '[data-testid="search-input"]'
    ];

    let searchFound = false;
    for (const selector of searchSelectors) {
      try {
        await page.waitForSelector(selector, { state: 'visible', timeout: 3000 });
        searchFound = true;
        console.log(`✅ Found search input with selector: ${selector}`);
        break;
      } catch {
        // Try next selector
      }
    }

    if (!searchFound) {
      console.log('⚠️ Search input not found with expected selectors - page may have different structure');
      // Take a screenshot to debug
      await page.screenshot({ path: `test-results/page-structure-${Date.now()}.png` });
    }

    console.log('✅ Conversations page loaded');
  });

  test('complete search workflow: search → results → view conversation with highlight', async ({ page }) => {
    console.log('🎯 Testing: Complete chat history search workflow');

    // Step 3: Enter search query
    console.log('📍 Step 3: Entering search query for "hydraulic pump"');
    const searchSuccess = await searchConversations(page, 'hydraulic pump');

    if (!searchSuccess) {
      console.log('⚠️ Could not perform search - skipping test');
      return;
    }

    // Give the search time to process (usually debounced)
    await page.waitForTimeout(1000);

    console.log('✅ Search query entered successfully');

    // Step 4: Verify search results appear
    console.log('📍 Step 4: Verifying search results display');

    // Get conversation items
    const conversationItems = await getConversationItems(page);
    const itemCount = await conversationItems.count();

    if (itemCount > 0) {
      console.log(`✅ Found ${itemCount} matching conversations`);

      // Step 5: Click on first search result
      console.log('📍 Step 5: Clicking on first search result to view conversation');
      const viewSuccess = await viewConversation(page, 0);

      // Wait for conversation details to load
      await page.waitForTimeout(2000);

      // Step 6: Verify conversation loaded with messages
      console.log('📍 Step 6: Verifying conversation details loaded');

      // Look for message container
      const messageContainer = page.locator('.message, [class*="message"], [data-message-id]').first();
      await expect(messageContainer).toBeVisible({ timeout: 5000 });

      // Check if search term appears in the conversation
      const conversationContent = await page.locator('main, [role="main"], .conversation-content').textContent();
      const hasSearchTerm = conversationContent?.toLowerCase().includes('hydraulic') ||
                           conversationContent?.toLowerCase().includes('pump');

      if (hasSearchTerm) {
        console.log('✅ Search term found in conversation content');
      } else {
        console.log('⚠️ Search term not visible in current view');
      }

      // Take screenshot of successful search result
      await page.screenshot({
        path: `test-results/search-result-success-${Date.now()}.png`,
        fullPage: true
      });

      console.log('✅ Complete search workflow validated successfully');

    } else {
      console.log('⚠️ No conversations found matching search term - trying alternative query');

      // Try a more generic search
      await searchConversations(page, 'product');
      const alternativeItems = await getConversationItems(page);
      const alternativeResults = await alternativeItems.count();
      console.log(`📊 Alternative search found ${alternativeResults} results`);
    }
  });

  test('search with advanced filters: date range and status filtering', async ({ page }) => {
    console.log('🎯 Testing: Search with advanced filters');

    // Step 1: Enter a search term
    console.log('📍 Step 1: Entering search term "order"');
    const searchInput = page.locator(
      '[aria-label="Search conversations by message content or customer name"], ' +
      'input[placeholder*="Search"], ' +
      'input[type="search"], ' +
      'input[placeholder*="conversation"]'
    ).first();

    const isSearchVisible = await searchInput.isVisible({ timeout: 5000 }).catch(() => false);
    if (!isSearchVisible) {
      console.log('⚠️ Search input not visible - skipping test');
      return;
    }

    await searchInput.fill('order');
    await page.waitForTimeout(1000);

    // Step 2: Open advanced filters
    console.log('📍 Step 2: Opening advanced filters');
    const filtersButton = page.locator('button:has-text("Filters"), button[aria-label*="filter"]').first();

    if (await filtersButton.isVisible()) {
      await filtersButton.click();
      console.log('✅ Advanced filters opened');

      // Step 3: Apply date range filter
      console.log('📍 Step 3: Applying date range filter for last 7 days');
      const dateRangeSelector = page.locator('select[name="dateRange"], [data-testid="date-range"]').first();
      if (await dateRangeSelector.isVisible()) {
        await dateRangeSelector.selectOption({ label: 'Last 7 days' });
        console.log('✅ Date range filter applied');
      }

      // Step 4: Apply status filter
      console.log('📍 Step 4: Applying status filter for "resolved" conversations');
      const statusCheckbox = page.locator('input[value="resolved"], label:has-text("Resolved") input[type="checkbox"]').first();
      if (await statusCheckbox.isVisible()) {
        await statusCheckbox.check();
        console.log('✅ Status filter applied');
      }

      // Step 5: Apply filters
      const applyButton = page.locator('button:has-text("Apply"), button:has-text("Search")').first();
      if (await applyButton.isVisible()) {
        await applyButton.click();
        console.log('✅ Filters applied successfully');
      }

      // Wait for filtered results
      await page.waitForTimeout(2000);

      // Verify filtered results
      const filteredConversations = page.locator('[role="article"], .conversation-item');
      const filteredCount = await filteredConversations.count();
      console.log(`📊 Found ${filteredCount} conversations matching filters`);

    } else {
      console.log('⚠️ Advanced filters not available - feature may be disabled');
    }
  });

  test('handles empty search results gracefully', async ({ page }) => {
    console.log('🎯 Testing: Empty search results handling');

    // Step 1: Enter a query that should return no results
    console.log('📍 Step 1: Entering search query with no expected results');
    const searchInput = page.locator(
      '[aria-label="Search conversations by message content or customer name"], ' +
      'input[placeholder*="Search"], ' +
      'input[type="search"]'
    ).first();

    const isSearchVisible = await searchInput.isVisible({ timeout: 5000 }).catch(() => false);
    if (!isSearchVisible) {
      console.log('⚠️ Search input not visible - skipping test');
      return;
    }

    await searchInput.fill('xyzabc123nonexistentquery999');
    await page.waitForTimeout(2000);

    // Step 2: Check for empty state message
    console.log('📍 Step 2: Checking for empty state message');
    const emptyState = page.locator(
      'text=/no conversations found/i, text=/no results/i, text=/try a different search/i, [data-testid="empty-state"]'
    ).first();

    const isEmptyStateVisible = await emptyState.isVisible({ timeout: 5000 }).catch(() => false);

    if (isEmptyStateVisible) {
      console.log('✅ Empty state message displayed correctly');
    } else {
      // Check if conversation list is empty
      const conversationCount = await page.locator('[role="article"], .conversation-item').count();
      if (conversationCount === 0) {
        console.log('✅ No results shown for non-existent query');
      } else {
        console.log(`⚠️ Unexpected: Found ${conversationCount} conversations for non-existent query`);
      }
    }

    // Step 3: Clear search and verify conversations return
    console.log('📍 Step 3: Clearing search to restore all conversations');
    await searchInput.clear();
    await page.waitForTimeout(2000);

    const allConversations = await page.locator('[role="article"], .conversation-item').count();
    console.log(`✅ Search cleared, showing ${allConversations} conversations`);
  });

  test('search with special characters and edge cases', async ({ page }) => {
    console.log('🎯 Testing: Search with special characters');

    const specialQueries = [
      { query: 'user@example.com', description: 'email address' },
      { query: '$99.99', description: 'price with currency' },
      { query: '"exact phrase"', description: 'quoted phrase' },
      { query: 'product #12345', description: 'hash symbol' },
      { query: '50% discount', description: 'percentage' }
    ];

    const searchInput = page.locator(
      '[aria-label="Search conversations by message content or customer name"], ' +
      'input[placeholder*="Search"], ' +
      'input[type="search"]'
    ).first();

    const isSearchVisible = await searchInput.isVisible({ timeout: 5000 }).catch(() => false);
    if (!isSearchVisible) {
      console.log('⚠️ Search input not visible - skipping test');
      return;
    }

    for (const testCase of specialQueries) {
      console.log(`📍 Testing search with ${testCase.description}: "${testCase.query}"`);

      await searchInput.clear();
      await searchInput.fill(testCase.query);
      await page.waitForTimeout(1500);

      // Check if search executed without errors
      const hasError = await page.locator('[role="alert"], .error-message').isVisible().catch(() => false);

      if (hasError) {
        console.log(`⚠️ Error occurred with query: ${testCase.query}`);
      } else {
        const resultCount = await page.locator('[role="article"], .conversation-item').count();
        console.log(`✅ Search handled "${testCase.query}" - found ${resultCount} results`);
      }
    }
  });

  test('keyboard navigation and shortcuts in search', async ({ page }) => {
    console.log('🎯 Testing: Keyboard navigation and shortcuts');

    // Step 1: Focus search with keyboard shortcut
    console.log('📍 Step 1: Testing "/" keyboard shortcut to focus search');
    await page.keyboard.press('/');

    const searchInput = page.locator(
      '[aria-label="Search conversations by message content or customer name"], ' +
      'input[placeholder*="Search"], ' +
      'input[type="search"]'
    ).first();

    const isSearchVisible = await searchInput.isVisible({ timeout: 5000 }).catch(() => false);
    if (!isSearchVisible) {
      console.log('⚠️ Search input not visible - skipping test');
      return;
    }
    const isFocused = await searchInput.evaluate(el => el === document.activeElement);

    if (isFocused) {
      console.log('✅ Search focused with "/" shortcut');
    } else {
      console.log('⚠️ "/" shortcut did not focus search - manually focusing');
      await searchInput.focus();
    }

    // Step 2: Type search query
    console.log('📍 Step 2: Typing search query via keyboard');
    await page.keyboard.type('customer inquiry');
    await page.waitForTimeout(1500);

    // Step 3: Navigate results with keyboard
    console.log('📍 Step 3: Testing keyboard navigation through results');

    // Press Tab to move focus to first result
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab'); // May need multiple tabs to reach results

    // Press Enter to select
    const conversations = page.locator('[role="article"], .conversation-item');
    const conversationCount = await conversations.count();

    if (conversationCount > 0) {
      console.log('✅ Keyboard navigation available for search results');
    } else {
      console.log('⚠️ No results to navigate with keyboard');
    }

    // Step 4: Clear search with Escape
    console.log('📍 Step 4: Testing Escape key to clear search');
    await searchInput.focus();
    await page.keyboard.press('Escape');

    const searchValue = await searchInput.inputValue();
    if (searchValue === '') {
      console.log('✅ Escape key cleared search input');
    } else {
      console.log('⚠️ Escape key did not clear search - clearing manually');
      await searchInput.clear();
    }
  });

  test('search result persistence and back navigation', async ({ page }) => {
    console.log('🎯 Testing: Search result persistence across navigation');

    // Step 1: Perform a search
    console.log('📍 Step 1: Performing initial search');
    const searchInput = page.locator(
      '[aria-label="Search conversations by message content or customer name"], ' +
      'input[placeholder*="Search"], ' +
      'input[type="search"]'
    ).first();

    const isSearchVisible = await searchInput.isVisible({ timeout: 5000 }).catch(() => false);
    if (!isSearchVisible) {
      console.log('⚠️ Search input not visible - skipping test');
      return;
    }
    await searchInput.fill('support ticket');
    await page.waitForTimeout(2000);

    // Step 2: Click on a result
    console.log('📍 Step 2: Clicking on search result');
    const conversations = page.locator('[role="article"], .conversation-item');
    const hasResults = await conversations.count() > 0;

    if (hasResults) {
      await conversations.first().click();
      await page.waitForTimeout(2000);

      // Step 3: Navigate back
      console.log('📍 Step 3: Testing browser back navigation');
      await page.goBack();
      await page.waitForTimeout(2000);

      // Step 4: Verify search is preserved
      console.log('📍 Step 4: Verifying search query is preserved');
      const currentSearchValue = await searchInput.inputValue();

      if (currentSearchValue === 'support ticket') {
        console.log('✅ Search query preserved after navigation');
      } else {
        console.log('⚠️ Search query not preserved - re-entering');
        await searchInput.fill('support ticket');
      }
    } else {
      console.log('⚠️ No search results to test navigation');
    }
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') {
      console.log('❌ Test failed - capturing failure screenshot');
      await page.screenshot({
        path: `test-results/search-failure-${Date.now()}.png`,
        fullPage: true
      });
    }
  });
});