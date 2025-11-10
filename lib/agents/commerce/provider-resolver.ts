/**
 * Provider Resolution - Re-export from modular implementation
 * This file maintained for backward compatibility
 */

export {
  resolveProvider,
  resolveProviderWithRetry,
  getCircuitBreakerStats,
  resetCircuitBreaker
} from './provider-resolver/index';
