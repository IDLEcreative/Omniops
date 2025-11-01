/**
 * Scraper API Request Handlers
 * Handles page navigation, content extraction, and request processing
 */

import { getMemoryAwareJobManager } from '../redis-enhanced';
import { ScrapedPage, AIOptimizedResult } from '../scraper-api-types';
import { setupPreNavigationHook, waitForContent } from './page-navigation';
import { validatePageSize, validateExtractedContent } from './validation';
import { extractPageContent } from './extraction';
import { buildResult } from './result-builder';

// Re-export sub-modules
export { setupPreNavigationHook } from './page-navigation';
export { validatePageSize, validateExtractedContent } from './validation';
export { extractPageContent } from './extraction';
export { buildResult } from './result-builder';

// Re-export existing modules
export * from './types';
export * from './resource-blocker';
export * from './ai-optimizer';
export * from './error-handler';

// Get job manager instance
const jobManager = getMemoryAwareJobManager();

/**
 * Request handler - processes the page and extracts content
 */
export async function handlePageRequest(
  page: any,
  request: any,
  finalConfig: any,
  config: any,
  scrapeStartTime: number
): Promise<ScrapedPage | AIOptimizedResult> {
  const startTime = Date.now();
  console.log(`[SCRAPER] Request handler started for: ${request.url}`);

  try {
    // Wait for content to load
    await waitForContent(page, finalConfig);

    // Get the full HTML
    console.log(`[SCRAPER] Extracting page HTML content...`);
    const html = await page.content();
    console.log(`[SCRAPER] Page HTML extracted, length: ${html.length} characters`);

    // Validate page size
    validatePageSize(html, finalConfig);

    // Extract content
    const extracted = await extractPageContent(html, request.url, config, finalConfig);

    // Validate content
    validateExtractedContent(extracted, finalConfig);

    // Update rate limit
    const responseTime = Date.now() - startTime;
    await updateRateLimit(request.url, responseTime, finalConfig);

    // Build and return result
    return await buildResult(extracted, request.url, config, responseTime, scrapeStartTime);

  } catch (error) {
    logRequestError(error, request.url, startTime);
    throw error;
  }
}

/**
 * Update rate limit based on response time
 */
async function updateRateLimit(url: string, responseTime: number, finalConfig: any): Promise<void> {
  const domain = new URL(url).hostname;
  console.log(`[SCRAPER] Page processed in ${responseTime}ms for domain: ${domain}`);

  if (finalConfig.rateLimit.adaptiveDelay) {
    await jobManager.updateRateLimitDelay(domain, responseTime);
  }
}

/**
 * Log request processing error
 */
function logRequestError(error: unknown, url: string, startTime: number): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  console.error(`[SCRAPER] ERROR in requestHandler for ${url}:`);
  console.error(`[SCRAPER] Error message: ${errorMessage}`);
  if (errorStack) {
    console.error(`[SCRAPER] Error stack:`, errorStack);
  }
  console.error(`[SCRAPER] Error occurred at: ${new Date().toISOString()}`);
  console.error(`[SCRAPER] Processing time before error: ${Date.now() - startTime}ms`);
}
