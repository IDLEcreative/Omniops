import { Page } from '@playwright/test';

export async function mockScrapingError(page: Page, errorMessage: string): Promise<void> {
  console.log('🔧 Setting up scraping error mock...');
  await page.route('**/api/scrape**', async (route) => {
    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({ success: false, error: errorMessage, message: errorMessage })
    });
  });
  console.log('✅ Scraping error mock ready');
}

export async function mockScrapingAPIs(page: Page, domain: string): Promise<void> {
  console.log('🔧 Setting up scraping API mocks...');
  await page.route('**/api/scrape', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, job_id: 'job-' + Date.now(), message: 'Scraping started successfully' })
      });
    } else {
      await route.continue();
    }
  });
  let statusCallCount = 0;
  await page.route('**/api/scrape/status**', async (route) => {
    statusCallCount++;
    let status, progress, currentStep;
    if (statusCallCount <= 2) {
      status = 'processing'; progress = 25; currentStep = 'Analyzing homepage';
    } else if (statusCallCount <= 4) {
      status = 'processing'; progress = 50; currentStep = 'Discovering pages';
    } else if (statusCallCount <= 6) {
      status = 'processing'; progress = 75; currentStep = 'Scraping pages';
    } else {
      status = 'completed'; progress = 100; currentStep = 'Generating embeddings';
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, status, progress, currentStep, pages_scraped: statusCallCount * 2, embeddings_created: Math.max(0, (statusCallCount - 4) * 2) })
    });
  });
  console.log('✅ Scraping API mocks ready');
}

export function createMockScrapedPages(domain: string, count = 5): Array<{ url: string; title: string; content: string }> {
  const pages = [];
  const pageTypes = ['Homepage', 'About Us', 'Products', 'Services', 'Contact'];
  for (let i = 0; i < count; i++) {
    const pageType = pageTypes[i] || 'Page ' + (i + 1);
    const slug = pageType.toLowerCase().replace(/\s+/g, '-');
    pages.push({ url: 'https://' + domain + '/' + slug, title: pageType, content: 'This is the ' + pageType + ' page content from ' + domain + '.' });
  }
  return pages;
}
