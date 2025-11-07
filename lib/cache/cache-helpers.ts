/**
 * Cache Helper Utilities
 *
 * Shared utilities for cache operations including filter normalization,
 * Redis operations, and error handling.
 */

import { getRedisClient } from '@/lib/redis';
import { logger } from '@/lib/logger';
import type { ConversationListFilters } from './conversation-cache';

/**
 * Normalize filters for consistent cache keys
 *
 * Removes undefined/null values and sorts keys alphabetically
 * to ensure identical filters produce identical cache keys.
 */
export function normalizeFilters(filters: ConversationListFilters): Record<string, any> {
  const normalized: Record<string, any> = {};

  const keys = Object.keys(filters).sort();
  for (const key of keys) {
    const value = filters[key as keyof ConversationListFilters];
    if (value !== undefined && value !== null) {
      normalized[key] = value;
    }
  }

  return normalized;
}

/**
 * Get keys matching a pattern from Redis
 *
 * Returns empty array if KEYS command unavailable (fallback client)
 */
export async function getKeysMatchingPattern(pattern: string): Promise<string[]> {
  try {
    const redis = getRedisClient();

    if (typeof (redis as any).keys === 'function') {
      return await (redis as any).keys(pattern);
    }

    return [];
  } catch (error) {
    logger.error('Error getting keys from Redis', {
      error: error instanceof Error ? error.message : String(error),
      pattern
    });
    return [];
  }
}

/**
 * Delete multiple keys from Redis
 *
 * Handles both array and individual key deletion
 */
export async function deleteKeys(keys: string[]): Promise<number> {
  if (keys.length === 0) return 0;

  try {
    const redis = getRedisClient();
    await redis.del(...keys);
    return keys.length;
  } catch (error) {
    logger.error('Error deleting keys from Redis', {
      error: error instanceof Error ? error.message : String(error),
      keyCount: keys.length
    });
    return 0;
  }
}

/**
 * Check if Redis supports the KEYS command
 *
 * Fallback clients may not support this command
 */
export function supportsKeysCommand(): boolean {
  const redis = getRedisClient();
  return typeof (redis as any).keys === 'function';
}
