import { getRedisClient } from './redis-unified';
import type { ResilientRedisClient } from './redis-unified';

export class WooCommerceDashboardCache {
  private redis: ResilientRedisClient;
  
  // Cache TTLs in seconds - different data needs different freshness
  private readonly TTL = {
    DASHBOARD: 60,        // 1 minute for main dashboard (balance between freshness and performance)
    REVENUE_TODAY: 30,    // 30 seconds for today's revenue (needs to be fresh)
    ABANDONED_CARTS: 120, // 2 minutes for abandoned carts
    LOW_STOCK: 300,       // 5 minutes for low stock (doesn't change rapidly)
    SYSTEM_STATUS: 1800,  // 30 minutes for system status
    HISTORICAL: 3600,     // 1 hour for historical data (past revenue)
  };

  constructor() {
    this.redis = getRedisClient();
  }

  /**
   * Get cached dashboard data
   */
  async getCachedDashboard(tenantId: string): Promise<any | null> {
    try {
      const key = this.getDashboardKey(tenantId);
      const cached = await this.redis.get(key);
      
      if (cached) {
        return JSON.parse(cached);
      }
      
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null; // Fail gracefully - don't break if cache is down
    }
  }

  /**
   * Cache dashboard data with intelligent partial updates
   */
  async cacheDashboard(tenantId: string, data: any): Promise<void> {
    try {
      const key = this.getDashboardKey(tenantId);
      
      // Store the main dashboard with timestamp
      const cacheData = {
        ...data,
        cachedAt: new Date().toISOString(),
      };
      
      await this.redis.set(key, JSON.stringify(cacheData), this.TTL.DASHBOARD);
      console.log(`[Cache SET] Dashboard for tenant ${tenantId} (TTL: ${this.TTL.DASHBOARD}s)`);
      
      // Also cache individual components with their own TTLs
      await this.cacheComponents(tenantId, data);
    } catch (error) {
      console.error('Cache set error:', error);
      // Fail silently - caching should not break the app
    }
  }

  /**
   * Cache individual dashboard components with specific TTLs
   */
  private async cacheComponents(tenantId: string, data: any): Promise<void> {
    const promises = [];
    
    // Cache abandoned carts separately
    if (data.abandonedCarts) {
      const key = `wc:${tenantId}:abandoned_carts`;
      promises.push(
        this.redis.set(key, JSON.stringify(data.abandonedCarts), this.TTL.ABANDONED_CARTS)
      );
    }
    
    // Cache low stock items
    if (data.lowStock) {
      const key = `wc:${tenantId}:low_stock`;
      promises.push(
        this.redis.set(key, JSON.stringify(data.lowStock), this.TTL.LOW_STOCK)
      );
    }
    
    // Cache revenue history (can be cached longer)
    if (data.revenueHistory) {
      const key = `wc:${tenantId}:revenue_history`;
      promises.push(
        this.redis.set(key, JSON.stringify(data.revenueHistory), this.TTL.HISTORICAL)
      );
    }
    
    await Promise.allSettled(promises);
  }

  /**
   * Get partial cached data (useful for refreshing specific sections)
   */
  async getCachedComponent(tenantId: string, component: string): Promise<any | null> {
    try {
      const key = `wc:${tenantId}:${component}`;
      const cached = await this.redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error(`Cache component get error for ${component}:`, error);
      return null;
    }
  }

  /**
   * Invalidate all dashboard caches for a tenant
   */
  async invalidateDashboard(tenantId: string): Promise<void> {
    try {
      const pattern = `wc:${tenantId}:*`;
      const keys = await this.redis.keys(pattern);
      
      if (keys.length > 0) {
        // ResilientRedisClient.del() takes a single key, so delete them one by one
        for (const key of keys) {
          await this.redis.del(key);
        }
      }
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  /**
   * Invalidate specific cache component
   */
  async invalidateComponent(tenantId: string, component: string): Promise<void> {
    try {
      const key = `wc:${tenantId}:${component}`;
      await this.redis.del(key);
    } catch (error) {
      console.error(`Cache invalidation error for ${component}:`, error);
    }
  }

  /**
   * Check if cache is stale (for background refresh)
   */
  async isCacheStale(tenantId: string, maxAge: number = 60): Promise<boolean> {
    try {
      const key = this.getDashboardKey(tenantId);
      // TTL method not available in ResilientRedisClient
      // Using a different approach - check cached timestamp
      const cached = await this.redis.get(key);
      if (!cached) return true;
      const data = JSON.parse(cached);
      if (!data.cachedAt) return true;
      const cachedAt = new Date(data.cachedAt).getTime();
      const age = (Date.now() - cachedAt) / 1000;
      // If age is more than half of max age, consider it stale
      // This allows for background refresh before cache expires
      return age > (maxAge / 2);
    } catch (error) {
      return true; // If we can't check, assume it's stale
    }
  }

  /**
   * Get cache statistics for monitoring
   */
  async getCacheStats(tenantId: string): Promise<any> {
    try {
      const pattern = `wc:${tenantId}:*`;
      const keys = await this.redis.keys(pattern);
      
      const stats = {
        totalKeys: keys.length,
        keys: [] as any[],
      };
      
      // Note: ResilientRedisClient doesn't have ttl() or memory() methods
      // We'll just return the key names for now
      for (const key of keys) {
        stats.keys.push({
          key: key.replace(`wc:${tenantId}:`, ''),
          // ttl and memory info not available with ResilientRedisClient
        });
      }
      
      return stats;
    } catch (error) {
      console.error('Cache stats error:', error);
      return null;
    }
  }

  private getDashboardKey(tenantId: string): string {
    return `wc:${tenantId}:dashboard`;
  }

  /**
   * Warm up cache by pre-fetching data
   */
  async warmCache(tenantId: string, fetchFunction: () => Promise<any>): Promise<any> {
    try {
      const data = await fetchFunction();
      await this.cacheDashboard(tenantId, data);
      return data;
    } catch (error) {
      console.error('Cache warm-up error:', error);
      throw error;
    }
  }
}

// Singleton instance
let cacheInstance: WooCommerceDashboardCache | null = null;

export function getDashboardCache(): WooCommerceDashboardCache {
  if (!cacheInstance) {
    cacheInstance = new WooCommerceDashboardCache();
  }
  return cacheInstance;
}