/**
 * Query Cache - Core Implementation
 */

import type { SupabaseClient } from '@/types/supabase';
import type { SmartCacheOptions } from './types';
import { shouldCache } from './cache-strategy';
import { generateScopedKey } from './key-generation';
import {
  getFromMemory,
  setInMemory,
  getMemoryCacheStats,
  clearMemoryCacheByScope,
} from './memory-cache';
import { getFromDb, setInDb } from './database-cache';

/**
 * Smart Query Cache Class
 * Optimized for multi-user chat system with scope-aware caching
 */
export class SmartQueryCache {
  /**
   * Determine if a query should be cached based on its type
   */
  static shouldCache(queryType: string, queryContent: string): SmartCacheOptions {
    return shouldCache(queryType, queryContent);
  }

  /**
   * Generate cache key with scope awareness
   */
  static generateScopedKey(
    params: Record<string, any>,
    scope: 'user' | 'domain' | 'global',
    conversationId?: string,
    domainId?: string
  ): string {
    return generateScopedKey(params, scope, conversationId, domainId);
  }

  /**
   * Intelligent cache execution
   */
  static async execute<T>(
    params: {
      queryType: string;
      queryContent: string;
      domainId?: string;
      conversationId?: string;
      supabase?: SupabaseClient;
      forceOptions?: SmartCacheOptions;
    },
    queryFn: () => Promise<T>
  ): Promise<{ data: T; cacheHit: boolean; cacheType?: string }> {
    const { queryType, queryContent, domainId, conversationId, supabase, forceOptions } =
      params;

    // Determine caching strategy
    const cacheOptions = forceOptions || this.shouldCache(queryType, queryContent);

    // Don't cache if caching is disabled
    if (cacheOptions.cacheLevel === 'none') {
      const data = await queryFn();
      return { data, cacheHit: false };
    }

    // Generate appropriate cache key
    const cacheKey = this.generateScopedKey(
      { type: queryType, content: queryContent },
      cacheOptions.scope,
      conversationId,
      domainId
    );

    // Try memory cache first
    if (cacheOptions.cacheLevel === 'memory' || cacheOptions.cacheLevel === 'both') {
      const cached = getFromMemory(cacheKey);
      if (cached !== null) {
        return { data: cached as T, cacheHit: true, cacheType: 'memory' };
      }
    }

    // Try database cache
    if (cacheOptions.cacheLevel === 'database' || cacheOptions.cacheLevel === 'both') {
      if (supabase && domainId) {
        const cached = await getFromDb(supabase, domainId, cacheKey);
        if (cached !== null) {
          // Populate memory cache from DB
          if (cacheOptions.cacheLevel === 'both') {
            setInMemory(cacheKey, cached, cacheOptions.ttlSeconds);
          }
          return { data: cached as T, cacheHit: true, cacheType: 'database' };
        }
      }
    }

    // Cache miss - execute query
    const data = await queryFn();

    // Store in appropriate caches
    if (cacheOptions.cacheLevel === 'memory' || cacheOptions.cacheLevel === 'both') {
      setInMemory(cacheKey, data, cacheOptions.ttlSeconds);
    }

    if (
      (cacheOptions.cacheLevel === 'database' || cacheOptions.cacheLevel === 'both') &&
      supabase &&
      domainId
    ) {
      await setInDb(
        supabase,
        domainId,
        cacheKey,
        queryContent,
        data,
        cacheOptions.ttlSeconds
      );
    }

    return { data, cacheHit: false };
  }

  /**
   * Get cache statistics by scope
   */
  static getStatsByScope() {
    return getMemoryCacheStats();
  }

  /**
   * Clear caches by scope
   */
  static clearByScope(scope: 'user' | 'domain' | 'global', identifier?: string): number {
    return clearMemoryCacheByScope(scope, identifier);
  }
}
