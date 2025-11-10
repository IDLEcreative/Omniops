/**
 * Dynamic Concurrency Adjuster Module
 *
 * Adjusts crawler concurrency dynamically based on system performance.
 * Uses multiple fallback methods to ensure compatibility with different
 * Crawlee versions.
 *
 * @module lib/scraper/concurrency-adjuster
 */

/**
 * Adjusts crawler concurrency dynamically
 *
 * This function attempts to update the crawler's concurrency level using
 * multiple fallback methods to ensure compatibility across different
 * Crawlee versions:
 *
 * 1. autoscaledPool.setDesiredConcurrency() - Preferred method (Crawlee 3.x)
 * 2. autoscaledPool.setMaxConcurrency() - Fallback for older versions
 * 3. Direct property assignment - Last resort if methods unavailable
 *
 * @param {Object} crawler - PlaywrightCrawler instance
 * @param {Object} concurrencyManager - ConcurrencyManager instance
 * @param {string} jobId - Job identifier for logging
 * @param {number} previousConcurrency - Previous concurrency level to compare
 * @returns {Promise<number>} New concurrency level
 *
 * @example
 * const newConcurrency = await adjustConcurrency(
 *   crawler,
 *   concurrencyManager,
 *   'job-123',
 *   5
 * );
 * console.log(`Adjusted to ${newConcurrency} workers`);
 */
async function adjustConcurrency(crawler, concurrencyManager, jobId, previousConcurrency) {
  // Get new concurrency level from manager
  const newConcurrency = concurrencyManager.getCurrent();

  // Only adjust if concurrency has changed and autoscaledPool exists
  if (!crawler.autoscaledPool || newConcurrency === previousConcurrency) {
    return newConcurrency;
  }

  try {
    // Method 1: Try setDesiredConcurrency (preferred - Crawlee 3.x)
    if (typeof crawler.autoscaledPool.setDesiredConcurrency === 'function') {
      await crawler.autoscaledPool.setDesiredConcurrency(newConcurrency);
      console.log(`[Worker ${jobId}] ✅ Adjusted concurrency to ${newConcurrency} via setDesiredConcurrency`);
      return newConcurrency;
    }

    // Method 2: Fallback to setMaxConcurrency (older versions)
    if (typeof crawler.autoscaledPool.setMaxConcurrency === 'function') {
      crawler.autoscaledPool.setMaxConcurrency(newConcurrency);
      console.log(`[Worker ${jobId}] ✅ Adjusted concurrency to ${newConcurrency} via setMaxConcurrency`);
      return newConcurrency;
    }

    // Method 3: Direct property assignment (last resort)
    if (crawler.autoscaledPool.desiredConcurrency !== undefined) {
      crawler.autoscaledPool.desiredConcurrency = newConcurrency;
      console.log(`[Worker ${jobId}] ✅ Adjusted concurrency to ${newConcurrency} via direct property`);
      return newConcurrency;
    }

    // No methods available
    console.log(`[Worker ${jobId}] ⚠️ Cannot dynamically update concurrency - no methods available`);
    return newConcurrency;

  } catch (err) {
    console.error(`[Worker ${jobId}] ❌ Error updating concurrency:`, err.message);
    return newConcurrency; // Return new value even if update failed
  }
}

module.exports = {
  adjustConcurrency,
};
