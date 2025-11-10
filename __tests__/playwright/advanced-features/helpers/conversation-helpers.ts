import { Page, expect, test } from '@playwright/test';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 180000; // 3 minutes

// Helper functions extracted from conversations-management.spec.ts
/**
 * Navigate to conversations page
 */
export async function navigateToConversations(page: Page): Promise<void> {
  console.log('📍 Navigating to conversations page');

  await page.goto(`${BASE_URL}/dashboard/conversations`, { waitUntil: 'networkidle' });

  const pageTitle = page.locator('h1:has-text("Conversations"), h1:has-text("Messages")').first();
  await expect(pageTitle).toBeVisible({ timeout: 10000 });

  console.log('✅ Conversations page loaded');
}

/**
 * Verify conversations list loaded
 */
export async function verifyConversationsList(page: Page, expectedCount: number): Promise<void> {
  console.log('📍 Verifying conversations list');

  const conversationItems = page.locator('[data-testid="conversation-item"], .conversation-item, .conversation-row, tr[data-conversation-id]');

  await page.waitForTimeout(2000);
  const count = await conversationItems.count();

  expect(count).toBe(expectedCount);
  console.log(`✅ Found ${count} conversations`);
}

/**
 * Filter conversations by status
 */
export async function filterByStatus(page: Page, status: 'active' | 'resolved' | 'archived'): Promise<void> {
  console.log(`📍 Filtering by status: ${status}`);

  const statusFilter = page.locator(`select[name="status"], [data-testid="status-filter"]`).first();

  if (await statusFilter.isVisible({ timeout: 2000 })) {
    await statusFilter.selectOption(status);
  } else {
    // Try tabs or buttons
    const statusButton = page.locator(`button:has-text("${status}"), [role="tab"]:has-text("${status}")`).first();
    await statusButton.click();
  }

  await page.waitForTimeout(1500);
  console.log(`✅ Filtered by status: ${status}`);
}

/**
 * Filter conversations by date range
 */
export async function filterByDateRange(page: Page, startDate: string, endDate: string): Promise<void> {
  console.log(`📍 Filtering by date range: ${startDate} to ${endDate}`);

  const startDateInput = page.locator('input[name="start_date"], input[type="date"]').first();
  await startDateInput.fill(startDate);

  const endDateInput = page.locator('input[name="end_date"], input[type="date"]').nth(1);
  await endDateInput.fill(endDate);

  const applyButton = page.locator('button:has-text("Apply"), button:has-text("Filter")').first();
  if (await applyButton.isVisible({ timeout: 2000 })) {
    await applyButton.click();
  }

  await page.waitForTimeout(1500);
  console.log('✅ Date range filter applied');
}

/**
 * Search conversations
 */
export async function searchConversations(page: Page, searchTerm: string): Promise<void> {
  console.log(`📍 Searching for: "${searchTerm}"`);

  const searchInput = page.locator('input[name="search"], input[placeholder*="Search" i], input[type="search"]').first();
  await searchInput.fill(searchTerm);

  // Some search inputs trigger on input, others need submit
  await page.waitForTimeout(1000);

  const searchButton = page.locator('button[type="submit"]:has-text("Search"), button:has([data-icon="search"])').first();
  if (await searchButton.isVisible({ timeout: 1000 })) {
    await searchButton.click();
  }

  await page.waitForTimeout(1500);
  console.log('✅ Search applied');
}

/**
 * View conversation details
 */
export async function viewConversationDetails(page: Page, conversationId: string): Promise<void> {
  console.log(`📍 Viewing conversation details: ${conversationId}`);

  const conversationRow = page.locator(`[data-conversation-id="${conversationId}"], tr:has-text("${conversationId}")`).first();

  if (await conversationRow.isVisible({ timeout: 2000 })) {
    await conversationRow.click();
  } else {
    // Try direct navigation
    await page.goto(`${BASE_URL}/dashboard/conversations/${conversationId}`, { waitUntil: 'networkidle' });
  }

  await page.waitForTimeout(2000);

  // Verify messages are visible
  const messages = page.locator('[data-testid="message"], .message, .chat-message');
  const messageCount = await messages.count();
  expect(messageCount).toBeGreaterThan(0);

  console.log(`✅ Conversation details loaded with ${messageCount} messages`);
}

/**
 * Export conversations
 */
export async function exportConversations(page: Page, format: 'csv' | 'json' = 'csv'): Promise<void> {
  console.log(`📍 Exporting conversations as ${format.toUpperCase()}`);

  // Navigate back to conversations list if on details page
  if (page.url().includes('/conversations/')) {
    await page.goto(`${BASE_URL}/dashboard/conversations`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
  }

  const exportButton = page.locator('button:has-text("Export"), [data-testid="export-button"]').first();
  await exportButton.click();
  await page.waitForTimeout(500);

  // Select format if dropdown exists
  const formatOption = page.locator(`button:has-text("${format.toUpperCase()}"), [role="menuitem"]:has-text("${format}")`).first();
  if (await formatOption.isVisible({ timeout: 2000 })) {
    await formatOption.click();
  }

  await page.waitForTimeout(2000);

  // Verify download initiated (in real scenario, would check download)
  console.log(`✅ Export initiated for ${format.toUpperCase()} format`);
}
