/**
 * Database Query Cache
 * Provides intelligent caching with LRU eviction and TTL expiration
 */

import type { SupabaseClient } from '@/types/supabase';

interface QueryCacheEntry {
  data: any;
  timestamp: number;
  hits: number;
}

export class DatabaseOptimizer {
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
