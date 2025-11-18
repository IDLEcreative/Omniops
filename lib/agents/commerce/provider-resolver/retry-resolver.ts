/**
 * Provider Resolution - Retry Resolver
 * Implements adaptive retry logic with error classification
 */

import { CircuitBreakerError } from '@/lib/circuit-breaker';
import { trackProviderResolution, trackRetryPattern } from '@/lib/telemetry/search-telemetry';
import { classifyError } from '@/lib/retry/error-classifier';
import { calculateBackoff } from '@/lib/retry/adaptive-backoff';
import type { CommerceProvider } from '../types';
import { loadCustomerConfig } from '../config-loader';
import { providerDetectors, detectShopify } from '../provider-detectors';
import { providerCircuitBreaker } from './circuit-breaker';

/**
 * Resolves a commerce provider with adaptive retry logic
 * Uses error classification to determine appropriate retry strategy:
 * - TRANSIENT errors: Exponential backoff (100ms → 200ms → 400ms)
 * - RATE_LIMIT errors: Long exponential backoff (1s → 2s → 4s)
 * - SERVER_ERROR errors: Linear backoff (500ms → 1000ms → 1500ms)
 * - AUTH_FAILURE / NOT_FOUND: No retry (immediate failure)
 * All delays include ±20% jitter to prevent thundering herd
 * @returns Provider instance or null if all attempts fail
 */
export async function resolveProviderWithRetry(
  domain: string,
  maxRetries = 2
): Promise<CommerceProvider | null> {
  const startTime = Date.now();
  let finalProvider: CommerceProvider | null = null;
  let finalPlatform: string | null = null;
  let finalError: string | null = null;
  let lastErrorCategory: string = 'UNKNOWN';

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    const attemptStartTime = Date.now();

    try {
      console.log('[Provider] Resolution attempt', {
        domain,
        attempt,
        maxAttempts: maxRetries + 1,
        timestamp: Date.now(),
      });

      const config = await loadCustomerConfig(domain);

      for (const detector of providerDetectors) {
        const detectorName = detector === detectShopify ? 'shopify' : 'woocommerce';

        try {
          // Wrap detector call in circuit breaker to prevent cascading failures
          const circuitBreakerStats = providerCircuitBreaker.getStats();
          const provider = await providerCircuitBreaker.execute(async () => {
            const result = await detector({ domain, config });
            // Treat null as failure for circuit breaker
            if (!result) {
              throw new Error(`${detectorName} detector returned null`);
            }
            return result;
          });

          // If we get here, provider is not null (would have thrown above)
          const duration = Date.now() - attemptStartTime;
          finalProvider = provider;
          finalPlatform = provider.platform;

          // Track successful provider resolution
          await trackProviderResolution({
            domain,
            attempt,
            success: true,
            duration_ms: duration,
            platform: provider.platform,
            error_message: null,
            cache_hit: false,
            circuit_breaker_state: circuitBreakerStats.state as any,
            timestamp: new Date(),
          });

          console.log('[Provider] Resolution completed', {
            domain,
            hasProvider: true,
            platform: provider.platform,
            duration,
            totalAttempts: attempt,
          });

          // Track overall retry pattern
          await trackRetryPattern({
            domain,
            retry_count: attempt - 1,
            final_success: true,
            total_duration_ms: Date.now() - startTime,
            platform: provider.platform,
            error_message: null,
            timestamp: new Date(),
          });

          return provider;

        } catch (error) {
          const willRetry = attempt < maxRetries + 1;
          const errorMessage = error instanceof Error ? error.message : 'unknown error';
          finalError = errorMessage;

          // Classify error for adaptive retry strategy
          const errorCategory = classifyError(error);
          lastErrorCategory = errorCategory;

          // Handle circuit breaker errors specially
          if (error instanceof CircuitBreakerError) {
            console.warn('[Provider] Circuit breaker is open, skipping detector', {
              domain,
              detectorName,
              state: error.state,
              cooldownRemaining: Math.ceil(error.cooldownRemaining / 1000),
              attempt,
              errorCategory,
            });

            // Track circuit breaker event
            await trackProviderResolution({
              domain,
              attempt,
              success: false,
              duration_ms: Date.now() - attemptStartTime,
              platform: null,
              error_message: `Circuit breaker ${error.state}`,
              cache_hit: false,
              circuit_breaker_state: error.state as any,
              timestamp: new Date(),
            });

            // Continue to next detector or retry attempt
            continue;
          }

          // Log detector failure (including null returns)
          console.log(`[Provider] Detector failed: ${detectorName}`, {
            domain,
            error: errorMessage,
            errorCategory,
            attempt,
            willRetry,
          });

          // Track failed attempt
          await trackProviderResolution({
            domain,
            attempt,
            success: false,
            duration_ms: Date.now() - attemptStartTime,
            platform: null,
            error_message: errorMessage,
            cache_hit: false,
            circuit_breaker_state: circuitBreakerStats.state as any,
            timestamp: new Date(),
          });

          // If this detector failed but we have more retries, continue to next detector
          // The outer retry loop will retry all detectors
        }
      }

      // No provider found in this attempt
      if (attempt < maxRetries + 1) {
        // Calculate adaptive backoff based on last error (if any)
        const errorCategory = lastErrorCategory || 'UNKNOWN';
        const backoffMs = calculateBackoff(errorCategory as any, attempt);

        if (backoffMs === null) {
          // Non-retryable error (AUTH_FAILURE, NOT_FOUND) - stop retrying
          console.log('[Provider] Non-retryable error, stopping retries', {
            domain,
            errorCategory,
            attempt,
          });
          break;
        }

        console.log(`[Provider] Retry attempt ${attempt + 1}/${maxRetries + 1}`, {
          domain,
          backoffMs,
          errorCategory,
          strategy: 'adaptive-backoff',
          timestamp: Date.now(),
        });
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    } catch (error) {
      const willRetry = attempt < maxRetries + 1;
      const errorMessage = error instanceof Error ? error.message : 'unknown error';
      finalError = errorMessage;

      // Classify error for adaptive retry strategy
      const errorCategory = classifyError(error);
      lastErrorCategory = errorCategory;

      console.error('[Provider] Resolution attempt failed', {
        domain,
        attempt,
        error: errorMessage,
        errorCategory,
        willRetry,
      });

      // Track failed attempt
      await trackProviderResolution({
        domain,
        attempt,
        success: false,
        duration_ms: Date.now() - attemptStartTime,
        platform: null,
        error_message: errorMessage,
        cache_hit: false,
        timestamp: new Date(),
      });

      if (attempt < maxRetries + 1) {
        // Calculate adaptive backoff
        const backoffMs = calculateBackoff(errorCategory, attempt);

        if (backoffMs === null) {
          // Non-retryable error - stop retrying
          console.log('[Provider] Non-retryable error, stopping retries', {
            domain,
            errorCategory,
            attempt,
          });
          break;
        }

        console.log('[Provider] Retrying with adaptive backoff', {
          domain,
          backoffMs,
          errorCategory,
          attempt: attempt + 1,
          strategy: 'adaptive-backoff',
        });
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }
  }

  const duration = Date.now() - startTime;
  console.log('[Provider] Resolution completed', {
    domain,
    hasProvider: false,
    platform: null,
    duration,
    totalAttempts: maxRetries + 1,
  });

  // Track final retry pattern failure
  await trackRetryPattern({
    domain,
    retry_count: maxRetries,
    final_success: false,
    total_duration_ms: duration,
    platform: finalPlatform,
    error_message: finalError,
    timestamp: new Date(),
  });

  return null;
}
