# Turbo Mode vs Force Rescrape - Understanding the Difference

## Overview

These are **two completely separate features** with distinct purposes in the scraping system:

1. **Turbo Mode** - Performance optimization for regular/scheduled scrapes
2. **Force Rescrape** - Complete override for fresh data regeneration

## 🚀 Turbo Mode

**Purpose:** Speed up scraping for regular/scheduled operations while maintaining data integrity

### What it does:
- **Higher concurrency** - 5-12 concurrent pages (vs 3-8 in normal mode)
- **Request blocking** - Blocks images, CSS, fonts, analytics to save bandwidth
- **Smart caching** - KEEPS deduplication to avoid re-processing unchanged content
- **Optimized for speed** - Ideal for scheduled scrapes that run frequently

### Code locations:
```javascript
// lib/scraper-worker.js - Line 915-916
const concurrencyManager = new ConcurrencyManager(
  turboMode === 'true' ? 5 : 3,  // Initial concurrency
  turboMode === 'true' ? 12 : 8   // Max concurrency
);

// lib/scraper-api.js - Line 377-385
if (turboMode) {
  // Blocks unnecessary resources (images, CSS, analytics)
  const blockedTypes = ['image', 'media', 'font', 'stylesheet'];
  const blockedDomains = ['googletagmanager.com', 'google-analytics.com'];
}
```

### When to use:
- ✅ Regular scheduled scrapes (hourly, daily, weekly)
- ✅ Large-scale crawling where speed matters
- ✅ When you want to skip unchanged content
- ✅ Production scraping with deduplication

## 🔄 Force Rescrape

**Purpose:** Completely regenerate all data, embeddings, and metadata from scratch

### What it does:
- **Bypasses all caching** - Ignores existing scraped_pages records
- **Skips deduplication** - Processes ALL content, even if seen before
- **Deletes old embeddings** - Removes and regenerates all vectors
- **Full metadata extraction** - Re-extracts all product data
- **Content enrichment** - Applies ContentEnricher to all content

### Code locations:
```javascript
// lib/scraper-worker.js - Line 806-809
if (FORCE_RESCRAPE) {
  console.log(`Force rescrape enabled - skipping deduplication`);
  return nonBoilerplateChunks;  // Skip deduplication
}

// lib/scraper-worker.js - Line 964-970
if (!FORCE_RESCRAPE) {
  // Check cache for existing page
  const { data } = await supabase
    .from('scraped_pages')
    .select('scraped_at, metadata')
}

// lib/scraper-worker.js - Line 1170
if (!existingEmbeddings || existingEmbeddings.length === 0 || FORCE_RESCRAPE) {
  // Regenerate embeddings with enriched content
}
```

### When to use:
- ✅ After updating extraction logic (metadata, enrichment)
- ✅ When product data structure has changed
- ✅ To fix corrupted or incorrect embeddings
- ✅ Testing new features that affect data extraction
- ❌ NOT for regular scheduled scrapes (wastes resources)

## Key Differences

| Feature | Turbo Mode | Force Rescrape |
|---------|------------|----------------|
| **Purpose** | Speed optimization | Complete regeneration |
| **Deduplication** | ✅ Active (skips unchanged) | ❌ Disabled (processes all) |
| **Cache checking** | ✅ Uses cached pages | ❌ Ignores cache |
| **Embeddings** | Only new content | Deletes & regenerates all |
| **Resource blocking** | ✅ Blocks images/CSS | N/A (orthogonal feature) |
| **Concurrency** | Higher (5-12) | Normal (depends on turbo) |
| **Use case** | Scheduled scrapes | Data structure updates |
| **Resource usage** | Efficient | Intensive |

## How They Work Together

These features can be used **independently or together**:

### 1. Normal Scrape (neither enabled)
```bash
# Standard scraping with deduplication
curl -X POST http://localhost:3000/api/scrape \
  -d '{"url": "...", "crawl": true}'
```
- Standard concurrency (3-8)
- Deduplication active
- Uses cached content

### 2. Turbo Scrape (scheduled/regular)
```bash
# Fast scraping for regular updates
curl -X POST http://localhost:3000/api/scrape \
  -d '{"url": "...", "crawl": true, "turbo": true}'
```
- Higher concurrency (5-12)
- Resource blocking for speed
- **STILL uses deduplication** (efficient)

### 3. Force Rescrape (data regeneration)
```bash
# Complete regeneration (manual trigger)
FORCE_RESCRAPE=true node lib/scraper-worker.js
```
- Bypasses all caching
- Regenerates all embeddings
- Processes everything fresh

### 4. Turbo + Force (fast regeneration)
```bash
# Fast complete regeneration
FORCE_RESCRAPE=true TURBO=true node lib/scraper-worker.js
```
- High speed regeneration
- No deduplication
- Resource blocking + fresh data

## Implementation Details

### Current API Behavior
- `turbo: true` in API → Sets turbo mode only
- `FORCE_RESCRAPE=true` env var → Sets force rescrape
- These are **completely independent** flags

### Why Keep Them Separate?

1. **Different use cases** - Scheduled vs manual regeneration
2. **Resource management** - Force rescrape is expensive
3. **Data integrity** - Scheduled scrapes shouldn't override everything
4. **Flexibility** - Can combine as needed

## Best Practices

### For Scheduled Scrapes:
```javascript
// Use turbo mode WITHOUT force rescrape
{
  "url": "https://example.com",
  "crawl": true,
  "turbo": true,  // Speed optimization
  "max_pages": 100
}
```

### For Metadata Updates:
```bash
# Use force rescrape when you've updated extraction logic
FORCE_RESCRAPE=true node lib/scraper-worker.js
```

### For Testing:
```bash
# Can combine both for fast testing
FORCE_RESCRAPE=true TURBO=true node lib/scraper-worker.js
```

## Summary

- **Turbo Mode** = Speed optimization for regular scraping (keeps deduplication)
- **Force Rescrape** = Complete override for fresh regeneration (bypasses deduplication)
- They serve **different purposes** and should remain separate
- Turbo is for **efficiency**, Force is for **correctness**
- Can be combined when needed but shouldn't be automatically linked