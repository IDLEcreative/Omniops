/**
 * Query Cache Implementation
 * Provides in-memory and database-level caching for expensive queries
 */

import { createHash } from 'crypto';
import { SupabaseClient } from '@supabase/supabase-js';

interface CacheOptions {
  ttlSeconds?: number;
  useMemoryCache?: boolean;
  useDbCache?: boolean;
}

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class QueryCache {
  private static memoryCache = new Map<string, CacheEntry<any>>();
  private static readonly DEFAULT_TTL = 3600; // 1 hour
  
  /**
   * Generate cache key from query parameters
   */
  static generateKey(params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = params[key];
        return acc;
      }, {} as Record<string, any>);
    
    return createHash('sha256')
      .update(JSON.stringify(sortedParams))
      .digest('hex');
  }
  
  /**
   * Get cached result from memory
   */
  static getFromMemory<T>(key: string): T | null {
    const entry = this.memoryCache.get(key);
    
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
      this.memoryCache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }
  
  /**
   * Store result in memory cache
   */
  static setInMemory<T>(key: string, data: T, ttlSeconds?: number): void {
    const ttl = ttlSeconds || this.DEFAULT_TTL;
    this.memoryCache.set(key, {
      data,
      expiresAt: Date.now() + (ttl * 1000)
    });
    
    // Prevent memory leak - limit cache size
    if (this.memoryCache.size > 1000) {
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
    }
  }
  
  /**
   * Get cached result from database
   */
  static async getFromDb<T>(
    supabase: SupabaseClient,
    domainId: string,
    queryHash: string
  ): Promise<T | null> {
    const { data, error } = await supabase
      .from('query_cache')
      .select('results, hit_count')
      .eq('domain_id', domainId)
      .eq('query_hash', queryHash)
      .gt('expires_at', new Date().toISOString())
      .single();
    
    if (error || !data) return null;
    
    // Increment hit count asynchronously
    supabase
      .from('query_cache')
      .update({ hit_count: data.hit_count + 1 })
      .eq('domain_id', domainId)
      .eq('query_hash', queryHash)
      .then(() => {});
    
    return data.results as T;
  }
  
  /**
   * Store result in database cache
   */
  static async setInDb<T>(
    supabase: SupabaseClient,
    domainId: string,
    queryHash: string,
    queryText: string | null,
    data: T,
    ttlSeconds?: number
  ): Promise<void> {
    const ttl = ttlSeconds || this.DEFAULT_TTL;
    const expiresAt = new Date(Date.now() + (ttl * 1000)).toISOString();
    
    await supabase
      .from('query_cache')
      .upsert({
        domain_id: domainId,
        query_hash: queryHash,
        query_text: queryText,
        results: data,
        expires_at: expiresAt,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'domain_id,query_hash'
      });
  }
  
  /**
   * Cached query executor with both memory and DB caching
   */
  static async execute<T>(
    params: {
      key: string;
      domainId?: string;
      queryText?: string;
      ttlSeconds?: number;
      useMemoryCache?: boolean;
      useDbCache?: boolean;
      supabase?: SupabaseClient;
    },
    queryFn: () => Promise<T>
  ): Promise<T> {
    const {
      key,
      domainId,
      queryText,
      ttlSeconds,
      useMemoryCache = true,
      useDbCache = false,
      supabase
    } = params;
    
    // Try memory cache first (fastest)
    if (useMemoryCache) {
      const memoryResult = this.getFromMemory<T>(key);
      if (memoryResult !== null) {
        return memoryResult;
      }
    }
    
    // Try database cache (slower but persistent)
    if (useDbCache && supabase && domainId) {
      const dbResult = await this.getFromDb<T>(supabase, domainId, key);
      if (dbResult !== null) {
        // Populate memory cache from DB
        if (useMemoryCache) {
          this.setInMemory(key, dbResult, ttlSeconds);
        }
        return dbResult;
      }
    }
    
    // Cache miss - execute query
    const result = await queryFn();
    
    // Store in both caches
    if (useMemoryCache) {
      this.setInMemory(key, result, ttlSeconds);
    }
    
    if (useDbCache && supabase && domainId) {
      await this.setInDb(
        supabase,
        domainId,
        key,
        queryText || null,
        result,
        ttlSeconds
      );
    }
    
    return result;
  }
  
  /**
   * Clear memory cache
   */
  static clearMemory(pattern?: string): void {
    if (!pattern) {
      this.memoryCache.clear();
      return;
    }
    
    // Clear entries matching pattern
    for (const [key] of this.memoryCache) {
      if (key.includes(pattern)) {
        this.memoryCache.delete(key);
      }
    }
  }
  
  /**
   * Clear database cache for a domain
   */
  static async clearDb(
    supabase: SupabaseClient,
    domainId: string
  ): Promise<void> {
    await supabase
      .from('query_cache')
      .delete()
      .eq('domain_id', domainId);
  }
  
  /**
   * Get cache statistics
   */
  static getStats() {
    let totalSize = 0;
    let expiredCount = 0;
    const now = Date.now();
    
    for (const [, entry] of this.memoryCache) {
      totalSize += JSON.stringify(entry.data).length;
      if (now > entry.expiresAt) expiredCount++;
    }
    
    return {
      entries: this.memoryCache.size,
      sizeBytes: totalSize,
      expired: expiredCount,
      active: this.memoryCache.size - expiredCount
    };
  }
}