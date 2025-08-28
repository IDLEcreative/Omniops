/**
 * Smart Periodic Scraper - Optimized for customer service bot training
 * 
 * Features:
 * - Initial full scrape
 * - Smart change detection
 * - Adaptive scheduling based on page change frequency
 * - Minimal resource usage
 */

const crypto = require('crypto');
const { CronJob } = require('cron');

class SmartPeriodicScraper {
  constructor(domain, options = {}) {
    this.domain = domain;
    this.options = {
      storagePath: options.storagePath || './scraper-data',
      checkInterval: options.checkInterval || '0 */6 * * *', // Every 6 hours default
      maxConcurrent: options.maxConcurrent || 5,
      ...options
    };
    
    // Page type patterns and their typical update frequencies
    this.pagePatterns = {
      homepage: {
        pattern: /^\/$/,
        checkFrequency: 'daily',
        priority: 1
      },
      products: {
        pattern: /\/product\//,
        checkFrequency: 'daily', 
        priority: 2
      },
      categories: {
        pattern: /\/category\/|\/product-category\//,
        checkFrequency: 'twice-daily',
        priority: 2
      },
      news: {
        pattern: /\/news\/|\/blog\//,
        checkFrequency: 'hourly',
        priority: 1
      },
      policies: {
        pattern: /\/terms|\/privacy|\/return|\/shipping/,
        checkFrequency: 'weekly',
        priority: 3
      },
      about: {
        pattern: /\/about|\/contact|\/help/,
        checkFrequency: 'monthly',
        priority: 4
      }
    };
    
    this.state = {
      pages: {},
      lastFullScrape: null,
      lastIncrementalCheck: null,
      changeHistory: {}, // Track how often each page changes
      statistics: {
        totalChecks: 0,
        changesFound: 0,
        lastCheckDuration: 0
      }
    };
    
    this.cronJobs = [];
  }

  /**
   * Initialize the scraper - does full scrape if needed, then starts periodic updates
   */
  async initialize() {
    console.log('🚀 Initializing Smart Periodic Scraper...');
    
    // Load previous state if exists
    await this.loadState();
    
    // Check if we need initial full scrape
    if (!this.state.lastFullScrape) {
      console.log('📊 No previous data found - performing initial full scrape...');
      await this.fullScrape();
    } else {
      const daysSinceFullScrape = (Date.now() - new Date(this.state.lastFullScrape)) / (1000 * 60 * 60 * 24);
      console.log(`📊 Last full scrape was ${daysSinceFullScrape.toFixed(1)} days ago`);
      
      // Force full rescrape monthly for data integrity
      if (daysSinceFullScrape > 30) {
        console.log('🔄 Monthly full rescrape triggered...');
        await this.fullScrape();
      }
    }
    
    // Start periodic update jobs
    this.startPeriodicUpdates();
    
    console.log('✅ Scraper initialized and running');
    this.printSchedule();
  }

  /**
   * Perform initial full scrape
   */
  async fullScrape() {
    const startTime = Date.now();
    console.log('\n🌐 Starting full website scrape...');
    
    // Get all URLs from the site
    const urls = await this.discoverAllUrls();
    console.log(`  Found ${urls.length} total pages to scrape`);
    
    // Scrape in batches for efficiency
    const batchSize = this.options.maxConcurrent;
    let scraped = 0;
    
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      const results = await Promise.all(
        batch.map(url => this.scrapePage(url))
      );
      
      // Store page data and metadata
      results.forEach(pageData => {
        if (pageData) {
          const contentHash = this.hashContent(pageData.content);
          this.state.pages[pageData.url] = {
            url: pageData.url,
            title: pageData.title,
            contentHash,
            contentLength: pageData.content.length,
            lastChecked: new Date().toISOString(),
            lastModified: new Date().toISOString(),
            changeCount: 0,
            pageType: this.identifyPageType(pageData.url),
            checkPriority: this.calculatePriority(pageData.url)
          };
          
          // Store actual content for bot training
          this.savePageContent(pageData);
        }
      });
      
      scraped += batch.length;
      if (scraped % 50 === 0) {
        console.log(`  Progress: ${scraped}/${urls.length} pages (${((scraped/urls.length)*100).toFixed(1)}%)`);
      }
    }
    
    this.state.lastFullScrape = new Date().toISOString();
    await this.saveState();
    
    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    console.log(`✅ Full scrape completed: ${scraped} pages in ${duration} minutes`);
    
    // Analyze change patterns if we have history
    if (this.state.changeHistory && Object.keys(this.state.changeHistory).length > 0) {
      this.analyzeChangePatterns();
    }
  }

  /**
   * Start periodic update jobs based on page types
   */
  startPeriodicUpdates() {
    console.log('\n⏰ Setting up periodic update schedule...');
    
    // Clear any existing jobs
    this.cronJobs.forEach(job => job.stop());
    this.cronJobs = [];
    
    // Create optimized check schedules
    const schedules = {
      hourly: '0 * * * *',      // Every hour
      'twice-daily': '0 */12 * * *', // Every 12 hours
      daily: '0 3 * * *',        // 3 AM daily
      weekly: '0 3 * * 1',       // Monday 3 AM
      monthly: '0 3 1 * *'       // 1st of month 3 AM
    };
    
    // Group pages by update frequency
    const pageGroups = {};
    Object.values(this.state.pages).forEach(page => {
      const pageType = this.identifyPageType(page.url);
      const frequency = this.pagePatterns[pageType]?.checkFrequency || 'daily';
      
      if (!pageGroups[frequency]) {
        pageGroups[frequency] = [];
      }
      pageGroups[frequency].push(page.url);
    });
    
    // Create cron job for each frequency group
    Object.entries(pageGroups).forEach(([frequency, urls]) => {
      const cronTime = schedules[frequency];
      if (cronTime) {
        const job = new CronJob(cronTime, async () => {
          await this.checkPageGroup(urls, frequency);
        });
        
        job.start();
        this.cronJobs.push(job);
        console.log(`  📅 Scheduled ${frequency} checks for ${urls.length} pages`);
      }
    });
    
    // Also create a smart incremental check that runs frequently
    const smartCheck = new CronJob('*/30 * * * *', async () => {
      await this.smartIncrementalCheck();
    });
    smartCheck.start();
    this.cronJobs.push(smartCheck);
  }

  /**
   * Smart incremental check - focuses on pages likely to have changed
   */
  async smartIncrementalCheck() {
    const startTime = Date.now();
    console.log('\n🔍 Running smart incremental check...');
    
    // Select pages to check based on:
    // 1. Time since last check
    // 2. Historical change frequency
    // 3. Page type priority
    
    const pagesToCheck = this.selectPagesForCheck();
    
    if (pagesToCheck.length === 0) {
      console.log('  No pages need checking right now');
      return;
    }
    
    console.log(`  Checking ${pagesToCheck.length} pages for updates...`);
    
    const changes = [];
    const unchanged = [];
    
    // Check pages in batches
    for (let i = 0; i < pagesToCheck.length; i += this.options.maxConcurrent) {
      const batch = pagesToCheck.slice(i, i + this.options.maxConcurrent);
      
      const results = await Promise.all(
        batch.map(async (url) => {
          const hasChanged = await this.hasPageChanged(url);
          return { url, hasChanged };
        })
      );
      
      for (const { url, hasChanged } of results) {
        if (hasChanged) {
          changes.push(url);
          // Re-scrape the changed page
          const newContent = await this.scrapePage(url);
          if (newContent) {
            this.updatePageData(url, newContent);
            console.log(`  ✅ Updated: ${url}`);
          }
        } else {
          unchanged.push(url);
        }
        
        // Update check timestamp
        this.state.pages[url].lastChecked = new Date().toISOString();
      }
    }
    
    // Update statistics
    this.state.statistics.totalChecks += pagesToCheck.length;
    this.state.statistics.changesFound += changes.length;
    this.state.statistics.lastCheckDuration = Date.now() - startTime;
    this.state.lastIncrementalCheck = new Date().toISOString();
    
    await this.saveState();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ Incremental check completed in ${duration}s`);
    console.log(`  Changes found: ${changes.length}/${pagesToCheck.length}`);
    
    // Notify bot training system of updates
    if (changes.length > 0) {
      await this.notifyBotOfChanges(changes);
    }
  }

  /**
   * Select which pages to check based on smart heuristics
   */
  selectPagesForCheck() {
    const now = Date.now();
    const pages = Object.values(this.state.pages);
    
    // Calculate priority score for each page
    const pagesWithScores = pages.map(page => {
      const timeSinceLastCheck = now - new Date(page.lastChecked).getTime();
      const hourssSinceCheck = timeSinceLastCheck / (1000 * 60 * 60);
      
      // Base score on time since last check
      let score = hourssSinceCheck;
      
      // Boost score based on page type priority
      const pageType = this.identifyPageType(page.url);
      const priority = this.pagePatterns[pageType]?.priority || 5;
      score *= (6 - priority); // Higher priority = higher multiplier
      
      // Boost score based on historical change frequency
      if (this.state.changeHistory[page.url]) {
        const changeRate = this.state.changeHistory[page.url].changeRate || 0;
        score *= (1 + changeRate);
      }
      
      // Reduce score if page rarely changes
      if (page.changeCount === 0 && hourssSinceCheck < 168) { // No changes in a week
        score *= 0.1;
      }
      
      return { url: page.url, score, hourssSinceCheck };
    });
    
    // Sort by score and select top pages
    pagesWithScores.sort((a, b) => b.score - a.score);
    
    // Determine how many pages to check
    const maxToCheck = Math.min(
      50, // Never check more than 50 at once
      Math.ceil(pages.length * 0.1) // Check 10% of total pages
    );
    
    // Select pages that need checking
    const threshold = 1; // Minimum hours before rechecking
    const selected = pagesWithScores
      .filter(p => p.hourssSinceCheck >= threshold)
      .slice(0, maxToCheck)
      .map(p => p.url);
    
    return selected;
  }

  /**
   * Check if a page has changed (efficiently)
   */
  async hasPageChanged(url) {
    const savedPage = this.state.pages[url];
    if (!savedPage) return true; // New page
    
    try {
      // First try HEAD request for quick check
      const headResponse = await fetch(url, { method: 'HEAD' });
      const headers = Object.fromEntries(headResponse.headers);
      
      // Check Last-Modified header
      if (headers['last-modified']) {
        const lastModified = new Date(headers['last-modified']).getTime();
        const savedModified = new Date(savedPage.lastModified).getTime();
        
        if (lastModified > savedModified) {
          return true; // Page has been modified
        }
      }
      
      // Check Content-Length for significant changes
      if (headers['content-length']) {
        const currentLength = parseInt(headers['content-length']);
        const savedLength = savedPage.contentLength;
        
        // If size changed by more than 5%, probably updated
        const changePct = Math.abs(currentLength - savedLength) / savedLength;
        if (changePct > 0.05) {
          return true;
        }
      }
      
      // For critical pages, do full content check
      const pageType = this.identifyPageType(url);
      if (this.pagePatterns[pageType]?.priority <= 2) {
        const response = await fetch(url);
        const content = await response.text();
        const currentHash = this.hashContent(content);
        
        return currentHash !== savedPage.contentHash;
      }
      
      return false; // Assume unchanged
      
    } catch (error) {
      console.error(`  Error checking ${url}: ${error.message}`);
      return true; // Assume changed on error to be safe
    }
  }

  /**
   * Update page data after detecting changes
   */
  updatePageData(url, newContent) {
    const page = this.state.pages[url];
    
    // Update metadata
    page.contentHash = this.hashContent(newContent.content);
    page.contentLength = newContent.content.length;
    page.lastModified = new Date().toISOString();
    page.changeCount = (page.changeCount || 0) + 1;
    
    // Track change history for pattern analysis
    if (!this.state.changeHistory[url]) {
      this.state.changeHistory[url] = {
        changes: [],
        changeRate: 0
      };
    }
    
    this.state.changeHistory[url].changes.push({
      timestamp: new Date().toISOString(),
      sizeChange: newContent.content.length - page.contentLength
    });
    
    // Calculate change rate (changes per week)
    const changes = this.state.changeHistory[url].changes;
    if (changes.length > 1) {
      const timespan = Date.now() - new Date(changes[0].timestamp).getTime();
      const weeks = timespan / (1000 * 60 * 60 * 24 * 7);
      this.state.changeHistory[url].changeRate = changes.length / Math.max(1, weeks);
    }
    
    // Save new content for bot training
    this.savePageContent(newContent);
  }

  /**
   * Identify page type based on URL pattern
   */
  identifyPageType(url) {
    for (const [type, config] of Object.entries(this.pagePatterns)) {
      if (config.pattern.test(url)) {
        return type;
      }
    }
    return 'other';
  }

  /**
   * Calculate priority for checking a page
   */
  calculatePriority(url) {
    const pageType = this.identifyPageType(url);
    return this.pagePatterns[pageType]?.priority || 5;
  }

  /**
   * Hash content for change detection
   */
  hashContent(content) {
    // Strip dynamic content before hashing
    const normalized = content
      .replace(/[\r\n\s]+/g, ' ') // Normalize whitespace
      .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/g, '') // Remove timestamps
      .replace(/session[^"'\s]*/gi, '') // Remove session tokens
      .replace(/csrf[^"'\s]*/gi, '') // Remove CSRF tokens
      .replace(/nonce[^"'\s]*/gi, '') // Remove nonces
      .trim();
    
    return crypto.createHash('md5').update(normalized).digest('hex');
  }

  /**
   * Analyze change patterns to optimize checking frequency
   */
  analyzeChangePatterns() {
    console.log('\n📊 Analyzing page change patterns...');
    
    const patterns = {};
    
    Object.entries(this.state.changeHistory).forEach(([url, history]) => {
      const pageType = this.identifyPageType(url);
      
      if (!patterns[pageType]) {
        patterns[pageType] = {
          totalPages: 0,
          totalChanges: 0,
          avgChangeRate: 0
        };
      }
      
      patterns[pageType].totalPages++;
      patterns[pageType].totalChanges += history.changes.length;
      patterns[pageType].avgChangeRate += history.changeRate || 0;
    });
    
    // Calculate averages and suggest optimizations
    Object.entries(patterns).forEach(([type, stats]) => {
      stats.avgChangeRate = stats.avgChangeRate / stats.totalPages;
      
      console.log(`  ${type}: ${stats.totalChanges} changes across ${stats.totalPages} pages`);
      console.log(`    Average change rate: ${stats.avgChangeRate.toFixed(2)} changes/week`);
      
      // Suggest frequency adjustments
      if (stats.avgChangeRate > 7) {
        console.log(`    💡 Consider checking ${type} pages more frequently`);
      } else if (stats.avgChangeRate < 0.5) {
        console.log(`    💡 Consider checking ${type} pages less frequently`);
      }
    });
  }

  /**
   * Print the current checking schedule
   */
  printSchedule() {
    console.log('\n📅 Current Checking Schedule:');
    
    const pagesByType = {};
    Object.values(this.state.pages).forEach(page => {
      const type = this.identifyPageType(page.url);
      pagesByType[type] = (pagesByType[type] || 0) + 1;
    });
    
    Object.entries(this.pagePatterns).forEach(([type, config]) => {
      const count = pagesByType[type] || 0;
      if (count > 0) {
        console.log(`  ${type}: ${count} pages checked ${config.checkFrequency}`);
      }
    });
    
    const changeRate = ((this.state.statistics.changesFound / Math.max(1, this.state.statistics.totalChecks)) * 100).toFixed(1);
    console.log(`\n📊 Overall Statistics:`);
    console.log(`  Total checks performed: ${this.state.statistics.totalChecks}`);
    console.log(`  Changes detected: ${this.state.statistics.changesFound} (${changeRate}% change rate)`);
  }

  /**
   * Notify bot training system of content changes
   */
  async notifyBotOfChanges(changedUrls) {
    // This would integrate with your bot training system
    console.log(`\n🤖 Notifying bot training system of ${changedUrls.length} content changes`);
    
    // In production, this would trigger bot retraining
    // await botTrainingAPI.updateContent(changedUrls);
  }

  /**
   * Save/load state persistence
   */
  async saveState() {
    const fs = require('fs').promises;
    const path = require('path');
    
    const stateFile = path.join(this.options.storagePath, 'scraper-state.json');
    await fs.mkdir(this.options.storagePath, { recursive: true });
    await fs.writeFile(stateFile, JSON.stringify(this.state, null, 2));
  }

  async loadState() {
    const fs = require('fs').promises;
    const path = require('path');
    
    try {
      const stateFile = path.join(this.options.storagePath, 'scraper-state.json');
      const data = await fs.readFile(stateFile, 'utf8');
      this.state = JSON.parse(data);
    } catch (error) {
      // No previous state, start fresh
      console.log('No previous state found, starting fresh');
    }
  }

  async savePageContent(pageData) {
    const fs = require('fs').promises;
    const path = require('path');
    
    const sanitizedUrl = pageData.url.replace(/[^a-z0-9]/gi, '_');
    const contentFile = path.join(
      this.options.storagePath, 
      'content',
      `${sanitizedUrl}.json`
    );
    
    await fs.mkdir(path.dirname(contentFile), { recursive: true });
    await fs.writeFile(contentFile, JSON.stringify({
      url: pageData.url,
      title: pageData.title,
      content: pageData.content,
      extractedAt: new Date().toISOString()
    }, null, 2));
  }

  // Placeholder methods - integrate with your existing scraper
  async discoverAllUrls() {
    // Use your existing crawler to get all URLs
    const { crawlWebsite } = require('./scraper-api');
    const results = await crawlWebsite(this.domain, { 
      maxPages: -1,
      turboMode: true 
    });
    return results.map(r => r.url);
  }

  async scrapePage(url) {
    // Use your existing page scraper
    const { scrapePage } = require('./scraper-api');
    return scrapePage(url);
  }

  /**
   * Stop all periodic jobs
   */
  stop() {
    console.log('🛑 Stopping periodic scraper...');
    this.cronJobs.forEach(job => job.stop());
    this.cronJobs = [];
  }
}

module.exports = { SmartPeriodicScraper };

// Usage example:
/*
const scraper = new SmartPeriodicScraper('https://www.thompsonseparts.co.uk', {
  checkInterval: '0 */4 * * *', // Every 4 hours
  maxConcurrent: 10
});

// Initialize and start automatic updates
await scraper.initialize();

// The scraper now runs automatically:
// - News pages checked hourly
// - Products checked daily  
// - Categories checked twice daily
// - Policies checked weekly
// - About pages checked monthly
// - Smart incremental checks every 30 minutes focusing on likely changes

// To stop:
// scraper.stop();
*/