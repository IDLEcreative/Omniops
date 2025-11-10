/**
 * Provider caching utilities
 * Implements TTL-based caching for commerce provider instances
 */

import type { CommerceProvider } from './types';

const providerCache = new Map<string, { provider: CommerceProvider | null; expiresAt: number }>();
const PROVIDER_CACHE_TTL_MS = 60_000;

export function getCachedProvider(domain: string): {
  provider: CommerceProvider | null;
  expiresAt: number;
} | null {
  const cached = providerCache.get(domain);
  const now = Date.now();

  if (cached && cached.expiresAt > now) {
    return cached;
  }

  return null;
}

export function setCachedProvider(
  domain: string,
  provider: CommerceProvider | null
): void {
  const now = Date.now();
  providerCache.set(domain, {
    provider,
    expiresAt: now + PROVIDER_CACHE_TTL_MS,
  });
}

export function clearProviderCache(): void {
  providerCache.clear();
}

export function getCacheTTL(): number {
  return PROVIDER_CACHE_TTL_MS;
}
