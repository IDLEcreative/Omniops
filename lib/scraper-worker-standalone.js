#!/usr/bin/env node

/**
 * Standalone Scraper Worker Process - Fallback Mode
 * Works without Supabase/OpenAI for basic crawling functionality
 */

const { PlaywrightCrawler } = require('@crawlee/playwright');
const Redis = require('ioredis');
const { JSDOM } = require('jsdom');
const cheerio = require('cheerio');
const crypto = require('crypto');

// Cache for chunk deduplication (standalone mode)
const chunkHashCache = new Map();

// Common page elements to filter out before chunking
const COMMON_SELECTORS_TO_REMOVE = [
  'nav', 'navigation', '.nav', '#nav',
  'header', '.header', '#header', '.site-header',
  'footer', '.footer', '#footer', '.site-footer',
  'aside', '.sidebar', '#sidebar',
  '.cookie-banner', '.cookie-notice', '.cookie-consent',
  '.social-share', '.social-links', '.social-media',
  '.newsletter', '.subscribe',
  '.ads', '.advertisement', '.ad-container',
  '.comments', '#comments', '.comment-section',
  '.related-posts', '.related-articles',
  '.breadcrumb', '.breadcrumbs',
  '.pagination', '.page-numbers'
];

// Get command line arguments
const [,, jobId, url, maxPages, turboMode, configPreset, isOwnSite] = process.argv;

// Early validation of arguments
if (!jobId || !url) {
  console.error('Error: Missing required arguments (jobId, url)');
  process.exit(1);
}

console.log(`[Worker ${jobId}] Starting STANDALONE crawl worker...`);
console.log(`[Worker ${jobId}] URL: ${url}`);
console.log(`[Worker ${jobId}] Max pages: ${maxPages}`);
console.log(`[Worker ${jobId}] Turbo mode: ${turboMode}`);
console.log(`[Worker ${jobId}] Config preset: ${configPreset}`);
console.log(`[Worker ${jobId}] Own site: ${isOwnSite}`);
console.log(`[Worker ${jobId}] Mode: STANDALONE (no Supabase/OpenAI required)`);

// Initialize Redis
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Content extraction functions
function htmlToText(html) {
  const $ = cheerio.load(html);
  
  // Remove script and style elements
  $('script, style, noscript').remove();
  
  // Preserve some structure
  $('p, div, section, article').append('\n\n');
  $('br').replaceWith('\n');
  
  // Get text content
  return $.text()
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function extractContent(html, url) {
  const $ = cheerio.load(html);
  
  // Remove unwanted elements - expanded list for better deduplication
  $('script, style, nav, header, footer, aside, form, iframe, object, embed').remove();
  
  // Remove all common selectors that appear on every page
  COMMON_SELECTORS_TO_REMOVE.forEach(selector => {
    $(selector).remove();
  });
  
  // Also remove elements with common class/id patterns
  $('[class*="sidebar"], [class*="header"], [class*="footer"], [class*="nav"]').remove();
  $('[id*="sidebar"], [id*="header"], [id*="footer"], [id*="nav"]').remove();
  $('[class*="cookie"], [class*="banner"], [class*="modal"], [class*="popup"]').remove();
  
  // Get title
  const title = $('title').text() || 
                $('h1').first().text() || 
                $('meta[property="og:title"]').attr('content') || 
                '';
  
  // Get main content
  let mainContent = '';
  const contentSelectors = ['main', 'article', '[role="main"]', '.content', '#content', 'body'];
  
  for (const selector of contentSelectors) {
    const element = $(selector).first();
    if (element.length && element.text().trim().length > 100) {
      mainContent = element.html() || '';
      break;
    }
  }
  
  // Convert to text
  const textContent = htmlToText(mainContent);
  const wordCount = textContent.split(/\s+/).filter(word => word.length > 0).length;
  
  // Generate content hash with normalization
  const normalizedContent = textContent
    .toLowerCase()
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .trim();
  
  const contentHash = crypto.createHash('sha256')
    .update(normalizedContent)
    .digest('hex')
    .substring(0, 16);
  
  // Check for duplicate content
  const isDuplicate = chunkHashCache.has(contentHash);
  if (isDuplicate) {
    console.log(`[Worker ${jobId}] Duplicate content detected for ${url}`);
  } else {
    chunkHashCache.set(contentHash, url);
  }
  
  return {
    title: title.trim(),
    content: textContent,
    textContent: textContent,
    wordCount: wordCount,
    contentHash: contentHash,
    excerpt: textContent.substring(0, 200) + '...',
    metadata: {
      url: url,
      scrapedAt: new Date().toISOString()
    }
  };
}

// Main crawl function
async function runCrawl() {
  try {
    // Update job status to processing
    await redis.hset(`crawl:${jobId}`, {
      status: 'processing',
      startedAt: new Date().toISOString(),
      mode: 'standalone',
      workerPid: process.pid,
    });

    console.log(`[Worker ${jobId}] Starting standalone crawl...`);

    const results = [];
    const visited = new Set();
    const maxPagesToScrape = maxPages === undefined ? -1 : parseInt(maxPages); // Default to unlimited if not specified
    
    // Create the crawler
    console.log(`[Worker ${jobId}] Initializing PlaywrightCrawler...`);
    const crawler = new PlaywrightCrawler({
      maxRequestsPerCrawl: maxPagesToScrape,
      requestHandlerTimeoutSecs: 30,
      maxConcurrency: turboMode === 'true' ? 5 : 2,
      
      launchContext: {
        launchOptions: {
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        },
      },
      
      async requestHandler({ request, page, enqueueLinks }) {
        const pageUrl = request.url;
        
        // Skip if already visited
        if (visited.has(pageUrl)) {
          console.log(`[Worker ${jobId}] Skipping duplicate: ${pageUrl}`);
          return;
        }
        visited.add(pageUrl);
        
        console.log(`[Worker ${jobId}] Scraping: ${pageUrl}`);
        
        try {
          // Wait for content to load
          await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
          
          // Get page content
          const html = await page.content();
          
          // Extract content
          const extracted = extractContent(html, pageUrl);
          
          // Store result
          results.push(extracted);
          
          // Update progress
          await redis.hset(`crawl:${jobId}`, {
            'stats.scraped': results.length,
            'stats.total': maxPagesToScrape,
            'stats.errors': 0,
          });
          
          console.log(`[Worker ${jobId}] Progress: ${results.length}/${maxPagesToScrape} pages`);
          
          // Enqueue more links if we haven't reached the limit
          if (results.length < maxPagesToScrape) {
            await enqueueLinks({
              strategy: 'same-domain',
              limit: Math.min(10, maxPagesToScrape - results.length),
            });
          }
        } catch (error) {
          console.error(`[Worker ${jobId}] Error processing ${pageUrl}:`, error);
        }
      },
      
      failedRequestHandler({ request, error }) {
        console.error(`[Worker ${jobId}] Failed to process ${request.url}: ${error.message}`);
      },
    });
    
    console.log(`[Worker ${jobId}] Crawler initialized, starting crawl of ${url}...`);
    
    // Start the crawl
    await crawler.run([url]);

    console.log(`[Worker ${jobId}] Crawl completed, processed ${results.length} pages`);

    // Store results in Redis for retrieval
    await redis.set(
      `crawl:${jobId}:results`,
      JSON.stringify(results),
      'EX',
      3600 // Expire after 1 hour
    );

    // Update job as completed
    await redis.hset(`crawl:${jobId}`, {
      status: 'completed',
      completedAt: new Date().toISOString(),
      'stats.scraped': results.length,
      'stats.errors': 0,
      'stats.total': results.length,
      pagesProcessed: results.length,
      totalResults: results.length,
      mode: 'standalone'
    });

    console.log(`[Worker ${jobId}] Standalone crawl completed successfully!`);
    console.log(`[Worker ${jobId}] Pages processed: ${results.length}`);
    console.log(`[Worker ${jobId}] Unique content hashes: ${chunkHashCache.size}`);
    console.log(`[Worker ${jobId}] Duplicate pages detected: ${results.length - chunkHashCache.size}`);

    // Keep job data available for 5 minutes after completion
    await redis.expire(`crawl:${jobId}`, 300);

    // Give the main process time to read results before exiting
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Clean up
    await redis.quit();
    process.exit(0);

  } catch (error) {
    console.error(`[Worker ${jobId}] Fatal error:`, error);

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

    await redis.quit();
    process.exit(1);
  }
}

// Handle uncaught errors
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

// Run the crawl
console.log(`[Worker ${jobId}] Starting standalone crawler...`);
runCrawl().catch(async (error) => {
  console.error(`[Worker ${jobId}] runCrawl failed:`, error);
  try {
    await redis.hset(`crawl:${jobId}`, {
      status: 'failed',
      error: `runCrawl failed: ${error.message}`,
      completedAt: new Date().toISOString(),
    });
    await redis.quit();
  } catch {}
  process.exit(1);
});