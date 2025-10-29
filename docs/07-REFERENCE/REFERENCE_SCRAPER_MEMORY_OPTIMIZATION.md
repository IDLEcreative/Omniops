# Scraper Memory Optimization Update

**Type:** Reference
**Status:** Active
**Last Updated:** 2025-10-29
**Verified For:** v0.1.0
**Estimated Read Time:** 12 minutes

## Purpose
This document describes the memory optimization improvements made to the ContentDeduplicator class to prevent memory leaks during large-scale web scraping operations.

## Quick Links
- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Solution Implementation](#solution-implementation)
- [Performance Impact](#performance-impact)
- [Configuration Tuning](#configuration-tuning)

## Keywords
conclusion, configuration, future, guide, impact, implementation, improvements, memory, migration, optimization

---


## Overview
This document describes the memory optimization improvements made to the ContentDeduplicator class to prevent memory leaks during large-scale web scraping operations.

## Problem Statement

### Issue Discovered
During production scraping of Thompson's eParts website (4,432 pages), the scraper experienced severe performance degradation after processing approximately 3,800 pages:
- Memory usage reached 93-95% of system capacity
- Concurrency automatically reduced from 12 workers to 2 workers
- Processing speed dropped from ~88 pages/minute to ~10 pages/minute
- System entered critical memory pressure state

### Root Cause Analysis
The ContentDeduplicator class was storing all content hashes indefinitely in memory:
- `minHashCache: Map<string, MinHash>` - No size limits, grew unbounded
- `storage.commonElements: Map<string, ContentHash>` - Accumulated all unique content forever
- `storage.references: Map<string, string[]>` - Never cleaned up orphaned references
- No automatic cleanup or eviction strategy
- Memory consumption grew linearly with pages processed

## Solution Implementation

### 1. LRU Cache Implementation
Created a custom Least Recently Used (LRU) cache class with automatic eviction:

```typescript
class LRUCache<K, V> {
  private cache: Map<K, V> = new Map();
  private maxSize: number;
  private accessOrder: Map<K, number> = new Map();
  private accessCounter: number = 0;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  // Automatically evicts least recently used items when cache is full
  private evictLeastRecentlyUsed(): void {
    // Finds and removes the oldest accessed entry
  }
}
```

**Key Features:**
- Configurable maximum size
- Tracks access order for all entries
- Automatically evicts LRU items when capacity is reached
- O(1) get/set operations with O(n) eviction (rare)

### 2. Memory-Bounded Configuration
Introduced strict limits for memory-consuming data structures:

```typescript
export class ContentDeduplicator {
  private minHashCache: LRUCache<string, MinHash>;
  private readonly MAX_MINHASH_CACHE = 1000;     // Was: unlimited
  private readonly MAX_COMMON_ELEMENTS = 2000;   // Was: unlimited
  private readonly CLEANUP_INTERVAL = 500;       // Cleanup every 500 pages
  
  constructor() {
    this.minHashCache = new LRUCache<string, MinHash>(this.MAX_MINHASH_CACHE);
  }
}
```

### 3. Automatic Memory Cleanup
Implemented periodic cleanup that runs every 500 pages processed:

```typescript
private async performMemoryCleanup(): Promise<void> {
  // 1. Trim commonElements Map if too large
  if (this.storage.commonElements.size > this.MAX_COMMON_ELEMENTS) {
    // Keep only the 80% most frequently used entries
    const sortedElements = Array.from(this.storage.commonElements.entries())
      .sort((a, b) => b[1].frequency - a[1].frequency)
      .slice(0, Math.floor(this.MAX_COMMON_ELEMENTS * 0.8));
  }
  
  // 2. Clean up rarely accessed unique content
  // 3. Remove orphaned references
  // 4. Request garbage collection
  if (global.gc) {
    global.gc();
  }
}
```

### 4. Enhanced Monitoring
Added memory usage tracking to storage statistics:

```typescript
getStorageStats(): {
  commonElements: number;
  uniqueContent: number;
  references: number;
  patterns: number;
  cacheSize: number;
  processedPages: number;      // NEW: Track pages processed
  memoryUsage: NodeJS.MemoryUsage;  // NEW: Real-time memory stats
}
```

## Performance Impact

### Before Optimization
- **Pages 1-3,800**: Fast processing (~88 pages/minute)
- **Pages 3,800+**: Severe slowdown (~10 pages/minute)
- **Memory Usage**: Unbounded growth, reaching system limits
- **Worker Concurrency**: Degraded from 12 to 2 workers

### After Optimization
- **Consistent Performance**: Maintains speed throughout entire scrape
- **Memory Usage**: Bounded to configured limits
- **Worker Concurrency**: Stable at optimal levels
- **Automatic Cleanup**: Prevents accumulation of stale data

## Configuration Tuning

The following constants can be adjusted based on available system memory:

| Parameter | Default | Description | Tuning Guidance |
|-----------|---------|-------------|-----------------|
| `MAX_MINHASH_CACHE` | 1000 | Maximum MinHash entries | Increase for better deduplication accuracy |
| `MAX_COMMON_ELEMENTS` | 2000 | Maximum common elements stored | Increase for sites with more unique patterns |
| `CLEANUP_INTERVAL` | 500 | Pages between cleanup runs | Decrease for more aggressive memory management |

### Memory Usage Estimation
- MinHash entry: ~2KB each
- Common element: ~1-5KB each (depends on content size)
- Reference entry: ~100 bytes each

**Example Memory Footprint:**
- 1000 MinHash entries: ~2MB
- 2000 Common elements: ~6MB
- Total overhead: ~8-10MB (vs unlimited before)

## Migration Guide

### For Existing Deployments
1. Update `lib/content-deduplicator.ts` with the new implementation
2. No database changes required
3. No configuration changes needed (uses sensible defaults)
4. Restart scraper workers to apply changes

### For New Deployments
The optimization is automatically included. No special setup required.

### Monitoring Memory Performance
```bash
# Check memory usage during scraping
npm run scraper:crawl -- <url> --force

# Monitor in logs
[ContentDeduplicator] Performing memory cleanup at 500 pages processed
[ContentDeduplicator] Trimmed commonElements from 2500 to 1600
[ContentDeduplicator] Cleaned 200 items from uniqueContent
[ContentDeduplicator] Requested garbage collection
```

## Testing Recommendations

### Load Testing
1. **Small Site Test** (< 500 pages)
   - Verify normal operation without cleanup triggers
   - Confirm deduplication accuracy maintained

2. **Large Site Test** (> 5000 pages)
   - Monitor memory usage stays bounded
   - Verify cleanup runs at intervals
   - Check performance remains consistent

3. **Memory Pressure Test**
   - Run with reduced memory limits
   - Verify graceful degradation
   - Confirm no crashes or data loss

### Performance Metrics to Monitor
- Pages processed per minute
- Memory usage percentage
- Worker concurrency levels
- Deduplication effectiveness
- Cleanup frequency and duration

## Rollback Plan

If issues arise, revert to previous implementation:
1. Restore original `lib/content-deduplicator.ts`
2. Restart scraper workers
3. Monitor for original memory leak behavior

## Future Improvements

### Potential Enhancements
1. **Redis-backed LRU Cache**: Move cache to Redis for distributed scraping
2. **Adaptive Limits**: Dynamically adjust limits based on available memory
3. **Compression**: Compress stored content to reduce memory footprint
4. **Incremental Cleanup**: Spread cleanup work across multiple intervals
5. **Memory Profiling**: Add detailed memory usage breakdowns

### Planned Optimizations
- Implement bloom filters for faster duplicate detection
- Add configurable cleanup strategies (LRU, LFU, TTL)
- Create memory usage dashboards for monitoring
- Implement cache warming for frequently accessed content

## Troubleshooting

### Common Issues and Solutions

**Issue: Cleanup running too frequently**
- Solution: Increase `CLEANUP_INTERVAL` to 1000 or higher

**Issue: Still hitting memory limits**
- Solution: Reduce `MAX_MINHASH_CACHE` and `MAX_COMMON_ELEMENTS`

**Issue: Poor deduplication after optimization**
- Solution: Increase cache sizes if memory permits

**Issue: Cleanup taking too long**
- Solution: Reduce cleanup scope or increase interval

## Conclusion

This memory optimization update ensures the scraper can handle large-scale crawling operations without performance degradation. The implementation maintains deduplication effectiveness while preventing unbounded memory growth, resulting in consistent performance regardless of site size.

The solution has been tested in production with a 4,432-page website and successfully prevents the memory leak that previously caused severe slowdowns after ~3,800 pages.
