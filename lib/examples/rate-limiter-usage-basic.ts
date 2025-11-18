/**
 * Basic usage examples for the enhanced rate limiting system
 * Demonstrates fundamental integration patterns
 */

import {
  initializeRateLimiter,
  checkScraperRateLimit,
  reportScrapingResult,
  getRateLimitStats,
  RateLimiterPresets,
  configureDomainLimit,
} from '../scraper-rate-limit-integration';

// ============================================================================
// Example 1: Basic Setup and Configuration
// ============================================================================

export async function example1_basicSetup() {

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

}

// ============================================================================
// Example 2: Simple Scraping with Rate Limiting
// ============================================================================

export async function example2_simpleScraping() {

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

      // Wait and retry
      await sleep(rateLimit.delay);
      continue;
    }

    // Apply suggested delay for anti-detection
    if (rateLimit.delay > 0) {
      await sleep(rateLimit.delay);
    }

    try {
      // Simulate scraping (replace with actual scraper call)
      console.log(`   Headers: ${JSON.stringify(rateLimit.headers, null, 2)}`);

      // Simulate network request
      await sleep(Math.random() * 1000 + 500);

      const responseTime = Date.now() - startTime;

      // Report success
      await reportScrapingResult(url, true, responseTime, 200);


    } catch (error) {
      const responseTime = Date.now() - startTime;

      // Report failure
      await reportScrapingResult(url, false, responseTime, 500);

      console.error(`❌ Failed to scrape ${url}: ${error}\n`);
    }
  }

  // Show statistics
  const stats = getRateLimitStats('example.com');
}

// ============================================================================
// Example 3: Handling Rate Limit Errors and Circuit Breakers
// ============================================================================

export async function example3_errorHandling() {

  // Initialize with conservative settings for demonstration
  initializeRateLimiter({
    ...RateLimiterPresets.conservative,
    circuitBreakerThreshold: 3, // Open after 3 failures
    circuitBreakerTimeout: 10000, // 10 seconds
  });

  const url = 'https://api.example.com/endpoint';

  // Simulate multiple failures to trigger circuit breaker
  for (let i = 0; i < 5; i++) {

    const rateLimit = await checkScraperRateLimit(url, {
      retryCount: i,
      priority: 'high',
    });

    if (!rateLimit.proceed) {
      if (rateLimit.message === 'Circuit breaker open') {

        // In production, you might want to:
        // 1. Alert administrators
        // 2. Switch to a backup scraping method
        // 3. Log the incident for analysis

        break;
      } else {
        await sleep(rateLimit.delay);
        continue;
      }
    }

    // Simulate failure to trigger circuit breaker
    if (i < 3) {
      await reportScrapingResult(url, false, 100, 503, i);
    } else {
      console.log('✅ Request would succeed (but circuit might be open)');
      await reportScrapingResult(url, true, 100, 200, i);
    }
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
