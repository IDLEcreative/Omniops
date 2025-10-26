/**
 * Type definitions for scraper rate limit integration
 */

import { DomainLimit } from './rate-limiter-enhanced';

/**
 * Options for scraper rate limit checks
 */
export interface ScraperRateLimitOptions {
  retryCount?: number;
  priority?: 'high' | 'normal' | 'low';
  throwOnBlocked?: boolean;
}

/**
 * Result of a scraper rate limit check
 */
export interface ScraperRateLimitResult {
  proceed: boolean;
  delay: number;
  headers?: Record<string, string>;
  userAgent?: string;
  message?: string;
}

/**
 * Options for rate-limited function wrapper
 */
export interface RateLimitWrapperOptions {
  priority?: 'high' | 'normal' | 'low';
  throwOnBlocked?: boolean;
}

/**
 * Domain limits configuration set
 */
export type DomainLimitsMap = Map<string, DomainLimit>;

/**
 * Environment-specific configuration types
 */
export type Environment = 'production' | 'development' | 'test';
