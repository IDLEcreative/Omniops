**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# Web Scraping Utilities

**Type:** Reference
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Dependencies:** [Crawler Configuration](/home/user/Omniops/lib/crawler-config.ts), [Content Extraction](/home/user/Omniops/lib/content-extractor.ts), [Scraping API](/home/user/Omniops/app/api/scrape/route.ts), [Main Scripts README](/home/user/Omniops/scripts/README.md)
**Estimated Read Time:** 5 minutes

## Purpose

Diagnostic and testing tools for web scraping functionality using Crawlee and Playwright to extract content from websites with diagnostic capabilities and full scraping examples.

## Quick Links

- [Main Scripts README](/home/user/Omniops/scripts/README.md)
- [Crawler Configuration](/home/user/Omniops/lib/crawler-config.ts)
- [Content Extraction](/home/user/Omniops/lib/content-extractor.ts)
- [Scraping API](/home/user/Omniops/app/api/scrape/route.ts)

## Keywords

web scraping, Crawlee, Playwright, content extraction, diagnostics, Mozilla Readability, embeddings, browser automation

## Overview

This directory contains diagnostic tools and examples for the web scraping system, which uses Crawlee and Playwright to extract content from websites.

## Available Tools

### diagnose-scraper.js
**Purpose:** Diagnose web scraping issues and troubleshoot failures

**Usage:**
```bash
node scripts/scrapers/diagnose-scraper.js
```

**What it diagnoses:**
- Scraper configuration issues
- Browser launch problems
- Content extraction failures
- Network connectivity issues
- Rate limiting problems
- Memory usage patterns

**Diagnostic checks:**
```
Scraper Diagnostic

Environment:
  ✓ Playwright installed
  ✓ Chromium browser available
  ✓ Redis connection active
  ✓ Memory available: 4.2GB

Configuration:
  ✓ Crawler config valid
  ✓ Request queue initialized
  ✓ Proxy settings (if configured)

Test Scrape:
  ✓ Can launch browser (234ms)
  ✓ Can navigate to URL (567ms)
  ✓ Can extract content (123ms)
  ✓ Can save to database (45ms)

Overall: HEALTHY
```

**Common issues detected:**
- Browser launch failures
- Timeout errors
- Content extraction regex issues
- Database save failures
- Memory leaks

---

### scrape-thompsons-full.mjs
**Purpose:** Full website scraping example (using Thompson's as example customer)

**Usage:**
```bash
node scripts/scrapers/scrape-thompsons-full.mjs
```

**What it does:**
- Demonstrates full website scraping workflow
- Scrapes all pages from specified domain
- Extracts content using Mozilla Readability
- Generates embeddings for vector search
- Saves to database with proper relationships

**Features:**
- Respects robots.txt
- Implements rate limiting
- Handles pagination
- Extracts metadata (title, description, etc.)
- Cleans and formats content

**⚠️ Note:** This is an example script. Adapt for other customers by changing the domain.

**Configuration:**
```javascript
const config = {
  domain: 'example.com',
  maxPages: 100,          // Limit pages to scrape
  maxDepth: 3,            // Max link depth to follow
  requestsPerMinute: 60,  // Rate limit
  timeout: 30000,         // 30s timeout per page
};
```

**Output:**
```
Full Website Scrape

Domain: example.com
Started: 2025-10-30 10:00:00

Progress:
  Pages found: 145
  Pages scraped: 100/100 (100%)
  Pages failed: 0
  Duration: 5m 23s

Content extracted:
  Total text: 2.4MB
  Average per page: 24KB
  Embeddings generated: 100

Saved to database:
  ✓ 100 pages
  ✓ 100 embeddings
  ✓ Metadata indexed

Complete!
```

---

## Scraping Architecture

### How It Works

1. **Crawler Setup:**
   - Uses Crawlee with Playwright
   - Configures browser options
   - Sets up request queue

2. **Content Extraction:**
   - Uses Mozilla Readability for main content
   - Extracts metadata (title, description)
   - Cleans HTML and removes boilerplate

3. **Embedding Generation:**
   - Splits content into chunks
   - Generates vector embeddings
   - Stores in database with metadata

4. **Job Queue:**
   - Redis-backed background jobs
   - Retry logic for failures
   - Progress tracking

### Key Components

**Crawler Configuration:**
- `lib/crawler-config.ts` - Main crawler setup
- `lib/content-extractor.ts` - Content extraction logic
- `lib/embeddings.ts` - Embedding generation

**API Endpoints:**
- `app/api/scrape/route.ts` - Trigger scraping
- `app/api/scrape-jobs/route.ts` - Job management
- `app/api/scrape-jobs/[id]/route.ts` - Job status

## Common Workflows

### Diagnosing Scraping Issues

```bash
# 1. Run diagnostic
node scripts/scrapers/diagnose-scraper.js

# 2. Check scraping jobs
npx tsx scripts/analysis/investigate_scraping.js

# 3. Review detailed stats
npx tsx scripts/analysis/investigate_scraping_detailed.js

# 4. Check Redis queue
docker exec customer-service-redis redis-cli KEYS "*scrape*"
```

### Testing Full Scrape

```bash
# 1. Clean existing data (optional)
npx tsx scripts/database/cleanup-scraped-data.ts --domain=example.com

# 2. Run full scrape
node scripts/scrapers/scrape-thompsons-full.mjs

# 3. Verify results
npx tsx scripts/analysis/investigate_scraping_detailed.js

# 4. Check embeddings
node scripts/utilities/check-embeddings.js
```

### Troubleshooting Failed Scrapes

```bash
# 1. Diagnose issue
node scripts/scrapers/diagnose-scraper.js

# 2. Check browser
# Ensure Chromium is installed
npx playwright install chromium

# 3. Check memory
# Ensure sufficient memory available

# 4. Retry scrape
# Via API or re-run script
```

## Performance Considerations

### Memory Usage

Scraping is memory-intensive:
- **Minimum:** 2GB RAM
- **Recommended:** 4GB+ RAM
- **Large sites:** 8GB+ RAM

Monitor memory:
```bash
# During scraping
docker stats customer-service-redis
top -o MEM  # macOS
htop  # Linux
```

### Rate Limiting

Respect target servers:
```javascript
const config = {
  requestsPerMinute: 60,  // Default: 60 req/min
  maxConcurrency: 5,      // Parallel requests
  delayBetweenRequests: 1000,  // 1s delay
};
```

### Optimization Tips

1. **Limit depth** - Don't scrape entire internet
2. **Use selectors** - Target specific content areas
3. **Batch processing** - Process multiple pages efficiently
4. **Cache results** - Don't re-scrape unchanged pages
5. **Clean up** - Remove old scrape data periodically

## Prerequisites

```bash
# Install Playwright browsers
npx playwright install

# Ensure Redis is running
docker ps | grep redis

# Environment variables
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
REDIS_URL=redis://localhost:6379
```

## Troubleshooting

### "Browser launch failed"
```bash
# Install Chromium
npx playwright install chromium

# Check dependencies
npx playwright install-deps
```

### "Scraping timeout"
```bash
# Increase timeout in config
const config = {
  timeout: 60000,  // 60s
};

# Check network connectivity
ping example.com
```

### "Out of memory"
```bash
# Reduce concurrency
const config = {
  maxConcurrency: 1,  # One at a time
};

# Increase Docker memory allocation
# Docker Desktop → Settings → Resources → Memory
```

### "Content not extracting"
```bash
# Check if Readability can parse page
# Try different content extraction strategy

# Review extraction logic
# In: lib/content-extractor.ts
```

## Related Scripts

- **Analysis:** `scripts/analysis/investigate_scraping.js`
- **Analysis:** `scripts/analysis/investigate_scraping_detailed.js`
- **Monitoring:** `scripts/monitoring/monitor-embeddings-health.ts`
- **Database:** `scripts/database/cleanup-scraped-data.ts`

## Related Documentation

- [Crawler Configuration](/home/user/Omniops/lib/crawler-config.ts)
- [Content Extraction](/home/user/Omniops/lib/content-extractor.ts)
- [Scraping API](/home/user/Omniops/app/api/scrape/route.ts)
- [Main Scripts README](/home/user/Omniops/scripts/README.md)
