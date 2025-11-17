/**
 * Test helpers for Conversations Advanced Filters
 */

import { Page } from '@playwright/test';

export const MOCK_CONVERSATIONS = [
  {
    id: 'conv-1',
    customerEmail: 'john@example.com',
    message: 'Great service! Very happy with my order',
    sentiment: 'positive',
    status: 'resolved',
    domain: 'example.com',
    createdAt: '2025-01-15T10:00:00Z'
  },
  {
    id: 'conv-2',
    customerEmail: 'jane@test.com',
    message: 'Product arrived damaged, very disappointed',
    sentiment: 'negative',
    status: 'active',
    domain: 'test.com',
    createdAt: '2025-01-16T14:30:00Z'
  },
  {
    id: 'conv-3',
    customerEmail: 'bob@example.com',
    message: 'When will my order ship?',
    sentiment: 'neutral',
    status: 'waiting',
    domain: 'example.com',
    createdAt: '2025-01-17T09:15:00Z'
  }
];

export const MOCK_DOMAINS = [
  { id: 'domain-1', name: 'example.com' },
  { id: 'domain-2', name: 'test.com' }
];

export async function setupMocks(page: Page) {
  // Mock conversations API
  await page.route('**/api/dashboard/conversations**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        recent: MOCK_CONVERSATIONS,
        statusCounts: { all: 3, active: 1, waiting: 1, resolved: 1 },
        languages: [{ language: 'en', count: 3 }]
      })
    });
  });

  // Mock domains API
  await page.route('**/api/domains**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ domains: MOCK_DOMAINS })
    });
  });
}

export async function openFiltersPanel(page: Page): Promise<boolean> {
  console.log('📍 Opening advanced filters panel');

  // Look for filter button with multiple possible selectors
  const filterButton = page.locator('button[aria-label="Filter conversations"], button:has-text("Filter"), button:has(svg.lucide-filter)').first();

  const isVisible = await filterButton.isVisible({ timeout: 5000 }).catch(() => false);

  if (!isVisible) {
    console.log('⚠️ Filter button not found');
    return false;
  }

  await filterButton.click();
  console.log('✅ Clicked filter button');

  // Wait for panel to open
  await page.waitForTimeout(500);

  // Verify panel is open by looking for filter controls
  const filterPanel = page.locator('[role="dialog"], [data-testid="filters-panel"], .filters-panel').first();
  const panelVisible = await filterPanel.isVisible({ timeout: 3000 }).catch(() => false);

  if (panelVisible) {
    console.log('✅ Filters panel opened');
    return true;
  } else {
    console.log('⚠️ Filters panel did not open');
    return false;
  }
}

export async function applySentimentFilter(page: Page, sentiment: 'positive' | 'negative' | 'neutral') {
  console.log(`📍 Applying ${sentiment} sentiment filter`);

  // Look for sentiment filter controls
  const sentimentSelect = page.locator('select[name="sentiment"], [data-testid="sentiment-filter"]').first();
  const selectVisible = await sentimentSelect.isVisible({ timeout: 3000 }).catch(() => false);

  if (selectVisible) {
    await sentimentSelect.selectOption(sentiment);
    console.log(`✅ Selected ${sentiment} sentiment`);
    return true;
  }

  // Try checkbox/radio buttons as alternative
  const sentimentOption = page.locator(`input[value="${sentiment}"], label:has-text("${sentiment}")`).first();
  const optionVisible = await sentimentOption.isVisible({ timeout: 3000 }).catch(() => false);

  if (optionVisible) {
    await sentimentOption.click();
    console.log(`✅ Clicked ${sentiment} sentiment option`);
    return true;
  }

  console.log(`⚠️ Could not find ${sentiment} sentiment filter`);
  return false;
}

export async function applyDomainFilter(page: Page, domains: string[]) {
  console.log(`📍 Applying domain filter: ${domains.join(', ')}`);

  for (const domain of domains) {
    const domainCheckbox = page.locator(`input[value="${domain}"], label:has-text("${domain}")`).first();
    const checkboxVisible = await domainCheckbox.isVisible({ timeout: 3000 }).catch(() => false);

    if (checkboxVisible) {
      await domainCheckbox.click();
      console.log(`✅ Selected domain: ${domain}`);
    } else {
      console.log(`⚠️ Could not find domain filter for: ${domain}`);
    }
  }
}

export async function applyEmailFilter(page: Page, email: string) {
  console.log(`📍 Applying email filter: ${email}`);

  const emailInput = page.locator('input[name="customerEmail"], input[placeholder*="email"]').first();
  const inputVisible = await emailInput.isVisible({ timeout: 3000 }).catch(() => false);

  if (inputVisible) {
    await emailInput.fill(email);
    console.log(`✅ Entered email: ${email}`);
    return true;
  }

  console.log('⚠️ Could not find email filter input');
  return false;
}

export async function applyFilters(page: Page) {
  console.log('📍 Applying filters');

  // Look for apply button
  const applyButton = page.locator('button:has-text("Apply"), button:has-text("Apply Filters")').first();
  const buttonVisible = await applyButton.isVisible({ timeout: 3000 }).catch(() => false);

  if (buttonVisible) {
    await applyButton.click();
    console.log('✅ Clicked Apply button');
    await page.waitForTimeout(1000);
    return true;
  }

  console.log('⚠️ Apply button not found');
  return false;
}

export async function clearAllFilters(page: Page) {
  console.log('📍 Clearing all filters');

  const clearButton = page.locator('button:has-text("Clear"), button:has-text("Clear All")').first();
  const buttonVisible = await clearButton.isVisible({ timeout: 3000 }).catch(() => false);

  if (buttonVisible) {
    await clearButton.click();
    console.log('✅ Clicked Clear All button');
    await page.waitForTimeout(1000);
    return true;
  }

  console.log('⚠️ Clear button not found');
  return false;
}

export async function verifyFilterBadgeCount(page: Page, expectedCount: number) {
  console.log(`📍 Verifying filter badge shows count: ${expectedCount}`);

  const badge = page.locator('[data-testid="filter-badge"], .filter-count, .badge').first();
  const badgeVisible = await badge.isVisible({ timeout: 3000 }).catch(() => false);

  if (badgeVisible) {
    const badgeText = await badge.textContent();
    const count = parseInt(badgeText?.match(/\d+/)?.[0] || '0');

    if (count === expectedCount) {
      console.log(`✅ Filter badge shows correct count: ${count}`);
      return true;
    } else {
      console.log(`⚠️ Filter badge shows ${count}, expected ${expectedCount}`);
      return false;
    }
  }

  console.log('⚠️ Filter badge not visible');
  return false;
}

export async function verifyConversationResults(page: Page, expectedCount: number) {
  console.log(`📍 Verifying ${expectedCount} conversations displayed`);

  // Wait for results to update
  await page.waitForTimeout(1500);

  const conversations = page.locator('[data-testid="conversation-item"], .conversation-item, [role="listitem"]');
  const count = await conversations.count();

  if (count === expectedCount) {
    console.log(`✅ Showing ${count} conversation(s)`);
    return true;
  } else {
    console.log(`⚠️ Showing ${count} conversations, expected ${expectedCount}`);
    return false;
  }
}