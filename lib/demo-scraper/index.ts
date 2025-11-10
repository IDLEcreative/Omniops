/**
 * Demo Scraper - Main Orchestrator
 * Quickly scrapes a website's landing page and optionally 2-3 key pages from sitemap
 * Used for instant demo - no database storage
 */

import { scrapePage } from './page-scraper';
import { parseSitemap, scoreSitemapPages } from './sitemap-parser';

export type {
  ScrapedPage,
  QuickScrapeOptions,
  QuickScrapeResult,
  ChunkMetadata,
  DemoEmbeddingsResult
} from './types';

export { generateDemoEmbeddings } from './embeddings';

import type { QuickScrapeOptions, QuickScrapeResult } from './types';

/**
 * Quickly scrapes a website's landing page and optionally 2-3 key pages from sitemap
 * Used for instant demo - no database storage
 */
export async function quickScrape(
  url: string,
  options: QuickScrapeOptions = { maxPages: 3, timeout: 8000, useSitemap: true }
): Promise<QuickScrapeResult> {
  const startTime = Date.now();
  const results: any[] = [];

  try {
    // 1. Scrape landing page first
    const landingPage = await scrapePage(url, options.timeout);
    if (landingPage) {
      results.push(landingPage);
    }

    // 2. Try sitemap if enabled and we have budget for more pages
    if (options.useSitemap && results.length < options.maxPages) {
      const sitemapUrls = await parseSitemap(url, options.timeout);
      const priorityPages = scoreSitemapPages(sitemapUrls, url);

      // Scrape top priority pages
      const remainingSlots = options.maxPages - results.length;
      const pagesToScrape = priorityPages.slice(0, remainingSlots);

      for (const pageUrl of pagesToScrape) {
        const remainingTime = options.timeout - (Date.now() - startTime);
        if (remainingTime <= 1000) break; // Need at least 1s per page

        const page = await scrapePage(pageUrl, Math.min(remainingTime, 3000));
        if (page) {
          results.push(page);
        }
      }
    }

    const scrapeDuration = Date.now() - startTime;

    return {
      pages: results,
      totalPages: results.length,
      scrapeDuration
    };

  } catch (error) {
    const scrapeDuration = Date.now() - startTime;
    return {
      pages: results,
      totalPages: results.length,
      scrapeDuration,
      error: error instanceof Error ? error.message : 'Scraping failed'
    };
  }
}
