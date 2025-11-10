/**
 * Crawler Configuration Builder
 *
 * Builds PlaywrightCrawler configuration with optimized settings for performance
 * and resource efficiency. Handles dynamic concurrency, browser optimization,
 * and timeout management.
 *
 * @module lib/scraper/crawler-config
 */

/**
 * Builds PlaywrightCrawler configuration with optimized settings
 *
 * @param {Object} options - Configuration options
 * @param {number} options.maxPages - Maximum number of pages to scrape (-1 for unlimited)
 * @param {boolean} options.turboMode - Whether to use turbo mode (higher concurrency)
 * @param {Object} options.concurrencyManager - ConcurrencyManager instance for dynamic concurrency
 * @returns {Object} PlaywrightCrawler options object
 *
 * @example
 * const crawlerOptions = buildCrawlerConfig({
 *   maxPages: 100,
 *   turboMode: true,
 *   concurrencyManager
 * });
 * const crawler = new PlaywrightCrawler({ ...crawlerOptions, requestHandler });
 */
export function buildCrawlerConfig({ maxPages, turboMode, concurrencyManager }) {
  // Get current concurrency from manager
  const initialConcurrency = concurrencyManager.getCurrent();

  // Calculate max requests per crawl
  // Use a large number (1M) for unlimited scraping, otherwise use specified limit
  const maxRequests = maxPages === -1 ? 1000000 : maxPages;

  return {
    // Crawl limits
    maxRequestsPerCrawl: maxRequests,
    maxConcurrency: initialConcurrency,

    // Timeout configuration
    // Reduced from 30 to 20 seconds for better resource management
    requestHandlerTimeoutSecs: 20,
    navigationTimeoutSecs: 20,

    // Browser launch configuration
    // Optimized for headless performance and resource efficiency
    launchContext: {
      launchOptions: {
        headless: true,
        args: [
          // Security and sandbox settings
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-web-security',

          // Resource optimization
          '--disable-dev-shm-usage', // Overcome limited shared memory problems
          '--disable-gpu', // Disable GPU for better performance in headless

          // Feature disabling for performance
          '--disable-features=IsolateOrigins,site-per-process',
          '--disable-blink-features=AutomationControlled',

          // Startup optimization
          '--no-first-run',
          '--no-default-browser-check',
        ],
      },
    },
  };
}

/**
 * Browser launch arguments explanation:
 *
 * Security & Sandbox:
 * - --no-sandbox: Disables Chrome sandbox (required in Docker/CI)
 * - --disable-setuid-sandbox: Alternative sandbox disabling
 * - --disable-web-security: Allows cross-origin requests
 *
 * Resource Optimization:
 * - --disable-dev-shm-usage: Fixes shared memory issues in containers
 * - --disable-gpu: Saves resources in headless mode
 *
 * Performance:
 * - --disable-features=IsolateOrigins,site-per-process: Reduces process overhead
 * - --disable-blink-features=AutomationControlled: Hides automation detection
 *
 * Startup Speed:
 * - --no-first-run: Skips first-run setup
 * - --no-default-browser-check: Skips default browser check
 */
