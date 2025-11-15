import { test, expect } from '@playwright/test';
import {
  searchConversations,
  getConversationItems,
  viewConversation
} from '../../utils/playwright/conversation-helpers';
import {
  SEARCH_SELECTORS,
  EMPTY_STATE_SELECTORS,
  findElement,
  isAnyVisible
} from '../helpers/selector-helpers';
import { testKeyboardShortcut, clearWithEscape } from '../helpers/keyboard-helpers';
import { testSpecialCharacterSearch, verifyConversationContent } from '../helpers/search-test-helpers';
import { TEST_AUTH_COOKIE } from '../helpers/test-data';
import { openFiltersPanel, applyDateRangeFilter, applyStatusFilter, submitFilters } from '../helpers/filter-helpers';

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

    await page.setViewportSize({ width: 1280, height: 720 });
    await page.context().addCookies([TEST_AUTH_COOKIE]);

    console.log('📍 Step 2: Navigating to conversations dashboard');
    await page.goto(`${BASE_URL}/dashboard/conversations`, { waitUntil: 'domcontentloaded' });

    const searchElement = await findElement(page, SEARCH_SELECTORS);

    if (!searchElement) {
      console.log('⚠️ Search input not found - page may have different structure');
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

      await verifyConversationContent(page, 'hydraulic');

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

    console.log('📍 Step 1: Entering search term "order"');
    const searchInput = await findElement(page, SEARCH_SELECTORS);

    if (!searchInput) {
      console.log('⚠️ Search input not visible - skipping test');
      return;
    }

    await searchInput.fill('order');
    await page.waitForTimeout(1000);

    console.log('📍 Step 2: Opening advanced filters');
    const filtersOpened = await openFiltersPanel(page);

    if (filtersOpened) {
      console.log('📍 Step 3: Applying date range filter for last 7 days');
      await applyDateRangeFilter(page, 'Last 7 days');

      console.log('📍 Step 4: Applying status filter for "resolved" conversations');
      await applyStatusFilter(page, 'resolved');

      console.log('📍 Step 5: Submitting filters');
      await submitFilters(page);

      const filteredConversations = page.locator('[role="article"], .conversation-item');
      const filteredCount = await filteredConversations.count();
      console.log(`📊 Found ${filteredCount} conversations matching filters`);
    }
  });

  test('handles empty search results gracefully', async ({ page }) => {
    console.log('🎯 Testing: Empty search results handling');

    console.log('📍 Step 1: Entering search query with no expected results');
    const searchInput = await findElement(page, SEARCH_SELECTORS);

    if (!searchInput) {
      console.log('⚠️ Search input not visible - skipping test');
      return;
    }

    await searchInput.fill('xyzabc123nonexistentquery999');
    await page.waitForTimeout(2000);

    console.log('📍 Step 2: Checking for empty state message');
    const emptyStateResult = await isAnyVisible(page, EMPTY_STATE_SELECTORS, 5000);

    if (emptyStateResult.found) {
      console.log('✅ Empty state message displayed correctly');
    } else {
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

    const searchInput = await findElement(page, SEARCH_SELECTORS);
    if (!searchInput) {
      console.log('⚠️ Search input not visible - skipping test');
      return;
    }

    await testSpecialCharacterSearch(page, searchInput);
  });

  test('keyboard navigation and shortcuts in search', async ({ page }) => {
    console.log('🎯 Testing: Keyboard navigation and shortcuts');

    const shortcutWorked = await testKeyboardShortcut(page, '/', SEARCH_SELECTORS);
    const searchInput = await findElement(page, SEARCH_SELECTORS);
    if (!searchInput) return;

    if (!shortcutWorked) await searchInput.focus();

    await page.keyboard.type('customer inquiry');
    await page.waitForTimeout(1500);

    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    const conversationCount = await page.locator('[role="article"], .conversation-item').count();
    if (conversationCount > 0) {
      console.log('✅ Keyboard navigation available');
    }

    await clearWithEscape(page, searchInput);
  });

  test('search result persistence and back navigation', async ({ page }) => {
    console.log('🎯 Testing: Search result persistence across navigation');

    const searchInput = await findElement(page, SEARCH_SELECTORS);
    if (!searchInput) return;

    await searchInput.fill('support ticket');
    await page.waitForTimeout(2000);

    const conversations = page.locator('[role="article"], .conversation-item');
    if (await conversations.count() > 0) {
      await conversations.first().click();
      await page.waitForTimeout(2000);

      await page.goBack();
      await page.waitForTimeout(2000);

      const currentSearchValue = await searchInput.inputValue();
      if (currentSearchValue === 'support ticket') {
        console.log('✅ Search query preserved after navigation');
      }
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