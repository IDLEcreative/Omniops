/**
 * Progress Tracker Module
 *
 * Handles progress tracking for web scraping jobs in Redis.
 * Updates statistics including scraped count, total pages, errors,
 * memory usage, concurrency, and success rate.
 */

/**
 * Updates scraping progress in Redis
 *
 * @param {import('ioredis').Redis} redis - Redis client instance
 * @param {string} jobId - Job identifier
 * @param {Object} stats - Progress statistics
 * @param {number} stats.scraped - Number of pages scraped so far
 * @param {number} stats.total - Total number of pages to scrape
 * @param {number} stats.errors - Number of errors encountered
 * @param {number} stats.memoryMB - Current memory usage in MB
 * @param {number} stats.concurrency - Current concurrency level
 * @param {number} stats.successRate - Success rate as decimal (0-1)
 * @returns {Promise<void>}
 *
 * @example
 * await updateProgress(redis, 'job-123', {
 *   scraped: 45,
 *   total: 100,
 *   errors: 2,
 *   memoryMB: 256,
 *   concurrency: 3,
 *   successRate: 0.956
 * });
 */
export async function updateProgress(redis, jobId, stats) {
  const {
    scraped,
    total,
    errors,
    memoryMB,
    concurrency,
    successRate
  } = stats;

  // Format success rate as percentage string
  const successRateFormatted = (successRate * 100).toFixed(1) + '%';

  // Update Redis hash with all progress metrics
  await redis.hset(`crawl:${jobId}`, {
    'stats.scraped': scraped,
    'stats.total': total,
    'stats.errors': errors,
    'stats.memoryMB': memoryMB,
    'stats.concurrency': concurrency,
    'stats.successRate': successRateFormatted,
  });

  // Log progress update
  console.log(
    `[Worker ${jobId}] Progress: ${scraped}/${total} pages ` +
    `(Memory: ${memoryMB}MB, Concurrency: ${concurrency})`
  );
}
