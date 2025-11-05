/**
 * Search Cache Manager
 *
 * NOTE: This file has been refactored into modular structure.
 * See lib/search-cache/ directory for implementation details.
 *
 * Original file backed up as: lib/search-cache.ts.old
 */

// Re-export all functionality from modular structure for backward compatibility
export {
  // Types
  type CachedSearchResult,
  type CacheStats,

  // Classes
  SearchCacheManager,
  CacheOperations,
  CacheManagement,

  // Singleton
  getSearchCacheManager,
} from './search-cache/index'
