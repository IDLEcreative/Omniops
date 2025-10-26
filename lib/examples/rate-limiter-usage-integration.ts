/**
 * Integration and monitoring examples for the enhanced rate limiting system
 * Demonstrates scraper integration and monitoring patterns
 */

import {
  initializeRateLimiter,
  checkScraperRateLimit,
  reportScrapingResult,
  getRateLimitStats,
  RateLimiterPresets,
} from '../scraper-rate-limit-integration';

// ============================================================================
// Example 6: Integration with Actual Scraper
// ============================================================================

export async function example6_actualScraperIntegration() {
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

export async function example7_monitoring() {
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
