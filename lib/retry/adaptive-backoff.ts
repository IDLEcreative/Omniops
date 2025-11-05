/**
 * Adaptive Backoff Calculator for Retry Strategies
 *
 * Implements multiple backoff strategies based on error type:
 * - Exponential backoff with jitter for transient errors
 * - Longer exponential backoff for rate limits
 * - Linear backoff for server errors
 * - No retry for auth failures and not found errors
 *
 * Jitter (±20%) is added to prevent thundering herd problem
 */

import { ErrorCategory, isRetryableError } from './error-classifier';
import { getRetryPolicyForCategory } from './config';

export interface BackoffResult {
  delayMs: number | null;
  shouldRetry: boolean;
  strategy: string;
}

/**
 * Calculates adaptive backoff delay based on error category and attempt number
 * @param errorCategory - The classified error category
 * @param attemptNumber - The current attempt number (1-indexed)
 * @param baseDelay - Base delay in milliseconds (default: 100ms)
 * @returns Delay in milliseconds, or null if error should not be retried
 */
export function calculateBackoff(
  errorCategory: ErrorCategory,
  attemptNumber: number,
  baseDelay: number = 100
): number | null {
  // Non-retryable errors return null immediately
  if (!isRetryableError(errorCategory)) {
    return null;
  }

  // Get retry policy for this error category
  const policy = getRetryPolicyForCategory(errorCategory);

  // Check if we've exceeded max retries for this category
  if (attemptNumber > policy.maxRetries) {
    return null;
  }

  let delay: number;

  switch (errorCategory) {
    case 'TRANSIENT':
      // Exponential backoff: baseDelay * 2^(attempt-1)
      // Attempts: 1→100ms, 2→200ms, 3→400ms
      delay = policy.baseDelay * Math.pow(2, attemptNumber - 1);
      break;

    case 'RATE_LIMIT':
      // Longer exponential backoff for rate limits
      // Attempts: 1→1000ms, 2→2000ms, 3→4000ms
      delay = policy.baseDelay * Math.pow(2, attemptNumber - 1);
      break;

    case 'SERVER_ERROR':
      // Linear backoff for server errors
      // Attempts: 1→500ms, 2→1000ms, 3→1500ms
      delay = policy.baseDelay + (500 * (attemptNumber - 1));
      break;

    case 'UNKNOWN':
    default:
      // Default exponential backoff
      delay = policy.baseDelay * Math.pow(2, attemptNumber - 1);
      break;
  }

  // Apply jitter (±20%) to prevent thundering herd
  delay = applyJitter(delay, policy.jitterPercent);

  // Enforce max delay cap
  return Math.min(delay, policy.maxDelay);
}

/**
 * Calculates backoff with detailed result information
 * @param errorCategory - The classified error category
 * @param attemptNumber - The current attempt number (1-indexed)
 * @param baseDelay - Base delay in milliseconds (default: 100ms)
 * @returns BackoffResult with delay, retry decision, and strategy used
 */
export function calculateBackoffWithDetails(
  errorCategory: ErrorCategory,
  attemptNumber: number,
  baseDelay: number = 100
): BackoffResult {
  const delayMs = calculateBackoff(errorCategory, attemptNumber, baseDelay);
  const shouldRetry = delayMs !== null;

  let strategy: string;
  if (!shouldRetry) {
    strategy = 'no-retry';
  } else {
    switch (errorCategory) {
      case 'TRANSIENT':
        strategy = 'exponential-backoff';
        break;
      case 'RATE_LIMIT':
        strategy = 'exponential-backoff-long';
        break;
      case 'SERVER_ERROR':
        strategy = 'linear-backoff';
        break;
      default:
        strategy = 'exponential-backoff-default';
        break;
    }
  }

  return {
    delayMs,
    shouldRetry,
    strategy,
  };
}

/**
 * Applies jitter to a delay value to prevent thundering herd
 * @param delay - Base delay in milliseconds
 * @param jitterPercent - Percentage of jitter to apply (0-100, default: 20)
 * @returns Delay with jitter applied, rounded to nearest integer
 */
export function applyJitter(delay: number, jitterPercent: number = 20): number {
  // Calculate jitter range: ±jitterPercent% of delay
  const jitterRange = delay * (jitterPercent / 100);

  // Random value between -jitterRange and +jitterRange
  const jitter = jitterRange * (Math.random() * 2 - 1);

  // Apply jitter and ensure result is positive
  return Math.max(0, Math.round(delay + jitter));
}

/**
 * Calculates total expected retry time for an error category
 * @param errorCategory - The classified error category
 * @param maxRetries - Maximum number of retries (optional, uses policy default)
 * @returns Total time in milliseconds (without jitter)
 */
export function calculateTotalRetryTime(
  errorCategory: ErrorCategory,
  maxRetries?: number
): number {
  if (!isRetryableError(errorCategory)) {
    return 0;
  }

  const policy = getRetryPolicyForCategory(errorCategory);
  const retries = maxRetries ?? policy.maxRetries;

  let totalTime = 0;

  for (let attempt = 1; attempt <= retries; attempt++) {
    const delay = calculateBackoff(errorCategory, attempt);
    if (delay === null) break;
    totalTime += delay;
  }

  return totalTime;
}

/**
 * Gets recommended retry strategy description for an error category
 * @param errorCategory - The classified error category
 * @returns Human-readable strategy description
 */
export function getRetryStrategyDescription(errorCategory: ErrorCategory): string {
  const descriptions: Record<ErrorCategory, string> = {
    TRANSIENT: 'Exponential backoff (100ms → 200ms → 400ms) with ±20% jitter',
    AUTH_FAILURE: 'No retry - authentication/authorization errors are not transient',
    RATE_LIMIT: 'Long exponential backoff (1s → 2s → 4s) with ±20% jitter',
    SERVER_ERROR: 'Linear backoff (500ms → 1000ms → 1500ms) with ±20% jitter',
    NOT_FOUND: 'No retry - resource does not exist',
    UNKNOWN: 'Default exponential backoff (100ms → 200ms → 400ms) with ±20% jitter',
  };

  return descriptions[errorCategory];
}
