# Web Scraping Improvements

## Overview

The web scraping system has been significantly upgraded with the following improvements:

### 1. **Redis-Based Job Management**
- Crawl jobs are now stored in Redis instead of memory
- Prevents memory leaks during large crawls
- Jobs persist across server restarts
- Automatic cleanup of old jobs

### 2. **Advanced Content Extraction**
- Uses Mozilla's Readability algorithm for accurate content extraction
- Extracts structured metadata (author, dates, images, links)
- Better handling of modern web pages
- Calculates reading time and word count

### 3. **Content Deduplication**
- SHA-256 content hashing to detect duplicate pages
- Skips already-crawled content automatically
- Saves storage and processing time

### 4. **Smart Rate Limiting**
- Per-domain rate limiting (20 requests/minute default)
- Adaptive delays based on server response times
- Respects server load to avoid being blocked

### 5. **Improved Error Handling**
- Tracks failed URLs with error reasons
- Partial success handling
- Detailed crawl statistics

## Setup

### 1. Start Redis (Development)
```bash
docker-compose up -d
```

### 2. Redis Configuration
Add to your `.env` file:
```
REDIS_URL=redis://localhost:6379
```

For production, use a managed Redis service like:
- Redis Cloud
- AWS ElastiCache
- Upstash

### 3. Usage

**Single Page Scraping:**
```json
POST /api/scrape
{
  "url": "https://example.com/page",
  "crawl": false
}
```

**Full Site Crawling:**
```json
POST /api/scrape
{
  "url": "https://example.com",
  "crawl": true,
  "max_pages": 100  // or -1 for unlimited
}
```

**Check Crawl Status:**
```json
GET /api/scrape?job_id=crawl_xxx_yyy
```

## Key Features

### Content Quality
- Removes navigation, headers, footers, ads
- Preserves images with alt text
- Converts to clean Markdown
- Validates minimum content length

### Performance
- 5 concurrent page requests
- Intelligent link discovery
- Skips non-content files (PDFs, images, etc.)
- Caches extracted content

### Monitoring
The crawl status includes:
- Total pages found
- Pages completed
- Pages skipped (duplicates)
- Failed pages with errors
- Progress percentage
- Crawl duration

## Architecture

```
User Request
    ↓
API Route (/api/scrape)
    ↓
Crawlee Scraper (crawlee-scraper-v2.ts)
    ├─→ Redis (Job Storage)
    ├─→ Content Extractor (Readability)
    └─→ Supabase (Final Storage)
```

## Benefits Over Firecrawl

1. **Cost**: Free (self-hosted) vs $0.01/page
2. **Control**: Full customization of extraction logic
3. **Performance**: Adaptive rate limiting and caching
4. **Quality**: Better content extraction with Readability
5. **Reliability**: Redis-backed job persistence

## Troubleshooting

### Redis Connection Issues
```bash
# Check if Redis is running
docker ps | grep redis

# Test Redis connection
redis-cli ping
```

### Memory Issues
- Jobs are automatically cleaned up after 24 hours
- Results are stored for 24 hours
- Content hashes expire after 24 hours

### Rate Limiting
- Default: 20 requests/minute per domain
- Adjust in `crawlee-scraper-v2.ts` if needed
- Check Redis for rate limit keys: `rate:*`