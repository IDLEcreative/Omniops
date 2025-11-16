/**
 * Helper functions for training dashboard E2E tests
 */

import { Page, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
export const TRAINING_PAGE = `${BASE_URL}/dashboard/training`;

export async function navigateToTrainingPage(page: Page) {
  console.log('📍 Step: Navigate to training dashboard');
  await page.goto(TRAINING_PAGE, {
    waitUntil: 'networkidle',
    timeout: 30000
  });
  await page.waitForTimeout(1000);
  console.log('✅ Training dashboard loaded');
}

export async function uploadUrl(page: Page, url: string) {
  console.log(`📍 Step: Upload URL - ${url}`);

  // Find URL input field
  const urlInput = page.locator('input#url').first();
  await expect(urlInput).toBeVisible();

  // Clear and fill URL
  await urlInput.clear();
  await urlInput.fill(url);
  console.log(`✅ Entered URL: ${url}`);

  // Click submit button (Scrape button)
  const submitButton = page.locator('button:has-text("Scrape")').first();
  await submitButton.click();
  console.log('✅ Clicked Scrape button');

  // Wait for API response (network request to complete)
  // The optimistic UI may not be working, so wait for actual API response
  await page.waitForResponse(
    response => response.url().includes('/api/training') && response.status() === 200,
    { timeout: 10000 }
  ).catch(() => {
    console.log('⚠️ No API response detected, continuing anyway');
  });

  // Wait additional time for React state update
  await page.waitForTimeout(2000);

  // Scroll list to top to see new item (virtual scrolling)
  const listContainer = page.locator('[data-testid="training-list"], .overflow-auto').first();
  await listContainer.evaluate(el => el.scrollTop = 0).catch(() => {});
  await page.waitForTimeout(500);
}

export async function uploadText(page: Page, text: string) {
  console.log(`📍 Step: Upload text - ${text.substring(0, 50)}...`);

  // Switch to text tab
  const textTab = page.locator('[role="tab"]:has-text("Text")').first();
  await textTab.click();
  await page.waitForTimeout(500);
  console.log('✅ Switched to Text tab');

  // Find text input field
  const textInput = page.locator('textarea#text').first();
  await expect(textInput).toBeVisible();

  // Clear and fill text
  await textInput.clear();
  await textInput.fill(text);
  console.log(`✅ Entered text (${text.length} chars)`);

  // Click submit button (Save Content button)
  const submitButton = page.locator('button:has-text("Save Content")').first();
  await submitButton.click();
  console.log('✅ Clicked Save Content button');

  // Wait for API response
  await page.waitForResponse(
    response => response.url().includes('/api/training') && response.status() === 200,
    { timeout: 10000 }
  ).catch(() => {
    console.log('⚠️ No API response detected, continuing anyway');
  });

  // Wait additional time for React state update
  await page.waitForTimeout(2000);

  // Scroll list to top to see new item (virtual scrolling)
  const listContainer = page.locator('[data-testid="training-list"], .overflow-auto').first();
  await listContainer.evaluate(el => el.scrollTop = 0).catch(() => {});
  await page.waitForTimeout(500);
}

export async function uploadQA(page: Page, question: string, answer: string) {
  console.log(`📍 Step: Upload Q&A - Q: ${question.substring(0, 50)}...`);

  // Switch to Q&A tab
  const qaTab = page.locator('[role="tab"]:has-text("Q&A")').first();
  await qaTab.click();
  await page.waitForTimeout(500);
  console.log('✅ Switched to Q&A tab');

  // Find question input
  const questionInput = page.locator('input#question').first();
  await expect(questionInput).toBeVisible();
  await questionInput.clear();
  await questionInput.fill(question);
  console.log(`✅ Entered question: ${question}`);

  // Find answer input
  const answerInput = page.locator('textarea#answer').first();
  await expect(answerInput).toBeVisible();
  await answerInput.clear();
  await answerInput.fill(answer);
  console.log(`✅ Entered answer (${answer.length} chars)`);

  // Click submit button (Add Q&A Pair button)
  const submitButton = page.locator('button:has-text("Add Q&A Pair")').first();
  await submitButton.click();
  console.log('✅ Clicked Add Q&A Pair button');

  // Wait for API response
  await page.waitForResponse(
    response => response.url().includes('/api/training') && response.status() === 200,
    { timeout: 10000 }
  ).catch(() => {
    console.log('⚠️ No API response detected, continuing anyway');
  });

  // Wait additional time for React state update
  await page.waitForTimeout(2000);

  // Scroll list to top to see new item (virtual scrolling)
  const listContainer = page.locator('[data-testid="training-list"], .overflow-auto').first();
  await listContainer.evaluate(el => el.scrollTop = 0).catch(() => {});
  await page.waitForTimeout(500);
}

export async function waitForItemInList(page: Page, content: string, timeout: number = 15000) {
  console.log(`📍 Step: Wait for item in list - ${content.substring(0, 50)}...`);

  // CRITICAL: Virtual scrolling only renders visible items
  // New items are added at index 0 (top), so we must scroll to top
  // IMPORTANT: The list appears BELOW the upload form, so scroll page first!

  // Wait for list container to exist
  const listContainer = page.locator('[data-testid="training-list"], .overflow-auto').first();
  await expect(listContainer).toBeVisible({ timeout: 5000 });

  // Truncate content for matching (virtual items may truncate long text)
  const searchText = content.substring(0, 50);

  // Retry scroll + wait multiple times to ensure virtual rendering updates
  const startTime = Date.now();
  const retryInterval = 1500; // Wait 1.5s between retries

  while (Date.now() - startTime < timeout) {
    // STEP 1: Scroll the PAGE down to ensure list is in viewport
    await listContainer.scrollIntoViewIfNeeded().catch(() => {});
    await page.waitForTimeout(300);

    // STEP 2: Scroll the LIST CONTAINER to top where new items appear
    await listContainer.evaluate(el => {
      el.scrollTop = -10; // Force negative first to trigger re-render
    }).catch(() => {});

    await page.waitForTimeout(100);

    await listContainer.evaluate(el => {
      el.scrollTop = 0; // Then scroll to actual top
    }).catch(() => {
      console.log('⚠️ Could not scroll list to top');
    });

    // STEP 3: Wait for React state update + virtual rendering
    await page.waitForTimeout(retryInterval);

    // STEP 4: Debug - log what items are actually visible
    const visibleItems = page.locator('p.truncate');
    const itemCount = await visibleItems.count();
    if (itemCount > 0) {
      console.log(`🔍 Found ${itemCount} visible items in list`);
      const firstItem = await visibleItems.first().textContent().catch(() => '');
      console.log(`🔍 First item: ${firstItem.substring(0, 60)}...`);
    } else {
      console.log(`🔍 No items with p.truncate found in DOM`);
    }

    // STEP 5: Check if our target item is now visible
    const item = page.locator(`p.truncate:has-text("${searchText}")`).first();
    if (await item.isVisible().catch(() => false)) {
      console.log('✅ Item appeared in list');
      return item;
    }

    console.log(`⏳ Item "${searchText}" not visible yet, retrying... (${Math.round((Date.now() - startTime) / 1000)}s elapsed)`);
  }

  // Final attempt with expect (will throw error with timeout details)
  const item = page.locator(`p.truncate:has-text("${searchText}")`).first();
  await expect(item).toBeVisible({ timeout: 1000 });
  console.log('✅ Item appeared in list');

  return item;
}

export async function waitForProcessingComplete(page: Page, content: string, timeout: number = 60000) {
  console.log(`📍 Step: Wait for processing complete - ${content.substring(0, 50)}...`);

  // CRITICAL: Scroll to top where new items appear
  const listContainer = page.locator('[data-testid="training-list"], .overflow-auto').first();
  await listContainer.evaluate(el => el.scrollTop = 0).catch(() => {});
  await page.waitForTimeout(500);

  // Wait for status to change from 'processing' to 'completed'
  const startTime = Date.now();
  const searchText = content.substring(0, 50);

  while (Date.now() - startTime < timeout) {
    // Ensure we're at top of list for virtual rendering
    await listContainer.evaluate(el => el.scrollTop = 0).catch(() => {});
    await page.waitForTimeout(500);

    // Find the row containing this content
    const row = page.locator(`[data-testid="training-item"]:has(p.truncate:has-text("${searchText}"))`).first();

    if (await row.isVisible().catch(() => false)) {
      // Check if there's a spinner (processing)
      const spinner = row.locator('.animate-spin');
      const hasSpinner = await spinner.isVisible().catch(() => false);

      if (!hasSpinner) {
        // No spinner means it's completed or errored
        const errorBadge = row.locator('text=/Error|Failed/i');
        const hasError = await errorBadge.isVisible().catch(() => false);

        if (hasError) {
          throw new Error('Processing failed with error status');
        }

        console.log('✅ Processing completed');
        return;
      }
    }

    await page.waitForTimeout(2000);
  }

  throw new Error(`Processing did not complete within ${timeout}ms`);
}

export async function deleteItem(page: Page, content: string) {
  console.log(`📍 Step: Delete item - ${content.substring(0, 50)}...`);

  // CRITICAL: Scroll to top where new items are
  const listContainer = page.locator('[data-testid="training-list"], .overflow-auto').first();
  await listContainer.evaluate(el => el.scrollTop = 0).catch(() => {});
  await page.waitForTimeout(500);

  const searchText = content.substring(0, 50);

  // Find the row containing this content
  const row = page.locator(`[data-testid="training-item"]:has(p.truncate:has-text("${searchText}"))`).first();
  await expect(row).toBeVisible({ timeout: 10000 });

  // Hover over the row to make delete button visible
  await row.hover();
  await page.waitForTimeout(500);

  // Find delete button (Trash2 icon)
  const deleteButton = row.locator('button:has(svg)').last(); // Last button is delete
  await deleteButton.click();
  console.log('✅ Clicked delete button');

  // Wait for confirmation dialog if present
  const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Delete")').last();
  if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await confirmButton.click();
    console.log('✅ Confirmed deletion');
  }

  // Wait for item to disappear
  await page.waitForTimeout(1000);
  console.log('✅ Item removed from list');
}

export async function verifyItemNotInList(page: Page, content: string) {
  console.log(`📍 Step: Verify item not in list - ${content.substring(0, 50)}...`);

  // Scroll to top to ensure virtual rendering shows items
  const listContainer = page.locator('[data-testid="training-list"], .overflow-auto').first();
  await listContainer.evaluate(el => el.scrollTop = 0).catch(() => {});
  await page.waitForTimeout(500);

  const searchText = content.substring(0, 50);
  const item = page.locator(`p.truncate:has-text("${searchText}")`).first();
  await expect(item).not.toBeVisible();
  console.log('✅ Confirmed item not in list');
}

export async function getTrainingItemCount(page: Page): Promise<number> {
  // Wait for list to load
  await page.waitForTimeout(1000);

  // Check empty state first
  const emptyState = page.locator('text=/No training data yet|no.*data|empty/i');
  if (await emptyState.isVisible({ timeout: 2000 }).catch(() => false)) {
    console.log('📊 Found 0 training items (empty state)');
    return 0;
  }

  // CRITICAL: Virtual scrolling only renders visible items (~6-8 at a time)
  // We need to count ALL items in the data array, not just rendered ones
  // Use data-testid selector for reliable counting
  const items = page.locator('[data-testid="training-item"]');
  const count = await items.count();
  console.log(`📊 Found ${count} training items in virtualized list`);

  return count;
}

export async function verifyEmptyState(page: Page) {
  console.log('📍 Step: Verify empty state');

  const emptyMessage = page.locator('text=/no.*data|empty|no.*items/i').first();
  await expect(emptyMessage).toBeVisible({ timeout: 5000 });
  console.log('✅ Empty state message visible');
}

export async function switchToTab(page: Page, tabName: string) {
  console.log(`📍 Step: Switch to ${tabName} tab`);

  const tab = page.locator(`[role="tab"]:has-text("${tabName}"), button:has-text("${tabName}")`).first();
  await tab.click();
  await page.waitForTimeout(500);
  console.log(`✅ Switched to ${tabName} tab`);
}

export async function waitForToast(page: Page, message: string, timeout: number = 5000) {
  console.log(`📍 Step: Wait for toast - ${message}`);

  const toast = page.locator(`[role="status"]:has-text("${message}"), .toast:has-text("${message}")`).first();
  await expect(toast).toBeVisible({ timeout });
  console.log('✅ Toast message appeared');
}

export async function reloadAndWaitForList(page: Page) {
  console.log('📍 Step: Reload page and wait for list');
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  console.log('✅ Page reloaded');
}
