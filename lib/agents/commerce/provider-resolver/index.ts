/**
 * Provider Resolution - Main Exports
 * Adaptive retry logic and circuit breaker for commerce provider detection
 */

import { providerCircuitBreaker as cb } from './circuit-breaker';

export { resolveProvider } from './simple-resolver';
export { resolveProviderWithRetry } from './retry-resolver';
export { providerCircuitBreaker } from './circuit-breaker';

export function getCircuitBreakerStats() {
  return cb.getStats();
}

export function resetCircuitBreaker() {
  cb.forceClose();
}
