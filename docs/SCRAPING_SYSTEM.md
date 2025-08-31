# Web Scraping System Documentation

## Overview

The Omniops scraping system is a high-performance, production-ready web scraper built with Playwright and Crawlee. It features intelligent content extraction, vector embeddings for semantic search, and adaptive performance optimization.

## Architecture

### Core Components

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│   API Routes    │────▶│ Redis Queue  │────▶│ Worker Process  │
│  /api/scrape/*  │     │   Job Mgmt   │     │ scraper-worker  │
└─────────────────┘     └──────────────┘     └─────────────────┘
                                                      │
                                                      ▼
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│    Supabase     │◀────│  Embeddings  │◀────│Content Extractor│
│   PostgreSQL    │     │  OpenAI API  │     │   Readability   │
└─────────────────┘     └──────────────┘     └─────────────────┘
```

### Key Files

- **`lib/scraper-api.ts`** - Main API interface for scraping operations
- **`lib/scraper-worker.js`** - Background worker process for async scraping
- **`lib/crawler-config.ts`** - Crawler configuration and presets
- **`lib/content-extractor.ts`** - Content extraction using Mozilla Readability
- **`lib/sitemap-parser.ts`** - Sitemap parsing and discovery
- **`lib/embedding-deduplicator.js`** - Global deduplication system
- **`app/api/scrape/route.ts`** - API endpoint for triggering scrapes

## Features

### 1. Smart Scraping

#### Sitemap Detection
- Automatically discovers and parses sitemaps
- Handles sitemap indexes with multiple child sitemaps
- Falls back to crawling if no sitemap found

```typescript
// Automatic sitemap discovery
const urls = await discoverSitemapUrls(domain);
// Returns all URLs from sitemap.xml, sitemap_index.xml, etc.
```

#### Incremental Updates
- Skips pages with existing embeddings
- Checks content freshness (24-hour cache)
- Only processes changed content

```javascript
// Skip if recently scraped
if (existingPage && Date.now() - existingPage.last_scraped < 24*60*60*1000) {
  return; // Skip this page
}
```

### 2. Performance Optimizations

#### Adaptive Concurrency (NEW)
Dynamic worker scaling based on system resources:

```javascript
class ConcurrencyManager {
  constructor() {
    this.minConcurrency = 3;
    this.maxConcurrency = 12;
    this.currentConcurrency = 3;
  }
  
  adjust() {
    const memUsage = process.memoryUsage().heapUsed / 1024 / 1024;
    
    if (memUsage < 1000 && successRate > 0.9) {
      this.currentConcurrency = Math.min(this.currentConcurrency + 2, this.maxConcurrency);
    } else if (memUsage > 1500 || successRate < 0.7) {
      this.currentConcurrency = Math.max(this.currentConcurrency - 1, this.minConcurrency);
    }
  }
}
```

#### Batch Embedding Processing (NEW)
Processes embeddings in batches of 50:

```javascript
// Before: 1 embedding at a time
for (const chunk of chunks) {
  await generateEmbedding(chunk);
}

// After: 50 embeddings per API call
const batches = chunkArray(chunks, 50);
for (const batch of batches) {
  await generateEmbeddings(batch); // Single API call
}
```

#### Resource Blocking (NEW)
Blocks unnecessary resources to improve speed:

```javascript
const blockedResources = [
  'image', 'media', 'font', 'stylesheet',
  'google-analytics.com', 'facebook.com', 'doubleclick.net'
];

page.route('**/*', (route) => {
  if (blockedResources.some(r => route.request().url().includes(r))) {
    route.abort();
  } else {
    route.continue();
  }
});
```

### 3. Deduplication System

#### Three-Layer Deduplication
1. **Content Filtering** - Removes common boilerplate
2. **Chunk Hashing** - SHA-256 hashes for exact matching
3. **Global Cache** - Redis-backed cross-session deduplication

```javascript
const deduplicator = new EmbeddingDeduplicator();

// Check if content already exists
if (await deduplicator.isDuplicate(chunk)) {
  return null; // Skip duplicate
}

// Add to cache if new
await deduplicator.addToCache(chunk, hash);
```

### 4. Memory Management

#### Automatic Garbage Collection
```javascript
// Force GC every 100 pages
if (processedCount % 100 === 0 && global.gc) {
  global.gc();
}
```

#### Memory-Based Throttling
```javascript
if (memoryUsage > threshold) {
  await crawler.autoscaledPool.setDesiredConcurrency(2);
  console.log('Memory threshold reached, reducing concurrency');
}
```

## Configuration

### Scraping Presets

| Preset | Concurrency | Timeout | Use Case |
|--------|------------|---------|----------|
| **fast** | 12 | 20s | High-performance servers |
| **balanced** | 5 | 30s | Default, most sites |
| **respectful** | 2 | 45s | Rate-limited sites |
| **memory-efficient** | 3 | 30s | Large scrapes, low memory |

### Environment Variables

```bash
# Required
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
REDIS_URL=redis://localhost:6379

# Optional
SCRAPER_MAX_PAGES=-1  # -1 for unlimited
SCRAPER_CONCURRENCY=5
SCRAPER_TIMEOUT=30000
```

## API Usage

### Start a Scrape

```bash
POST /api/scrape
{
  "domain": "example.com",
  "options": {
    "maxPages": -1,        # -1 for unlimited
    "preset": "balanced",  # or "fast", "respectful"
    "useSitemap": true,
    "incremental": true
  }
}
```

### Check Status

```bash
GET /api/scrape/status?jobId=crawl_1234567890_abc
```

### Response
```json
{
  "jobId": "crawl_1234567890_abc",
  "status": "processing",
  "progress": {
    "processed": 2791,
    "total": 4439,
    "percentage": 63
  },
  "metrics": {
    "pagesPerSecond": 1.6,
    "successRate": 100,
    "memoryUsage": 580
  }
}
```

## Performance Metrics

### Current Performance (v1)
- **Speed**: ~95 pages/minute
- **Memory**: ~580MB for 5 workers
- **API Calls**: 1 per text chunk
- **Full Site (4,439 pages)**: ~46 minutes

### Optimized Performance (v2)
- **Speed**: ~150-200 pages/minute
- **Memory**: ~400-1000MB (adaptive)
- **API Calls**: 1 per 50 chunks (98% reduction)
- **Full Site (4,439 pages)**: ~25-30 minutes

### Performance Gains
- **50-100% faster** page processing
- **40-60% less** memory per page
- **98% fewer** API calls
- **30-40% reduction** in total scraping time

## Monitoring

### Key Metrics to Track

1. **Pages per second** - Target: >2.5
2. **Memory usage** - Keep below 1.5GB
3. **Success rate** - Should be >95%
4. **API costs** - Monitor embedding calls

### Debug Commands

```bash
# Check running scraper
ps aux | grep scraper-worker

# Monitor memory
redis-cli info memory

# View logs
tail -f /tmp/scraper-*.log

# Check job status
redis-cli get "scrape:jobId"
```

## Troubleshooting

### Common Issues

#### 1. Memory Overflow
**Symptom**: Server restarts with "approaching memory threshold"
**Solution**: Reduce concurrency or use memory-efficient preset

#### 2. Slow Performance
**Symptom**: <50 pages/minute
**Solution**: Check network, increase concurrency, use fast preset

#### 3. High API Costs
**Symptom**: Too many embedding API calls
**Solution**: Ensure batch processing is enabled, check deduplication

#### 4. Duplicate Content
**Symptom**: Same content indexed multiple times
**Solution**: Run deduplication script, check cache configuration

### Maintenance Scripts

```bash
# Remove duplicate embeddings
npm run deduplicate

# Clear scraping cache
redis-cli del "embeddings:*"

# Reset scraping state
npm run reset-scraper
```

## Best Practices

### 1. Pre-Scraping Checklist
- [ ] Check robots.txt compliance
- [ ] Verify sitemap availability
- [ ] Estimate total pages
- [ ] Choose appropriate preset
- [ ] Monitor initial performance

### 2. During Scraping
- Monitor memory usage
- Watch for rate limiting
- Check success rate
- Verify content quality

### 3. Post-Scraping
- Run deduplication check
- Verify embedding count
- Check for missing pages
- Analyze performance metrics

## Future Enhancements

### Planned Features
1. **Distributed Scraping** - Multiple worker nodes
2. **Smart Scheduling** - Automatic re-crawling based on change frequency
3. **Content Diffing** - Only embed changed portions
4. **Visual Scraping** - Screenshot capture for visual content
5. **API Rate Limiting** - Per-domain rate limit configuration

### Optimization Opportunities
1. **HTTP/2 Connection Pooling**
2. **Browser Context Reuse**
3. **Predictive Resource Loading**
4. **Edge Computing Integration**
5. **WebAssembly Content Processing**

## Appendix

### Scraping Architecture Decision Records

#### ADR-001: Playwright over Puppeteer
**Decision**: Use Playwright for browser automation
**Rationale**: Better performance, multi-browser support, superior API

#### ADR-002: Redis for Job Queue
**Decision**: Use Redis for job management
**Rationale**: Simple, fast, persistent, supports complex data structures

#### ADR-003: Batch Embeddings
**Decision**: Process embeddings in batches of 50
**Rationale**: 98% reduction in API calls, significant cost savings

#### ADR-004: Adaptive Concurrency
**Decision**: Dynamic worker scaling based on resources
**Rationale**: Prevents OOM while maximizing throughput

---

*Last Updated: January 2025*
*Version: 2.0 (Post-Optimization)*