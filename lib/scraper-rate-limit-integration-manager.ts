/**
 * Rate limit manager for domain-specific limits and event handling
 */

import { EnhancedRateLimiter, RateLimitConfig, RateLimiterPresets, DomainLimit } from './rate-limiter-enhanced';
import { DomainLimitsMap, Environment } from './scraper-rate-limit-integration-types';

/**
 * Get configuration based on environment
 */
export function getEnvironmentConfig(): Partial<RateLimitConfig> {
  const env = process.env.NODE_ENV as Environment;
  const redisUrl = process.env.REDIS_URL;

  if (env === 'production') {
    return {
      ...RateLimiterPresets.moderate,
      useRedis: !!redisUrl,
      redisUrl,
      domainLimits: getProductionDomainLimits(),
    };
  }

  if (env === 'development') {
    return {
      ...RateLimiterPresets.conservative,
      useRedis: false,
      domainLimits: getDevelopmentDomainLimits(),
    };
  }

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

  return RateLimiterPresets.conservative;
}

/**
 * Get production domain limits
 */
export function getProductionDomainLimits(): DomainLimitsMap {
  const limits = new Map<string, DomainLimit>();

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
export function getDevelopmentDomainLimits(): DomainLimitsMap {
  const limits = new Map<string, DomainLimit>();

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
export function setupEventListeners(limiter: EnhancedRateLimiter): void {
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

  limiter.on('throttle-adjusted', (data) => {
    console.info(`📊 Throttle adjusted for ${data.domain}:`, {
      newRate: data.newRate,
      reason: data.reason,
    });
  });

  limiter.on('request-queued', (data) => {
    if (data.queueSize > 100) {
      console.warn(`⚠️ Large queue for ${data.domain}: ${data.queueSize} requests`);
    }
  });

  limiter.on('redis-error', (error) => {
    console.error('❌ Redis error in rate limiter:', error);
  });

  limiter.on('redis-connected', () => {
    console.info('✅ Rate limiter connected to Redis');
  });
}
