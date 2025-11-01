/**
 * Query Cache - Type Definitions
 */

export interface SmartCacheOptions {
  ttlSeconds: number;
  cacheLevel: 'none' | 'memory' | 'database' | 'both';
  scope: 'user' | 'domain' | 'global';
}
