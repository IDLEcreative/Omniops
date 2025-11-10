#!/usr/bin/env tsx

/**
 * Scraper Worker Process - Modular Architecture v2.0.0
 * Handles crawling in separate process using extracted modules for <300 LOC compliance
 */

// ============================================================================
// ENVIRONMENT SETUP (Lines 1-16 from original)
// ============================================================================
import { config } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '..', '.env') });

// ============================================================================
// CORE DEPENDENCIES
// ============================================================================
import { PlaywrightCrawler } from '@crawlee/playwright';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { ContentDeduplicator } from './content-deduplicator';
import { MetadataExtractor } from './metadata-extractor';
import { DatabaseOptimizer } from './db-optimization';

// ============================================================================
// EXTRACTED MODULES (22+ modules across 4 phases)
// ============================================================================
// Initialization modules
import { waitForRedis, setupRedisKeepalive, reportInitError } from './scraper/initialization/index.js';
import { checkEnvironmentVariables } from './scraper/initialization/environment-validator.js';
import { initializeServices } from './scraper/initialization/service-initializer.js';
import { getResilientRedisClient } from './redis-enhanced';

// Crawler configuration
import { ConcurrencyManager } from './scraper/concurrency-manager.js';
import { buildCrawlerConfig } from './scraper/crawler-config.js';

// Request handler (composes all 15+ modules)
import { buildRequestHandler } from './scraper/request-handler-builder.js';

// Cache utilities
import { getCacheStats } from './scraper/utils/chunking.js';

// ============================================================================
// GLOBAL STATE
// ============================================================================
const redisClient = getResilientRedisClient();
let redis;
let supabase;
let openai;
const deduplicator = new ContentDeduplicator();

// ============================================================================
// COMMAND LINE ARGUMENTS (Lines 124-157 from original)
// ============================================================================
const [,, jobId, url, maxPages, turboMode, configPreset, isOwnSite, sitemapUrlsJson, forceRescrapeArg] = process.argv;
const FORCE_RESCRAPE = (forceRescrapeArg === 'true') || (String(process.env.SCRAPER_FORCE_RESCRAPE_ALL || '').toLowerCase() === 'true');

console.log(`[Worker ${jobId}] 🔍 forceRescrape Validation:`);
console.log(`[Worker ${jobId}]   - Arg received: "${forceRescrapeArg}" (type: ${typeof forceRescrapeArg})`);
console.log(`[Worker ${jobId}]   - Env var: "${process.env.SCRAPER_FORCE_RESCRAPE_ALL}"`);
console.log(`[Worker ${jobId}]   - Final FORCE_RESCRAPE: ${FORCE_RESCRAPE}`);
console.log(`[Worker ${jobId}]   - Will ${FORCE_RESCRAPE ? 'FORCE' : 'SKIP'} re-scraping recently scraped pages`);

// Early validation
if (!jobId || !url) {
  console.error('Error: Missing required arguments (jobId, url)');
  process.exit(1);
}

// Parse sitemap URLs
let sitemapUrls = [];
try {
  if (sitemapUrlsJson && sitemapUrlsJson !== '[]') {
    sitemapUrls = JSON.parse(sitemapUrlsJson);
    console.log(`[Worker ${jobId}] Received ${sitemapUrls.length} URLs from sitemap`);
  }
} catch (e) {
  console.log(`[Worker ${jobId}] No sitemap URLs provided or error parsing`);
}

console.log(`[Worker ${jobId}] Starting crawl worker v2.0.0 (modular architecture)...`);
console.log(`[Worker ${jobId}] URL: ${url}`);
console.log(`[Worker ${jobId}] Max pages: ${maxPages}`);
console.log(`[Worker ${jobId}] Turbo mode: ${turboMode}`);
console.log(`[Worker ${jobId}] Config preset: ${configPreset}`);
console.log(`[Worker ${jobId}] Own site: ${isOwnSite}`);

// Setup keepalive interval (will be initialized after Redis connects)
let redisKeepaliveInterval;

// ============================================================================
// MAIN CRAWL FUNCTION (DRAMATICALLY SIMPLIFIED - was 570 lines, now ~100)
// ============================================================================
async function runCrawl() {
  try {
    // Validate Playwright availability
    if (!PlaywrightCrawler) {
      throw new Error('PlaywrightCrawler not available - missing @crawlee/playwright dependency');
    }

    // Update job status
    await redis.hset(`crawl:${jobId}`, {
      status: 'processing',
      startedAt: new Date().toISOString(),
      workerPid: process.pid,
      workerVersion: '2.0.0', // Version bump for modular refactor
    });

    console.log(`[Worker ${jobId}] Starting crawl with PID ${process.pid}...`);

    // Initialize state
    const results = [];
    const visited = new Set();
    const maxPagesToScrape = maxPages === undefined ? -1 : parseInt(maxPages);

    // Create concurrency manager
    const concurrencyManager = new ConcurrencyManager(
      turboMode === 'true' ? 5 : 3,
      turboMode === 'true' ? 12 : 8
    );

    // Build crawler config using extracted module
    const crawlerConfig = buildCrawlerConfig({
      maxPages: maxPagesToScrape,
      turboMode: turboMode === 'true',
      concurrencyManager
    });

    // Build request handler (COMPOSES ALL 15+ MODULES!)
    const requestHandler = buildRequestHandler({
      supabase,
      jobId,
      concurrencyManager,
      visited,
      results,
      redis,
      maxPagesToScrape,
      forceRescrape: FORCE_RESCRAPE,
      MetadataExtractor,
      openai
    });

    // Create crawler
    console.log(`[Worker ${jobId}] Initializing PlaywrightCrawler with optimizations...`);

    const crawler = new PlaywrightCrawler({
      ...crawlerConfig,
      requestHandler,
      failedRequestHandler({ request, error }) {
        console.error(`[Worker ${jobId}] Failed: ${request.url}`, error.message);
        concurrencyManager.recordError();
      }
    });

    console.log(`[Worker ${jobId}] Crawler initialized, starting crawl of ${url}...`);

    // Run crawl
    try {
      if (sitemapUrls.length > 0) {
        console.log(`[Worker ${jobId}] Using ${sitemapUrls.length} URLs from sitemap`);
        await crawler.run(sitemapUrls);
      } else {
        console.log(`[Worker ${jobId}] No sitemap found, using standard crawling`);
        await crawler.run([url]);
      }
    } catch (crawlError) {
      console.error(`[Worker ${jobId}] Crawl error:`, crawlError);
      throw new Error(`Crawl failed: ${crawlError.message}`);
    }

    console.log(`[Worker ${jobId}] Crawl completed! Successfully processed ${results.length} pages.`);

    // Update job as completed
    await redis.hset(`crawl:${jobId}`, {
      status: 'completed',
      completedAt: new Date().toISOString(),
      'stats.scraped': results.length,
      'stats.errors': 0,
      'stats.total': results.length,
    });

    // Store results summary
    await redis.set(
      `crawl:${jobId}:results`,
      JSON.stringify({ count: results.length, urls: results.map(r => r.url) }),
      'EX',
      3600
    );

    // Final statistics
    const finalCacheStats = getCacheStats();
    const globalStats = deduplicator.getStorageStats();

    console.log(`[Worker ${jobId}] ========== Crawl Complete ==========`);
    console.log(`[Worker ${jobId}] Pages processed: ${results.length}`);
    console.log(`[Worker ${jobId}] Deduplication Statistics:`);
    console.log(`[Worker ${jobId}]   - Unique content: ${globalStats.uniqueContent}`);
    console.log(`[Worker ${jobId}]   - Common elements: ${globalStats.commonElements}`);
    console.log(`[Worker ${jobId}]   - Processed pages: ${globalStats.processedPages}`);
    console.log(`[Worker ${jobId}]   - Cache size: ${globalStats.cacheSize}`);
    console.log(`[Worker ${jobId}] ====================================`);

    // Clean up and exit
    console.log(`[Worker ${jobId}] Cleaning up resources...`);
    clearInterval(redisKeepaliveInterval);
    await redisClient.disconnect();
    console.log(`[Worker ${jobId}] Worker exiting successfully`);
    process.exit(0);
  } catch (error) {
    console.error(`[Worker ${jobId}] Fatal error:`, error);
    console.error(`[Worker ${jobId}] Stack trace:`, error.stack);

    // Update job as failed
    try {
      await redis.hset(`crawl:${jobId}`, {
        status: 'failed',
        error: error.message,
        errorStack: error.stack,
        completedAt: new Date().toISOString(),
      });
      await redis.expire(`crawl:${jobId}`, 300);
    } catch (redisError) {
      console.error(`[Worker ${jobId}] Failed to update Redis:`, redisError);
    }

    clearInterval(redisKeepaliveInterval);
    await redisClient.disconnect();
    process.exit(1);
  }
}

// ============================================================================
// ERROR HANDLERS (Lines 1410-1435 from original)
// ============================================================================
process.on('uncaughtException', async (error) => {
  console.error(`[Worker ${jobId}] Uncaught exception:`, error);
  try {
    await redis.hset(`crawl:${jobId}`, {
      status: 'failed',
      error: `Uncaught exception: ${error.message}`,
      completedAt: new Date().toISOString(),
    });
    await redis.quit();
  } catch {}
  process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
  console.error(`[Worker ${jobId}] Unhandled rejection at:`, promise, 'reason:', reason);
  try {
    await redis.hset(`crawl:${jobId}`, {
      status: 'failed',
      error: `Unhandled rejection: ${reason}`,
      completedAt: new Date().toISOString(),
    });
    await redis.quit();
  } catch {}
  process.exit(1);
});

// ============================================================================
// MAIN EXECUTION (Lines 1438-1475 from original)
// ============================================================================
async function main() {
  console.log(`[Worker ${jobId}] Initializing services...`);

  try {
    // Ensure Redis is connected first
    await waitForRedis(redisClient, jobId);
    redis = redisClient.redis;
    console.log(`[Worker ${jobId}] Redis connection established`);

    // Setup keepalive interval now that redis is connected
    redisKeepaliveInterval = setupRedisKeepalive(redis, redisClient, jobId);

    // Validate environment variables
    await checkEnvironmentVariables(redis, redisClient, jobId, redisKeepaliveInterval);

    // Initialize all services
    ({ supabase, openai } = await initializeServices(redis, redisClient, jobId, redisKeepaliveInterval));
    console.log(`[Worker ${jobId}] All services initialized successfully`);

    // Now run the crawl
    console.log(`[Worker ${jobId}] Invoking runCrawl()...`);
    await runCrawl();
  } catch (error) {
    console.error(`[Worker ${jobId}] Main execution failed:`, error);
    try {
      if (redis) {
        await redis.hset(`crawl:${jobId}`, {
          status: 'failed',
          error: `Worker initialization failed: ${error.message}`,
          completedAt: new Date().toISOString(),
        });
      }
      clearInterval(redisKeepaliveInterval);
      await redisClient.disconnect();
    } catch {}
    process.exit(1);
  }
}

// Start the worker
main().catch((error) => {
  console.error(`[Worker ${jobId}] Fatal error in main:`, error);
  process.exit(1);
});
