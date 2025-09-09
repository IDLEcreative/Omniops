import { ScraperCleanupService } from './scraper-cleanup';
import { crawlWebsite } from './scraper-api';

// Re-export the original for tests or cases that handle cleanup separately
export { crawlWebsite as crawlWebsiteWithoutCleanup } from './scraper-api';

/**
 * Enhanced crawl function that runs cleanup before and after scraping
 * This ensures no stuck jobs interfere with the current scrape
 * and cleans up if the scrape fails unexpectedly
 */
export async function crawlWebsiteWithCleanup(
  url: string,
  options?: Parameters<typeof crawlWebsite>[1]
): Promise<string> {
  const cleanup = new ScraperCleanupService(process.env.REDIS_URL);
  
  try {
    // Clean up any stuck jobs BEFORE starting
    console.log('🧹 Running pre-scrape cleanup...');
    const preCleanup = await cleanup.cleanupStaleJobs();
    if (preCleanup > 0) {
      console.log(`✅ Cleaned ${preCleanup} stale jobs before starting`);
    }
    
    // Start the actual crawl
    console.log('🚀 Starting crawl...');
    const jobId = await crawlWebsite(url, options);
    
    // For long-running crawls, optionally run periodic cleanup
    // This is only useful for crawls that take hours
    if (options?.maxPages === -1 || (options?.maxPages && options.maxPages > 1000)) {
      // Set up periodic cleanup every 30 minutes for large crawls
      const cleanupInterval = setInterval(async () => {
        try {
          console.log('🧹 Running mid-scrape cleanup check...');
          await cleanup.cleanupStaleJobs();
        } catch (error) {
          console.error('Mid-scrape cleanup failed:', error);
        }
      }, 30 * 60 * 1000); // 30 minutes
      
      // Store interval ID to clear it later
      (global as any)[`cleanup_${jobId}`] = cleanupInterval;
    }
    
    return jobId;
  } catch (error) {
    // If crawl fails, still try to clean up
    console.log('🧹 Running error cleanup...');
    await cleanup.cleanupStaleJobs().catch(console.error);
    throw error;
  } finally {
    await cleanup.disconnect();
  }
}

/**
 * Call this when a crawl job completes to stop its cleanup interval
 */
export async function onCrawlComplete(jobId: string) {
  const intervalId = (global as any)[`cleanup_${jobId}`];
  if (intervalId) {
    clearInterval(intervalId);
    delete (global as any)[`cleanup_${jobId}`];
  }
  
  // Run final cleanup
  const cleanup = new ScraperCleanupService(process.env.REDIS_URL);
  try {
    console.log('🧹 Running post-scrape cleanup...');
    const cleaned = await cleanup.cleanupStaleJobs();
    if (cleaned > 0) {
      console.log(`✅ Cleaned ${cleaned} jobs after scrape`);
    }
  } finally {
    await cleanup.disconnect();
  }
}