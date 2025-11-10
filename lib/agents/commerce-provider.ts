/**
 * Commerce Provider - Main Entry Point
 * Provides unified interface for e-commerce platform integrations (WooCommerce, Shopify)
 * Includes caching, retry logic, circuit breaker, and telemetry
 */

import { trackProviderResolution } from '@/lib/telemetry/search-telemetry';
import { normalizeDomain } from './commerce/config-loader';
import { resolveProviderWithRetry, getCircuitBreakerStats, resetCircuitBreaker } from './commerce/provider-resolver';
import { getCachedProvider, setCachedProvider, clearProviderCache, getCacheTTL } from './commerce/provider-cache';
import type { CommerceProvider } from './commerce/types';

// Re-export types for public API
export type { OrderInfo, CommerceProvider } from './commerce/types';

/**
 * Main entry point for commerce provider resolution
 * Implements caching, retry logic, and telemetry tracking
 */
export async function getCommerceProvider(domain: string): Promise<CommerceProvider | null> {
  const normalizedDomain = normalizeDomain(domain || '');

  if (!normalizedDomain || /localhost|127\.0\.0\.1/.test(normalizedDomain)) {
    console.log('[Provider] Skipping provider resolution', {
      domain: normalizedDomain,
      reason: 'localhost or invalid domain',
    });
    return null;
  }

  const cached = getCachedProvider(normalizedDomain);
  const now = Date.now();

  if (cached && cached.expiresAt > now) {
    console.log('[Provider] Cache hit', {
      domain: normalizedDomain,
      platform: cached.provider?.platform || null,
      expiresIn: cached.expiresAt - now,
    });

    // Track cache hit
    await trackProviderResolution({
      domain: normalizedDomain,
      attempt: 1,
      success: true,
      duration_ms: 0,
      platform: cached.provider?.platform || null,
      error_message: null,
      cache_hit: true,
      timestamp: new Date(),
    });

    return cached.provider;
  }

  if (cached) {
    console.log('[Provider] Cache expired', {
      domain: normalizedDomain,
      expiredAgo: now - cached.expiresAt,
    });
  } else {
    console.log('[Provider] Cache miss', {
      domain: normalizedDomain,
    });
  }

  // Use retry logic to resolve provider
  const provider = await resolveProviderWithRetry(normalizedDomain);

  setCachedProvider(normalizedDomain, provider);

  console.log('[Provider] Cache updated', {
    domain: normalizedDomain,
    hasProvider: !!provider,
    platform: provider?.platform || null,
    ttlMs: getCacheTTL(),
  });

  return provider;
}

export function clearCommerceProviderCache() {
  clearProviderCache();
}

export { getCircuitBreakerStats, resetCircuitBreaker };
