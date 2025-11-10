/**
 * Search Telemetry System
 * Tracks retry patterns, provider health, and domain lookup effectiveness
 *
 * Non-blocking telemetry collection for monitoring search consistency
 */

import { createServiceRoleClient } from '@/lib/supabase-server';
import {
  calculateProviderHealth,
  calculateRetryPatterns,
  calculateDomainLookupStats,
  calculateCircuitBreakerStats,
} from './search-telemetry-calculators';

/**
 * Provider resolution telemetry event
 * Tracks each attempt to resolve a commerce provider
 */
export interface ProviderResolutionEvent {
  domain: string;
  attempt: number;
  success: boolean;
  duration_ms: number;
  platform: string | null;
  error_message: string | null;
  cache_hit: boolean;
  circuit_breaker_state?: 'closed' | 'open' | 'half-open';
  timestamp: Date;
}

/**
 * Domain lookup telemetry event
 * Tracks domain resolution with various fallback methods
 */
export interface DomainLookupEvent {
  domain: string;
  method: 'cache-hit' | 'cache-alternative' | 'direct-db-fuzzy' | 'failed';
  success: boolean;
  duration_ms: number;
  attempts_before_success: number;
  alternative_domains_tried?: string[];
  timestamp: Date;
}

/**
 * Retry pattern telemetry event
 * Aggregates retry attempts for provider resolution
 */
export interface RetryPatternEvent {
  domain: string;
  retry_count: number;
  final_success: boolean;
  total_duration_ms: number;
  platform: string | null;
  error_message: string | null;
  timestamp: Date;
}

/**
 * Circuit breaker state change event
 * Tracks circuit breaker state transitions
 */
export interface CircuitBreakerEvent {
  circuit_name: string;
  previous_state: 'closed' | 'open' | 'half-open';
  new_state: 'closed' | 'open' | 'half-open';
  failure_count: number;
  timestamp: Date;
}

/**
 * Non-blocking telemetry storage
 * Uses fire-and-forget pattern to avoid slowing down requests
 */
export async function trackProviderResolution(event: ProviderResolutionEvent): Promise<void> {
  // Fire-and-forget - don't await, don't block the request
  setTimeout(async () => {
    try {
      const supabase = await createServiceRoleClient();
      if (!supabase) {
        console.warn('[Telemetry] Failed to create Supabase client for provider resolution tracking');
        return;
      }

      const { error } = await supabase
        .from('provider_resolution_telemetry')
        .insert({
          domain: event.domain,
          attempt: event.attempt,
          success: event.success,
          duration_ms: event.duration_ms,
          platform: event.platform,
          error_message: event.error_message,
          cache_hit: event.cache_hit,
          circuit_breaker_state: event.circuit_breaker_state || 'closed',
          timestamp: event.timestamp.toISOString(),
        });

      if (error) {
        console.error('[Telemetry] Failed to store provider resolution event:', error);
      }
    } catch (err) {
      console.error('[Telemetry] Provider resolution tracking error:', err);
    }
  }, 0);
}

/**
 * Track domain lookup attempts and fallback strategies
 */
export async function trackDomainLookup(event: DomainLookupEvent): Promise<void> {
  setTimeout(async () => {
    try {
      const supabase = await createServiceRoleClient();
      if (!supabase) {
        console.warn('[Telemetry] Failed to create Supabase client for domain lookup tracking');
        return;
      }

      const { error } = await supabase
        .from('domain_lookup_telemetry')
        .insert({
          domain: event.domain,
          method: event.method,
          success: event.success,
          duration_ms: event.duration_ms,
          attempts_before_success: event.attempts_before_success,
          alternative_domains_tried: event.alternative_domains_tried || [],
          timestamp: event.timestamp.toISOString(),
        });

      if (error) {
        console.error('[Telemetry] Failed to store domain lookup event:', error);
      }
    } catch (err) {
      console.error('[Telemetry] Domain lookup tracking error:', err);
    }
  }, 0);
}

/**
 * Track retry patterns for provider resolution
 */
export async function trackRetryPattern(event: RetryPatternEvent): Promise<void> {
  setTimeout(async () => {
    try {
      const supabase = await createServiceRoleClient();
      if (!supabase) {
        console.warn('[Telemetry] Failed to create Supabase client for retry pattern tracking');
        return;
      }

      const { error } = await supabase
        .from('retry_telemetry')
        .insert({
          domain: event.domain,
          retry_count: event.retry_count,
          final_success: event.final_success,
          total_duration_ms: event.total_duration_ms,
          platform: event.platform,
          error_message: event.error_message,
          timestamp: event.timestamp.toISOString(),
        });

      if (error) {
        console.error('[Telemetry] Failed to store retry pattern event:', error);
      }
    } catch (err) {
      console.error('[Telemetry] Retry pattern tracking error:', err);
    }
  }, 0);
}

/**
 * Track circuit breaker state changes
 */
export async function trackCircuitBreakerStateChange(event: CircuitBreakerEvent): Promise<void> {
  setTimeout(async () => {
    try {
      const supabase = await createServiceRoleClient();
      if (!supabase) {
        console.warn('[Telemetry] Failed to create Supabase client for circuit breaker tracking');
        return;
      }

      const { error } = await supabase
        .from('circuit_breaker_telemetry')
        .insert({
          circuit_name: event.circuit_name,
          previous_state: event.previous_state,
          new_state: event.new_state,
          failure_count: event.failure_count,
          timestamp: event.timestamp.toISOString(),
        });

      if (error) {
        console.error('[Telemetry] Failed to store circuit breaker event:', error);
      }
    } catch (err) {
      console.error('[Telemetry] Circuit breaker tracking error:', err);
    }
  }, 0);
}

/**
 * Aggregate telemetry for dashboard queries
 */
export interface TelemetryStats {
  providerHealth: {
    platform: string;
    successRate: number;
    avgDuration: number;
    totalAttempts: number;
  }[];
  retryPatterns: {
    avgRetries: number;
    successRate: number;
    p50Duration: number;
    p95Duration: number;
    p99Duration: number;
  };
  domainLookup: {
    methodDistribution: Record<string, number>;
    avgDuration: number;
    successRate: number;
  };
  circuitBreaker: {
    openEvents: number;
    halfOpenEvents: number;
    avgFailuresBeforeOpen: number;
  };
}

/**
 * Query telemetry data for dashboard display
 */
export async function getTelemetryStats(
  timePeriodHours: number = 24
): Promise<TelemetryStats | null> {
  try {
    const supabase = await createServiceRoleClient();
    if (!supabase) {
      console.error('[Telemetry] Failed to create Supabase client for stats query');
      return null;
    }

    const cutoffTime = new Date(Date.now() - timePeriodHours * 60 * 60 * 1000).toISOString();

    // Provider health stats
    const { data: providerData } = await supabase
      .from('provider_resolution_telemetry')
      .select('platform, success, duration_ms')
      .gte('timestamp', cutoffTime);

    const providerHealth = calculateProviderHealth(providerData || []);

    // Retry pattern stats
    const { data: retryData } = await supabase
      .from('retry_telemetry')
      .select('retry_count, final_success, total_duration_ms')
      .gte('timestamp', cutoffTime);

    const retryPatterns = calculateRetryPatterns(retryData || []);

    // Domain lookup stats
    const { data: domainData } = await supabase
      .from('domain_lookup_telemetry')
      .select('method, success, duration_ms')
      .gte('timestamp', cutoffTime);

    const domainLookup = calculateDomainLookupStats(domainData || []);

    // Circuit breaker stats
    const { data: circuitData } = await supabase
      .from('circuit_breaker_telemetry')
      .select('new_state, failure_count')
      .gte('timestamp', cutoffTime);

    const circuitBreaker = calculateCircuitBreakerStats(circuitData || []);

    return {
      providerHealth,
      retryPatterns,
      domainLookup,
      circuitBreaker,
    };
  } catch (error) {
    console.error('[Telemetry] Failed to query telemetry stats:', error);
    return null;
  }
}
