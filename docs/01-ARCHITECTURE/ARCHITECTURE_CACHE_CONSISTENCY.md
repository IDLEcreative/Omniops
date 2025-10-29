# Cache Consistency & Versioning System

## Overview

The search system uses a multi-layered caching strategy to improve performance from 3-26 seconds to <1 second response times. This document explains how the cache versioning system works and how to resolve consistency issues.

## Architecture

### Cache Layers

1. **Search Result Cache** - Stores complete search results for queries
   - TTL: 1 hour
   - Key format: `search:cache:{hash}:v{version}`
   - Includes response text and content chunks

2. **Embedding Cache** - Stores vector embeddings for frequently searched terms
   - TTL: 24 hours  
   - Key format: `embedding:cache:{hash}:v{version}`
   - Reduces OpenAI API calls

3. **LRU Tracking** - Manages cache size with Least Recently Used eviction
   - Max cache size: 1000 entries
   - Uses Redis sorted sets for efficient tracking

### Versioning System

Cache keys include a version suffix (e.g., `:v3.1.0`) that automatically invalidates old entries when the search logic changes.

**Current Version:** `3.1.0`

**Version History:**
- `3.1.0` - Fixed cache consistency with proper versioning for embeddings
- `3.0.0` - Fixed Supabase OR limitation by using multiple queries
- `2.0.0` - Added short query detection for better brand/keyword searches
- `1.2.0` - Improved metadata search
- `1.1.0` - Added product enhancement logic
- `1.0.0` - Initial cache implementation

## Common Issues & Solutions

### Issue 1: Stale Cache Results

**Symptoms:**
- Old product counts (e.g., 35 Cifa products instead of 209)
- Inconsistent results between queries
- Cache returns outdated information after database updates

**Root Causes:**
1. Old version cache entries not cleared after version bump
2. Embedding cache not using versioning
3. Cache invalidation not working properly

**Solution:**
```bash
# Clear old version caches
npx tsx clear-stale-cache.ts

# Or clear ALL cache (use with caution)
npx tsx clear-stale-cache.ts --clear-all
```

### Issue 2: Cache Not Invalidating

**Symptoms:**
- Changes to database don't reflect in search results
- Cache persists even after supposed invalidation

**Root Cause:**
Missing Redis methods in fallback implementation prevented proper cache management.

**Solution:**
The system now includes full Redis compatibility in the fallback implementation, supporting:
- `keys()` for pattern matching
- `zadd()`, `zrange()`, `zrem()`, `zcard()` for LRU tracking
- Proper version-based invalidation

### Issue 3: Inconsistent Cache Behavior

**Symptoms:**
- Different results in development vs production
- Cache works sometimes but not others

**Root Cause:**
Fallback to in-memory cache when Redis is unavailable, without proper method support.

**Solution:**
Ensure Redis is properly configured:
```bash
# Start Redis locally
docker-compose up -d redis

# Set environment variable
export REDIS_URL=redis://localhost:6379
```

## Maintenance Commands

### Check Cache Health
```bash
npx tsx test-cache-consistency.ts
```

### Clear Stale Entries
```bash
# Clear old versions only
npx tsx clear-stale-cache.ts

# Clear everything
npx tsx clear-stale-cache.ts --clear-all
```

### Warm Cache with Common Queries
```bash
npx tsx -e "
import { warmCache } from './lib/cache-warmer';
warmCache('thompsonseparts.co.uk').then(() => process.exit(0));
"
```

### View Cache Statistics
```bash
npx tsx -e "
import { getSearchCacheManager } from './lib/search-cache';
const manager = getSearchCacheManager();
manager.getCacheStats().then(stats => {
  console.log('Cache Statistics:');
  console.log(JSON.stringify(stats, null, 2));
  process.exit(0);
});
"
```

## Implementation Details

### Key Components

1. **`lib/search-cache.ts`**
   - Main cache manager implementation
   - Handles get/set operations with TTL
   - Manages LRU eviction

2. **`lib/cache-versioning.ts`**
   - Version tracking and key generation
   - Version history documentation
   - Helper functions for version management

3. **`lib/redis-fallback.ts`**
   - In-memory fallback when Redis unavailable
   - Full Redis API compatibility
   - Automatic cleanup of expired entries

4. **`lib/cache-warmer.ts`**
   - Pre-populates cache with common queries
   - Reduces cold start latency

### Cache Key Structure

```
search:cache:{md5_hash}:v{version}
             ↑          ↑
             Query hash  Version suffix
```

Example: `search:cache:a3f2b89c:v3.1.0`

### Cache Invalidation Strategy

1. **Version-based** - Changing `SEARCH_CACHE_VERSION` invalidates all old entries
2. **TTL-based** - Entries expire after configured time
3. **Manual** - Explicit invalidation for specific queries or domains
4. **LRU eviction** - Oldest entries removed when cache limit reached

## Best Practices

1. **Always use versioned keys** - Ensures cache consistency across deployments
2. **Monitor cache metrics** - Track hit rate to ensure effectiveness
3. **Clear old versions regularly** - Prevents cache bloat
4. **Test after changes** - Run consistency tests after modifying search logic
5. **Use appropriate TTLs** - Balance between performance and freshness

## Troubleshooting

### Debug Cache Issues

```typescript
// Check what's in cache
const manager = getSearchCacheManager();
const stats = await manager.getCacheStats();
console.log('Versioned entries:', stats.versionedEntries);
console.log('Legacy entries:', stats.legacyEntries);

// Test specific query
const cached = await manager.getCachedResult('Cifa', 'thompsonseparts.co.uk', 100);
if (cached) {
  console.log('Found cached result:', cached.chunks.length, 'items');
  console.log('Cached at:', new Date(cached.cachedAt));
}
```

### Force Cache Rebuild

```typescript
// Invalidate and rebuild specific query
await manager.invalidateQuery('Cifa', 'thompsonseparts.co.uk', 100);
const freshResults = await searchSimilarContent('Cifa', 'thompsonseparts.co.uk', 100, 0.15);
console.log('Cache rebuilt with', freshResults.length, 'items');
```

## Performance Impact

- **Without cache:** 3-26 seconds per search
- **With cache (hit):** <100ms
- **With cache (miss):** Same as without cache + ~50ms overhead
- **Hit rate target:** >80% for common queries

## Future Improvements

1. **Distributed cache** - Redis Cluster for high availability
2. **Smart invalidation** - Track database changes and invalidate affected queries
3. **Predictive warming** - Use analytics to pre-cache trending queries
4. **Tiered caching** - Different TTLs based on query popularity
5. **Compression** - Reduce memory usage for large result sets