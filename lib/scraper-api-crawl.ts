import { spawn } from 'child_process';
import { join } from 'path';
import * as fs from 'fs';
import { getMemoryAwareJobManager } from './redis-enhanced';
import { getCrawlerConfig, CrawlerConfig, MemoryMonitor } from './crawler-config';
import { SitemapParser } from './sitemap-parser';
import { jobLimiter } from './job-limiter';
import { OwnSiteDetector } from './own-site-detector';
import { CustomerConfigLoader } from './customer-config-loader';
import {
  ConfigPresets,
  applyConfigPreset,
  loadCustomerConfig,
  configManager
} from './scraper-config';
import { CrawlJob, AIOptimizationConfig } from './scraper-api-types';

// Get job manager instance
const jobManager = getMemoryAwareJobManager();

// Get memory monitor instance
const memoryMonitor = MemoryMonitor.getInstance();

// Crawl an entire website with enhanced memory management and AI optimization
export async function crawlWebsite(
  url: string,
  options?: {
    maxPages?: number;
    includePaths?: string[];
    excludePaths?: string[];
    configPreset?: 'fast' | 'careful' | 'memoryEfficient' | 'production';
    config?: Partial<CrawlerConfig>;
    turboMode?: boolean;
    ownSite?: boolean; // Enable own-site optimizations
    organizationId?: string; // Organization ID to load owned domains
    useNewConfig?: boolean; // Use new configuration system
    newConfigPreset?: keyof typeof ConfigPresets; // Preset for new config system
    aiOptimization?: AIOptimizationConfig; // AI optimization configuration
    forceRescrape?: boolean; // Force re-scrape even if recently scraped
  }
): Promise<string> {
  const jobId = `crawl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startUrl = new URL(url);
  const maxPages = options?.maxPages ?? -1; // Default to unlimited for production
  const crawlEntireSite = options?.maxPages === -1;

  console.log(`[CRAWLER] Starting crawl ${jobId} for ${url} (max: ${crawlEntireSite ? 'UNLIMITED' : maxPages})`);

  // Load organization's owned domains if organizationId provided
  if (options?.organizationId) {
    try {
      await CustomerConfigLoader.initializeForScraping(options.organizationId);
      if (options?.useNewConfig) await loadCustomerConfig(options.organizationId);
    } catch (error) {
      console.error(`[CRAWLER] Failed to load organization config:`, error);
    }
  }

  // Get configuration
  let crawlerConfig: any;

  // Use new configuration system if requested
  if (options?.useNewConfig) {
    // Apply preset if specified
    if (options?.newConfigPreset) {
      applyConfigPreset(options.newConfigPreset);
    }

    // Get configuration from new system
    const scraperConfig = configManager.getEffectiveConfig(url);

    // Map to old config structure for compatibility
    crawlerConfig = {
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
      memory: {
        maxResultsInMemory: 500,
        batchSize: 50,
        enableStreaming: true,
        gcThreshold: 0.7,
      },
      content: {
        minWordCount: scraperConfig.extraction.filters.minDescriptionLength || 50,
        maxPageSizeMB: 10,
        extractImages: !scraperConfig.performance.resources.blockImages,
        extractLinks: true,
        extractMetadata: true,
      },
      retry: {
        maxAttempts: 3,
        backoffMultiplier: scraperConfig.rateLimiting.backoff.multiplier,
        initialDelayMs: scraperConfig.rateLimiting.backoff.initialDelayMs,
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
        customHeaders: {},
      },
    };
  } else {
    // Use old configuration system
    crawlerConfig = getCrawlerConfig(options?.configPreset);
  }

  // Auto-detect if this is an owned site
  const isOwnSite = options?.ownSite || await OwnSiteDetector.isOwnSite(url);

  // Apply own-site optimizations if enabled or detected
  if (isOwnSite) {
    jobLimiter.enableOwnSiteMode();
    try {
      const { ownSiteConfig } = await import('./scraper-config-own-site');
      crawlerConfig = { ...crawlerConfig, ...ownSiteConfig };
      console.log(`[${jobId}] Own-site mode enabled with optimized config`);
    } catch (error) {
      console.error(`[CRAWLER] Failed to apply own-site config:`, error);
    }
  }

  const finalConfig = { ...crawlerConfig, ...options?.config };
  const turboMode = options?.turboMode !== false;

  // Initialize job in Redis
  const initialJob: CrawlJob = {
    jobId,
    status: 'processing',
    progress: 0,
    total: 0,
    completed: 0,
    failed: 0,
    skipped: 0,
    startedAt: new Date().toISOString(),
    config: finalConfig,
  };

  await jobManager.createJob(jobId, initialJob);

  // Start memory monitoring
  memoryMonitor.startMonitoring(async (stats) => {
    // Log memory status periodically (only when significant change)
    if (Math.random() < 0.1) { // Log 10% of memory updates to avoid spam
      console.log(`[CRAWLER] Memory update - Heap: ${(stats.heapUsed / 1024 / 1024).toFixed(2)}MB / ${(stats.heapTotal / 1024 / 1024).toFixed(2)}MB (${(stats.percentUsed * 100).toFixed(1)}% used)`);
    }

    await jobManager.updateJob(jobId, { memoryStats: stats });

    // Pause crawl if memory pressure is too high
    if (stats.percentUsed > 0.9) {
      console.warn(`[CRAWLER] CRITICAL: Memory pressure at ${(stats.percentUsed * 100).toFixed(1)}%, pausing crawl...`);
      await jobManager.updateJob(jobId, {
        status: 'paused',
        pausedAt: new Date().toISOString(),
      });
    }
  });

  // Try to discover URLs from sitemap first
  let sitemapUrls: string[] = [];
  try {
    console.log(`[${jobId}] Checking for sitemap at ${startUrl.origin}/sitemap.xml`);
    const parser = new SitemapParser();
    const sitemapEntries = await parser.parseSitemapFromUrl(`${startUrl.origin}/sitemap.xml`);

    if (sitemapEntries && sitemapEntries.length > 0) {
      console.log(`[${jobId}] Found ${sitemapEntries.length} URLs in sitemap!`);
      sitemapUrls = sitemapEntries.map(entry => entry.loc);

      // Update job with discovered URLs count
      await jobManager.updateJob(jobId, {
        total: Math.min(sitemapEntries.length, maxPages === -1 ? sitemapEntries.length : maxPages),
        sitemapDetected: true,
        sitemapUrlCount: sitemapEntries.length
      });
    }
  } catch (sitemapError) {
    console.log(`[${jobId}] No sitemap found or error parsing: ${sitemapError instanceof Error ? sitemapError.message : String(sitemapError)}`);
    // Continue with regular crawling
  }

  // Start crawling in background using child process
  const crawlerPath = join(process.cwd(), 'lib', 'scraper-worker.js');

  if (!fs.existsSync(crawlerPath)) {
    throw new Error(`Worker script not found at ${crawlerPath}`);
  }

  const workerArgs = [
    crawlerPath,
    jobId,
    url,
    maxPages.toString(),
    turboMode.toString(),
    options?.configPreset || 'memoryEfficient',
    isOwnSite ? 'true' : 'false',
    JSON.stringify(sitemapUrls.slice(0, maxPages === -1 ? undefined : maxPages)),
    (options?.forceRescrape ? 'true' : 'false')
  ];

  try {
    const child = spawn('node', workerArgs, {
      cwd: process.cwd(),
      env: { ...process.env },
      stdio: 'inherit'
    });

    console.log(`[${jobId}] Worker process spawned with PID: ${child.pid}`);

    child.on('error', (error) => {
      console.error(`[${jobId}] Failed to spawn worker:`, error);
      jobManager.updateJob(jobId, {
        status: 'failed',
        completedAt: new Date().toISOString(),
        errors: [{ url, error: `Failed to spawn worker: ${error.message}`, timestamp: new Date().toISOString() }],
      }).catch(err => console.error(`[${jobId}] Failed to update job:`, err));
    });

    child.on('exit', async (code, signal) => {
      if (code !== 0) {
        console.error(`[${jobId}] Worker exited with code ${code}, signal: ${signal}`);
        try {
          const job = await jobManager.getJob(jobId);
          if (job?.status === 'failed' && job.error) {
            console.error(`[${jobId}] Worker error: ${job.error}`);
          } else if (code === 1 && (!job || job.status !== 'failed')) {
            await jobManager.updateJob(jobId, {
              status: 'failed',
              completedAt: new Date().toISOString(),
              error: 'Worker failed to initialize. Check environment variables.',
            });
          }
        } catch (error) {
          console.error(`[${jobId}] Failed to check worker status:`, error);
        }
      }
      memoryMonitor.stopMonitoring();
    });

    child.on('close', (code, signal) => {
      console.log(`[${jobId}] Worker process closed with code: ${code}, signal: ${signal}`);
    });

  } catch (spawnError) {
    console.error(`[${jobId}] FATAL ERROR: Failed to spawn worker process:`, spawnError);
    throw spawnError;
  }

  return jobId;
}
