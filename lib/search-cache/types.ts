/**
 * Search Cache Types
 * Type definitions for search cache operations
 */

export interface CachedSearchResult {
  response: string;
  chunks: any[];
  metadata?: {
    sourcesUsed?: string[];
    chunksRetrieved?: number;
    searchMethod?: string;
  };
  cachedAt: number;
}

export interface CacheStats {
  totalCached: number;
  cacheHits: number;
  cacheMisses: number;
  cacheWrites: number;
  hitRate: number;
  embeddingCacheHits: number;
  oldestEntry: number;
  newestEntry: number;
  currentVersion: string;
  versionedEntries: number;
  legacyEntries: number;
}
