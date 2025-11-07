/**
 * Cache TTL Configuration
 *
 * Centralized TTL values for different cache types.
 * TTLs are optimized based on data volatility:
 * - Short TTL (60s) for frequently changing data
 * - Medium TTL (180s) for moderate volatility
 * - Long TTL (300s) for relatively stable data
 */

export const CACHE_TTL = {
  /**
   * Conversations list cache (1 minute)
   * Short TTL because list changes frequently with new messages
   */
  CONVERSATIONS_LIST: 60,

  /**
   * Individual conversation detail (5 minutes)
   * Longer TTL because details are relatively stable
   */
  CONVERSATION_DETAIL: 300,

  /**
   * Analytics aggregations (3 minutes)
   * Medium TTL balancing freshness and performance
   */
  ANALYTICS_DATA: 180,

  /**
   * Status counts (1 minute)
   * Short TTL for real-time accuracy
   */
  STATUS_COUNTS: 60,
} as const;
