import { Job } from 'bullmq';
import { scrapePage, crawlWebsite, checkCrawlStatus } from '../scraper-api';
import { ScrapeJobData, ScrapeJobResult } from '../queue/scrape-queue';
import { logger } from '../logger';
import { MemoryUsage } from './scraper-worker-service-types';

/**
 * Normalizes AI optimization options from job data
 */
function normalizeAiOptimization(aiOptimization: any) {
  if (typeof aiOptimization === 'boolean') {
    return aiOptimization ? {
      enabled: true,
      level: 'standard' as const,
      tokenTarget: 4000,
      preserveContent: [],
      cacheEnabled: true,
      precomputeMetadata: true,
      deduplicationEnabled: true
    } : undefined;
  }
  return aiOptimization;
}

/**
 * Processes a single page scraping job
 */
async function processSinglePageJob(
  job: Job<ScrapeJobData, ScrapeJobResult>,
  url: string
): Promise<{ result: any; pagesScraped: number }> {
  logger.info(`Single page scrape: ${url}`);

  const result = await scrapePage(url, {
    turboMode: job.data.turboMode,
    ecommerceMode: true,
    useNewConfig: job.data.useNewConfig,
    configPreset: job.data.newConfigPreset as any,
    aiOptimization: normalizeAiOptimization(job.data.aiOptimization),
  });

  await job.updateProgress(80);
  return { result, pagesScraped: 1 };
}

/**
 * Processes a multi-page crawling job
 */
async function processMultiPageJob(
  job: Job<ScrapeJobData, ScrapeJobResult>,
  url: string,
  maxPages: number,
  organizationId: string | undefined,
  maxJobDuration: number
): Promise<{ result: any; pagesScraped: number }> {
  logger.info(`Multi-page crawl: ${url} (max: ${maxPages} pages)`);

  const crawlJobId = await crawlWebsite(url, {
    maxPages,
    includePaths: job.data.includePaths,
    excludePaths: job.data.excludePaths,
    turboMode: job.data.turboMode,
    ownSite: job.data.ownSite,
    organizationId,
    useNewConfig: job.data.useNewConfig,
    newConfigPreset: job.data.newConfigPreset as any,
    aiOptimization: normalizeAiOptimization(job.data.aiOptimization),
  });

  // Monitor crawl progress
  const pagesScraped = await monitorCrawlProgress(job, crawlJobId, maxJobDuration);
  return { result: { crawlJobId, pagesScraped }, pagesScraped };
}

/**
 * Monitors crawl progress for multi-page jobs
 */
async function monitorCrawlProgress(
  job: Job,
  crawlJobId: string,
  maxJobDuration: number
): Promise<number> {
  let lastProgress = 10;
  let pagesScraped = 0;

  return new Promise((resolve) => {
    const checkInterval = setInterval(async () => {
      try {
        const status = await checkCrawlStatus(crawlJobId);

        if (status) {
          pagesScraped = status.completed || 0;
          const progress = Math.min(90, 10 + (pagesScraped / (status.total || 1)) * 70);

          if (progress > lastProgress) {
            await job.updateProgress(progress);
            lastProgress = progress;
          }

          // If crawl is completed or failed, stop monitoring
          if (status.status === 'completed' || status.status === 'failed') {
            clearInterval(checkInterval);
            resolve(pagesScraped);
          }
        }
      } catch (error) {
        logger.error(`Error monitoring crawl progress for job ${job.id}:`, error);
      }
    }, 5000); // Check every 5 seconds

    // Set a maximum monitoring time
    setTimeout(() => {
      clearInterval(checkInterval);
      resolve(pagesScraped);
    }, maxJobDuration);
  });
}

/**
 * Creates a successful job result
 */
function createSuccessResult(
  job: Job<ScrapeJobData>,
  result: any,
  pagesScraped: number,
  maxPages: number | undefined,
  startTime: number,
  getMemoryUsage: () => MemoryUsage
): ScrapeJobResult {
  const duration = Date.now() - startTime;

  return {
    jobId: job.id!,
    status: 'completed',
    pagesScraped,
    totalPages: maxPages || 1,
    errors: [],
    startedAt: new Date(startTime).toISOString(),
    completedAt: new Date().toISOString(),
    duration,
    data: Array.isArray(result) ? result : [result],
    metadata: {
      ...job.data.metadata,
      memoryUsage: getMemoryUsage(),
      processingTime: duration,
    },
  };
}

/**
 * Creates a failed job result
 */
function createFailureResult(
  job: Job<ScrapeJobData>,
  error: Error | unknown,
  maxPages: number | undefined,
  startTime: number,
  getMemoryUsage: () => MemoryUsage
): ScrapeJobResult {
  const duration = Date.now() - startTime;
  const errorMessage = error instanceof Error ? error.message : String(error);

  return {
    jobId: job.id!,
    status: 'failed',
    pagesScraped: 0,
    totalPages: maxPages || 1,
    errors: [errorMessage],
    startedAt: new Date(startTime).toISOString(),
    completedAt: new Date().toISOString(),
    duration,
    metadata: {
      ...job.data.metadata,
      error: errorMessage,
      memoryUsage: getMemoryUsage(),
    },
  };
}

/**
 * Main job processing function
 */
export async function processJob(
  job: Job<ScrapeJobData, ScrapeJobResult>,
  getMemoryUsage: () => MemoryUsage,
  maxJobDuration: number
): Promise<ScrapeJobResult> {
  const startTime = Date.now();
  const { url, maxPages, organizationId } = job.data;

  try {
    logger.info(`Processing job ${job.id}: ${url}`);
    await job.updateProgress(10);

    let result: any;
    let pagesScraped = 0;

    // Check if this is a single page or multi-page job
    if (!maxPages || maxPages === 1) {
      const singlePageResult = await processSinglePageJob(job, url);
      result = singlePageResult.result;
      pagesScraped = singlePageResult.pagesScraped;
    } else {
      const multiPageResult = await processMultiPageJob(
        job,
        url,
        maxPages,
        organizationId,
        maxJobDuration
      );
      result = multiPageResult.result;
      pagesScraped = multiPageResult.pagesScraped;
    }

    await job.updateProgress(90);

    const jobResult = createSuccessResult(
      job,
      result,
      pagesScraped,
      maxPages,
      startTime,
      getMemoryUsage
    );

    await job.updateProgress(100);
    logger.info(`Job ${job.id} completed in ${jobResult.duration}ms`);

    return jobResult;
  } catch (error) {
    logger.error(`Job ${job.id} failed after ${Date.now() - startTime}ms:`, error);

    const jobResult = createFailureResult(
      job,
      error,
      maxPages,
      startTime,
      getMemoryUsage
    );

    throw error; // Let BullMQ handle the failure
  }
}
