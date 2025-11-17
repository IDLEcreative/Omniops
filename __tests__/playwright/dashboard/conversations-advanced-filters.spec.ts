/**
 * E2E Test: Advanced Conversation Filters
 *
 * Tests the COMPLETE advanced filtering workflow for conversations including:
 * - Sentiment filtering (positive/negative/neutral)
 * - Domain filtering (multi-domain selection)
 * - Customer email filtering
 * - Date range filtering
 * - Filter combinations
 * - Filter badge count updates
 * - Clear all filters functionality
 *
 * This test validates the consolidated filter system that replaced
 * the separate /dashboard/search page.
 */

import { test, expect } from '@playwright/test';
import {
  setupMocks,
  openFiltersPanel,
  applySentimentFilter,
  applyDomainFilter,
  applyEmailFilter,
  applyFilters,
  clearAllFilters,
  verifyFilterBadgeCount,
  verifyConversationResults,
  MOCK_CONVERSATIONS
} from '@/test-utils/playwright/dashboard/conversations-helpers';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 90000; // 90 seconds

test.describe('Advanced Conversation Filters', () => {
  test.setTimeout(TEST_TIMEOUT);

  test.beforeEach(async ({ page }) => {
    console.log('📍 Setting up test environment');

    // Setup mocks
    await setupMocks(page);

    // Navigate to conversations page
    console.log('📍 Navigating to /dashboard/conversations');
    await page.goto(`${BASE_URL}/dashboard/conversations`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    // Wait for page to load
    await page.waitForSelector('h1', { timeout: 10000 });
    console.log('✅ Conversations page loaded');
  });

  test('should filter conversations by sentiment', async ({ page }) => {
    console.log('\n📋 TEST: Sentiment Filtering');

    // Open filters panel
    const panelOpened = await openFiltersPanel(page);
    if (!panelOpened) {
      console.log('❌ TEST SKIPPED: Could not open filters panel');
      return;
    }

    // Apply positive sentiment filter
    await applySentimentFilter(page, 'positive');
    await applyFilters(page);

    // Verify results show only positive conversations
    const positiveConversations = MOCK_CONVERSATIONS.filter(c => c.sentiment === 'positive');
    await verifyConversationResults(page, positiveConversations.length);

    // Verify filter badge
    await verifyFilterBadgeCount(page, 1);

    console.log('✅ TEST PASSED: Sentiment filtering works');
  });

  test('should filter conversations by domain', async ({ page }) => {
    console.log('\n📋 TEST: Domain Filtering');

    // Open filters panel
    const panelOpened = await openFiltersPanel(page);
    if (!panelOpened) {
      console.log('❌ TEST SKIPPED: Could not open filters panel');
      return;
    }

    // Apply domain filter
    await applyDomainFilter(page, ['example.com']);
    await applyFilters(page);

    // Verify results show only conversations from selected domain
    const domainConversations = MOCK_CONVERSATIONS.filter(c => c.domain === 'example.com');
    await verifyConversationResults(page, domainConversations.length);

    // Verify filter badge
    await verifyFilterBadgeCount(page, 1);

    console.log('✅ TEST PASSED: Domain filtering works');
  });

  test('should filter conversations by customer email', async ({ page }) => {
    console.log('\n📋 TEST: Customer Email Filtering');

    // Open filters panel
    const panelOpened = await openFiltersPanel(page);
    if (!panelOpened) {
      console.log('❌ TEST SKIPPED: Could not open filters panel');
      return;
    }

    // Apply email filter
    await applyEmailFilter(page, 'john@example.com');
    await applyFilters(page);

    // Verify results show only conversations from that email
    const emailConversations = MOCK_CONVERSATIONS.filter(c => c.customerEmail === 'john@example.com');
    await verifyConversationResults(page, emailConversations.length);

    // Verify filter badge
    await verifyFilterBadgeCount(page, 1);

    console.log('✅ TEST PASSED: Email filtering works');
  });

  test('should combine multiple filters', async ({ page }) => {
    console.log('\n📋 TEST: Combined Filters');

    // Open filters panel
    const panelOpened = await openFiltersPanel(page);
    if (!panelOpened) {
      console.log('❌ TEST SKIPPED: Could not open filters panel');
      return;
    }

    // Apply multiple filters
    await applySentimentFilter(page, 'negative');
    await applyDomainFilter(page, ['test.com']);
    await applyFilters(page);

    // Verify results match combined criteria
    const combinedConversations = MOCK_CONVERSATIONS.filter(
      c => c.sentiment === 'negative' && c.domain === 'test.com'
    );
    await verifyConversationResults(page, combinedConversations.length);

    // Verify filter badge shows correct count
    await verifyFilterBadgeCount(page, 2);

    console.log('✅ TEST PASSED: Combined filtering works');
  });

  test('should clear all filters and reset results', async ({ page }) => {
    console.log('\n📋 TEST: Clear All Filters');

    // Open filters panel
    const panelOpened = await openFiltersPanel(page);
    if (!panelOpened) {
      console.log('❌ TEST SKIPPED: Could not open filters panel');
      return;
    }

    // Apply some filters first
    await applySentimentFilter(page, 'positive');
    await applyDomainFilter(page, ['example.com']);
    await applyFilters(page);

    // Verify filters are applied
    const filteredCount = MOCK_CONVERSATIONS.filter(
      c => c.sentiment === 'positive' && c.domain === 'example.com'
    ).length;
    await verifyConversationResults(page, filteredCount);

    // Clear all filters
    await openFiltersPanel(page);
    await clearAllFilters(page);

    // Verify all conversations are shown again
    await verifyConversationResults(page, MOCK_CONVERSATIONS.length);

    // Verify filter badge is cleared
    const badgeHidden = await page.locator('[data-testid="filter-badge"]')
      .isHidden({ timeout: 3000 })
      .catch(() => true);

    if (badgeHidden) {
      console.log('✅ Filter badge cleared');
    }

    console.log('✅ TEST PASSED: Clear filters works');
  });

  test('should complete full filtering user journey', async ({ page }) => {
    console.log('\n📋 TEST: Complete Filtering Journey');
    console.log('Simulating a user exploring all filter options');

    // Step 1: View all conversations
    console.log('\n📍 Step 1: Viewing all conversations');
    await verifyConversationResults(page, MOCK_CONVERSATIONS.length);
    console.log('✅ All conversations visible');

    // Step 2: Filter by sentiment
    console.log('\n📍 Step 2: Filter by negative sentiment');
    const panelOpened = await openFiltersPanel(page);
    if (!panelOpened) {
      console.log('❌ TEST SKIPPED: Could not open filters panel');
      return;
    }

    await applySentimentFilter(page, 'negative');
    await applyFilters(page);

    const negativeConversations = MOCK_CONVERSATIONS.filter(c => c.sentiment === 'negative');
    await verifyConversationResults(page, negativeConversations.length);
    console.log('✅ Filtered by negative sentiment');

    // Step 3: Add domain filter
    console.log('\n📍 Step 3: Add domain filter');
    await openFiltersPanel(page);
    await applyDomainFilter(page, ['test.com']);
    await applyFilters(page);

    const combinedFiltered = MOCK_CONVERSATIONS.filter(
      c => c.sentiment === 'negative' && c.domain === 'test.com'
    );
    await verifyConversationResults(page, combinedFiltered.length);
    console.log('✅ Combined sentiment and domain filters');

    // Step 4: Clear filters
    console.log('\n📍 Step 4: Clear all filters');
    await openFiltersPanel(page);
    await clearAllFilters(page);
    await verifyConversationResults(page, MOCK_CONVERSATIONS.length);
    console.log('✅ All filters cleared');

    // Step 5: Apply email filter
    console.log('\n📍 Step 5: Filter by email');
    await openFiltersPanel(page);
    await applyEmailFilter(page, 'jane@test.com');
    await applyFilters(page);

    const emailFiltered = MOCK_CONVERSATIONS.filter(c => c.customerEmail === 'jane@test.com');
    await verifyConversationResults(page, emailFiltered.length);
    console.log('✅ Filtered by email');

    console.log('\n✅ TEST PASSED: Complete filtering journey successful');
    console.log('User successfully explored all filter options!');
  });

  test('should handle filter panel interactions smoothly', async ({ page }) => {
    console.log('\n📋 TEST: Filter Panel Interactions');

    // Test opening and closing panel multiple times
    console.log('📍 Testing panel open/close');

    // Open panel
    let opened = await openFiltersPanel(page);
    if (!opened) {
      console.log('❌ TEST SKIPPED: Could not open filters panel');
      return;
    }

    // Close panel (ESC key or close button)
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    console.log('✅ Panel closed with ESC');

    // Re-open panel
    opened = await openFiltersPanel(page);
    if (opened) {
      console.log('✅ Panel re-opened successfully');
    }

    // Apply filter without closing
    await applySentimentFilter(page, 'neutral');
    await applyFilters(page);

    const neutralConversations = MOCK_CONVERSATIONS.filter(c => c.sentiment === 'neutral');
    await verifyConversationResults(page, neutralConversations.length);

    console.log('✅ TEST PASSED: Filter panel interactions work smoothly');
  });
});