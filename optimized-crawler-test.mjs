#!/usr/bin/env node

/**
 * Optimized Crawler Test for Thompson's Parts
 * Implements stealth techniques to bypass anti-bot measures
 * Based on the network connectivity test results
 */

import { PlaywrightCrawler } from 'crawlee';
import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';

const TARGET_SITE = 'https://www.thompsonseparts.co.uk';
const OUTPUT_DIR = './optimized-crawl-test';
const MAX_PAGES = 5; // Small test to validate access

// Create output directory
await fs.mkdir(OUTPUT_DIR, { recursive: true });

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.cyan}${colors.bold}${msg}${colors.reset}`),
};

console.log(`${colors.bold}${colors.cyan}🚀 Optimized Crawler Test${colors.reset}`);
console.log('━'.repeat(60));
console.log(`Target Site: ${TARGET_SITE}`);
console.log(`Max Pages: ${MAX_PAGES}`);
console.log(`Output Directory: ${OUTPUT_DIR}`);
console.log('━'.repeat(60));

// Statistics tracking
const stats = {
  pagesScraped: 0,
  pagesFailed: 0,
  blockedRequests: 0,
  startTime: Date.now(),
  urls: [],
  errors: [],
  userAgents: [
    'Mozilla/5.0 (compatible; bot/1.0)', // We know this works
    'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)', // This works too
  ],
  currentUserAgentIndex: 0
};

function getRandomUserAgent() {
  const userAgent = stats.userAgents[stats.currentUserAgentIndex];
  stats.currentUserAgentIndex = (stats.currentUserAgentIndex + 1) % stats.userAgents.length;
  return userAgent;
}

function randomDelay(min = 2000, max = 5000) {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
}

// Configure the crawler with stealth settings
const crawler = new PlaywrightCrawler({
  maxRequestsPerCrawl: MAX_PAGES,
  maxConcurrency: 1, // Conservative approach - one page at a time
  
  // Browser configuration optimized for stealth
  browserPoolOptions: {
    useFingerprints: false, // Disable fingerprinting for stealth
    preLaunchHooks: [
      async (pageId, launchContext) => {
        log.info('Pre-launching browser with stealth configuration');
        launchContext.launchOptions = {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-blink-features=AutomationControlled',
            '--disable-features=VizDisplayCompositor',
            '--user-agent=' + getRandomUserAgent()
          ],
        };
      },
    ],
  },
  
  // Pre-navigation hooks
  preNavigationHooks: [
    async ({ page, request }) => {
      log.info(`🔄 [${stats.pagesScraped + 1}/${MAX_PAGES}] Preparing to navigate to: ${request.url}`);
      
      // Set up request interception for stealth and resource blocking
      await page.route('**/*', (route) => {
        const resourceType = route.request().resourceType();
        const url = route.request().url();
        
        // Block unnecessary resources to appear more bot-like (based on our successful test)
        const blockedTypes = ['image', 'media', 'font', 'stylesheet'];
        const blockedDomains = [
          'googletagmanager.com', 
          'google-analytics.com', 
          'facebook.com',
          'doubleclick.net',
          'cloudflare.com',
          'cookiebot.com'
        ];
        
        if (blockedTypes.includes(resourceType) || 
            blockedDomains.some(domain => url.includes(domain))) {
          stats.blockedRequests++;
          route.abort();
        } else {
          // Add some realistic headers
          const headers = {
            ...route.request().headers(),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
          };
          route.continue({ headers });
        }
      });
      
      // Remove webdriver properties that might be detected
      await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined,
        });
        
        // Remove chrome automation indicators
        delete window.chrome;
        
        // Override plugins
        Object.defineProperty(navigator, 'plugins', {
          get: () => [1, 2, 3, 4, 5],
        });
        
        // Override languages
        Object.defineProperty(navigator, 'languages', {
          get: () => ['en-US', 'en'],
        });
      });
      
      // Random delay before navigation
      const delay = Math.floor(Math.random() * 3000) + 1000;
      log.info(`⏱️ Waiting ${delay}ms before navigation (anti-detection)`);
      await new Promise(resolve => setTimeout(resolve, delay));
    },
  ],
  
  // Main request handler
  requestHandler: async ({ page, request, enqueueLinks }) => {
    try {
      log.info(`📄 Processing page: ${request.url}`);
      
      // Wait for the page to load with extended timeout
      await page.waitForLoadState('domcontentloaded', { timeout: 45000 });
      
      // Additional wait to ensure dynamic content loads
      await page.waitForTimeout(3000);
      
      // Try to detect if we've been blocked
      const title = await page.title();
      const url = page.url();
      
      if (title.toLowerCase().includes('just a moment') || 
          title.toLowerCase().includes('access denied') ||
          title.toLowerCase().includes('blocked')) {
        throw new Error(`Potential blocking detected: ${title}`);
      }
      
      log.success(`✅ Successfully accessed: ${title}`);
      
      // Extract page data with error handling
      const pageData = await page.evaluate(() => {
        try {
          // Clean up scripts and styles first
          document.querySelectorAll('script, style, noscript').forEach(el => el.remove());
          
          // Extract structured data
          const getJsonLd = () => {
            const scripts = document.querySelectorAll('script[type=\"application/ld+json\"]');
            const jsonLd = [];
            scripts.forEach(script => {
              try {
                jsonLd.push(JSON.parse(script.textContent));
              } catch {}
            });
            return jsonLd;
          };
          
          // Safe text extraction with fallbacks
          const safeTextContent = (selector) => {
            try {
              const el = document.querySelector(selector);
              return el ? el.textContent.trim() : null;
            } catch {
              return null;
            }
          };
          
          // Extract product information if available
          const extractProductInfo = () => {
            const product = {
              name: safeTextContent('h1') || safeTextContent('.product-title'),
              price: safeTextContent('.price') || safeTextContent('.product-price') || safeTextContent('[class*=\"price\"]'),
              sku: safeTextContent('.sku') || safeTextContent('[class*=\"sku\"]'),
              description: safeTextContent('.description') || safeTextContent('.product-description'),
              availability: safeTextContent('.stock') || safeTextContent('.availability'),
            };
            
            // Clean up undefined values
            Object.keys(product).forEach(key => {
              if (!product[key]) delete product[key];
            });
            
            return Object.keys(product).length > 1 ? product : null;
          };
          
          // Extract links for crawling
          const extractLinks = () => {
            const links = [];
            document.querySelectorAll('a[href]').forEach(link => {
              const href = link.href;
              if (href && href.includes('thompsonseparts.co.uk') && !href.includes('#')) {
                links.push({
                  url: href,
                  text: link.textContent.trim().substring(0, 100)
                });
              }
            });
            return links.slice(0, 20); // Limit to first 20 links
          };
          
          return {
            title: document.title,
            description: document.querySelector('meta[name=\"description\"]')?.content,
            h1: safeTextContent('h1'),
            textContent: document.body ? document.body.innerText.substring(0, 10000) : '', // Limit size
            breadcrumbs: Array.from(document.querySelectorAll('.breadcrumb a, nav[aria-label=\"breadcrumb\"] a'))
              .map(a => a.textContent?.trim()).filter(Boolean),
            jsonLd: getJsonLd(),
            productInfo: extractProductInfo(),
            categories: Array.from(document.querySelectorAll('.category-link, .product-category a'))
              .map(a => a.textContent?.trim()).filter(Boolean),
            links: extractLinks(),
            hasContent: !!document.body?.innerText?.length
          };
        } catch (error) {
          return {
            title: document.title || 'Unknown',
            error: error.message,
            hasContent: false
          };
        }
      });
      
      // Determine page type
      let pageType = 'general';
      const urlPath = new URL(url).pathname;
      if (urlPath.includes('/product')) pageType = 'product';
      else if (urlPath.includes('/category')) pageType = 'category';
      else if (urlPath === '/') pageType = 'homepage';
      else if (urlPath.includes('/shop')) pageType = 'shop';
      
      // Create safe filename
      const filenameSafe = urlPath.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'homepage';
      const timestamp = Date.now();
      const filename = `${pageType}_${filenameSafe}_${timestamp}.json`;
      
      // Prepare data to save
      const dataToSave = {
        url,
        type: pageType,
        title: pageData.title,
        h1: pageData.h1,
        description: pageData.description,
        breadcrumbs: pageData.breadcrumbs,
        textContent: pageData.textContent,
        productInfo: pageData.productInfo,
        jsonLd: pageData.jsonLd,
        categories: pageData.categories,
        links: pageData.links,
        hasContent: pageData.hasContent,
        scrapedAt: new Date().toISOString(),
        responseTime: Date.now() - stats.startTime,
        userAgent: page.context().browser()?.version() || 'unknown'
      };
      
      // Save to file
      await fs.writeFile(
        path.join(OUTPUT_DIR, filename),
        JSON.stringify(dataToSave, null, 2)
      );
      
      // Update statistics
      stats.pagesScraped++;
      stats.urls.push(url);
      
      log.success(`💾 Saved page data: ${filename} (${pageType})`);
      log.info(`📊 Content extracted: ${pageData.hasContent ? 'Yes' : 'No'} | Links found: ${pageData.links?.length || 0}`);
      
      // Enqueue more links if we haven't reached the limit
      if (stats.pagesScraped < MAX_PAGES) {
        try {
          await enqueueLinks({
            globs: [`${TARGET_SITE}/**`],
            exclude: [
              '**/wp-admin/**',
              '**/admin/**',
              '**/login/**',
              '**/cart/**',
              '**/checkout/**',
              '**/my-account/**',
              '**/*.pdf',
              '**/*.jpg',
              '**/*.png',
              '**/*.gif',
              '**/#*',
              '**/javascript:*',
              '**/mailto:*',
              '**/tel:*'
            ],
            transformRequestFunction: (req) => {
              // Additional filtering
              if (stats.urls.includes(req.url)) {
                return false; // Already visited
              }
              return req;
            }
          });
        } catch (linkError) {
          log.warning(`Could not enqueue links: ${linkError.message}`);
        }
      }
      
      // Random delay between pages
      await randomDelay(3000, 7000);
      
    } catch (error) {
      log.error(`❌ Failed to process ${request.url}: ${error.message}`);
      stats.pagesFailed++;
      stats.errors.push({
        url: request.url,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  },
  
  // Handle failed requests
  failedRequestHandler: ({ request, error }) => {
    log.error(`❌ Request failed: ${request.url} - ${error.message}`);
    stats.pagesFailed++;
    stats.errors.push({
      url: request.url,
      error: error.message,
      timestamp: new Date().toISOString(),
      type: 'request_failed'
    });
  },
});

// Run the optimized crawler
log.section('🚀 Starting Optimized Crawl');

try {
  await crawler.run([TARGET_SITE]);
  
  const elapsed = ((Date.now() - stats.startTime) / 1000).toFixed(2);
  
  // Save detailed statistics
  const detailedStats = {
    ...stats,
    elapsed,
    successRate: ((stats.pagesScraped / (stats.pagesScraped + stats.pagesFailed)) * 100).toFixed(1),
    avgTimePerPage: stats.pagesScraped > 0 ? (parseFloat(elapsed) / stats.pagesScraped).toFixed(2) : 0,
    resourcesBlocked: stats.blockedRequests,
    completedAt: new Date().toISOString()
  };
  
  const statsFile = path.join(OUTPUT_DIR, '_crawl_statistics.json');
  await fs.writeFile(statsFile, JSON.stringify(detailedStats, null, 2));
  
  // Generate report
  const report = `
# Optimized Crawler Test Report
Generated: ${new Date().toISOString()}

## Test Results
- **Target Site:** ${TARGET_SITE}
- **Pages Scraped:** ${stats.pagesScraped}
- **Pages Failed:** ${stats.pagesFailed}
- **Success Rate:** ${detailedStats.successRate}%
- **Total Time:** ${elapsed}s
- **Avg Time per Page:** ${detailedStats.avgTimePerPage}s
- **Resources Blocked:** ${stats.blockedRequests}

## Anti-Bot Measures Assessment
${stats.pagesFailed === 0 ? '✅ Successfully bypassed anti-bot measures' : '⚠️ Some pages were blocked'}

## User Agents Used
${stats.userAgents.map(ua => `- ${ua}`).join('\n')}

## Pages Successfully Scraped
${stats.urls.map(url => `- ${url}`).join('\n')}

${stats.errors.length > 0 ? `\n## Errors Encountered\n${stats.errors.map(e => `- ${e.url}: ${e.error}`).join('\n')}` : ''}

## Recommendations
${stats.pagesFailed === 0 
  ? '✅ The crawler configuration is working well. Consider scaling up for full site crawling.'
  : '⚠️ Some requests failed. Consider implementing additional stealth measures or reducing crawl speed.'
}
`;
  
  const reportFile = path.join(OUTPUT_DIR, '_test_report.md');
  await fs.writeFile(reportFile, report);
  
  // Display final results
  console.log('\n' + '━'.repeat(60));
  console.log(`${colors.bold}${colors.cyan}🎉 Optimized Crawler Test Completed${colors.reset}`);
  console.log('━'.repeat(60));
  console.log(`${colors.green}Success Rate: ${detailedStats.successRate}%${colors.reset}`);
  console.log(`Pages Scraped: ${stats.pagesScraped}/${MAX_PAGES}`);
  console.log(`Time Elapsed: ${elapsed}s`);
  console.log(`Resources Blocked: ${stats.blockedRequests}`);
  console.log(`\n📁 Output Directory: ${OUTPUT_DIR}`);
  console.log(`📊 Statistics: ${statsFile}`);
  console.log(`📄 Report: ${reportFile}`);
  console.log('━'.repeat(60));
  
  if (stats.pagesScraped > 0) {
    log.success('✅ Crawler can successfully access Thompson\'s Parts website');
    log.info('💡 Ready for full-scale crawling with current configuration');
  } else {
    log.warning('⚠️ No pages were successfully scraped. Additional optimization may be needed.');
  }
  
} catch (error) {
  log.error(`❌ Crawler test failed: ${error.message}`);
  
  // Save error details
  const errorReport = {
    error: error.message,
    stack: error.stack,
    stats,
    timestamp: new Date().toISOString()
  };
  
  await fs.writeFile(
    path.join(OUTPUT_DIR, '_error_report.json'),
    JSON.stringify(errorReport, null, 2)
  );
  
  process.exit(1);
}

console.log('\n✅ Optimized crawler test completed successfully!');