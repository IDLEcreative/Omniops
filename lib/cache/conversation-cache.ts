/**
 * Conversation Dashboard Caching System
 *
 * Implements Redis-backed caching for conversation dashboard queries to reduce database load
 * and improve response times. Uses strategic TTLs based on data volatility.
 *
 * Performance Impact:
 * - Expected 60-80% reduction in database queries
 * - Expected 300ms → 50-100ms response time improvement
 * - Cache hit rate target: >60% after 5 minutes of use
 */

import { getRedisClient } from '@/lib/redis';
import type { DashboardConversation } from '@/types/dashboard';
import { CacheKeys } from './cache-keys';
import { CACHE_TTL } from './cache-config';
import {
  normalizeFilters,
  getKeysMatchingPattern,
  deleteKeys,
  supportsKeysCommand
} from './cache-helpers';
import { getCachedData, setCachedData } from './cache-operations';

export interface ConversationListFilters {
  status?: string;
  language?: string;
  searchTerm?: string;
  days?: number;
  cursor?: string | null;
  limit?: number;
}

export interface ConversationListResponse {
  total: number;
  change: number;
  statusCounts: {
    active: number;
    waiting: number;
    resolved: number;
  };
  languages: Array<{
    language: string;
    count: number;
    percentage: number;
  }>;
  peakHours: Array<{
    hour: number;
    label: string;
    level: string;
    count: number;
  }>;
  recent: DashboardConversation[];
  pagination: {
    nextCursor: string | null;
    hasMore: boolean;
    limit: number;
  };
}

export interface AnalyticsData {
  [key: string]: any;
}

export class ConversationCache {
  static async getConversationsList(
    domainId: string,
    filters: ConversationListFilters
  ): Promise<ConversationListResponse | null> {
    const normalized = normalizeFilters(filters);
    const cacheKey = CacheKeys.conversationsList(domainId, normalized);
    return getCachedData(cacheKey, { domainId, filters });
  }

  static async setConversationsList(
    domainId: string,
    filters: ConversationListFilters,
    data: ConversationListResponse
  ): Promise<void> {
    const normalized = normalizeFilters(filters);
    const cacheKey = CacheKeys.conversationsList(domainId, normalized);
    return setCachedData(cacheKey, data, CACHE_TTL.CONVERSATIONS_LIST, { domainId, filters });
  }

  static async getConversationDetail(conversationId: string): Promise<any | null> {
    const cacheKey = CacheKeys.conversationDetail(conversationId);
    return getCachedData(cacheKey, { conversationId });
  }

  static async setConversationDetail(conversationId: string, data: any): Promise<void> {
    const cacheKey = CacheKeys.conversationDetail(conversationId);
    return setCachedData(cacheKey, data, CACHE_TTL.CONVERSATION_DETAIL, { conversationId });
  }

  static async invalidateConversation(conversationId: string, domainId: string): Promise<void> {
    const redis = getRedisClient();

    // Invalidate detail cache
    await redis.del(CacheKeys.conversationDetail(conversationId));

    // Invalidate list caches
    const pattern = CacheKeys.conversationsListPattern(domainId);

    if (supportsKeysCommand()) {
      const keys = await getKeysMatchingPattern(pattern);
      if (keys.length > 0) {
        await deleteKeys(keys);
      }
    } else {
      // Fallback: Clear common keys
      const commonKeys = CacheKeys.commonListKeys(domainId);
      for (const key of commonKeys) {
        try {
          await redis.del(key);
        } catch (err) {
          // Continue on error
        }
      }
    }
  }

  static async invalidateConversations(conversationIds: string[], domainId: string): Promise<void> {
    const keysToDelete = conversationIds.map(id => CacheKeys.conversationDetail(id));

    if (supportsKeysCommand()) {
      const pattern = CacheKeys.conversationsListPattern(domainId);
      const listKeys = await getKeysMatchingPattern(pattern);
      keysToDelete.push(...listKeys);
    }

    await deleteKeys(keysToDelete);
  }

  static async getAnalytics(domainId: string, days: number): Promise<AnalyticsData | null> {
    const cacheKey = CacheKeys.analytics(domainId, days);
    return getCachedData(cacheKey, { domainId, days });
  }

  static async setAnalytics(domainId: string, days: number, data: AnalyticsData): Promise<void> {
    const cacheKey = CacheKeys.analytics(domainId, days);
    return setCachedData(cacheKey, data, CACHE_TTL.ANALYTICS_DATA, { domainId, days });
  }

  static async getCacheStats(domainId: string): Promise<{
    totalKeys: number;
    listKeys: number;
    detailKeys: number;
    analyticsKeys: number;
  }> {
    if (!supportsKeysCommand()) {
      return { totalKeys: 0, listKeys: 0, detailKeys: 0, analyticsKeys: 0 };
    }

    const [listKeys, detailKeys, analyticsKeys] = await Promise.all([
      getKeysMatchingPattern(CacheKeys.conversationsListPattern(domainId)),
      getKeysMatchingPattern(CacheKeys.conversationDetailPattern()),
      getKeysMatchingPattern(CacheKeys.analyticsPattern(domainId))
    ]);

    return {
      totalKeys: listKeys.length + detailKeys.length + analyticsKeys.length,
      listKeys: listKeys.length,
      detailKeys: detailKeys.length,
      analyticsKeys: analyticsKeys.length,
    };
  }

  static async clearDomainCache(domainId: string): Promise<void> {
    if (!supportsKeysCommand()) return;

    const patterns = [
      CacheKeys.conversationsListPattern(domainId),
      CacheKeys.conversationDetailPattern(),
      CacheKeys.analyticsPattern(domainId),
    ];

    for (const pattern of patterns) {
      const keys = await getKeysMatchingPattern(pattern);
      if (keys.length > 0) {
        await deleteKeys(keys);
      }
    }
  }
}
