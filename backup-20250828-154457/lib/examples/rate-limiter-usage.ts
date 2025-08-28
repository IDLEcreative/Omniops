/**
 * Usage examples for the enhanced rate limiting system
 * Demonstrates integration with scraper-api.ts
 */

import { 
  initializeRateLimiter,
  checkScraperRateLimit,
  reportScrapingResult,
  getRateLimitStats,
  withRateLimit,
  RateLimiterPresets,
  configureDomainLimit,
} from '../scraper-rate-limit-integration';
import { EnhancedRateLimiter } from '../rate-limiter-enhanced';

// ============================================================================
// Example 1: Basic Setup and Configuration
// ============================================================================

async function example1_basicSetup() {
  console.log('Example 1: Basic Setup and Configuration');
  console.log('=========================================\n');
  
  // Initialize with moderate preset
  const limiter = initializeRateLimiter(RateLimiterPresets.moderate);
  
  // Configure specific domain limits
  configureDomainLimit('api.example.com', {
    requestsPerSecond: 10,
    burstSize: 30,
    priority: 'high',
    minDelay: 100,
    maxDelay: 500,
    customHeaders: {
      'X-API-Key': 'your-api-key',
    },
    customUserAgents: [
      'YourBot/1.0 (Compatible)',
    ],
  });
  
  // Configure a more restrictive limit for a sensitive domain
  configureDomainLimit('sensitive-site.com', {
    requestsPerSecond: 0.5,
    burstSize: 2,
    priority: 'low',
    minDelay: 3000,
    maxDelay: 8000,
  });
  
  console.log('✅ Rate limiter configured with domain-specific limits\n');
}

// ============================================================================
// Example 2: Simple Scraping with Rate Limiting
// ============================================================================

async function example2_simpleScraping() {
  console.log('Example 2: Simple Scraping with Rate Limiting');
  console.log('=============================================\n');
  
  const urls = [
    'https://example.com/page1',
    'https://example.com/page2',
    'https://example.com/page3',
  ];
  
  for (const url of urls) {
    const startTime = Date.now();
    
    // Check rate limit before scraping
    const rateLimit = await checkScraperRateLimit(url, {
      priority: 'normal',
    });
    
    if (!rateLimit.proceed) {
      console.log(`⏳ Rate limited for ${url}: ${rateLimit.message}`);
      console.log(`   Waiting ${rateLimit.delay}ms before retry...\n`);
      
      // Wait and retry
      await sleep(rateLimit.delay);
      continue;
    }
    
    // Apply suggested delay for anti-detection
    if (rateLimit.delay > 0) {
      console.log(`🕐 Applying anti-detection delay: ${rateLimit.delay}ms`);
      await sleep(rateLimit.delay);
    }
    
    try {
      // Simulate scraping (replace with actual scraper call)
      console.log(`🔍 Scraping ${url}...`);
      console.log(`   User-Agent: ${rateLimit.userAgent}`);
      console.log(`   Headers: ${JSON.stringify(rateLimit.headers, null, 2)}`);
      
      // Simulate network request
      await sleep(Math.random() * 1000 + 500);
      
      const responseTime = Date.now() - startTime;
      
      // Report success
      await reportScrapingResult(url, true, responseTime, 200);
      
      console.log(`✅ Successfully scraped ${url} in ${responseTime}ms\n`);
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      // Report failure
      await reportScrapingResult(url, false, responseTime, 500);
      
      console.error(`❌ Failed to scrape ${url}: ${error}\n`);
    }
  }
  
  // Show statistics
  const stats = getRateLimitStats('example.com');
  console.log('📊 Statistics for example.com:', stats, '\n');
}

// ============================================================================
// Example 3: Handling Rate Limit Errors and Circuit Breakers
// ============================================================================

async function example3_errorHandling() {
  console.log('Example 3: Handling Rate Limit Errors and Circuit Breakers');
  console.log('==========================================================\n');
  
  // Initialize with conservative settings for demonstration
  initializeRateLimiter({
    ...RateLimiterPresets.conservative,
    circuitBreakerThreshold: 3, // Open after 3 failures
    circuitBreakerTimeout: 10000, // 10 seconds
  });
  
  const url = 'https://api.example.com/endpoint';
  
  // Simulate multiple failures to trigger circuit breaker
  for (let i = 0; i < 5; i++) {
    console.log(`\nAttempt ${i + 1}:`);
    
    const rateLimit = await checkScraperRateLimit(url, {
      retryCount: i,
      priority: 'high',
    });
    
    if (!rateLimit.proceed) {
      if (rateLimit.message === 'Circuit breaker open') {
        console.log('⚡ Circuit breaker is OPEN - too many failures detected');
        console.log(`   Waiting ${rateLimit.delay}ms before circuit breaker resets`);
        
        // In production, you might want to:
        // 1. Alert administrators
        // 2. Switch to a backup scraping method
        // 3. Log the incident for analysis
        
        break;
      } else {
        console.log(`⏳ Rate limited: ${rateLimit.message}`);
        await sleep(rateLimit.delay);
        continue;
      }
    }
    
    // Simulate failure to trigger circuit breaker
    if (i < 3) {
      console.log('❌ Simulating request failure...');
      await reportScrapingResult(url, false, 100, 503, i);
    } else {
      console.log('✅ Request would succeed (but circuit might be open)');
      await reportScrapingResult(url, true, 100, 200, i);
    }
  }
}

// ============================================================================
// Example 4: Adaptive Throttling Based on Response
// ============================================================================

async function example4_adaptiveThrottling() {
  console.log('Example 4: Adaptive Throttling Based on Response');
  console.log('================================================\n');
  
  // Initialize with adaptive throttling enabled
  const limiter = initializeRateLimiter({
    requestsPerSecond: 5,
    burstSize: 10,
    adaptiveThrottling: true,
    throttleOnStatusCodes: [429, 503],
  });
  
  const url = 'https://api.example.com/data';
  
  // Listen to throttle adjustment events
  limiter.on('throttle-adjusted', (data) => {
    console.log(`📊 Rate adjusted for ${data.domain}: ${data.newRate} req/s`);
    console.log(`   Reason: ${data.reason}\n`);
  });
  
  // Simulate various response scenarios
  const scenarios = [
    { statusCode: 200, responseTime: 200, description: 'Normal response' },
    { statusCode: 200, responseTime: 100, description: 'Fast response' },
    { statusCode: 429, responseTime: 50, description: 'Rate limit hit' },
    { statusCode: 200, responseTime: 300, description: 'Normal after throttle' },
    { statusCode: 503, responseTime: 100, description: 'Service unavailable' },
  ];
  
  for (const scenario of scenarios) {
    console.log(`\n🔄 Scenario: ${scenario.description}`);
    
    const rateLimit = await checkScraperRateLimit(url);
    
    if (!rateLimit.proceed) {
      console.log(`   Waiting ${rateLimit.delay}ms...`);
      await sleep(rateLimit.delay);
      continue;
    }
    
    // Report the scenario result
    await reportScrapingResult(
      url,
      scenario.statusCode === 200,
      scenario.responseTime,
      scenario.statusCode
    );
    
    const stats = getRateLimitStats('api.example.com');
    console.log(`   Current rate: ${stats.currentRate} req/s`);
    console.log(`   Circuit breaker: ${stats.circuitBreakerState}`);
  }
}

// ============================================================================
// Example 5: Using the withRateLimit Wrapper
// ============================================================================

async function example5_wrapperFunction() {
  console.log('Example 5: Using the withRateLimit Wrapper');
  console.log('==========================================\n');
  
  // Original scraping function
  async function scrapePage(url: string, options?: any): Promise<any> {
    console.log(`Scraping ${url} with options:`, options);
    // Simulate scraping
    await sleep(Math.random() * 500 + 200);
    return { url, content: 'Page content here', timestamp: Date.now() };
  }
  
  // Wrap with rate limiting
  const rateLimitedScrape = withRateLimit(
    scrapePage,
    (args) => new URL(args[0]).hostname,
    { priority: 'normal', throwOnBlocked: false }
  );
  
  // Use the wrapped function
  try {
    const result1 = await rateLimitedScrape('https://example.com/page1');
    console.log('Result 1:', result1, '\n');
    
    const result2 = await rateLimitedScrape('https://example.com/page2', { 
      waitForSelector: '.content' 
    });
    console.log('Result 2:', result2, '\n');
    
    const result3 = await rateLimitedScrape('https://different-site.com/page');
    console.log('Result 3:', result3, '\n');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// ============================================================================
// Example 6: Integration with Actual Scraper
// ============================================================================

async function example6_actualScraperIntegration() {
  console.log('Example 6: Integration with Actual Scraper');
  console.log('==========================================\n');
  
  // This shows how to modify scraper-api.ts to use the enhanced rate limiter
  
  const integrationCode = `
// In scraper-api.ts, add at the top:
import { 
  checkScraperRateLimit, 
  reportScrapingResult,
  initializeRateLimiter,
  RateLimiterPresets,
} from './scraper-rate-limit-integration';

// Initialize rate limiter based on environment
const rateLimiterConfig = process.env.NODE_ENV === 'production' 
  ? RateLimiterPresets.moderate 
  : RateLimiterPresets.conservative;

initializeRateLimiter({
  ...rateLimiterConfig,
  useRedis: !!process.env.REDIS_URL,
  redisUrl: process.env.REDIS_URL,
});

// In scrapePage function, before creating crawler:
export async function scrapePage(url: string, config?: any): Promise<ScrapedPage> {
  const startTime = Date.now();
  let retryCount = 0;
  
  while (retryCount < 3) {
    // Check rate limit
    const rateLimit = await checkScraperRateLimit(url, {
      retryCount,
      priority: config?.priority || 'normal',
    });
    
    if (!rateLimit.proceed) {
      if (rateLimit.message === 'Circuit breaker open') {
        throw new Error(\`Circuit breaker open for \${new URL(url).hostname}\`);
      }
      
      console.log(\`Rate limited, waiting \${rateLimit.delay}ms...\`);
      await new Promise(resolve => setTimeout(resolve, rateLimit.delay));
      retryCount++;
      continue;
    }
    
    // Apply anti-detection delay
    if (rateLimit.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, rateLimit.delay));
    }
    
    try {
      // Create crawler with rate limit headers and user agent
      const crawler = new PlaywrightCrawler({
        launchContext: {
          userAgent: rateLimit.userAgent || config?.userAgent,
        },
        preNavigationHooks: [
          async ({ page }) => {
            if (rateLimit.headers) {
              await page.setExtraHTTPHeaders(rateLimit.headers);
            }
            // ... rest of the hooks
          },
        ],
        // ... rest of crawler config
      });
      
      // ... perform scraping
      
      // Report success
      await reportScrapingResult(
        url, 
        true, 
        Date.now() - startTime, 
        200,
        retryCount
      );
      
      return result;
      
    } catch (error) {
      // Report failure
      const statusCode = error.response?.status || 500;
      await reportScrapingResult(
        url,
        false,
        Date.now() - startTime,
        statusCode,
        retryCount
      );
      
      // Retry on certain errors
      if (statusCode === 429 || statusCode === 503) {
        retryCount++;
        continue;
      }
      
      throw error;
    }
  }
  
  throw new Error(\`Failed to scrape \${url} after \${retryCount} retries\`);
}
`;
  
  console.log('Integration code for scraper-api.ts:');
  console.log('=====================================');
  console.log(integrationCode);
}

// ============================================================================
// Example 7: Monitoring and Metrics
// ============================================================================

async function example7_monitoring() {
  console.log('Example 7: Monitoring and Metrics');
  console.log('=================================\n');
  
  // Initialize rate limiter with Redis for distributed metrics
  const limiter = initializeRateLimiter({
    ...RateLimiterPresets.moderate,
    useRedis: true,
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  });
  
  // Set up monitoring listeners
  limiter.on('circuit-breaker-open', (data) => {
    // Send alert to monitoring service
    console.log('🚨 ALERT: Circuit breaker opened!');
    console.log(`   Domain: ${data.domain}`);
    console.log(`   Failures: ${data.failures}`);
    console.log(`   Next retry: ${new Date(data.nextRetryTime).toISOString()}`);
    
    // In production:
    // await sendAlert('circuit-breaker-open', data);
    // await logToDatadog('circuit_breaker.open', 1, { domain: data.domain });
  });
  
  limiter.on('throttle-adjusted', (data) => {
    // Log throttle adjustments
    console.log('📊 Throttle adjusted:');
    console.log(`   Domain: ${data.domain}`);
    console.log(`   New rate: ${data.newRate} req/s`);
    console.log(`   Reason: ${data.reason}`);
    
    // In production:
    // await logMetric('rate_limit.adjusted', data.newRate, { domain: data.domain });
  });
  
  // Simulate some activity
  const domains = ['api1.example.com', 'api2.example.com', 'api3.example.com'];
  
  for (const domain of domains) {
    for (let i = 0; i < 5; i++) {
      const url = `https://${domain}/endpoint${i}`;
      
      await checkScraperRateLimit(url);
      
      // Simulate random success/failure
      const success = Math.random() > 0.2;
      const statusCode = success ? 200 : (Math.random() > 0.5 ? 429 : 503);
      const responseTime = Math.random() * 1000 + 100;
      
      await reportScrapingResult(url, success, responseTime, statusCode);
    }
    
    // Get and display statistics
    const stats = getRateLimitStats(domain);
    console.log(`\n📈 Statistics for ${domain}:`);
    console.log(`   Requests/min: ${stats.requestsPerMinute}`);
    console.log(`   Avg response time: ${stats.averageResponseTime.toFixed(0)}ms`);
    console.log(`   Success rate: ${(stats.successRate * 100).toFixed(1)}%`);
    console.log(`   Current rate: ${stats.currentRate} req/s`);
    console.log(`   Circuit breaker: ${stats.circuitBreakerState}`);
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// Main Runner
// ============================================================================

async function runExamples() {
  console.log('🚀 Enhanced Rate Limiter Usage Examples');
  console.log('=======================================\n');
  
  try {
    // Run examples sequentially
    await example1_basicSetup();
    await sleep(1000);
    
    await example2_simpleScraping();
    await sleep(1000);
    
    await example3_errorHandling();
    await sleep(1000);
    
    await example4_adaptiveThrottling();
    await sleep(1000);
    
    await example5_wrapperFunction();
    await sleep(1000);
    
    await example6_actualScraperIntegration();
    await sleep(1000);
    
    // await example7_monitoring(); // Requires Redis
    
    console.log('\n✅ All examples completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Error running examples:', error);
  }
}

// Run if executed directly
if (require.main === module) {
  runExamples().then(() => process.exit(0));
}

// Export for use in other modules
export {
  example1_basicSetup,
  example2_simpleScraping,
  example3_errorHandling,
  example4_adaptiveThrottling,
  example5_wrapperFunction,
  example6_actualScraperIntegration,
  example7_monitoring,
};