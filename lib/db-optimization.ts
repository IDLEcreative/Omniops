/**
 * Database Query Optimization Utilities
 * Provides batching, caching, and connection pooling for Supabase queries
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { createServiceRoleClientSync } from '@/lib/supabase/server';

interface QueryCacheEntry {
  data: any;
  timestamp: number;
  hits: number;
}

class DatabaseOptimizer {
  private queryCache: Map<string, QueryCacheEntry>;
  private cacheMaxSize: number;
  private cacheTTL: number;
  private pendingBatches: Map<string, Promise<any>>;
  private stats = {
    cacheHits: 0,
    cacheMisses: 0,
    batchedQueries: 0,
    totalQueries: 0,
  };

  constructor(maxCacheSize: number = 100, cacheTTLMinutes: number = 5) {
    this.queryCache = new Map();
    this.cacheMaxSize = maxCacheSize;
    this.cacheTTL = cacheTTLMinutes * 60 * 1000;
    this.pendingBatches = new Map();
  }

  /**
   * Generate cache key from query parameters
   */
  private generateCacheKey(table: string, query: any): string {
    return `${table}:${JSON.stringify(query)}`;
  }

  /**
   * Get cached query result
   */
  getCachedQuery(table: string, query: any): any | null {
    const key = this.generateCacheKey(table, query);
    const entry = this.queryCache.get(key);

    if (!entry) {
      this.stats.cacheMisses++;
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > this.cacheTTL) {
      this.queryCache.delete(key);
      this.stats.cacheMisses++;
      return null;
    }

    // Update stats and LRU
    entry.hits++;
    this.queryCache.delete(key);
    this.queryCache.set(key, entry);
    
    this.stats.cacheHits++;
    return entry.data;
  }

  /**
   * Cache query result
   */
  cacheQuery(table: string, query: any, data: any): void {
    const key = this.generateCacheKey(table, query);

    // Evict if needed
    if (this.queryCache.size >= this.cacheMaxSize) {
      const firstKey = this.queryCache.keys().next().value;
      if (firstKey) this.queryCache.delete(firstKey);
    }

    this.queryCache.set(key, {
      data,
      timestamp: Date.now(),
      hits: 0,
    });
  }

  /**
   * Batch multiple database operations
   */
  async batchQueries<T>(
    supabase: SupabaseClient,
    queries: Array<{
      table: string;
      operation: 'select' | 'insert' | 'update' | 'delete';
      data?: any;
      filters?: Record<string, any>;
      columns?: string;
    }>
  ): Promise<T[]> {
    this.stats.totalQueries += queries.length;
    this.stats.batchedQueries++;

    // Group queries by table and operation
    const groupedQueries = new Map<string, typeof queries>();
    
    queries.forEach(query => {
      const key = `${query.table}-${query.operation}`;
      if (!groupedQueries.has(key)) {
        groupedQueries.set(key, []);
      }
      groupedQueries.get(key)!.push(query);
    });

    // Execute grouped queries in parallel
    const results = await Promise.all(
      Array.from(groupedQueries.entries()).map(async ([key, group]) => {
        const [table, operation] = key.split('-');
        
        if (!table) return [];
        
        if (operation === 'select') {
          // Combine select queries with OR conditions
          const filters = group.map(q => q.filters).filter(Boolean);
          if (filters.length > 0) {
            let query = supabase.from(table).select(group[0]?.columns || '*');
            
            // Apply filters
            filters.forEach(filter => {
              Object.entries(filter || {}).forEach(([key, value]) => {
                query = query.eq(key, value);
              });
            });
            
            const { data, error } = await query;
            if (error) throw error;
            return data;
          }
        } else if (operation === 'insert') {
          // Batch insert
          const records = group.map(q => q.data).flat();
          const { data, error } = await supabase.from(table).insert(records).select();
          if (error) throw error;
          return data;
        } else if (operation === 'update') {
          // Batch update (if same update values)
          const updates = group.map(q => ({
            data: q.data,
            filters: q.filters,
          }));
          
          // Group by update data
          const updateGroups = new Map<string, typeof updates>();
          updates.forEach(update => {
            const dataKey = JSON.stringify(update.data);
            if (!updateGroups.has(dataKey)) {
              updateGroups.set(dataKey, []);
            }
            updateGroups.get(dataKey)!.push(update);
          });
          
          const updateResults = await Promise.all(
            Array.from(updateGroups.entries()).map(async ([dataKey, updateGroup]) => {
              const data = JSON.parse(dataKey);
              if (!table) return [];
              let query = supabase.from(table).update(data);
              
              // Apply filters
              updateGroup.forEach(({ filters }) => {
                Object.entries(filters || {}).forEach(([key, value]) => {
                  query = query.eq(key, value);
                });
              });
              
              const { data: result, error } = await query.select();
              if (error) throw error;
              return result;
            })
          );
          
          return updateResults.flat();
        }
        
        return [];
      })
    );

    return results.flat() as T[];
  }

  /**
   * Execute query with caching
   */
  async cachedQuery<T>(
    supabase: SupabaseClient,
    table: string,
    queryBuilder: (query: any) => any
  ): Promise<T> {
    const cacheKey = `${table}:${queryBuilder.toString()}`;
    
    // Check cache
    const cached = this.getCachedQuery(table, cacheKey);
    if (cached) return cached;

    // Execute query
    const query = supabase.from(table);
    const builtQuery = queryBuilder(query);
    const { data, error } = await builtQuery;

    if (error) throw error;

    // Cache result
    this.cacheQuery(table, cacheKey, data);
    
    return data;
  }

  /**
   * Prefetch commonly accessed data
   */
  async prefetchCommon(supabase: SupabaseClient): Promise<void> {
    const prefetchQueries = [
      { table: 'customer_configs', limit: 10 },
      { table: 'scraped_pages', limit: 20 },
      { table: 'page_embeddings', limit: 50 },
    ];

    await Promise.all(
      prefetchQueries.map(async ({ table, limit }) => {
        const { data } = await supabase.from(table).select('*').limit(limit);
        if (data) {
          this.cacheQuery(table, { limit }, data);
        }
      })
    );

    console.log('[DatabaseOptimizer] Prefetched common queries');
  }

  /**
   * Get optimization statistics
   */
  getStats() {
    const hitRate = this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses) || 0;
    return {
      ...this.stats,
      cacheSize: this.queryCache.size,
      cacheHitRate: (hitRate * 100).toFixed(2) + '%',
      averageQueriesPerBatch: this.stats.batchedQueries > 0 
        ? (this.stats.totalQueries / this.stats.batchedQueries).toFixed(2)
        : '0',
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.queryCache.clear();
    this.stats = {
      cacheHits: 0,
      cacheMisses: 0,
      batchedQueries: 0,
      totalQueries: 0,
    };
  }
}

// Singleton instance
export const dbOptimizer = new DatabaseOptimizer();

/**
 * Connection pool for Supabase
 */
class SupabasePool {
  private connections: Map<string, SupabaseClient>;
  private lastUsed: Map<string, number>;
  private maxConnections: number;
  private maxIdleTime: number;

  constructor(maxConnections: number = 5, maxIdleMinutes: number = 10) {
    this.connections = new Map();
    this.lastUsed = new Map();
    this.maxConnections = maxConnections;
    this.maxIdleTime = maxIdleMinutes * 60 * 1000;

    // Cleanup idle connections periodically
    setInterval(() => this.cleanupIdleConnections(), 60000);
  }

  /**
   * Get or create a Supabase client
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
    const client = createClient(url, key);
    this.connections.set(connectionKey, client);
    this.lastUsed.set(connectionKey, Date.now());
    
    return client;
  }

  /**
   * Clean up idle connections
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
      console.log(`[SupabasePool] Cleaned up ${keysToDelete.length} idle connections`);
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
}

export const supabasePool = new SupabasePool();

/**
 * Optimized query builder with automatic batching
 */
export class QueryBuilder {
  private pendingQueries: Array<{
    resolve: (value: any) => void;
    reject: (error: any) => void;
    query: any;
  }> = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private batchDelay: number;

  constructor(batchDelayMs: number = 10) {
    this.batchDelay = batchDelayMs;
  }

  /**
   * Add query to batch
   */
  addQuery<T>(query: any): Promise<T> {
    return new Promise((resolve, reject) => {
      this.pendingQueries.push({ resolve, reject, query });
      
      if (!this.batchTimeout) {
        this.batchTimeout = setTimeout(() => this.executeBatch(), this.batchDelay);
      }
    });
  }

  /**
   * Execute pending queries
   */
  private async executeBatch(): Promise<void> {
    const queries = [...this.pendingQueries];
    this.pendingQueries = [];
    this.batchTimeout = null;

    if (queries.length === 0) return;

    try {
      // Execute all queries in parallel
      const results = await Promise.allSettled(
        queries.map(q => q.query)
      );

      results.forEach((result, index) => {
        const query = queries[index];
        if (!query) return;
        if (result.status === 'fulfilled') {
          query.resolve(result.value);
        } else {
          query.reject(result.reason);
        }
      });

      console.log(`[QueryBuilder] Executed batch of ${queries.length} queries`);
    } catch (error) {
      queries.forEach(q => q.reject(error));
    }
  }
}

export const queryBuilder = new QueryBuilder();