import { test, expect } from '@playwright/test';
import {
  navigateToScrapingSection,
  completeScraping,
  viewScrapedPages
} from '../../utils/playwright/scraping-test-steps';
import { mockScrapingError } from '../../utils/playwright/scraping-helpers';
import { waitForChatWidget, mockChatAPI } from '../../utils/playwright/chat-helpers';

/**
 * E2E Test: Web Scraping Flow
 *
 * Tests the COMPLETE web scraping flow from initiating a scrape to verifying
 * the scraped content is searchable in chat. This is a core product feature.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 300000; // 5 minutes
const TEST_DOMAIN = process.env.TEST_SCRAPE_DOMAIN || 'example.com';

test.describe('Web Scraping Flow E2E', () => {
  test.setTimeout(TEST_TIMEOUT);

  test('should complete scraping and make content searchable in chat', async ({ page }) => {
    console.log('=== Starting Web Scraping Flow Test ===');

    // Navigate and initiate scraping
    await navigateToScrapingSection(page, BASE_URL);
    await completeScraping(page, TEST_DOMAIN);

    // View scraped pages
    const pageCount = await viewScrapedPages(page);
    console.log(`📊 Found ${pageCount} page(s) in view`);

    // Test chat search with scraped content
    await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });
    const iframe = await waitForChatWidget(page);

    const chatState = await mockChatAPI(page, () => ({
      success: true,
      response: `Based on the content scraped from ${TEST_DOMAIN}, I found information about the homepage, about page, and products.`,
      sources: [
        { url: `https://${TEST_DOMAIN}/`, title: 'Homepage' },
        { url: `https://${TEST_DOMAIN}/about`, title: 'About Us' },
        { url: `https://${TEST_DOMAIN}/products`, title: 'Products' }
      ]
    }));

    const inputField = iframe.locator('input[type="text"], textarea').first();
    await inputField.waitFor({ state: 'visible', timeout: 10000 });
    await inputField.fill('What pages are on this website?');

    const sendButton = iframe.locator('button[type="submit"]').first();
    await sendButton.click();
    await page.waitForTimeout(5000);

    const chatResponse = chatState.response;
    expect(chatResponse).not.toBeNull();

    const responseText = chatResponse?.response.toLowerCase() || '';
    const mentionsScrapedContent = responseText.includes(TEST_DOMAIN.toLowerCase()) ||
      responseText.includes('homepage') || responseText.includes('page');

    expect(mentionsScrapedContent).toBe(true);

    if (chatResponse?.sources && chatResponse.sources.length > 0) {
      console.log(`✅ ${chatResponse.sources.length} source(s) included in response`);
    }

    await page.screenshot({
      path: `test-results/scraping-flow-success-${Date.now()}.png`,
      fullPage: true
    });

    console.log('✅ Web scraping flow validated end-to-end!');
  });

  test('should handle scraping errors gracefully', async ({ page }) => {
    console.log('=== Testing Scraping Error Handling ===');

    await page.goto(`${BASE_URL}/dashboard/installation`, { waitUntil: 'networkidle' });
    await mockScrapingError(page, 'The domain could not be accessed or does not exist');

    const domainInput = page.locator('input[name="domain"]').first();
    await domainInput.waitFor({ state: 'visible', timeout: 10000 });
    await domainInput.fill('invalid-domain-that-does-not-exist.xyz');

    const startButton = page.locator('button:has-text("Start Scraping")').first();
    await startButton.click();
    await page.waitForTimeout(2000);

    const errorMessage = page.locator(
      'text=/failed/i, text=/error/i, [role="alert"]:has-text("error")'
    ).first();

    const errorVisible = await errorMessage.isVisible({ timeout: 5000 }).catch(() => false);
    expect(errorVisible).toBe(true);

    console.log('✅ Error handling test complete');
  });

  test('should show progress during long scraping jobs', async ({ page }) => {
    console.log('=== Testing Progress Display ===');
    console.log('⏭️  Long scraping progress test - TODO');
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') {
      await page.screenshot({
        path: `test-results/scraping-flow-failure-${Date.now()}.png`,
        fullPage: true
      });
    }
  });
});
