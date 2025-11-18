/**
 * Database Connection Pool
 * Manages Supabase client connections with LRU eviction and automatic cleanup
 *
 * NOTE: This pool still uses createClient from @supabase/supabase-js directly
 * because it manages multiple connections with different credentials.
 * This is a legitimate use case for direct client creation.
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@/types/supabase';

/**
 * Connection pool for Supabase
 * Implements least-recently-used eviction and idle connection cleanup
 */
export class SupabasePool {
  private connections: Map<string, SupabaseClient>;
  private lastUsed: Map<string, number>;
  private maxConnections: number;
  private maxIdleTime: number;
  private cleanupInterval: NodeJS.Timeout;

  constructor(maxConnections: number = 5, maxIdleMinutes: number = 10) {
    this.connections = new Map();
    this.lastUsed = new Map();
    this.maxConnections = maxConnections;
    this.maxIdleTime = maxIdleMinutes * 60 * 1000;

    // Cleanup idle connections periodically
    this.cleanupInterval = setInterval(() => this.cleanupIdleConnections(), 60000);
  }

  /**
   * Get or create a Supabase client
   * Uses LRU eviction when pool is full
   */
  getClient(url: string, key: string): SupabaseClient {
    const connectionKey = `${url}:${key}`;

    // Return existing connection
    if (this.connections.has(connectionKey)) {
      this.lastUsed.set(connectionKey, Date.now());
      return this.connections.get(connectionKey)!;
    }

    // Check if we need to evict
    if (this.connections.size >= this.maxConnections) {
      // Find least recently used
      let oldestKey: string | null = null;
      let oldestTime = Date.now();

      this.lastUsed.forEach((time, key) => {
        if (time < oldestTime) {
          oldestTime = time;
          oldestKey = key;
        }
      });

      if (oldestKey) {
        this.connections.delete(oldestKey);
        this.lastUsed.delete(oldestKey);
      }
    }

    // Create new connection
    const client = createSupabaseClient(url, key);
    this.connections.set(connectionKey, client);
    this.lastUsed.set(connectionKey, Date.now());

    return client;
  }

  /**
   * Clean up idle connections
   * Removes connections that haven't been used within maxIdleTime
   */
  private cleanupIdleConnections(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.lastUsed.forEach((time, key) => {
      if (now - time > this.maxIdleTime) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => {
      this.connections.delete(key);
      this.lastUsed.delete(key);
    });

    if (keysToDelete.length > 0) {
    }
  }

  /**
   * Get pool statistics
   */
  getStats() {
    return {
      activeConnections: this.connections.size,
      maxConnections: this.maxConnections,
    };
  }

  /**
   * Cleanup resources (for graceful shutdown)
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.connections.clear();
    this.lastUsed.clear();
  }
}

export const supabasePool = new SupabasePool();
