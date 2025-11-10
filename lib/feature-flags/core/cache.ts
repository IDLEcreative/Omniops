/**
 * Feature Flag Cache Management
 *
 * Purpose: In-memory cache for feature flag configurations
 * Last Updated: 2025-11-08
 */

import type { ChatWidgetFeatureFlags } from '@/lib/chat-widget/default-config';
import type { CacheEntry } from './types';

/**
 * Cache manager for feature flags
 */
export class FlagCache {
  private cache: Map<string, CacheEntry>;
  private cacheTTL: number;

  constructor(cacheTTL: number = 5 * 60 * 1000) {
    this.cache = new Map();
    this.cacheTTL = cacheTTL;
  }

  /**
   * Generate cache key from customer/org IDs
   */
  generateKey(customerId?: string, organizationId?: string): string {
    return `${customerId || 'none'}:${organizationId || 'none'}`;
  }

  /**
   * Get cached config if valid
   */
  get(key: string): ChatWidgetFeatureFlags | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.config;
    }
    return null;
  }

  /**
   * Store config in cache
   */
  set(key: string, config: ChatWidgetFeatureFlags): void {
    this.cache.set(key, {
      config,
      timestamp: Date.now(),
    });
  }

  /**
   * Get cached entry with timestamp
   */
  getEntry(key: string): CacheEntry | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached;
    }
    return null;
  }

  /**
   * Invalidate cache for a customer
   */
  invalidateCustomer(customerId: string): void {
    const keysToDelete: string[] = [];
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${customerId}:`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Invalidate cache for all customers in an organization
   */
  invalidateOrganization(organizationId: string): void {
    const keysToDelete: string[] = [];
    for (const key of this.cache.keys()) {
      if (key.includes(`:${organizationId}`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}
