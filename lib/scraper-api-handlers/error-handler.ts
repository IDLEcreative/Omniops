/**
 * Error handling utilities for scraper
 * Extracted from scraper-api-handlers.ts
 */

/**
 * Failed request handler
 * Processes and categorizes scraper errors
 */
export function handleFailedRequest(
  request: any,
  error: any,
  url: string,
  finalConfig: any,
  scrapeStartTime: number,
  reject: (error: Error) => void
): void {
  const errorMessage = error.message || String(error);
  const errorStack = error.stack || undefined;

  console.error(`[SCRAPER] FAILED REQUEST HANDLER triggered for: ${request.url}`);
  console.error(`[SCRAPER] Error type: ${error.name || 'Unknown'}`);
  console.error(`[SCRAPER] Error message: ${errorMessage}`);
  if (errorStack) {
    console.error(`[SCRAPER] Error stack:`, errorStack);
  }
  console.error(`[SCRAPER] Failed at: ${new Date().toISOString()}`);
  console.error(`[SCRAPER] Total time before failure: ${Date.now() - scrapeStartTime}ms`);

  // Check if it's a timeout error
  if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
    const timeoutError = `Timeout scraping ${url}: Page took too long to load (exceeded ${finalConfig.timeouts.navigation}ms)`;
    console.error(`[SCRAPER] Identified as TIMEOUT error`);
    reject(new Error(timeoutError));
  } else if (errorMessage.includes('net::') || errorMessage.includes('NS_ERROR')) {
    const networkError = `Network error scraping ${url}: ${errorMessage}`;
    console.error(`[SCRAPER] Identified as NETWORK error`);
    reject(new Error(networkError));
  } else {
    console.error(`[SCRAPER] Identified as GENERAL error`);
    reject(new Error(`Failed to scrape ${url}: ${errorMessage}`));
  }
}
