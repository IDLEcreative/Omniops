# Embedding Cache Guide

**Type:** Guide
**Status:** Active
**Last Updated:** 2025-11-05
**Verified For:** v0.1.0
**Dependencies:** [Performance Optimization](../09-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md)
**Estimated Read Time:** 10 minutes

## Purpose

Embedding caching reduces OpenAI API costs by 60-80% for repeat content by storing generated embeddings in an in-memory LRU cache. This guide explains how to configure, monitor, and optimize the embedding cache system.

## Quick Links

- [Performance Optimization Reference](../09-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md)
- [Architecture: Search System](../01-ARCHITECTURE/ARCHITECTURE_SEARCH_SYSTEM.md)

## Table of Contents

- [Overview](#overview)
- [How It Works](#how-it-works)
- [Configuration](#configuration)
- [Monitoring](#monitoring)
- [Expected Performance](#expected-performance)
- [Use Cases](#use-cases)
- [Troubleshooting](#troubleshooting)
- [Cost Analysis](#cost-analysis)

---

## Overview

The embedding cache is an **in-memory LRU (Least Recently Used) cache** that stores OpenAI embedding vectors. When the same text is processed multiple times (common during re-scraping or duplicate content), the cached embeddings are reused instead of making new API calls.

**Key Benefits:**
- **60-80% cost reduction** on repeat content
- **10-20ms response time** (cached) vs **200-500ms** (API call)
- **Automatic management** with LRU eviction and TTL expiration
- **Zero configuration** required (works out of the box with defaults)

## How It Works

### 1. Embedding Generation Flow

```typescript
// User requests embedding for text
const embedding = await generateEmbeddingVectors(['some text']);

// Cache flow:
// 1. Check cache for 'some text' hash
// 2. If cached: Return immediately (cache hit)
// 3. If not cached: Call OpenAI API (cache miss)
// 4. Store result in cache for next time
```

### 2. Cache Architecture

```
┌─────────────────────────────────────────┐
│         Embedding Request               │
└────────────────┬────────────────────────┘
                 │
                 ▼
     ┌───────────────────────┐
     │  Generate MD5 Hash    │  Hash = MD5(text)
     └──────────┬────────────┘
                │
                ▼
     ┌───────────────────────┐
     │   Check Cache (LRU)   │
     └──────────┬────────────┘
                │
        ┌───────┴────────┐
        │                │
        ▼                ▼
   ┌─────────┐      ┌──────────┐
   │  HIT    │      │   MISS   │
   │ Return  │      │  Call    │
   │ Cached  │      │ OpenAI   │
   │ (10ms)  │      │ (300ms)  │
   └─────────┘      └────┬─────┘
                         │
                         ▼
                  ┌──────────────┐
                  │ Cache Result │
                  │ Update Stats │
                  └──────────────┘
```

### 3. Key Components

**Location:** `lib/embedding-cache.ts`

- **EmbeddingCache Class**: Main cache implementation
  - `get(text)`: Retrieve cached embedding
  - `set(text, embedding)`: Store embedding
  - `getMultiple(texts)`: Batch retrieval
  - `setMultiple(texts, embeddings)`: Batch storage
  - `getStats()`: Cache statistics

- **Cache Entry**:
  ```typescript
  {
    embedding: number[],  // 1536-dim vector
    timestamp: number,     // Creation time
    hits: number          // Access count
  }
  ```

## Configuration

### Environment Variables

Add to `.env.local` or `.env`:

```bash
# Enable/disable cache (default: true)
EMBEDDING_CACHE_ENABLED=true

# Maximum cached entries (default: 1000)
EMBEDDING_CACHE_MAX_SIZE=1000

# Time-to-live in minutes (default: 60)
EMBEDDING_CACHE_TTL_MINUTES=60
```

### Recommended Settings

| Use Case | Max Size | TTL (minutes) | Rationale |
|----------|----------|---------------|-----------|
| **Development** | 500 | 30 | Lower memory usage, faster invalidation |
| **Production (Small)** | 1000 | 60 | Balanced memory/performance |
| **Production (Medium)** | 5000 | 120 | Higher hit rate for larger sites |
| **Production (Large)** | 10000 | 240 | Maximum performance for high-traffic sites |

**Memory Usage Estimate:**
- Each embedding: ~6KB (1536 floats × 4 bytes)
- 1000 entries ≈ 6MB RAM
- 10000 entries ≈ 60MB RAM

### Programmatic Configuration

```typescript
import { embeddingCache } from '@/lib/embedding-cache';

// Get current configuration
const stats = embeddingCache.getStats();
console.log(`Cache: ${stats.size}/${stats.maxSize}, Hit rate: ${stats.hitRate}`);

// Clear cache (useful for testing)
embeddingCache.clear();
```

## Monitoring

### 1. Cache Statistics API

**Endpoint:** `GET /api/admin/embedding-cache-stats`

**Response:**
```json
{
  "success": true,
  "stats": {
    "hits": 150,
    "misses": 50,
    "evictions": 2,
    "size": 998,
    "maxSize": 1000,
    "hitRate": "75.00%",
    "ttlMinutes": 60,
    "enabled": true,
    "costSavings": {
      "total": "$0.0038",
      "perHit": "$0.000025"
    },
    "message": "Cache hit rate: 75.00%"
  }
}
```

### 2. Clear Cache API

**Endpoint:** `POST /api/admin/embedding-cache-stats`

Clears all cached embeddings (useful for testing or forcing refresh).

### 3. Console Logging

The cache automatically logs performance metrics:

```
[Performance] Generating 5/10 embeddings (5 from cache)
[Performance] All 10 embeddings from cache
[EmbeddingCache] Initialized with maxSize=1000, ttl=60 minutes
```

## Expected Performance

### Timing Benchmarks

| Operation | Cache Miss | Cache Hit | Improvement |
|-----------|-----------|-----------|-------------|
| Single embedding | 200-500ms | 10-20ms | **95% faster** |
| Batch (10 chunks) | 1.5-3s | 50-100ms | **95% faster** |
| Batch (50 chunks) | 7-15s | 200-400ms | **97% faster** |

### Cost Savings

**OpenAI Pricing:**
- Model: `text-embedding-3-small`
- Cost: **$0.0001 per 1K tokens**
- Average chunk: ~250 tokens
- **Cost per embedding: ~$0.000025**

**Cache Impact:**

| Scenario | Embeddings | No Cache | With Cache (75% hit) | Savings |
|----------|-----------|----------|---------------------|---------|
| Small scrape | 1,000 | $0.025 | $0.00625 | **$0.019 (75%)** |
| Medium scrape | 10,000 | $0.25 | $0.0625 | **$0.1875 (75%)** |
| Large scrape | 100,000 | $2.50 | $0.625 | **$1.875 (75%)** |
| Re-scrape (same site) | 10,000 | $0.25 | $0.025 | **$0.225 (90%)** |

**Monthly Savings (Example):**
- 5 customers re-scraping weekly
- 10,000 chunks per scrape
- 20 scrapes/month
- Cache hit rate: 70%
- **Monthly savings: $3.50 (70% reduction)**

## Use Cases

### 1. Website Re-scraping

**Scenario:** Customer updates their website and re-scrapes to refresh content.

**Without Cache:**
- Generate 10,000 embeddings
- Cost: $0.25
- Time: ~50 seconds

**With Cache (80% unchanged content):**
- Generate 2,000 new embeddings
- Reuse 8,000 cached embeddings
- Cost: $0.05 (80% savings)
- Time: ~12 seconds (76% faster)

### 2. Duplicate Content Detection

**Scenario:** Multiple pages have identical footer/header content.

**Without Cache:**
- Same text embedded multiple times
- Wasted API calls

**With Cache:**
- Text embedded once
- Subsequent uses are instant
- **100% savings on duplicates**

### 3. Incremental Updates

**Scenario:** Adding new pages to existing site.

**Without Cache:**
- Re-embed entire site
- High cost for small updates

**With Cache:**
- Only new pages generate embeddings
- Existing pages use cache
- **90%+ savings**

## Troubleshooting

### Cache Not Working

**Symptoms:**
- High API costs
- No cache hits in logs
- Stats show 0% hit rate

**Checks:**

1. **Verify cache is enabled:**
   ```bash
   curl http://localhost:3000/api/admin/embedding-cache-stats
   # Check: "enabled": true
   ```

2. **Check environment variables:**
   ```bash
   echo $EMBEDDING_CACHE_ENABLED  # Should be empty or "true"
   # If "false", set to "true" or remove variable
   ```

3. **Verify logs show cache activity:**
   ```
   [Performance] Generating 5/10 embeddings (5 from cache)
   ```

### Low Hit Rate

**Symptoms:**
- Hit rate < 30%
- Few cache hits despite repeat content

**Possible Causes:**

1. **TTL too short:**
   - Solution: Increase `EMBEDDING_CACHE_TTL_MINUTES`
   - Try: 120-240 minutes for production

2. **Max size too small:**
   - Solution: Increase `EMBEDDING_CACHE_MAX_SIZE`
   - Check: Current `size` vs `maxSize` in stats
   - If frequently at max, increase limit

3. **Content is actually unique:**
   - Solution: This is expected behavior
   - Cache helps most with re-scraping

### Memory Issues

**Symptoms:**
- High memory usage
- Cache evictions in stats

**Solutions:**

1. **Reduce max size:**
   ```bash
   EMBEDDING_CACHE_MAX_SIZE=500
   ```

2. **Reduce TTL:**
   ```bash
   EMBEDDING_CACHE_TTL_MINUTES=30
   ```

3. **Monitor evictions:**
   ```bash
   curl http://localhost:3000/api/admin/embedding-cache-stats | jq '.stats.evictions'
   ```

## Cost Analysis

### ROI Calculation

**Assumptions:**
- 10 customers
- 5,000 chunks per customer
- Re-scrape weekly (4x/month)
- 70% cache hit rate

**Monthly Calculations:**

```
Without Cache:
- Total embeddings: 10 × 5,000 × 4 = 200,000
- Cost: 200,000 × $0.000025 = $5.00/month

With Cache:
- Cached (70%): 140,000 (no cost)
- Generated (30%): 60,000
- Cost: 60,000 × $0.000025 = $1.50/month

Savings: $3.50/month (70%)
Annual Savings: $42.00/year
```

**Scaling to 100 customers:**
- Without cache: $50/month
- With cache: $15/month
- **Savings: $35/month ($420/year)**

### Break-Even Analysis

**Implementation cost:** 0 hours (already implemented)
**Maintenance cost:** 0 hours (automatic)
**Break-even:** Immediate (first API call saved)

## Testing

### Unit Tests

Located at: `__tests__/lib/embeddings/cache.test.ts`

Run tests:
```bash
npm test -- __tests__/lib/embeddings/cache.test.ts
```

**Test Coverage:**
- ✅ Basic cache operations (get/set)
- ✅ Cache expiration (TTL)
- ✅ LRU eviction
- ✅ Batch operations
- ✅ Integration with embeddings
- ✅ Cost savings calculation

### Manual Testing

1. **Enable cache:**
   ```bash
   export EMBEDDING_CACHE_ENABLED=true
   npm run dev
   ```

2. **Scrape test site:**
   ```bash
   curl -X POST http://localhost:3000/api/scrape \
     -H "Content-Type: application/json" \
     -d '{"domain":"example.com"}'
   ```

3. **Check stats (should show cache misses):**
   ```bash
   curl http://localhost:3000/api/admin/embedding-cache-stats
   ```

4. **Re-scrape same site:**
   ```bash
   curl -X POST http://localhost:3000/api/scrape \
     -H "Content-Type: application/json" \
     -d '{"domain":"example.com"}'
   ```

5. **Verify cache hits:**
   ```bash
   curl http://localhost:3000/api/admin/embedding-cache-stats
   # Expected: hitRate > 50%
   ```

## Best Practices

### 1. Production Configuration

```bash
# Recommended production settings
EMBEDDING_CACHE_ENABLED=true
EMBEDDING_CACHE_MAX_SIZE=5000
EMBEDDING_CACHE_TTL_MINUTES=120
```

### 2. Monitoring

- Check cache stats weekly
- Monitor hit rate (target: >50%)
- Track cost savings
- Alert if hit rate drops below 30%

### 3. Cache Clearing

Clear cache when:
- Content format changes significantly
- Embedding model changes
- Testing requires fresh embeddings

```bash
curl -X POST http://localhost:3000/api/admin/embedding-cache-stats
```

### 4. Scaling Considerations

**Small sites (<100 pages):**
- Use default settings (1000 max, 60 min TTL)
- Expected hit rate: 40-60%

**Medium sites (100-1000 pages):**
- Increase max size to 5000
- Increase TTL to 120 minutes
- Expected hit rate: 60-75%

**Large sites (>1000 pages):**
- Increase max size to 10000
- Increase TTL to 240 minutes
- Expected hit rate: 70-85%

---

## Summary

The embedding cache provides:
- ✅ **60-80% cost reduction** on repeat content
- ✅ **95%+ faster** response times on cache hits
- ✅ **Zero configuration** required (works out of the box)
- ✅ **Automatic management** (LRU eviction, TTL expiration)
- ✅ **Production-ready** monitoring and statistics

**Next Steps:**
1. Verify cache is enabled: `GET /api/admin/embedding-cache-stats`
2. Monitor hit rate after re-scraping
3. Adjust configuration based on usage patterns
4. Track cost savings over time
