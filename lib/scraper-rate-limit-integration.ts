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
import { EventEmitter } from 'events';

// Singleton instance
let rateLimiterInstance: EnhancedRateLimiter | null = null;

/**
 * Initialize rate limiter with configuration
 */
export function initializeRateLimiter(config?: Partial<RateLimitConfig>): EnhancedRateLimiter {
  if (rateLimiterInstance) {
    rateLimiterInstance.close();
  }
  
  // Determine configuration based on environment
  const defaultConfig = getEnvironmentConfig();
  const finalConfig = { ...defaultConfig, ...config };
  
  rateLimiterInstance = new EnhancedRateLimiter(finalConfig);
  
  // Set up event listeners for monitoring
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
 * Get configuration based on environment
 */
function getEnvironmentConfig(): Partial<RateLimitConfig> {
  const env = process.env.NODE_ENV;
  const redisUrl = process.env.REDIS_URL;
  
  // Production configuration
  if (env === 'production') {
    return {
      ...RateLimiterPresets.moderate,
      useRedis: !!redisUrl,
      redisUrl,
      domainLimits: getProductionDomainLimits(),
    };
  }
  
  // Development configuration
  if (env === 'development') {
    return {
      ...RateLimiterPresets.conservative,
      useRedis: false, // Use in-memory in development
      domainLimits: getDevelopmentDomainLimits(),
    };
  }
  
  // Test configuration
  if (env === 'test') {
    return {
      requestsPerSecond: 100,
      burstSize: 200,
      adaptiveThrottling: false,
      circuitBreakerThreshold: 100,
      enableExponentialBackoff: false,
      jitterEnabled: false,
      randomizeTimings: false,
      rotateUserAgents: false,
      useRedis: false,
    };
  }
  
  // Default to conservative
  return RateLimiterPresets.conservative;
}

/**
 * Get production domain limits
 */
function getProductionDomainLimits(): Map<string, DomainLimit> {
  const limits = new Map<string, DomainLimit>();
  
  // Common API endpoints
  limits.set('api.github.com', {
    requestsPerSecond: 10,
    burstSize: 30,
    priority: 'high',
    minDelay: 100,
    maxDelay: 500,
  });
  
  limits.set('*.googleapis.com', {
    requestsPerSecond: 50,
    burstSize: 100,
    priority: 'high',
    minDelay: 50,
    maxDelay: 200,
  });
  
  // E-commerce sites (more conservative)
  limits.set('*.shopify.com', {
    requestsPerSecond: 2,
    burstSize: 10,
    priority: 'normal',
    minDelay: 500,
    maxDelay: 3000,
  });
  
  limits.set('*.woocommerce.com', {
    requestsPerSecond: 3,
    burstSize: 15,
    priority: 'normal',
    minDelay: 400,
    maxDelay: 2500,
  });
  
  // Social media (very conservative)
  limits.set('*.facebook.com', {
    requestsPerSecond: 0.5,
    burstSize: 3,
    priority: 'low',
    minDelay: 2000,
    maxDelay: 5000,
  });
  
  limits.set('*.instagram.com', {
    requestsPerSecond: 0.5,
    burstSize: 3,
    priority: 'low',
    minDelay: 2000,
    maxDelay: 5000,
  });
  
  // News sites
  limits.set('*.nytimes.com', {
    requestsPerSecond: 1,
    burstSize: 5,
    priority: 'normal',
    minDelay: 1000,
    maxDelay: 3000,
  });
  
  return limits;
}

/**
 * Get development domain limits
 */
function getDevelopmentDomainLimits(): Map<string, DomainLimit> {
  const limits = new Map<string, DomainLimit>();
  
  // Localhost (no limits)
  limits.set('localhost', {
    requestsPerSecond: 1000,
    burstSize: 2000,
    priority: 'high',
    minDelay: 0,
    maxDelay: 10,
  });
  
  limits.set('127.0.0.1', {
    requestsPerSecond: 1000,
    burstSize: 2000,
    priority: 'high',
    minDelay: 0,
    maxDelay: 10,
  });
  
  // Development servers
  limits.set('*.local', {
    requestsPerSecond: 100,
    burstSize: 200,
    priority: 'high',
    minDelay: 10,
    maxDelay: 50,
  });
  
  return limits;
}

/**
 * Set up event listeners for monitoring and logging
 */
function setupEventListeners(limiter: EnhancedRateLimiter): void {
  // Circuit breaker events
  limiter.on('circuit-breaker-open', (data) => {
    console.warn(`⚠️ Circuit breaker opened for ${data.domain}:`, {
      failures: data.failures,
      nextRetryTime: new Date(data.nextRetryTime).toISOString(),
    });
  });
  
  limiter.on('circuit-breaker-closed', (data) => {
    console.info(`✅ Circuit breaker closed for ${data.domain}`);
  });
  
  limiter.on('circuit-breaker-half-open', (data) => {
    console.info(`🔄 Circuit breaker half-open for ${data.domain}`);
  });
  
  // Throttle adjustment events
  limiter.on('throttle-adjusted', (data) => {
    console.info(`📊 Throttle adjusted for ${data.domain}:`, {
      newRate: data.newRate,
      reason: data.reason,
    });
  });
  
  // Request queuing events
  limiter.on('request-queued', (data) => {
    if (data.queueSize > 100) {
      console.warn(`⚠️ Large queue for ${data.domain}: ${data.queueSize} requests`);
    }
  });
  
  // Redis events
  limiter.on('redis-error', (error) => {
    console.error('❌ Redis error in rate limiter:', error);
  });
  
  limiter.on('redis-connected', () => {
    console.info('✅ Rate limiter connected to Redis');
  });
}

/**
 * Middleware for Express/Next.js API routes
 */
export function rateLimitMiddleware(domain?: string) {
  return async (req: any, res: any, next: any) => {
    const limiter = getRateLimiter();
    const targetDomain = domain || new URL(req.url || '', `http://${req.headers.host}`).hostname;
    
    const result = await limiter.checkRateLimit(targetDomain);
    
    // Set rate limit headers
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
    
    // Add delay if specified
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
  options?: {
    retryCount?: number;
    priority?: 'high' | 'normal' | 'low';
    throwOnBlocked?: boolean;
  }
): Promise<{
  proceed: boolean;
  delay: number;
  headers?: Record<string, string>;
  userAgent?: string;
  message?: string;
}> {
  const limiter = getRateLimiter();
  const domain = new URL(url).hostname;
  
  // Check robots.txt first
  const robotsAllowed = await limiter.checkRobotsTxt(url);
  if (!robotsAllowed) {
    if (options?.throwOnBlocked) {
      throw new Error(`Blocked by robots.txt: ${url}`);
    }
    return {
      proceed: false,
      delay: 0,
      message: 'Blocked by robots.txt',
    };
  }
  
  // Check rate limit
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
  
  // Return overall statistics (would need to be implemented in EnhancedRateLimiter)
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
  
  // This would need to be added to EnhancedRateLimiter
  // For now, reinitialize with new config
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
  options?: {
    priority?: 'high' | 'normal' | 'low';
    throwOnBlocked?: boolean;
  }
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
        
        // Wait and retry
        await new Promise(resolve => setTimeout(resolve, rateLimit.delay));
        retryCount++;
        continue;
      }
      
      // Apply delay if needed
      if (rateLimit.delay > 0) {
        await new Promise(resolve => setTimeout(resolve, rateLimit.delay));
      }
      
      try {
        // Execute the function
        const result = await fn(...args);
        
        // Report success
        await reportScrapingResult(
          `https://${domain}`,
          true,
          Date.now() - startTime,
          200,
          retryCount
        );
        
        return result;
      } catch (error: any) {
        // Report failure
        const statusCode = error.response?.status || 500;
        await reportScrapingResult(
          `https://${domain}`,
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

// Export types
export type { RateLimitConfig, DomainLimit, RequestMetrics } from './rate-limiter-enhanced';
export { RateLimiterPresets } from './rate-limiter-enhanced';

// Auto-cleanup on process exit
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