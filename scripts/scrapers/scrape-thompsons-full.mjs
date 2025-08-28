#!/usr/bin/env node

/**
 * Full website scraper for Thompson's Parts using the existing crawler infrastructure
 * This will crawl the entire website and save results locally
 */

import { PlaywrightCrawler, Dataset } from 'crawlee';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const SITE_URL = 'https://www.thompsonseparts.co.uk/';
const OUTPUT_DIR = './scraped-data/thompsons-parts';
const MAX_PAGES = 100; // Limit for safety, increase if needed

// Create output directory
await fs.mkdir(OUTPUT_DIR, { recursive: true });

// Statistics tracking
const stats = {
  pagesScraped: 0,
  pagesFailed: 0,
  totalSize: 0,
  startTime: Date.now(),
  urls: [],
  categories: new Set(),
  products: []
};

console.log('🚀 Starting Full Website Scrape of Thompson\'s Parts');
console.log('━'.repeat(60));
console.log('📊 Configuration:');
console.log(`  - Starting URL: ${SITE_URL}`);
console.log(`  - Max Pages: ${MAX_PAGES}`);
console.log(`  - Output Directory: ${OUTPUT_DIR}`);
console.log(`  - Turbo Mode: Enabled`);
console.log('━'.repeat(60));
console.log('');

const crawler = new PlaywrightCrawler({
  maxRequestsPerCrawl: MAX_PAGES,
  maxConcurrency: 3, // Parallel pages
  
  // Browser configuration
  launchContext: {
    launchOptions: {
      headless: true,
    },
    userAgent: 'Mozilla/5.0 (compatible; CustomerServiceBot/1.0)',
  },
  
  // Pre-navigation setup
  preNavigationHooks: [
    async ({ page, request }) => {
      // Turbo mode: Block unnecessary resources
      await page.route('**/*', (route) => {
        const resourceType = route.request().resourceType();
        const url = route.request().url();
        
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
          route.abort();
        } else {
          route.continue();
        }
      });
      
      console.log(`⏳ [${stats.pagesScraped + 1}/${MAX_PAGES}] Scraping: ${request.url}`);
    },
  ],
  
  // Main request handler
  requestHandler: async ({ page, request, enqueueLinks }) => {
    try {
      // Wait for content
      await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
      
      // Try to wait for main content
      try {
        await page.waitForSelector('main, article, .content, #content', { timeout: 5000 });
      } catch {
        // Continue anyway
      }
      
      const url = request.url;
      const urlObj = new URL(url);
      
      // Extract page data
      const pageData = await page.evaluate(() => {
        // Remove scripts and styles
        const scripts = document.querySelectorAll('script, style, noscript');
        scripts.forEach(el => el.remove());
        
        // Extract structured data
        const getJsonLd = () => {
          const scripts = document.querySelectorAll('script[type="application/ld+json"]');
          const jsonLd = [];
          scripts.forEach(script => {
            try {
              jsonLd.push(JSON.parse(script.textContent));
            } catch {}
          });
          return jsonLd;
        };
        
        // Extract product information if it's a product page
        const extractProductInfo = () => {
          const product = {
            name: document.querySelector('h1')?.textContent?.trim(),
            price: document.querySelector('.price, .product-price, [class*="price"]')?.textContent?.trim(),
            sku: document.querySelector('.sku, [class*="sku"]')?.textContent?.trim(),
            description: document.querySelector('.description, .product-description, [class*="description"]')?.textContent?.trim(),
            availability: document.querySelector('.stock, .availability, [class*="stock"]')?.textContent?.trim(),
          };
          
          // Clean up undefined values
          Object.keys(product).forEach(key => {
            if (!product[key]) delete product[key];
          });
          
          return Object.keys(product).length > 1 ? product : null;
        };
        
        return {
          title: document.title,
          description: document.querySelector('meta[name="description"]')?.content,
          h1: document.querySelector('h1')?.textContent?.trim(),
          textContent: document.body?.innerText || '',
          breadcrumbs: Array.from(document.querySelectorAll('.breadcrumb a, nav[aria-label="breadcrumb"] a')).map(a => a.textContent?.trim()),
          jsonLd: getJsonLd(),
          productInfo: extractProductInfo(),
          categories: Array.from(document.querySelectorAll('.category-link, .product-category a')).map(a => a.textContent?.trim()),
        };
      });
      
      // Determine page type
      let pageType = 'general';
      if (urlObj.pathname.includes('/product')) pageType = 'product';
      else if (urlObj.pathname.includes('/category')) pageType = 'category';
      else if (urlObj.pathname === '/') pageType = 'homepage';
      else if (urlObj.pathname.includes('/shop')) pageType = 'shop';
      
      // Create filename
      const filenameSafe = urlObj.pathname.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'homepage';
      const hash = crypto.createHash('md5').update(url).digest('hex').substring(0, 8);
      const filename = `${filenameSafe}_${hash}.json`;
      
      // Prepare data to save
      const dataToSave = {
        url,
        type: pageType,
        title: pageData.title,
        h1: pageData.h1,
        description: pageData.description,
        breadcrumbs: pageData.breadcrumbs,
        textContent: pageData.textContent.substring(0, 50000), // Limit size
        productInfo: pageData.productInfo,
        jsonLd: pageData.jsonLd,
        categories: pageData.categories,
        scrapedAt: new Date().toISOString(),
        wordCount: pageData.textContent.split(/\s+/).length,
      };
      
      // Save to file
      await fs.writeFile(
        path.join(OUTPUT_DIR, filename),
        JSON.stringify(dataToSave, null, 2)
      );
      
      // Update statistics
      stats.pagesScraped++;
      stats.urls.push(url);
      stats.totalSize += dataToSave.textContent.length;
      
      if (pageData.categories) {
        pageData.categories.forEach(cat => stats.categories.add(cat));
      }
      
      if (pageData.productInfo) {
        stats.products.push({
          name: pageData.productInfo.name,
          url: url,
          price: pageData.productInfo.price
        });
      }
      
      console.log(`✅ [${stats.pagesScraped}/${MAX_PAGES}] Saved: ${filename} (${pageType})`);
      
      // Enqueue more links from this page (only from same domain)
      await enqueueLinks({
        globs: [`${SITE_URL}**`],
        transformRequestFunction: (req) => {
          // Skip certain URLs
          const skipPatterns = [
            '/wp-admin',
            '/admin',
            '/login',
            '/cart',
            '/checkout',
            '/my-account',
            '.pdf',
            '.jpg',
            '.png',
            '.gif',
            '#',
            'javascript:',
            'mailto:',
            'tel:'
          ];
          
          if (skipPatterns.some(pattern => req.url.includes(pattern))) {
            return false;
          }
          
          return req;
        }
      });
      
    } catch (error) {
      console.error(`❌ Failed to scrape ${request.url}:`, error.message);
      stats.pagesFailed++;
    }
  },
  
  // Handle failed requests
  failedRequestHandler: ({ request, error }) => {
    console.error(`❌ Request failed for ${request.url}: ${error.message}`);
    stats.pagesFailed++;
  },
});

// Run the crawler
console.log('\n🔄 Starting crawl process...\n');

try {
  await crawler.run([SITE_URL]);
  
  const elapsed = ((Date.now() - stats.startTime) / 1000).toFixed(2);
  
  // Save statistics
  const statsFile = path.join(OUTPUT_DIR, '_crawl_statistics.json');
  await fs.writeFile(statsFile, JSON.stringify(stats, null, 2));
  
  // Generate summary report
  const summaryReport = `
# Thompson's Parts Website Scraping Report
Generated: ${new Date().toISOString()}

## Summary Statistics
- **Total Pages Scraped:** ${stats.pagesScraped}
- **Failed Pages:** ${stats.pagesFailed}
- **Success Rate:** ${((stats.pagesScraped / (stats.pagesScraped + stats.pagesFailed)) * 100).toFixed(1)}%
- **Total Content Size:** ${(stats.totalSize / 1024 / 1024).toFixed(2)} MB
- **Time Elapsed:** ${elapsed} seconds
- **Pages per Second:** ${(stats.pagesScraped / parseFloat(elapsed)).toFixed(2)}
- **Unique Categories Found:** ${stats.categories.size}
- **Products Discovered:** ${stats.products.length}

## Categories Found
${Array.from(stats.categories).map(cat => `- ${cat}`).join('\n') || 'None found'}

## Sample Products (First 10)
${stats.products.slice(0, 10).map(p => `- ${p.name} (${p.price || 'No price'}) - ${p.url}`).join('\n') || 'No products found'}

## All URLs Scraped
${stats.urls.map(url => `- ${url}`).join('\n')}

## Output Location
All scraped data saved to: ${OUTPUT_DIR}
`;
  
  const summaryFile = path.join(OUTPUT_DIR, '_summary_report.md');
  await fs.writeFile(summaryFile, summaryReport);
  
  // Display final summary
  console.log('\n' + '━'.repeat(60));
  console.log('✨ SCRAPING COMPLETED SUCCESSFULLY!\n');
  console.log(`📊 Final Statistics:`);
  console.log(`  - Pages Scraped: ${stats.pagesScraped}`);
  console.log(`  - Failed: ${stats.pagesFailed}`);
  console.log(`  - Time: ${elapsed}s`);
  console.log(`  - Categories: ${stats.categories.size}`);
  console.log(`  - Products: ${stats.products.length}`);
  console.log(`\n📁 Data saved to: ${OUTPUT_DIR}`);
  console.log(`📄 Summary report: ${summaryFile}`);
  console.log('━'.repeat(60));
  
} catch (error) {
  console.error('\n❌ Crawler failed:', error);
  process.exit(1);
}

console.log('\n✅ Full website scrape completed!');
process.exit(0);