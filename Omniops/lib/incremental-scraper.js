/**
 * Incremental Scraping System
 * Only scrapes new or changed content - 10-100x faster than full scraping
 */

const crypto = require('crypto');
const fs = require('fs').promises;

class IncrementalScraper {
  constructor(domain) {
    this.domain = domain;
    this.stateFile = `./scraper-state/${domain.replace(/[^a-z0-9]/gi, '_')}.json`;
    this.state = null;
  }

  async scrape(options = {}) {
    // Load previous state
    this.state = await this.loadState();
    
    if (!this.state.lastFullScrape) {
      console.log('🆕 First time scraping - performing full crawl...');
      return this.fullScrape();
    }
    
    console.log('🔄 Incremental scrape - checking for changes...');
    return this.incrementalScrape(options);
  }

  async fullScrape() {
    const startTime = Date.now();
    const results = [];
    
    // Use your existing crawler
    const pages = await crawlWebsite(this.domain, { maxPages: -1 });
    
    // Save state for each page
    for (const page of pages) {
      const pageState = {
        url: page.url,
        contentHash: this.hashContent(page.content),
        lastModified: page.headers?.['last-modified'] || new Date().toISOString(),
        etag: page.headers?.etag,
        contentLength: page.content.length,
        title: page.title,
        lastScraped: new Date().toISOString()
      };
      
      this.state.pages[page.url] = pageState;
      results.push(page);
    }
    
    this.state.lastFullScrape = new Date().toISOString();
    this.state.totalPages = results.length;
    await this.saveState();
    
    const elapsed = (Date.now() - startTime) / 1000 / 60;
    console.log(`✅ Full scrape complete: ${results.length} pages in ${elapsed.toFixed(1)} minutes`);
    
    return results;
  }

  async incrementalScrape(options) {
    const startTime = Date.now();
    const results = {
      new: [],
      updated: [],
      deleted: [],
      unchanged: 0
    };
    
    // Step 1: Find new pages by checking navigation
    const currentUrls = await this.discoverUrls();
    const previousUrls = new Set(Object.keys(this.state.pages));
    
    // New pages to scrape
    const newUrls = currentUrls.filter(url => !previousUrls.has(url));
    console.log(`  📝 Found ${newUrls.length} new pages`);
    
    // Deleted pages
    const deletedUrls = Array.from(previousUrls).filter(url => !currentUrls.includes(url));
    console.log(`  🗑️  Found ${deletedUrls.length} deleted pages`);
    
    // Step 2: Check existing pages for changes (smart sampling)
    const pagesToCheck = await this.selectPagesToCheck(previousUrls, options);
    console.log(`  🔍 Checking ${pagesToCheck.length} existing pages for changes...`);
    
    let checked = 0;
    for (const url of pagesToCheck) {
      checked++;
      
      // First try cheap HEAD request
      const hasChanged = await this.hasPageChanged(url);
      
      if (hasChanged) {
        // Page changed - need to re-scrape
        console.log(`    ♻️  [${checked}/${pagesToCheck.length}] Changed: ${url}`);
        const newContent = await this.scrapePage(url);
        results.updated.push(newContent);
        
        // Update state
        this.state.pages[url] = {
          url,
          contentHash: this.hashContent(newContent.content),
          lastModified: new Date().toISOString(),
          lastScraped: new Date().toISOString()
        };
      } else {
        results.unchanged++;
      }
      
      // Progress update every 10 pages
      if (checked % 10 === 0) {
        console.log(`    Progress: ${checked}/${pagesToCheck.length} pages checked`);
      }
    }
    
    // Step 3: Scrape all new pages
    for (const url of newUrls) {
      console.log(`  🆕 Scraping new page: ${url}`);
      const content = await this.scrapePage(url);
      results.new.push(content);
      
      this.state.pages[url] = {
        url,
        contentHash: this.hashContent(content.content),
        lastModified: new Date().toISOString(),
        lastScraped: new Date().toISOString()
      };
    }
    
    // Step 4: Remove deleted pages from state
    for (const url of deletedUrls) {
      delete this.state.pages[url];
      results.deleted.push(url);
    }
    
    // Save updated state
    this.state.lastIncrementalScrape = new Date().toISOString();
    await this.saveState();
    
    // Report results
    const elapsed = (Date.now() - startTime) / 1000 / 60;
    console.log(`
✅ Incremental Scrape Complete in ${elapsed.toFixed(1)} minutes:
  • New pages: ${results.new.length}
  • Updated pages: ${results.updated.length}
  • Deleted pages: ${results.deleted.length}
  • Unchanged pages: ${results.unchanged}
  • Total in database: ${Object.keys(this.state.pages).length}
    `);
    
    return results;
  }

  async hasPageChanged(url) {
    try {
      // Method 1: Try HEAD request first (fastest)
      const response = await fetch(url, { method: 'HEAD' });
      const headers = Object.fromEntries(response.headers);
      
      const savedPage = this.state.pages[url];
      
      // Check ETag (most reliable if present)
      if (headers.etag && savedPage.etag) {
        return headers.etag !== savedPage.etag;
      }
      
      // Check Last-Modified header
      if (headers['last-modified'] && savedPage.lastModified) {
        return new Date(headers['last-modified']) > new Date(savedPage.lastModified);
      }
      
      // Check Content-Length (quick check for major changes)
      if (headers['content-length'] && savedPage.contentLength) {
        const diff = Math.abs(parseInt(headers['content-length']) - savedPage.contentLength);
        if (diff > 100) return true; // Significant size change
      }
      
      // If no reliable headers, need to fetch and hash content (slower)
      if (!headers.etag && !headers['last-modified']) {
        const fullResponse = await fetch(url);
        const content = await fullResponse.text();
        const currentHash = this.hashContent(content);
        return currentHash !== savedPage.contentHash;
      }
      
      return false; // Assume unchanged if we can't determine
    } catch (error) {
      console.error(`    ⚠️  Error checking ${url}: ${error.message}`);
      return true; // Assume changed on error to be safe
    }
  }

  selectPagesToCheck(allUrls, options) {
    const urls = Array.from(allUrls);
    
    // Strategy 1: Check everything if explicitly requested
    if (options.checkAll) {
      return urls;
    }
    
    // Strategy 2: Smart sampling based on page importance
    const priorityPatterns = [
      /\/product\//,   // Product pages change often (price, stock)
      /\/shop\//,      // Shop pages show new products
      /\/news\//,      // News is frequently updated
      /\/$/            // Homepage
    ];
    
    const highPriority = urls.filter(url => 
      priorityPatterns.some(pattern => pattern.test(url))
    );
    
    // Strategy 3: Time-based checking
    const now = Date.now();
    const timeBasedCheck = urls.filter(url => {
      const page = this.state.pages[url];
      const lastChecked = new Date(page.lastScraped).getTime();
      const daysSinceCheck = (now - lastChecked) / (1000 * 60 * 60 * 24);
      
      // Check based on how long since last check
      if (daysSinceCheck > 30) return true;  // Monthly for static pages
      if (daysSinceCheck > 7 && url.includes('/product/')) return true; // Weekly for products
      if (daysSinceCheck > 1 && url.includes('/news/')) return true; // Daily for news
      
      return false;
    });
    
    // Strategy 4: Random sampling of remaining pages (10%)
    const unchecked = urls.filter(url => 
      !highPriority.includes(url) && !timeBasedCheck.includes(url)
    );
    const randomSample = unchecked
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.ceil(unchecked.length * 0.1));
    
    // Combine all strategies
    const toCheck = new Set([...highPriority, ...timeBasedCheck, ...randomSample]);
    
    // Limit maximum pages per run (configurable)
    const maxPerRun = options.maxPagesPerRun || 500;
    return Array.from(toCheck).slice(0, maxPerRun);
  }

  async discoverUrls() {
    // Quick discovery of all URLs without full scraping
    console.log('  🔍 Discovering current site structure...');
    
    const urls = new Set();
    
    // Method 1: Check sitemap
    try {
      const sitemapUrls = await this.getSitemapUrls();
      sitemapUrls.forEach(url => urls.add(url));
      console.log(`    Found ${sitemapUrls.length} URLs in sitemap`);
    } catch (e) {
      console.log('    No sitemap found');
    }
    
    // Method 2: Crawl main navigation pages only
    const navPages = [
      this.domain,
      `${this.domain}/shop`,
      `${this.domain}/products`,
      `${this.domain}/categories`
    ];
    
    for (const page of navPages) {
      try {
        const links = await this.getPageLinks(page);
        links.forEach(url => urls.add(url));
      } catch (e) {
        continue;
      }
    }
    
    console.log(`    Total URLs discovered: ${urls.size}`);
    return Array.from(urls);
  }

  hashContent(content) {
    // Remove dynamic content before hashing
    const staticContent = content
      .replace(/timestamp"?:\s*"?[\d\-T:\.Z]+/gi, '') // Remove timestamps
      .replace(/id"?:\s*"?[\w\-]+/gi, '')             // Remove IDs
      .replace(/csrf"?:\s*"?[\w\-]+/gi, '')           // Remove CSRF tokens
      .replace(/\s+/g, ' ')                           // Normalize whitespace
      .trim();
    
    return crypto.createHash('md5').update(staticContent).digest('hex');
  }

  async loadState() {
    try {
      const data = await fs.readFile(this.stateFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      // First run - no state file exists
      return {
        domain: this.domain,
        pages: {},
        lastFullScrape: null,
        lastIncrementalScrape: null,
        totalPages: 0
      };
    }
  }

  async saveState() {
    const dir = './scraper-state';
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(this.stateFile, JSON.stringify(this.state, null, 2));
  }

  // Placeholder methods - integrate with your existing scraper
  async scrapePage(url) {
    // Use your existing single-page scraper
    return scrapePage(url);
  }

  async getPageLinks(url) {
    // Quick link extraction without full scraping
    const response = await fetch(url);
    const html = await response.text();
    const links = html.match(/href="([^"]+)"/g) || [];
    return links
      .map(link => link.replace(/href="|"/g, ''))
      .filter(link => link.startsWith(this.domain));
  }

  async getSitemapUrls() {
    const response = await fetch(`${this.domain}/sitemap.xml`);
    const text = await response.text();
    const urls = text.match(/<loc>([^<]+)<\/loc>/g) || [];
    return urls.map(url => url.replace(/<\/?loc>/g, ''));
  }
}

module.exports = { IncrementalScraper };

// Usage:
/*
const scraper = new IncrementalScraper('https://www.thompsonseparts.co.uk');

// First run: Full scrape (7 hours)
await scraper.scrape();

// Daily runs: Only changes (10-30 minutes)
await scraper.scrape({ maxPagesPerRun: 500 });

// Weekly deep check: Sample more pages
await scraper.scrape({ maxPagesPerRun: 1000 });

// Force full recheck (useful monthly)
await scraper.scrape({ checkAll: true });
*/