import { Page } from '@playwright/test';

/**
 * Helper functions for conversation filters
 */

export async function applyDateRangeFilter(page: Page, dateRange: string): Promise<boolean> {
  const dateRangeSelector = page.locator('select[name="dateRange"], [data-testid="date-range"]').first();
  if (await dateRangeSelector.isVisible()) {
    await dateRangeSelector.selectOption({ label: dateRange });
    console.log(`✅ Date range filter applied: ${dateRange}`);
    return true;
  }
  return false;
}

export async function applyStatusFilter(page: Page, status: string): Promise<boolean> {
  const statusCheckbox = page.locator(
    `input[value="${status}"], label:has-text("${status}") input[type="checkbox"]`
  ).first();
  if (await statusCheckbox.isVisible()) {
    await statusCheckbox.check();
    console.log(`✅ Status filter applied: ${status}`);
    return true;
  }
  return false;
}

export async function openFiltersPanel(page: Page): Promise<boolean> {
  const filtersButton = page.locator('button:has-text("Filters"), button[aria-label*="filter"]').first();

  if (await filtersButton.isVisible()) {
    await filtersButton.click();
    console.log('✅ Advanced filters opened');
    return true;
  }
  console.log('⚠️ Advanced filters not available');
  return false;
}

export async function submitFilters(page: Page): Promise<boolean> {
  const applyButton = page.locator('button:has-text("Apply"), button:has-text("Search")').first();
  if (await applyButton.isVisible()) {
    await applyButton.click();
    console.log('✅ Filters applied successfully');
    await page.waitForTimeout(2000);
    return true;
  }
  return false;
}
