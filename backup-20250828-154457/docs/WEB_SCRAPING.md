# Web Scraping Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Setup Guide](#setup-guide)
4. [API Reference](#api-reference)
5. [Configuration](#configuration)
6. [How It Works](#how-it-works)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)
9. [Performance Optimization](#performance-optimization)

## Overview

The web scraping system allows the AI customer service agent to learn from website content by crawling and indexing web pages. It uses advanced content extraction, deduplication, and intelligent crawling to build a knowledge base.

### Key Features
- 🚀 **Full-site crawling** with configurable limits
- 📄 **Smart content extraction** using Mozilla Readability
- 🔍 **Semantic search** with OpenAI embeddings
- 🚫 **Duplicate detection** to save resources
- ⚡ **Rate limiting** to respect server limits
- 💾 **Redis-backed** job management
- 🎯 **Source attribution** for AI responses

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Web Browser   │────▶│   Next.js API   │────▶│ Crawlee Scraper │
└─────────────────┘     └────────┬────────┘     └────────┬────────┘
                                 │                         │
                                 ▼                         ▼
                        ┌─────────────────┐       ┌─────────────────┐
                        │     Redis       │       │   Playwright    │
                        │  (Job Storage)  │       │   (Browser)     │
                        └─────────────────┘       └────────┬────────┘
                                                           │
                        ┌─────────────────┐                ▼
                        │    Supabase     │       ┌─────────────────┐
                        │   (Database)    │◀──────│Content Extractor│
                        └────────┬────────┘       │  (Readability)  │
                                 │                └─────────────────┘
                                 ▼
                        ┌─────────────────┐
                        │  OpenAI API     │
                        │  (Embeddings)   │
                        └─────────────────┘
```

## Setup Guide

### Prerequisites
- Node.js 18+
- Redis (local or cloud)
- Supabase account
- OpenAI API key

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file:

```env
# Database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Redis (optional - defaults to localhost)
REDIS_URL=redis://localhost:6379

# OpenAI
OPENAI_API_KEY=sk-your_api_key

# Optional: Production Redis examples
# REDIS_URL=redis://default:password@redis-12345.c123.us-east-1-2.ec2.cloud.redislabs.com:12345
# REDIS_URL=redis://username:password@redis.railway.app:6379
```

### 3. Start Redis (Development)

Using Docker:
```bash
docker-compose up -d
```

Or install locally:
```bash
# macOS
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis
```

### 4. Database Setup

The required tables are automatically created by Supabase migrations. Key tables:
- `scraped_pages` - Stores page content and metadata
- `page_embeddings` - Stores vector embeddings for search

## API Reference

### POST /api/scrape

Scrape a single page or crawl an entire website.

#### Request Body

```typescript
{
  url: string;           // URL to scrape
  crawl?: boolean;       // false = single page, true = full site
  max_pages?: number;    // Max pages to crawl (-1 for unlimited)
}
```

#### Examples

**Scrape Single Page:**
```bash
curl -X POST http://localhost:3000/api/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/about",
    "crawl": false
  }'
```

**Crawl Entire Website (Limited):**
```bash
curl -X POST http://localhost:3000/api/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "crawl": true,
    "max_pages": 100
  }'
```

**Crawl Entire Website (Unlimited):**
```bash
curl -X POST http://localhost:3000/api/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "crawl": true,
    "max_pages": -1
  }'
```

#### Response

**Single Page:**
```json
{
  "status": "completed",
  "pages_scraped": 1,
  "message": "Successfully scraped and indexed https://example.com/about"
}
```

**Crawl Job:**
```json
{
  "status": "started",
  "job_id": "crawl_1234567890_abc123",
  "message": "Started crawling https://example.com. This may take a few minutes."
}
```

### GET /api/scrape?job_id={id}

Check the status of a crawl job.

#### Example

```bash
curl http://localhost:3000/api/scrape?job_id=crawl_1234567890_abc123
```

#### Response

```json
{
  "jobId": "crawl_1234567890_abc123",
  "status": "processing",
  "progress": 45,
  "total": 150,
  "completed": 68,
  "failed": 2,
  "skipped": 5,
  "startedAt": "2024-01-20T10:30:00Z",
  "errors": [
    {
      "url": "https://example.com/broken-page",
      "error": "404 Not Found",
      "timestamp": "2024-01-20T10:32:15Z"
    }
  ]
}
```

**When completed:**
```json
{
  "jobId": "crawl_1234567890_abc123",
  "status": "completed",
  "progress": 100,
  "total": 150,
  "completed": 143,
  "failed": 2,
  "skipped": 5,
  "startedAt": "2024-01-20T10:30:00Z",
  "completedAt": "2024-01-20T10:45:30Z",
  "data": [
    {
      "url": "https://example.com",
      "title": "Example Homepage",
      "content": "# Welcome to Example\n\nThis is the main content...",
      "wordCount": 523,
      "images": [
        {
          "src": "https://example.com/hero.jpg",
          "alt": "Hero image"
        }
      ]
    }
    // ... more pages
  ]
}
```

## Configuration

### Crawling Options

Configure in `/lib/crawlee-scraper-v2.ts`:

```typescript
// Maximum concurrent requests
maxConcurrency: 5,

// Request timeout
requestHandlerTimeoutSecs: 30,

// Navigation timeout
navigationTimeoutSecs: 30,

// Rate limiting (requests per minute)
const canProceed = await jobManager.checkRateLimit(domain, 20, 60);
```

### Content Extraction

Configure selectors in `/lib/content-extractor.ts`:

```typescript
// Main content selectors (in priority order)
const contentSelectors = [
  'main',
  'article',
  '[role="main"]',
  '.main-content',
  '#main-content',
  '.post-content',
  '.entry-content',
  // ... add custom selectors
];

// Elements to remove
$('script, style, nav, header, footer, aside, form, iframe').remove();
$('.advertisement, .ads, .social-share, .comments').remove();
```

### Exclusion Patterns

Default excluded paths:
```typescript
const excludePaths = [
  '/wp-admin',
  '/admin', 
  '/login',
  '/cart',
  '/checkout',
  '.pdf',
  '.zip',
  '.exe'
];
```

## How It Works

### 1. URL Processing
```
User submits URL → Validate URL → Check crawl type → Initialize job
```

### 2. Content Extraction Flow
```
Fetch page → Wait for content → Extract HTML → Apply Readability → 
Convert to Markdown → Extract metadata → Calculate metrics
```

### 3. Crawling Logic
```
Start URL → Extract links → Filter same-domain → Check exclusions →
Queue new URLs → Respect rate limits → Track progress
```

### 4. Storage Pipeline
```
Extracted content → Check duplicate → Generate embeddings →
Store in Supabase → Update job status → Return results
```

### 5. Embedding Generation
```
Split content into chunks → Generate vectors (OpenAI) → 
Store with metadata → Enable semantic search
```

## Best Practices

### 1. Crawling Strategy

**Start Small:**
```json
{
  "url": "https://docs.example.com",
  "crawl": true,
  "max_pages": 10
}
```

**Then Expand:**
```json
{
  "url": "https://docs.example.com",
  "crawl": true,
  "max_pages": 100
}
```

### 2. URL Selection

✅ **Good URLs to Crawl:**
- Documentation sites
- Knowledge bases
- FAQ sections
- Product catalogs
- Blog posts

❌ **URLs to Avoid:**
- User-generated content
- Dynamic search results
- Infinite pagination
- Large media galleries

### 3. Rate Limiting

Respect server resources:
- Default: 20 requests/minute per domain
- Adjust based on robots.txt
- Monitor response times
- Back off if errors increase

### 4. Content Quality

Ensure good content:
- Minimum 50 words per page
- Check for error pages
- Validate extraction quality
- Monitor duplicate rates

## Troubleshooting

### Common Issues

#### 1. Redis Connection Failed
```
Error: Redis connection error: ECONNREFUSED
```

**Solution:**
```bash
# Check Redis is running
docker ps | grep redis
redis-cli ping

# Restart Redis
docker-compose restart redis
```

#### 2. High Memory Usage
```
Error: JavaScript heap out of memory
```

**Solution:**
- Reduce `maxConcurrency` (default: 5)
- Lower `max_pages` limit
- Ensure Redis is being used (not in-memory)

#### 3. Crawl Stuck/Slow

**Check:**
- Server response times
- Rate limiting delays
- Network connectivity
- Content size

**Debug:**
```bash
# Check job status
curl http://localhost:3000/api/scrape?job_id=YOUR_JOB_ID

# Check Redis
redis-cli
> KEYS crawl:*
> GET crawl:job:YOUR_JOB_ID
```

#### 4. Poor Content Extraction

**Symptoms:**
- Missing main content
- Including navigation/ads
- Broken formatting

**Solutions:**
1. Add custom selectors for the site
2. Update removal patterns
3. Check if site uses client-side rendering
4. Verify Playwright is working

### Error Messages

| Error | Meaning | Solution |
|-------|---------|----------|
| `Invalid or insufficient content` | Page has < 50 words | Normal for some pages, check URL |
| `Duplicate content found` | Content hash exists | Working as intended |
| `Rate limit hit` | Too many requests | Wait or reduce concurrency |
| `Job not found` | Job ID invalid/expired | Jobs expire after 1 hour |

## Performance Optimization

### 1. Redis Configuration

**Production Settings:**
```redis
# Persistence
appendonly yes
appendfsync everysec

# Memory
maxmemory 2gb
maxmemory-policy allkeys-lru

# Performance
tcp-keepalive 60
timeout 300
```

### 2. Crawling Optimization

**Large Sites (>1000 pages):**
```typescript
{
  maxConcurrency: 10,        // Increase if server allows
  requestHandlerTimeoutSecs: 20,  // Lower timeout
  includePaths: ['/docs', '/api'], // Focus on relevant sections
}
```

**Slow Sites:**
```typescript
{
  maxConcurrency: 2,         // Reduce load
  navigationTimeoutSecs: 60, // Increase timeout
  waitFor: 5000,            // Wait for dynamic content
}
```

### 3. Database Optimization

**Indexes (already created):**
```sql
-- URL lookups
CREATE INDEX idx_scraped_pages_url ON scraped_pages(url);

-- Content search
CREATE INDEX idx_page_embeddings_page_id ON page_embeddings(page_id);

-- Similarity search (using pgvector)
CREATE INDEX idx_embeddings_vector ON page_embeddings 
USING ivfflat (embedding vector_cosine_ops);
```

### 4. Monitoring

**Key Metrics:**
- Pages per minute
- Average response time
- Duplicate rate
- Error rate
- Memory usage

**Redis Monitoring:**
```bash
# Memory usage
redis-cli INFO memory

# Active jobs
redis-cli --scan --pattern "crawl:job:*" | wc -l

# Rate limit status
redis-cli --scan --pattern "rate:*"
```

## Advanced Usage

### Custom Extraction Rules

Add site-specific rules in `content-extractor.ts`:

```typescript
// Example: Extract product prices
if (url.includes('shop.example.com')) {
  const price = $('.price').first().text();
  metadata.price = price;
}
```

### Structured Data Extraction

Extract JSON-LD data:

```typescript
const jsonLd = $('script[type="application/ld+json"]').html();
if (jsonLd) {
  const structured = JSON.parse(jsonLd);
  // Process structured data
}
```

### Webhook Integration

Notify when crawl completes:

```typescript
// In crawl completion handler
await fetch('https://your-webhook.com/crawl-complete', {
  method: 'POST',
  body: JSON.stringify({ jobId, stats }),
});
```

## Security Considerations

1. **URL Validation**: Only accept valid HTTP/HTTPS URLs
2. **Domain Restrictions**: Optional whitelist/blacklist
3. **Resource Limits**: Max pages, timeouts, memory limits
4. **Authentication**: Add API keys for production use
5. **Rate Limiting**: Protect your API endpoints

## Maintenance

### Regular Tasks

1. **Clean Old Jobs** (daily):
```bash
# Implement in a cron job
node scripts/cleanup-old-jobs.js
```

2. **Monitor Redis Memory** (weekly):
```bash
redis-cli INFO memory
```

3. **Update Exclusion Lists** (monthly):
- Review crawl errors
- Add new patterns
- Update selectors

4. **Performance Review** (monthly):
- Analyze crawl speeds
- Check duplicate rates
- Optimize slow queries