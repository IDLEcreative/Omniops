/**
 * Retry Configuration Policies
 *
 * Defines retry behavior for different error categories:
 * - Max retries per error type
 * - Base delays per error type
 * - Jitter percentage
 * - Max delay caps
 * - Circuit breaker thresholds (future enhancement)
 */

import { ErrorCategory } from './error-classifier';

export interface RetryPolicy {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Base delay in milliseconds for first retry */
  baseDelay: number;
  /** Percentage of jitter to apply (0-100) */
  jitterPercent: number;
  /** Maximum delay cap in milliseconds */
  maxDelay: number;
  /** Circuit breaker threshold (consecutive failures before opening circuit) */
  circuitBreakerThreshold: number;
}

/**
 * Default retry policies for each error category
 */
const RETRY_POLICIES: Record<ErrorCategory, RetryPolicy> = {
  /**
   * TRANSIENT: Network blips, temporary connection issues
   * Strategy: Quick exponential backoff (100ms → 200ms → 400ms)
   * Rationale: These usually resolve quickly, so retry aggressively
   */
  TRANSIENT: {
    maxRetries: 3,
    baseDelay: 100,
    jitterPercent: 20,
    maxDelay: 2000,
    circuitBreakerThreshold: 10,
  },

  /**
   * AUTH_FAILURE: Invalid credentials, unauthorized access
   * Strategy: No retry
   * Rationale: Authentication errors won't resolve without user intervention
   */
  AUTH_FAILURE: {
    maxRetries: 0,
    baseDelay: 0,
    jitterPercent: 0,
    maxDelay: 0,
    circuitBreakerThreshold: 3,
  },

  /**
   * RATE_LIMIT: API rate limit exceeded
   * Strategy: Long exponential backoff (1s → 2s → 4s)
   * Rationale: Need to back off significantly to respect rate limits
   */
  RATE_LIMIT: {
    maxRetries: 3,
    baseDelay: 1000,
    jitterPercent: 20,
    maxDelay: 10000,
    circuitBreakerThreshold: 5,
  },

  /**
   * SERVER_ERROR: 500, 502, 503, 504 errors
   * Strategy: Linear backoff (500ms → 1000ms → 1500ms)
   * Rationale: Server issues may take time to resolve, linear is predictable
   */
  SERVER_ERROR: {
    maxRetries: 3,
    baseDelay: 500,
    jitterPercent: 20,
    maxDelay: 5000,
    circuitBreakerThreshold: 8,
  },

  /**
   * NOT_FOUND: Resource doesn't exist (404, database not found)
   * Strategy: No retry
   * Rationale: If it's not found now, it won't be found on retry
   */
  NOT_FOUND: {
    maxRetries: 0,
    baseDelay: 0,
    jitterPercent: 0,
    maxDelay: 0,
    circuitBreakerThreshold: 5,
  },

  /**
   * UNKNOWN: Unclassified errors
   * Strategy: Default exponential backoff (100ms → 200ms → 400ms)
   * Rationale: Conservative retry for unknown issues
   */
  UNKNOWN: {
    maxRetries: 2,
    baseDelay: 100,
    jitterPercent: 20,
    maxDelay: 2000,
    circuitBreakerThreshold: 10,
  },
};

/**
 * Gets the retry policy for a specific error category
 * @param category - The error category
 * @returns RetryPolicy configuration object
 */
export function getRetryPolicyForCategory(category: ErrorCategory): RetryPolicy {
  return RETRY_POLICIES[category];
}

/**
 * Gets all retry policies
 * @returns Record of all error categories and their policies
 */
export function getAllRetryPolicies(): Record<ErrorCategory, RetryPolicy> {
  return { ...RETRY_POLICIES };
}

/**
 * Configuration for circuit breaker pattern (future enhancement)
 */
export interface CircuitBreakerConfig {
  /** Number of consecutive failures before opening circuit */
  failureThreshold: number;
  /** Time in milliseconds before attempting to close circuit */
  resetTimeout: number;
  /** Time in milliseconds to keep circuit in half-open state */
  halfOpenTimeout: number;
}

/**
 * Default circuit breaker configuration
 */
export const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  resetTimeout: 60000, // 60 seconds
  halfOpenTimeout: 30000, // 30 seconds
};

/**
 * Global retry configuration (can be overridden via environment variables)
 */
export interface GlobalRetryConfig {
  /** Enable/disable adaptive retry globally */
  enabled: boolean;
  /** Enable/disable jitter globally */
  jitterEnabled: boolean;
  /** Enable/disable circuit breaker globally */
  circuitBreakerEnabled: boolean;
  /** Global max retries cap (overrides category-specific if lower) */
  globalMaxRetries: number;
}

/**
 * Default global retry configuration
 */
export const DEFAULT_GLOBAL_CONFIG: GlobalRetryConfig = {
  enabled: true,
  jitterEnabled: true,
  circuitBreakerEnabled: false, // Not yet implemented
  globalMaxRetries: 5,
};

/**
 * Gets the effective retry policy considering global overrides
 * @param category - The error category
 * @returns Effective RetryPolicy after applying global overrides
 */
export function getEffectiveRetryPolicy(category: ErrorCategory): RetryPolicy {
  const basePolicy = getRetryPolicyForCategory(category);
  const globalConfig = DEFAULT_GLOBAL_CONFIG;

  if (!globalConfig.enabled) {
    return {
      ...basePolicy,
      maxRetries: 0,
    };
  }

  return {
    ...basePolicy,
    maxRetries: Math.min(basePolicy.maxRetries, globalConfig.globalMaxRetries),
    jitterPercent: globalConfig.jitterEnabled ? basePolicy.jitterPercent : 0,
  };
}
