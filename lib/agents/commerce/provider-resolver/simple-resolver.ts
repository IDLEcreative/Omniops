/**
 * Provider Resolution - Simple Resolver
 * Basic provider detection without retry logic
 */

import { trackProviderResolution } from '@/lib/telemetry/search-telemetry';
import type { CommerceProvider } from '../types';
import { loadCustomerConfig } from '../config-loader';
import { providerDetectors, detectShopify } from '../provider-detectors';
import { providerCircuitBreaker } from './circuit-breaker';

/**
 * Resolves a commerce provider for a domain with comprehensive diagnostics
 * @returns Provider instance or null if none found
 */
export async function resolveProvider(domain: string): Promise<CommerceProvider | null> {
  const startTime = Date.now();
  console.log('[Provider] Resolution started', {
    domain,
    timestamp: startTime,
    cacheHit: false,
  });

  const config = await loadCustomerConfig(domain);

  for (const detector of providerDetectors) {
    const detectorName = detector === detectShopify ? 'shopify' : 'woocommerce';

    try {
      const provider = await detector({ domain, config });
      if (provider) {
        const duration = Date.now() - startTime;
        console.log('[Provider] Resolution completed', {
          domain,
          hasProvider: true,
          platform: provider.platform,
          duration,
          totalAttempts: 1,
        });
        return provider;
      }
    } catch (error) {
      console.error(`[Provider] Detector failed: ${detectorName}`, {
        domain,
        error: error instanceof Error ? error.message : 'unknown error',
        willRetry: false,
      });
    }
  }

  const duration = Date.now() - startTime;
  console.log('[Provider] Resolution completed', {
    domain,
    hasProvider: false,
    platform: null,
    duration,
    totalAttempts: 1,
  });
  return null;
}
