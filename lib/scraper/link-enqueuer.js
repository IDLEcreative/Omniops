/**
 * Link Enqueueing Module
 *
 * Handles enqueueing of new links during crawling with limit management.
 *
 * @module lib/scraper/link-enqueuer
 */

/**
 * Enqueues new links for crawling with limit management
 *
 * Calculates the remaining page limit and enqueues links using same-domain
 * strategy. Limits links per call to 100 for performance.
 *
 * @param {Function} enqueueLinks - Crawlee's enqueueLinks function
 * @param {number} maxPages - Maximum pages to scrape (-1 for unlimited)
 * @param {number} currentCount - Current number of pages visited
 * @returns {Promise<number>} Number of links enqueued
 *
 * @example
 * const enqueued = await enqueueNewLinks(
 *   enqueueLinks,
 *   maxPagesToScrape,
 *   visited.size
 * );
 * console.log(`Enqueued ${enqueued} new links`);
 */
export async function enqueueNewLinks(enqueueLinks, maxPages, currentCount) {
  // Calculate how many more pages we can scrape
  const hasUnlimitedScraping = maxPages === -1;
  const hasReachedLimit = !hasUnlimitedScraping && currentCount >= maxPages;

  // Don't enqueue if we've reached the limit
  if (hasReachedLimit) {
    return 0;
  }

  // Calculate limit for this batch (max 100 per page)
  const remainingPages = hasUnlimitedScraping
    ? 100
    : Math.min(100, maxPages - currentCount);

  // Enqueue links with same-domain strategy
  const result = await enqueueLinks({
    strategy: 'same-domain',
    limit: remainingPages,
  });

  // Return number of links enqueued (if result provides this info)
  return result?.processedRequests?.length || remainingPages;
}
