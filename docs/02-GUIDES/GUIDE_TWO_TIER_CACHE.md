# Two-Tier Cache Usage Guide

**Last Updated:** 2025-11-18
**Status:** Active
**Related:** [Performance Optimization](../09-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md)

---

## Quick Start

The two-tier cache provides automatic L1 (Redis) → L2 (Database) caching with graceful fallback.

### Basic Usage

```typescript
import { TwoTierCache } from '@/lib/cache/two-tier-cache';
import { CACHE_TTL } from '@/lib/cache/cache-config';

// Create cache instance
const userCache = new TwoTierCache<User>({
  ttl: CACHE_TTL.CUSTOMER_PROFILE, // 10 minutes
  prefix: 'user',
});

// Get with automatic caching
const user = await userCache.get(userId, async () => {
  // This only runs on cache miss
  return await database.users.findById(userId);
});

// Invalidate when data changes
await userCache.invalidate(userId);
```

---

## API Reference

### Constructor Options

```typescript
interface CacheOptions {
  ttl?: number;      // Time to live in seconds (default: 300)
  prefix?: string;   // Cache key prefix for namespacing (default: 'cache')
  verbose?: boolean; // Enable logging for debugging (default: false)
}
```

### Methods

#### `get(key, dbFetcher)`

Get cached data or fetch from database on miss.

```typescript
async get(
  key: string,
  dbFetcher: () => Promise<T>
): Promise<T>
```

**Example:**
```typescript
const config = await cache.get('domain.com', async () => {
  return await supabase
    .from('customer_configs')
    .select('*')
    .eq('domain', 'domain.com')
    .single();
});
```

#### `set(key, value)`

Manually set cache entry.

```typescript
async set(key: string, value: T): Promise<void>
```

**Example:**
```typescript
await cache.set('user-123', { id: '123', name: 'John' });
```

#### `invalidate(key)`

Remove single cache entry.

```typescript
async invalidate(key: string): Promise<void>
```

**Example:**
```typescript
// After updating user in database
await userCache.invalidate('user-123');
```

#### `invalidatePattern(pattern)`

Remove all keys matching glob pattern.

```typescript
async invalidatePattern(pattern: string): Promise<void>
```

**Example:**
```typescript
// Clear all user caches
await userCache.invalidatePattern('user-*');

// Clear caches for specific domain
await domainCache.invalidatePattern('domain.com:*');
```

#### `exists(key)`

Check if key exists in cache.

```typescript
async exists(key: string): Promise<boolean>
```

**Example:**
```typescript
if (await cache.exists('user-123')) {
  console.log('User is cached');
}
```

---

## Built-in Caches

The following caches are pre-configured and ready to use:

### Widget Configuration Cache

**Location:** `lib/chat/conversation-widget-config.ts`

```typescript
import { loadWidgetConfig, invalidateWidgetConfig } from '@/lib/chat/conversation-widget-config';

// Load (automatically cached for 5 minutes)
const config = await loadWidgetConfig(domainId, supabase);

// Invalidate after update
await invalidateWidgetConfig(domainId);
```

**TTL:** 5 minutes
**Use Case:** Loaded on every chat widget initialization

### Customer Profile Cache

**Location:** `lib/chat/conversation-widget-config.ts`

```typescript
import { loadCustomerProfile, invalidateCustomerProfile } from '@/lib/chat/conversation-widget-config';

// Load (automatically cached for 10 minutes)
const profile = await loadCustomerProfile(domainId, supabase);

// Invalidate after update
await invalidateCustomerProfile(domainId);
```

**TTL:** 10 minutes
**Use Case:** Business information, rarely changes

### Domain Lookup Cache

**Location:** `lib/chat/conversation-domain-operations.ts`

```typescript
import { lookupDomain, invalidateDomainLookup } from '@/lib/chat/conversation-domain-operations';

// Look up domain ID (automatically cached for 15 minutes)
const domainId = await lookupDomain('example.com', supabase);

// Invalidate after adding/updating domain
await invalidateDomainLookup('example.com');
```

**TTL:** 15 minutes
**Use Case:** Multi-tenant routing, used on every request

---

## TTL Selection Guide

| Data Type | Volatility | Recommended TTL | Example |
|-----------|------------|-----------------|---------|
| **Static** | Changes rarely | 15-30 minutes | Domain lookups, system config |
| **Stable** | Changes occasionally | 5-15 minutes | Widget configs, feature flags |
| **Dynamic** | Changes frequently | 1-5 minutes | User sessions, real-time data |
| **Real-time** | Changes constantly | Don't cache | Live metrics, counters |

**Available TTL Constants:**
```typescript
import { CACHE_TTL } from '@/lib/cache/cache-config';

CACHE_TTL.CONVERSATIONS_LIST   // 60s
CACHE_TTL.CONVERSATION_DETAIL  // 300s (5 min)
CACHE_TTL.ANALYTICS_DATA       // 180s (3 min)
CACHE_TTL.STATUS_COUNTS        // 60s
CACHE_TTL.WIDGET_CONFIG        // 300s (5 min)
CACHE_TTL.CUSTOMER_PROFILE     // 600s (10 min)
CACHE_TTL.DOMAIN_LOOKUP        // 900s (15 min)
```

---

## Cache Invalidation Patterns

### Pattern 1: Invalidate on Update

```typescript
export async function updateWidgetConfig(domainId: string, updates: any) {
  // 1. Update database
  const { error } = await supabase
    .from('widget_configs')
    .update(updates)
    .eq('domain_id', domainId);

  // 2. Invalidate cache
  if (!error) {
    await widgetConfigCache.invalidate(domainId);
  }

  return { error };
}
```

### Pattern 2: Batch Invalidation

```typescript
export async function bulkUpdateUsers(userIds: string[]) {
  // 1. Update database
  await database.users.updateMany({ id: { in: userIds } }, updates);

  // 2. Invalidate all affected caches
  await Promise.all(
    userIds.map(id => userCache.invalidate(id))
  );
}
```

### Pattern 3: Pattern-Based Invalidation

```typescript
export async function clearDomainCaches(domain: string) {
  // Clear all caches related to domain
  await Promise.all([
    widgetConfigCache.invalidatePattern(`${domain}:*`),
    customerProfileCache.invalidatePattern(`${domain}:*`),
    domainLookupCache.invalidate(domain),
  ]);
}
```

---

## Error Handling

The cache is designed to **never break your application**. All errors are caught and logged.

### Redis Unavailable

```typescript
// Redis fails → falls back to in-memory storage
[Redis] Using in-memory fallback storage
[Cache] MISS: widget-config:abc123
// Database query still executes normally ✓
```

### Cache Read Failure

```typescript
// Cache read fails → falls through to database
[Cache] Redis get error: Connection timeout
[Cache] MISS: user-123
// Database fetcher executes ✓
```

### Cache Write Failure

```typescript
// Cache write fails → database query still succeeds
[Cache] Failed to set cache: Redis unavailable
// User gets data from database ✓
```

**Result:** User experience is unaffected, requests just take longer without cache benefit.

---

## Debugging

### Enable Verbose Logging

```typescript
const cache = new TwoTierCache<WidgetConfig>({
  ttl: 300,
  prefix: 'widget-config',
  verbose: true, // ← Enable detailed logs
});
```

**Log Output:**
```
[Cache] MISS: widget-config:abc123
[Cache] SET: widget-config:abc123 TTL: 300s
[Cache] HIT: widget-config:abc123
[Cache] INVALIDATE: widget-config:abc123
```

### Verify Cache is Working

```bash
# Run verification script
npx tsx scripts/tests/verify-two-tier-cache.ts
```

### Check Redis Keys

```bash
# Connect to Redis
redis-cli

# List all cache keys
KEYS cache:*
KEYS widget-config:*
KEYS domain-lookup:*

# Check specific key
GET widget-config:abc123

# Check TTL
TTL widget-config:abc123
```

---

## Performance Expectations

### Cache Hit Performance

| Operation | Without Cache | With Cache (Hit) | Speedup |
|-----------|---------------|------------------|---------|
| Widget config | 50-100ms | 1-2ms | **25-50x** |
| Customer profile | 30-80ms | 1-2ms | **15-40x** |
| Domain lookup | 20-50ms | 1-2ms | **10-25x** |

### Expected Hit Rates

| Cache Type | Expected Hit Rate | Reasoning |
|------------|-------------------|-----------|
| Domain lookup | 99%+ | Same domains queried repeatedly |
| Widget config | 95%+ | Multiple chats per domain |
| Customer profile | 98%+ | Very stable data |

---

## Best Practices

### ✅ DO

- Use long TTLs for stable data (10-15 minutes)
- Invalidate cache after updates
- Use pattern invalidation for batch operations
- Monitor cache hit rates
- Use verbose logging during development

### ❌ DON'T

- Cache real-time data (use short TTLs instead)
- Forget to invalidate after updates
- Use cache for authentication/authorization decisions
- Store sensitive data in cache without encryption
- Rely on cache being available (always have fallback)

---

## Troubleshooting

### Problem: Cache hit rate is low

**Causes:**
- TTL too short for data access pattern
- Cache invalidation happening too frequently
- Keys changing (ensure consistent key generation)

**Solution:**
- Increase TTL for stable data
- Review invalidation logic
- Use verbose logging to see cache keys

### Problem: Stale data being served

**Causes:**
- Missing cache invalidation after updates
- TTL too long for data volatility

**Solution:**
- Add invalidation calls to update endpoints
- Reduce TTL for frequently changing data
- Use pattern invalidation for related data

### Problem: Cache not improving performance

**Causes:**
- Redis unavailable (using in-memory fallback)
- Cache miss rate too high
- Database queries still slow

**Solution:**
- Check Redis connection (`redis-cli ping`)
- Verify TTLs are appropriate
- Optimize database queries independently

---

## Examples

### Example 1: Custom Cache for Products

```typescript
import { TwoTierCache } from '@/lib/cache/two-tier-cache';

const productCache = new TwoTierCache<Product>({
  ttl: 300, // 5 minutes
  prefix: 'product',
});

export async function getProduct(productId: string): Promise<Product> {
  return await productCache.get(productId, async () => {
    return await database.products.findById(productId);
  });
}

export async function updateProduct(productId: string, updates: Partial<Product>) {
  await database.products.update(productId, updates);
  await productCache.invalidate(productId);
}
```

### Example 2: Cache with Complex Keys

```typescript
const searchCache = new TwoTierCache<SearchResults>({
  ttl: 180, // 3 minutes
  prefix: 'search',
});

export async function search(query: string, filters: SearchFilters) {
  // Create composite cache key
  const cacheKey = `${query}:${JSON.stringify(filters)}`;

  return await searchCache.get(cacheKey, async () => {
    return await database.search(query, filters);
  });
}
```

### Example 3: Cache Warming on Startup

```typescript
async function warmCache() {
  const popularDomains = await getPopularDomains(100);

  console.log(`Warming cache for ${popularDomains.length} domains...`);

  await Promise.all(
    popularDomains.map(async (domain) => {
      await loadWidgetConfig(domain.id, supabase);
      await loadCustomerProfile(domain.id, supabase);
    })
  );

  console.log('Cache warming complete');
}

// Call on app startup
warmCache().catch(console.error);
```

---

## Related Documentation

- [Performance Optimization Guide](../09-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md)
- [Redis Configuration](../../lib/redis-enhanced.ts)
- [Implementation Report](../../ARCHIVE/completion-reports-2025-11/TWO_TIER_CACHE_IMPLEMENTATION.md)
- [Supabase Performance Analysis](../10-ANALYSIS/ANALYSIS_SUPABASE_PERFORMANCE.md)
