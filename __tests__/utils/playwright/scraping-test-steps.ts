import { Page } from '@playwright/test';

export async function navigateToScrapingSection(page: Page, baseUrl: string): Promise<void> {
  console.log('📍 Step 1: Navigating to scraping section');
  await page.goto(baseUrl + '/dashboard/installation', { waitUntil: 'networkidle', timeout: 15000 });
  console.log('✅ Installation page loaded');
}

export async function completeScraping(page: Page, domain: string): Promise<void> {
  console.log('📍 Step 2: Initiating scraping for ' + domain);
  let scrapeJobId: string | null = null;
  await page.route('**/api/scrape', async (route) => {
    if (route.request().method() === 'POST') {
      scrapeJobId = 'job-' + Date.now();
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, job_id: scrapeJobId, message: 'Scraping started successfully' }) });
    } else {
      await route.continue();
    }
  });
  let statusCallCount = 0;
  await page.route('**/api/scrape/status**', async (route) => {
    statusCallCount++;
    const stages = [
      { status: 'processing', progress: 25, step: 'Analyzing homepage' },
      { status: 'processing', progress: 50, step: 'Discovering pages' },
      { status: 'processing', progress: 75, step: 'Scraping pages' },
      { status: 'completed', progress: 100, step: 'Generating embeddings' }
    ];
    const stageIndex = Math.min(Math.floor(statusCallCount / 2), stages.length - 1);
    const stage = stages[stageIndex];
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, ...stage, pages_scraped: statusCallCount * 2, embeddings_created: Math.max(0, (statusCallCount - 4) * 2) }) });
  });
  const domainInput = page.locator('input[name="domain"], input[placeholder*="domain" i]').first();
  await domainInput.waitFor({ state: 'visible', timeout: 10000 });
  await domainInput.fill(domain);
  console.log('✅ Entered domain: ' + domain);
  const startButton = page.locator('button:has-text("Start Scraping"), button:has-text("Begin Scraping"), button[type="submit"]').first();
  await startButton.click();
  console.log('✅ Scraping started');
  await page.waitForTimeout(8000);
  console.log('✅ Scraping completed');
}

export async function viewScrapedPages(page: Page): Promise<number> {
  console.log('📍 Step 3: Viewing scraped pages');
  const pagesLink = page.locator('a:has-text("Pages"), a:has-text("Scraped Pages"), a[href*="pages"]').first();
  const linkVisible = await pagesLink.isVisible({ timeout: 5000 }).catch(() => false);
  if (linkVisible) {
    await pagesLink.click();
    await page.waitForLoadState('networkidle');
  }
  const pageItems = page.locator('.page-item, .scraped-page, [data-page-url], tr:has-text("http")');
  const count = await pageItems.count();
  console.log('✅ Viewing ' + count + ' scraped page(s)');
  return count;
}
