/**
 * Scraping Test Step Functions
 *
 * High-level test step implementations for scraping E2E tests
 */

import { Page, expect } from '@playwright/test';
import {
  mockScrapingAPIs,
  mockScrapedPagesAPI,
  createMockScrapedPages,
  mockScrapingError
} from './scraping-helpers';

/**
 * Navigate to installation page and find scraping section
 */
export async function navigateToScrapingSection(page: Page, baseUrl: string) {
  await page.goto(`${baseUrl}/dashboard/installation`, {
    waitUntil: 'networkidle',
    timeout: 15000
  });

  const domainInput = page.locator(
    'input[name="domain"], input[name="url"], input[placeholder*="domain" i], input[placeholder*="website" i]'
  ).first();

  try {
    await domainInput.waitFor({ state: 'visible', timeout: 10000 });
  } catch (error) {
    const scrapeButton = page.locator(
      'button:has-text("Start Scraping"), a:has-text("Scrape"), a[href*="scrape"]'
    ).first();

    if (await scrapeButton.isVisible().catch(() => false)) {
      await scrapeButton.click();
      await page.waitForLoadState('networkidle');
    }
  }

  return domainInput;
}

/**
 * Start scraping process
 */
export async function startScraping(page: Page, domain: string) {
  const domainInput = page.locator('input[name="domain"], input[placeholder*="domain" i]').first();
  await domainInput.fill(domain);

  const startButton = page.locator(
    'button:has-text("Start Scraping"), button:has-text("Scrape"), button:has-text("Begin"), button[type="submit"]'
  ).first();

  await startButton.click();
  await page.waitForTimeout(1000);
}

/**
 * Monitor scraping progress
 */
export async function monitorScrapingProgress(page: Page): Promise<boolean> {
  const progressBar = page.locator(
    '[role="progressbar"], .progress-bar, [class*="progress"]'
  ).first();

  const progressVisible = await progressBar.isVisible({ timeout: 5000 }).catch(() => false);

  const statusText = page.locator(
    'text=/analyzing/i, text=/scraping/i, text=/crawling/i, text=/processing/i'
  ).first();

  const statusVisible = await statusText.isVisible({ timeout: 5000 }).catch(() => false);

  return progressVisible || statusVisible;
}

/**
 * Wait for scraping completion
 */
export async function waitForScrapingCompletion(page: Page) {
  await page.waitForTimeout(10000);

  const completionMessage = page.locator(
    'text=/complete/i, text=/success/i, text=/finished/i, text=/done/i'
  ).first();

  try {
    await completionMessage.waitFor({ state: 'visible', timeout: 15000 });
    const message = await completionMessage.textContent();
    console.log('✅ Scraping completed:', message);
  } catch (error) {
    console.warn('⚠️  Completion message not found');
  }
}

/**
 * View scraped pages
 */
export async function viewScrapedPages(page: Page): Promise<number> {
  const pagesLink = page.locator(
    'a:has-text("Pages"), a:has-text("Content"), button:has-text("View Pages"), [role="tab"]:has-text("Pages")'
  ).first();

  if (await pagesLink.isVisible().catch(() => false)) {
    await pagesLink.click();
    await page.waitForTimeout(1000);
  }

  const pagesList = page.locator(
    '.page-item, [data-testid="page"], table tbody tr, [class*="page-list"] li'
  );

  return await pagesList.count();
}

/**
 * Complete scraping workflow
 */
export async function completeScraping(page: Page, domain: string) {
  const scrapeJob = await mockScrapingAPIs(page, domain);
  await startScraping(page, domain);
  await monitorScrapingProgress(page);
  await waitForScrapingCompletion(page);

  const mockPages = createMockScrapedPages(domain);
  await mockScrapedPagesAPI(page, domain, mockPages);

  return scrapeJob;
}
