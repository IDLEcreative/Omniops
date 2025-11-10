/**
 * Provider Resolution - Circuit Breaker Setup
 * Shared circuit breaker instance for provider resolution
 */

import { createCircuitBreaker } from '@/lib/circuit-breaker';

// Circuit breaker for provider resolution
// Protects against cascading failures during provider outages
export const providerCircuitBreaker = createCircuitBreaker('ProviderResolution', {
  threshold: 3,
  timeout: 30000, // 30 seconds
});
