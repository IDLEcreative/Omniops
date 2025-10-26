/**
 * Integration module for enhanced rate limiting with scraper-api.ts
 * This module provides the glue between the enhanced rate limiter and the existing scraper
 */

import {
  EnhancedRateLimiter,
  RateLimitConfig,
  RateLimiterPresets,
  RequestMetrics,
  DomainLimit,
} from './rate-limiter-enhanced';
import {
  ScraperRateLimitOptions,
  ScraperRateLimitResult,
  RateLimitWrapperOptions,
} from './scraper-rate-limit-integration-types';
import { getEnvironmentConfig, setupEventListeners } from './scraper-rate-limit-integration-manager';

let rateLimiterInstance: EnhancedRateLimiter | null = null;

/**
 * Initialize rate limiter with configuration
 */
export function initializeRateLimiter(config?: Partial<RateLimitConfig>): EnhancedRateLimiter {
  if (rateLimiterInstance) {
    rateLimiterInstance.close();
  }

  const defaultConfig = getEnvironmentConfig();
  const finalConfig = { ...defaultConfig, ...config };

  rateLimiterInstance = new EnhancedRateLimiter(finalConfig);
  setupEventListeners(rateLimiterInstance);

  return rateLimiterInstance;
}

/**
 * Get rate limiter instance (creates default if not initialized)
 */
export function getRateLimiter(): EnhancedRateLimiter {
  if (!rateLimiterInstance) {
    rateLimiterInstance = initializeRateLimiter();
  }
  return rateLimiterInstance;
}

/**
 * Middleware for Express/Next.js API routes
 */
export function rateLimitMiddleware(domain?: string) {
  return async (req: any, res: any, next: any) => {
    const limiter = getRateLimiter();
    const targetDomain = domain || new URL(req.url || '', `http://${req.headers.host}`).hostname;

    const result = await limiter.checkRateLimit(targetDomain);

    res.setHeader('X-RateLimit-Limit', result.tokensRemaining + 1);
    res.setHeader('X-RateLimit-Remaining', result.tokensRemaining);
    res.setHeader('X-RateLimit-Reset', new Date(result.resetTime).toISOString());

    if (!result.allowed) {
      res.setHeader('Retry-After', Math.ceil(result.waitTimeMs / 1000));
      return res.status(429).json({
        error: 'Too Many Requests',
        message: result.reason || 'Rate limit exceeded',
        retryAfter: result.waitTimeMs,
      });
    }

    if (result.waitTimeMs > 0) {
      await new Promise(resolve => setTimeout(resolve, result.waitTimeMs));
    }

    next();
  };
}

/**
 * Scraper-specific rate limit check with retries
 */
export async function checkScraperRateLimit(
  url: string,
  options?: ScraperRateLimitOptions
): Promise<ScraperRateLimitResult> {
  const limiter = getRateLimiter();
  const domain = new URL(url).hostname;

  const result = await limiter.checkRateLimit(domain, {
    priority: options?.priority,
    retryCount: options?.retryCount,
  });

  if (!result.allowed) {
    if (result.reason === 'Circuit breaker open' && options?.throwOnBlocked) {
      throw new Error(`Circuit breaker open for ${domain}: Too many failures`);
    }

    return {
      proceed: false,
      delay: result.waitTimeMs,
      message: result.reason,
    };
  }

  return {
    proceed: true,
    delay: result.waitTimeMs,
    headers: result.headers,
    userAgent: result.userAgent,
  };
}

/**
 * Report scraping result for adaptive throttling
 */
export async function reportScrapingResult(
  url: string,
  success: boolean,
  responseTime: number,
  statusCode: number = success ? 200 : 500,
  retryCount: number = 0
): Promise<void> {
  const limiter = getRateLimiter();
  const domain = new URL(url).hostname;

  const metrics: RequestMetrics = {
    domain,
    timestamp: Date.now(),
    responseTime,
    statusCode,
    success,
    retryCount,
  };

  await limiter.reportRequestResult(metrics);
}

/**
 * Get rate limiting statistics for monitoring
 */
export function getRateLimitStats(domain?: string): any {
  const limiter = getRateLimiter();

  if (domain) {
    return limiter.getStatistics(domain);
  }

  return {
    message: 'Overall statistics not yet implemented',
  };
}

/**
 * Process queued requests for a domain
 */
export async function processQueuedRequests(domain: string): Promise<any[]> {
  const limiter = getRateLimiter();
  return limiter.processQueue(domain);
}

/**
 * Configure domain-specific limits at runtime
 */
export function configureDomainLimit(domain: string, limit: DomainLimit): void {
  const limiter = getRateLimiter();

  const currentConfig = limiter['config'];
  if (!currentConfig.domainLimits) {
    currentConfig.domainLimits = new Map();
  }
  currentConfig.domainLimits.set(domain, limit);

  initializeRateLimiter(currentConfig);
}

/**
 * Helper function to apply rate limiting to any async function
 */
export function withRateLimit<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  getDomain: (args: Parameters<T>) => string,
  options?: RateLimitWrapperOptions
): T {
  return (async (...args: Parameters<T>) => {
    const domain = getDomain(args);
    const startTime = Date.now();
    let retryCount = 0;

    while (retryCount < 3) {
      const rateLimit = await checkScraperRateLimit(`https://${domain}`, {
        retryCount,
        priority: options?.priority,
        throwOnBlocked: options?.throwOnBlocked,
      });

      if (!rateLimit.proceed) {
        if (options?.throwOnBlocked) {
          throw new Error(rateLimit.message || 'Rate limit exceeded');
        }

        await new Promise(resolve => setTimeout(resolve, rateLimit.delay));
        retryCount++;
        continue;
      }

      if (rateLimit.delay > 0) {
        await new Promise(resolve => setTimeout(resolve, rateLimit.delay));
      }

      try {
        const result = await fn(...args);

        await reportScrapingResult(
          `https://${domain}`,
          true,
          Date.now() - startTime,
          200,
          retryCount
        );

        return result;
      } catch (error: any) {
        const statusCode = error.response?.status || 500;
        await reportScrapingResult(
          `https://${domain}`,
          false,
          Date.now() - startTime,
          statusCode,
          retryCount
        );

        if (statusCode === 429 || statusCode === 503) {
          retryCount++;
          continue;
        }

        throw error;
      }
    }

    throw new Error(`Failed after ${retryCount} retries`);
  }) as T;
}

/**
 * Clean up rate limiter (call on shutdown)
 */
export async function cleanupRateLimiter(): Promise<void> {
  if (rateLimiterInstance) {
    await rateLimiterInstance.close();
    rateLimiterInstance = null;
  }
}

export type { RateLimitConfig, DomainLimit, RequestMetrics } from './rate-limiter-enhanced';
export { RateLimiterPresets } from './rate-limiter-enhanced';
export type { ScraperRateLimitOptions, ScraperRateLimitResult, RateLimitWrapperOptions } from './scraper-rate-limit-integration-types';

if (typeof process !== 'undefined') {
  process.on('exit', () => {
    cleanupRateLimiter().catch(console.error);
  });

  process.on('SIGINT', () => {
    cleanupRateLimiter().then(() => process.exit(0));
  });

  process.on('SIGTERM', () => {
    cleanupRateLimiter().then(() => process.exit(0));
  });
}
