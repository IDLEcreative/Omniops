import { Job } from 'bullmq';
import { JobData, FullCrawlJobData } from './queue-manager';
import { scrapePage, checkCrawlStatus } from '../scraper-api';
import { crawlWebsiteWithCleanup } from '../scraper-with-cleanup';
import { JobResult, ProgressUpdate } from './job-processor-types';
import { updateProgress } from './job-processor-utils';

/**
 * Process a single page scraping job
 */
export async function processSinglePageJob(
  job: Job<JobData>,
  jobData: JobData
): Promise<JobResult> {
  const startTime = Date.now();

  try {
    const singlePageData = jobData as any; // Type assertion
    await updateProgress(job, {
      percentage: 10,
      message: `Starting to scrape ${singlePageData.url}`,
      currentUrl: singlePageData.url,
    });

    // Scrape the page using the existing scraper-api
    const result = await scrapePage(singlePageData.url, singlePageData.config);

    await updateProgress(job, {
      percentage: 90,
      message: 'Processing scraped content',
      pagesProcessed: 1,
      totalPages: 1,
    });

    await updateProgress(job, {
      percentage: 100,
      message: 'Scraping completed successfully',
      pagesProcessed: 1,
      totalPages: 1,
    });

    return {
      success: true,
      data: result,
      duration: Date.now() - startTime,
      pagesProcessed: 1,
      totalPages: 1,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    await updateProgress(job, {
      percentage: 0,
      message: `Failed to scrape: ${errorMessage}`,
      errors: 1,
    });

    return {
      success: false,
      error: errorMessage,
      duration: Date.now() - startTime,
      pagesProcessed: 0,
      totalPages: 1,
    };
  }
}

/**
 * Process a full crawl job
 */
export async function processFullCrawlJob(
  job: Job<JobData>,
  jobData: JobData,
  isShuttingDown: () => boolean
): Promise<JobResult> {
  const startTime = Date.now();

  try {
    await updateProgress(job, {
      percentage: 5,
      message: `Starting full crawl of ${(jobData as FullCrawlJobData).url}`,
      currentUrl: (jobData as FullCrawlJobData).url,
    });

    // Start the crawl using the existing scraper-api
    const crawlResult = await crawlWebsiteWithCleanup((jobData as FullCrawlJobData).url, {
      ...(jobData as any).config,
      onProgress: async (progress: any) => {
        // Update progress based on crawl progress
        const percentage = Math.min(95, Math.max(10, progress.percentage || 0));

        await updateProgress(job, {
          percentage,
          message: `Crawling: ${progress.completed}/${progress.total} pages`,
          pagesProcessed: progress.completed,
          totalPages: progress.total,
          currentUrl: progress.currentUrl,
          errors: progress.failed || 0,
        });
      },
    });

    // Monitor crawl status if needed
    if ((crawlResult as any).jobId) {
      let crawlStatus: any;
      do {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        crawlStatus = await checkCrawlStatus((crawlResult as any).jobId);

        if (crawlStatus) {
          const percentage = Math.min(95, Math.max(10, crawlStatus.progress || 0));

          await updateProgress(job, {
            percentage,
            message: `Crawling: ${crawlStatus.completed}/${crawlStatus.total} pages`,
            pagesProcessed: crawlStatus.completed,
            totalPages: crawlStatus.total,
            errors: crawlStatus.failed || 0,
          });
        }
      } while (
        crawlStatus &&
        crawlStatus.status === 'processing' &&
        !isShuttingDown()
      );
    }

    await updateProgress(job, {
      percentage: 100,
      message: 'Full crawl completed successfully',
      pagesProcessed: (crawlResult as any).completed || 0,
      totalPages: (crawlResult as any).total || 0,
    });

    return {
      success: true,
      data: crawlResult,
      duration: Date.now() - startTime,
      pagesProcessed: (crawlResult as any).completed || 0,
      totalPages: (crawlResult as any).total || 0,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    await updateProgress(job, {
      percentage: 0,
      message: `Failed to crawl: ${errorMessage}`,
      errors: 1,
    });

    return {
      success: false,
      error: errorMessage,
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Process a refresh job
 */
export async function processRefreshJob(
  job: Job<JobData>,
  jobData: JobData
): Promise<JobResult> {
  const startTime = Date.now();

  const refreshData = jobData as any; // Type assertion
  try {
    await updateProgress(job, {
      percentage: 10,
      message: `Refreshing content for ${refreshData.urls?.[0] || 'urls'}`,
      currentUrl: refreshData.urls?.[0],
    });

    // For refresh jobs, we can use either single page or crawl depending on the config
    const config = {
      ...refreshData.config,
      forceRefresh: true, // Bypass cache
    };

    let result;
    if (refreshData.config?.fullRefresh && refreshData.urls?.[0]) {
      // Full refresh - crawl the website
      result = await crawlWebsiteWithCleanup(refreshData.urls[0], config);
    } else if (refreshData.urls?.[0]) {
      // Single page refresh
      result = await scrapePage(refreshData.urls[0], config);
    }

    await updateProgress(job, {
      percentage: 100,
      message: 'Refresh completed successfully',
      pagesProcessed: 1,
      totalPages: 1,
    });

    return {
      success: true,
      data: result,
      duration: Date.now() - startTime,
      pagesProcessed: 1,
      totalPages: 1,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    await updateProgress(job, {
      percentage: 0,
      message: `Failed to refresh: ${errorMessage}`,
      errors: 1,
    });

    return {
      success: false,
      error: errorMessage,
      duration: Date.now() - startTime,
    };
  }
}
