/**
 * Pattern examples for the enhanced rate limiting system
 * Demonstrates adaptive throttling and wrapper usage
 */

import {
  initializeRateLimiter,
  checkScraperRateLimit,
  reportScrapingResult,
  getRateLimitStats,
  withRateLimit,
  RateLimiterPresets,
} from '../scraper-rate-limit-integration';

// ============================================================================
// Example 4: Adaptive Throttling Based on Response
// ============================================================================

export async function example4_adaptiveThrottling() {
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

export async function example5_wrapperFunction() {
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
// Helper Functions
// ============================================================================

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
