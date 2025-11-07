/**
 * Cache Key Generation for Conversation Caching
 *
 * Centralized cache key generation to ensure consistency across the caching system.
 * Keys are namespaced by type and include domain isolation for multi-tenancy.
 */

import type { ConversationListFilters } from './conversation-cache';

export class CacheKeys {
  /**
   * Generate cache key for conversations list
   * Format: conversations:list:{domainId}:{normalizedFilters}
   */
  static conversationsList(domainId: string, filters: Record<string, any>): string {
    return `conversations:list:${domainId}:${JSON.stringify(filters)}`;
  }

  /**
   * Generate cache key for conversation detail
   * Format: conversation:detail:{conversationId}
   */
  static conversationDetail(conversationId: string): string {
    return `conversation:detail:${conversationId}`;
  }

  /**
   * Generate cache key for analytics data
   * Format: analytics:conversations:{domainId}:{days}
   */
  static analytics(domainId: string, days: number): string {
    return `analytics:conversations:${domainId}:${days}`;
  }

  /**
   * Generate pattern for all conversation lists for a domain
   * Used for pattern-based invalidation
   */
  static conversationsListPattern(domainId: string): string {
    return `conversations:list:${domainId}:*`;
  }

  /**
   * Generate pattern for conversation detail
   * Used for bulk operations
   */
  static conversationDetailPattern(): string {
    return `conversation:detail:*`;
  }

  /**
   * Generate pattern for analytics
   * Used for domain-wide cache clearing
   */
  static analyticsPattern(domainId: string): string {
    return `analytics:conversations:${domainId}:*`;
  }

  /**
   * Get all common cache key patterns for a domain
   * Used for fallback invalidation when KEYS command unavailable
   */
  static commonListKeys(domainId: string): string[] {
    return [
      `conversations:list:${domainId}:{}`,
      `conversations:list:${domainId}:{"status":"active"}`,
      `conversations:list:${domainId}:{"status":"waiting"}`,
      `conversations:list:${domainId}:{"status":"resolved"}`,
    ];
  }
}
