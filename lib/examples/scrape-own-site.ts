import { checkCrawlStatus, streamCrawlResults } from '../scraper-api';
import { crawlWebsiteWithCleanup } from '../scraper-with-cleanup';
import { getOptimalConfig } from '../scraper-config-own-site';

// Example: Scraping your own website with maximum speed
async function scrapeOwnWebsite() {
  const url = 'https://www.your-company.com';
  const estimatedPages = 5000; // Estimate of total pages
  
  
  // Get optimal configuration based on site size
  const { config, parallel } = getOptimalConfig(estimatedPages);
  
  console.log(`- Total concurrent browsers: ${parallel.totalJobs * (config.maxConcurrency || 3)}`);
  
  // Option 1: Single high-performance job
  const singleJobId = await crawlWebsiteWithCleanup(url, {
    maxPages: estimatedPages,
    ownSite: true, // Enable own-site optimizations
    turboMode: true, // Enable turbo mode
    config: {
      maxConcurrency: 20, // 20 concurrent pages
    }
  });
  
  
  // Option 2: Multiple parallel jobs (recommended for large sites)
  console.log('\nOption 2: Multiple parallel jobs (better for large sites)');
  const jobIds: string[] = [];
  
  // Start multiple jobs, each handling a portion of the site
  for (let i = 0; i < parallel.totalJobs; i++) {
    const jobId = await crawlWebsiteWithCleanup(url, {
      maxPages: parallel.pagesPerJob,
      ownSite: true,
      turboMode: true,
      // Each job can have different path filters to avoid overlap
      includePaths: getPathsForJob(i, parallel.totalJobs),
    });
    
    jobIds.push(jobId);
    
    // Small delay between starting jobs to avoid resource spike
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Monitor progress
  
  const startTime = Date.now();
  let allCompleted = false;
  
  while (!allCompleted) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Check every 5 seconds
    
    const statuses = await Promise.all(
      jobIds.map(id => checkCrawlStatus(id))
    );
    
    const totalCompleted = statuses.reduce((sum, status) => sum + status.completed, 0);
    const totalFailed = statuses.reduce((sum, status) => sum + status.failed, 0);
    const elapsedSeconds = Math.round((Date.now() - startTime) / 1000);
    const pagesPerSecond = (totalCompleted / elapsedSeconds).toFixed(2);
    
    console.log(`- Estimated completion: ${Math.round(estimatedPages / parseFloat(pagesPerSecond) / 60)} minutes`);
    
    allCompleted = statuses.every(s => s.status === 'completed' || s.status === 'failed');
  }
  
  
  // Stream results for processing
  let totalResults = 0;
  
  for (const jobId of jobIds) {
    for await (const page of streamCrawlResults(jobId)) {
      totalResults++;
      // Process each page (e.g., save to database, index for search, etc.)
      if (totalResults % 100 === 0) {
      }
    }
  }
  
}

// Helper function to distribute paths across jobs
function getPathsForJob(jobIndex: number, totalJobs: number): string[] {
  // Example: Distribute by first letter of path
  // Job 0: /a*, /b*, /c*
  // Job 1: /d*, /e*, /f*
  // etc.
  
  const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
  const charsPerJob = Math.ceil(26 / totalJobs);
  const startChar = jobIndex * charsPerJob;
  const endChar = Math.min(startChar + charsPerJob, 26);
  
  const paths = [];
  for (let i = startChar; i < endChar; i++) {
    paths.push(`/${alphabet[i]}*`);
  }
  
  // Also include number paths for one job
  if (jobIndex === 0) {
    for (let i = 0; i <= 9; i++) {
      paths.push(`/${i}*`);
    }
  }
  
  return paths;
}

// Advanced example: Custom configuration for specific use cases
async function advancedOwnSiteScraping() {
  const url = 'https://www.your-company.com';
  
  // Use case 1: Scrape only product pages for e-commerce
  const productJobId = await crawlWebsiteWithCleanup(url, {
    maxPages: -1, // No limit
    ownSite: true,
    includePaths: ['/products/*', '/category/*/products/*'],
    config: {
      maxConcurrency: 30, // Very high concurrency
      content: {
        minWordCount: 50,
        maxPageSizeMB: 10,
        extractImages: true, // Include product images
        extractLinks: true,
        extractMetadata: true,
      },
      advanced: {
        waitForSelector: '.product-details', // Wait for product content
        followRedirects: true,
        maxRedirects: 5,
        ignoreSslErrors: false,
        customHeaders: {
          'X-Scraper-Purpose': 'product-catalog-update',
        },
      },
    }
  });
  
  // Use case 2: Documentation site with code examples
  const docsJobId = await crawlWebsiteWithCleanup(url + '/docs', {
    maxPages: -1,
    ownSite: true,
    config: {
      maxConcurrency: 15,
      content: {
        minWordCount: 50, // Ensure meaningful content
        maxPageSizeMB: 10,
        extractImages: true,
        extractLinks: true,
        extractMetadata: true,
      },
      browser: {
        blockResources: ['media', 'font'], // Keep CSS for code highlighting
        headless: true,
        userAgent: 'CustomerServiceBot/1.0',
        viewport: { width: 1920, height: 1080 },
      },
      advanced: {
        waitForSelector: '.doc-content', // Wait for doc content
        followRedirects: true,
        maxRedirects: 5,
        ignoreSslErrors: false,
        customHeaders: {},
      },
    }
  });
  
  // Use case 3: News/blog site with frequent updates
  const newsJobId = await crawlWebsiteWithCleanup(url + '/news', {
    maxPages: 1000, // Last 1000 articles
    ownSite: true,
    config: {
      maxConcurrency: 25,
      content: {
        minWordCount: 50,
        maxPageSizeMB: 10,
        extractImages: true,
        extractLinks: true,
        extractMetadata: true, // Get publish dates, authors
      },
      advanced: {
        waitForSelector: 'article[data-loaded="true"]', // Dynamic content
        followRedirects: true,
        maxRedirects: 5,
        ignoreSslErrors: false,
        customHeaders: {},
      },
    }
  });
  
}

// Run the examples
if (require.main === module) {
  scrapeOwnWebsite().catch(console.error);
}