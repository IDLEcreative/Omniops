/**
 * Scraping E2E Test Helpers
 *
 * Reusable utilities for web scraping flow testing
 */

import { Page, Route } from '@playwright/test';

export interface ScrapeJob {
  jobId: string;
  domain: string;
  estimatedPages: number;
}

export interface ScrapePage {
  id: string;
  url: string;
  title: string;
  scraped_at: string;
}

/**
 * Setup scraping API mocks with progress simulation
 */
export async function mockScrapingAPIs(page: Page, domain: string): Promise<ScrapeJob> {
  const scrapeJobId = `job-${Date.now()}`;

  // Mock scrape start endpoint
  await page.route('**/api/scrape', async (route: Route) => {
    if (route.request().method() === 'POST') {
      const requestData = route.request().postDataJSON();
      console.log('🔍 Scrape request:', { domain: requestData.domain });

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Scraping started',
          job_id: scrapeJobId,
          domain: domain,
          estimated_pages: 10
        })
      });
    } else {
      await route.continue();
    }
  });

  // Mock scrape status endpoint with progressive updates
  let statusCallCount = 0;
  await page.route('**/api/scrape/status**', async (route: Route) => {
    statusCallCount++;

    let status: string, progress: number, currentStep: string;

    if (statusCallCount <= 2) {
      status = 'processing';
      progress = 25;
      currentStep = 'Analyzing homepage';
    } else if (statusCallCount <= 4) {
      status = 'processing';
      progress = 50;
      currentStep = 'Discovering pages from sitemap';
    } else if (statusCallCount <= 6) {
      status = 'processing';
      progress = 75;
      currentStep = 'Crawling pages (5/10)';
    } else if (statusCallCount <= 8) {
      status = 'processing';
      progress = 90;
      currentStep = 'Generating embeddings';
    } else {
      status = 'completed';
      progress = 100;
      currentStep = 'Complete';
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        job_id: scrapeJobId,
        status,
        progress,
        current_step: currentStep,
        pages_scraped: Math.min(statusCallCount, 10),
        total_pages: 10
      })
    });
  });

  return { jobId: scrapeJobId, domain, estimatedPages: 10 };
}

/**
 * Mock scraped pages API
 */
export async function mockScrapedPagesAPI(page: Page, domain: string, pages: ScrapePage[]) {
  await page.route('**/api/pages**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        pages,
        total: pages.length,
        domain
      })
    });
  });
}

/**
 * Generate mock scraped pages
 */
export function createMockScrapedPages(domain: string): ScrapePage[] {
  return [
    {
      id: 'page-1',
      url: `https://${domain}/`,
      title: 'Homepage',
      scraped_at: new Date().toISOString()
    },
    {
      id: 'page-2',
      url: `https://${domain}/about`,
      title: 'About Us',
      scraped_at: new Date().toISOString()
    },
    {
      id: 'page-3',
      url: `https://${domain}/products`,
      title: 'Products',
      scraped_at: new Date().toISOString()
    }
  ];
}

/**
 * Mock scraping error
 */
export async function mockScrapingError(page: Page, errorMessage: string) {
  await page.route('**/api/scrape', async (route: Route) => {
    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({
        error: 'Failed to scrape domain',
        message: errorMessage
      })
    });
  });
}
