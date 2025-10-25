import Redis from 'ioredis';
import { getCrawlerConfig, CrawlerConfig, AIOptimizationMonitor } from './crawler-config';
import { ConfigPresets, applyConfigPreset, configManager } from './scraper-config';
import { ScrapedPage, AIOptimizedResult, AIOptimizationConfig } from './scraper-api-types';
import { setupPreNavigationHook, handlePageRequest, handleFailedRequest } from './scraper-api-handlers';
import { getMemoryAwareJobManager } from './redis-enhanced';

// Only import Playwright for single page scraping
let PlaywrightCrawler: any;
if (typeof window === 'undefined' && !process.env.NEXT_RUNTIME) {
  import('crawlee').then(module => {
    PlaywrightCrawler = module.PlaywrightCrawler;
  }).catch(e => {
    console.log('PlaywrightCrawler not available in this environment');
  });
}

// Get job manager instance
const jobManager = getMemoryAwareJobManager();

// Get AI optimization monitor instance
const aiOptimizationMonitor = AIOptimizationMonitor.getInstance();

// Scrape a single page with configurable timeouts and AI optimization
export async function scrapePage(
  url: string,
  config?: Partial<CrawlerConfig> & {
    turboMode?: boolean;
    ecommerceMode?: boolean;
    useNewConfig?: boolean;
    configPreset?: keyof typeof ConfigPresets;
    aiOptimization?: AIOptimizationConfig;
  }
): Promise<ScrapedPage | AIOptimizedResult> {
  const scrapeStartTime = Date.now();
  console.log(`[SCRAPER] Starting single page scrape for: ${url}`);
  console.log(`[SCRAPER] Config options:`, {
    turboMode: config?.turboMode !== false,
    ecommerceMode: config?.ecommerceMode,
    useNewConfig: config?.useNewConfig,
    configPreset: config?.configPreset,
    aiOptimizationEnabled: config?.aiOptimization?.enabled
  });

  // In serverless/edge environments, use Redis queue instead of direct crawling
  if (!PlaywrightCrawler || process.env.VERCEL || process.env.NETLIFY) {
    console.log(`[SCRAPER] Serverless environment detected - using Redis queue for scraping`);

    // Create a job ID
    const jobId = `crawl_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Queue the job in Redis
    const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

    const jobData = {
      jobId,
      url,
      domain: new URL(url).hostname,
      maxPages: (config as any)?.maxPages || 50,
      options: {
        turboMode: config?.turboMode || false,
        configPreset: config?.configPreset,
        useNewConfig: config?.useNewConfig
      },
      createdAt: new Date().toISOString()
    };

    // Add to queue
    await redis.lpush('scrape:queue', JSON.stringify(jobData));

    // Store job status
    await redis.hset(`crawl:${jobId}`, {
      status: 'queued',
      url,
      maxPages: jobData.maxPages,
      createdAt: jobData.createdAt
    });

    // Set expiry for job data (7 days)
    await redis.expire(`crawl:${jobId}`, 604800);

    await redis.quit();

    console.log(`[SCRAPER] Job ${jobId} queued successfully`);

    return {
      url,
      title: '',
      content: '',
      jobId,
      status: 'queued' as const,
      message: 'Scraping job queued. A worker will process it soon.',
      checkStatusUrl: `/api/scrape/status?jobId=${jobId}`
    } as any;
  }

  // Use new configuration system if requested or by default in production
  let finalConfig: any;
  if (config?.useNewConfig !== false && process.env.NODE_ENV === 'production') {
    console.log(`[SCRAPER] Using new configuration system`);

    // Apply preset if specified
    if (config?.configPreset) {
      console.log(`[SCRAPER] Applying config preset: ${config.configPreset}`);
      applyConfigPreset(config.configPreset);
    }

    // Get configuration from new system
    const scraperConfig = configManager.getEffectiveConfig(url);
    console.log(`[SCRAPER] Loaded effective config for URL: ${url}`);

    // Map new config structure to old crawler config structure for compatibility
    finalConfig = {
      maxConcurrency: scraperConfig.performance.concurrency.maxConcurrentPages,
      timeouts: {
        request: scraperConfig.performance.timeouts.pageLoad,
        navigation: scraperConfig.performance.timeouts.navigation,
        resourceLoad: scraperConfig.performance.timeouts.selector,
        scriptExecution: scraperConfig.performance.timeouts.script,
      },
      rateLimit: {
        requestsPerMinute: scraperConfig.rateLimiting.perDomain.requestsPerMinute,
        delayBetweenRequests: scraperConfig.performance.delays.minRequestDelay,
        adaptiveDelay: scraperConfig.performance.delays.adaptiveDelayEnabled,
        respectRobotsTxt: scraperConfig.rateLimiting.global.respectRobotsTxt,
      },
      content: {
        minWordCount: scraperConfig.extraction.filters.minDescriptionLength || 50,
        maxPageSizeMB: 10,
        extractImages: !scraperConfig.performance.resources.blockImages,
        extractLinks: true,
        extractMetadata: true,
      },
      browser: {
        headless: scraperConfig.browser.headless,
        userAgent: scraperConfig.rateLimiting.userAgents.agents[0],
        viewport: scraperConfig.browser.viewport,
        blockResources: [
          ...(scraperConfig.performance.resources.blockImages ? ['image'] : []),
          ...(scraperConfig.performance.resources.blockMedia ? ['media'] : []),
          ...(scraperConfig.performance.resources.blockFonts ? ['font'] : []),
        ],
      },
      advanced: {
        followRedirects: true,
        maxRedirects: 5,
        ignoreSslErrors: false,
        waitForSelector: undefined,
        customHeaders: {},
      },
      ...config, // Allow direct overrides
    };
  } else {
    console.log(`[SCRAPER] Using legacy configuration system`);

    // Use old configuration system
    const crawlerConfig = getCrawlerConfig();
    finalConfig = { ...crawlerConfig, ...config };
  }

  console.log(`[SCRAPER] Final config timeouts:`, finalConfig.timeouts);
  const turboMode = config?.turboMode !== false; // Default to true
  console.log(`[SCRAPER] Turbo mode: ${turboMode ? 'ENABLED' : 'DISABLED'}`)

  return new Promise(async (resolve, reject) => {
    let result: ScrapedPage | null = null;

    console.log(`[SCRAPER] Creating PlaywrightCrawler instance`);
    console.log(`[SCRAPER] Browser settings: headless=${finalConfig.browser.headless}, userAgent=${finalConfig.browser.userAgent}`);

    try {
      const crawler = new PlaywrightCrawler({
        maxRequestsPerCrawl: 1,
        requestHandlerTimeoutSecs: finalConfig.timeouts.request / 1000,
        navigationTimeoutSecs: finalConfig.timeouts.navigation / 1000,

        browserPoolOptions: {
          useFingerprints: true,
          fingerprintOptions: {
            fingerprintGeneratorOptions: {
              browsers: ['chrome'],
              devices: ['desktop'],
              operatingSystems: ['windows', 'macos', 'linux'],
            },
          },
        },

        launchContext: {
          launchOptions: {
            headless: finalConfig.browser.headless,
          },
          userAgent: finalConfig.browser.userAgent,
        },

      preNavigationHooks: [
        async ({ page }: any) => {
          await setupPreNavigationHook(page, finalConfig, turboMode);
        },
      ],

      requestHandler: async ({ page, request }: any) => {
        result = await handlePageRequest(page, request, finalConfig, config, scrapeStartTime);
      },

      failedRequestHandler: ({ request, error }: any) => {
        handleFailedRequest(request, error, url, finalConfig, scrapeStartTime, reject);
      },
    });

    console.log(`[SCRAPER] Crawler instance created successfully`);
    console.log(`[SCRAPER] Starting crawler.run() for URL: ${url}`);

    await crawler.run([url]);

    console.log(`[SCRAPER] Crawler.run() completed`);

    if (result) {
      console.log(`[SCRAPER] SUCCESS: Scraping completed for ${url}`);
      console.log(`[SCRAPER] Total scraping time: ${Date.now() - scrapeStartTime}ms`);
      resolve(result);
    } else {
      const noResultError = `Failed to scrape ${url}: No result was produced`;
      console.error(`[SCRAPER] ERROR: ${noResultError}`);
      reject(new Error(noResultError));
    }
  } catch (crawlerError) {
      const errorMessage = crawlerError instanceof Error ? crawlerError.message : String(crawlerError);
      console.error(`[SCRAPER] FATAL ERROR during crawler initialization or execution:`, errorMessage);
      console.error(`[SCRAPER] Full error:`, crawlerError);
      reject(new Error(`Crawler initialization/execution failed: ${errorMessage}`));
    }
  });
}
