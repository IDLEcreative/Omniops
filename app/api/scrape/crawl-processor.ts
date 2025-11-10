import { checkCrawlStatus } from '@/lib/scraper-api';

// ⚠️ NOTE: Removed embedding service imports
// The worker handles all embedding generation now
// No services needed in this monitor-only file

/**
 * Background job to MONITOR crawl results
 *
 * ⚠️ CRITICAL: This is now a READ-ONLY monitor
 * The worker (lib/scraper-worker.js) is the SINGLE SOURCE OF TRUTH for:
 * - Saving pages to scraped_pages
 * - Deleting old embeddings
 * - Generating new embeddings
 * - Inserting embeddings
 *
 * This function ONLY polls Redis for job status and logs completion.
 * DO NOT add any data processing logic here - it will create race conditions!
 */
export async function processCrawlResults(jobId: string, supabase: any) {
  try {
    console.log(`[CrawlMonitor] Starting monitoring for job ${jobId}`);
    console.log(`[CrawlMonitor] Worker is handling all data operations (pages + embeddings)`);

    let completed = false;
    let retries = 0;
    const maxRetries = 60; // 5 minutes with 5-second intervals

    while (!completed && retries < maxRetries) {
      const crawlStatus = await checkCrawlStatus(jobId);

      if (crawlStatus.status === 'completed') {
        console.log(`[CrawlMonitor] ✅ Job ${jobId} completed successfully`);
        console.log(`[CrawlMonitor] Worker handled all page saving and embedding generation`);
        console.log(`[CrawlMonitor] No duplicate embeddings created (worker is single source of truth)`);
        completed = true;
      } else if (crawlStatus.status === 'failed') {
        console.error(`[CrawlMonitor] ❌ Job ${jobId} failed:`, crawlStatus);
        break;
      } else {
        // Still processing, wait and retry
        if (retries % 6 === 0) { // Log every 30 seconds
          console.log(`[CrawlMonitor] Job ${jobId} still processing... (${retries * 5}s elapsed)`);
        }
        await new Promise(resolve => setTimeout(resolve, 5000));
        retries++;
      }
    }

    if (!completed && retries >= maxRetries) {
      console.error(`[CrawlMonitor] ⏱️ Job ${jobId} timed out after ${maxRetries * 5} seconds`);
    }
  } catch (error) {
    console.error(`[CrawlMonitor] Error monitoring crawl job ${jobId}:`, error);
  }
}

// ⚠️ REMOVED: processPagesIndividually() and processPage()
// These functions created race conditions with the worker.
// The worker (lib/scraper-worker.js) is now the ONLY place that:
// - Saves pages to database
// - Deletes old embeddings
// - Generates new embeddings
// - Inserts embeddings
//
// DO NOT add page processing logic back here!
