# Scraping API

**Type:** Reference
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Dependencies:** [Search Architecture](/home/user/Omniops/docs/01-ARCHITECTURE/ARCHITECTURE_SEARCH_SYSTEM.md), [Content Extractor](/home/user/Omniops/lib/content-extractor.ts), [Crawler Config](/home/user/Omniops/lib/crawler-config.ts)
**Estimated Read Time:** 12 minutes

## Purpose

This document provides comprehensive technical reference for website content extraction and indexing capabilities including single-page scraping, full website crawling, vector embeddings generation, and intelligent content processing with Turbo mode optimization.

## Quick Links

- [API Routes Documentation](/home/user/Omniops/app/api/README.md)
- [Chat API Integration](/home/user/Omniops/app/api/chat/README.md)
- [Job Queue Management](/home/user/Omniops/app/api/jobs/README.md)
- [Database Schema](/home/user/Omniops/docs/09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md)

## Keywords

**Primary**: web scraping, content extraction, website crawling, vector embeddings, semantic search indexing, Turbo mode
**Aliases**: scraping API, crawler endpoint, content indexing, website scraper
**Related**: embeddings generation, job queue, crawlee, Mozilla Readability, OpenAI embeddings

## Table of Contents

- [Overview](#overview)
- [Endpoints](#endpoints)
  - [POST /api/scrape](#post-apiscrape)
  - [GET /api/scrape](#get-apiscrape)
- [Features](#features)
  - [Intelligent Content Extraction](#intelligent-content-extraction)
  - [Vector Embeddings](#vector-embeddings)
  - [Turbo Mode](#turbo-mode)
  - [Crawl Management](#crawl-management)
- [Configuration](#configuration)
- [Performance](#performance)
- [Examples](#examples)
- [Database Schema](#database-schema)
- [Error Handling](#error-handling)
- [Rate Limiting & Throttling](#rate-limiting--throttling)
- [Monitoring & Analytics](#monitoring--analytics)
- [Integration](#integration)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [Related Endpoints](#related-endpoints)

---

Website content extraction and indexing system with AI-powered embeddings and intelligent content processing.

## Overview

This endpoint provides comprehensive website scraping capabilities including single-page extraction, full website crawling, and automatic content indexing with vector embeddings for semantic search.

## Endpoints

### POST `/api/scrape`

Scrapes website content and generates searchable embeddings.

#### Authentication
- **Type**: Optional customer authentication for domain ownership
- **Rate Limits**: Standard domain-based limiting
- **Permissions**: Owned domains get enhanced features

#### Request Format

```json
{
  "url": "https://example.com/products/hydraulic-pump",
  "crawl": false,
  "max_pages": 100,
  "turbo": true,
  "incremental": false,
  "force_refresh": false
}
```

#### Required Fields
- `url` (string, valid URL): Target URL to scrape

#### Optional Fields
- `crawl` (boolean, default: false): Enable full website crawling
- `max_pages` (integer, -1 to 10000, default: -1): Maximum pages to crawl (-1 = unlimited)
- `turbo` (boolean, default: true): Enable turbo mode for faster processing
- `incremental` (boolean, default: false): Only scrape new/changed content
- `force_refresh` (boolean, default: false): Force full refresh even in incremental mode

#### Response Format

##### Single Page Scrape
```json
{
  "status": "completed",
  "pages_scraped": 1,
  "message": "Successfully scraped and indexed https://example.com/products/hydraulic-pump"
}
```

##### Full Website Crawl
```json
{
  "status": "started",
  "job_id": "crawl_20240117_123456_abc123",
  "turbo_mode": true,
  "message": "Started TURBO crawling https://example.com. This may take a few minutes."
}
```

### GET `/api/scrape`

Check crawl status and retrieve results.

#### Query Parameters
- `job_id` (required): Crawl job identifier
- `health` (optional): Set to "true" for health check
- `include_results` (optional): Include scraped data in response
- `offset` (optional): Pagination offset (default: 0)
- `limit` (optional): Results per page (default: 100)

#### Health Check Response
```json
{
  "status": "ok",
  "crawler_service": "operational",
  "redis_connection": "healthy",
  "active_jobs": 3,
  "completed_jobs_24h": 156,
  "timestamp": "2024-01-17T10:30:00.000Z"
}
```

#### Job Status Response
```json
{
  "status": "completed",
  "job_id": "crawl_20240117_123456_abc123",
  "progress": {
    "pages_discovered": 250,
    "pages_scraped": 245,
    "pages_failed": 5,
    "completion_percentage": 98
  },
  "data": [
    {
      "url": "https://example.com/products/pump-123",
      "title": "High-Pressure Hydraulic Pump",
      "content": "Professional grade hydraulic pump...",
      "metadata": {
        "word_count": 1250,
        "last_modified": "2024-01-15T14:30:00.000Z"
      }
    }
  ],
  "started_at": "2024-01-17T10:15:30.000Z",
  "completed_at": "2024-01-17T10:28:45.000Z"
}
```

## Features

### Intelligent Content Extraction
- **Mozilla Readability**: Clean content extraction
- **Automatic Chunking**: Optimized for semantic search
- **Deduplication**: Prevents duplicate content indexing
- **Metadata Extraction**: Title, descriptions, structured data

### Vector Embeddings
- **OpenAI Embeddings**: text-embedding-3-small model
- **Semantic Search**: Enables natural language queries
- **Batch Processing**: Efficient embedding generation
- **Smart Chunking**: Sentence-based content splitting

### Turbo Mode
- **Parallel Processing**: Concurrent page scraping
- **Optimized Extraction**: Faster content processing
- **Resource Management**: Intelligent resource allocation
- **Performance Monitoring**: Real-time performance tracking

### Crawl Management
- **Job Queue**: Redis-backed background processing
- **Progress Tracking**: Real-time crawl monitoring
- **Error Handling**: Robust failure recovery
- **Resource Limits**: Configurable crawling boundaries

## Configuration

### Crawl Settings
```json
{
  "maxPages": 100,           // Maximum pages to crawl
  "excludePaths": [          // Paths to skip
    "/wp-admin",
    "/admin", 
    "/login",
    "/cart",
    "/checkout"
  ],
  "turboMode": true,         // Enable turbo processing
  "customerId": "customer-123" // For owned domain detection
}
```

### Content Processing
- **Chunk Size**: 1000 characters (optimized for embeddings)
- **Batch Size**: 20 chunks per embedding API call
- **Deduplication**: SHA-256 hash-based duplicate detection
- **Text Cleaning**: HTML tag removal and normalization

## Performance

### Single Page Scrape
- **Average Time**: 2-5 seconds
- **Content Processing**: ~1-2 seconds
- **Embedding Generation**: ~1-3 seconds
- **Database Storage**: ~500ms

### Full Website Crawl
- **Standard Mode**: 5-15 pages/minute
- **Turbo Mode**: 15-50 pages/minute
- **Memory Usage**: Optimized for large sites
- **Concurrent Limits**: 10 pages simultaneously

### Database Operations
- **Bulk Insert**: 86% faster than individual inserts
- **Upsert Operations**: Prevents duplicate pages
- **Cascade Cleanup**: Safe foreign key handling
- **Index Optimization**: Fast similarity searches

## Examples

### Single Page Scrape
```bash
curl -X POST 'http://localhost:3000/api/scrape' \
  -H 'Content-Type: application/json' \
  -d '{
    "url": "https://example.com/products/hydraulic-pump-123",
    "turbo": true
  }'
```

### Full Website Crawl
```bash
curl -X POST 'http://localhost:3000/api/scrape' \
  -H 'Content-Type: application/json' \
  -d '{
    "url": "https://example.com",
    "crawl": true,
    "max_pages": 500,
    "turbo": true
  }'
```

### Check Crawl Status
```bash
curl 'http://localhost:3000/api/scrape?job_id=crawl_20240117_123456_abc123&include_results=true&limit=50'
```

### Health Check
```bash
curl 'http://localhost:3000/api/scrape?health=true'
```

### Incremental Scraping
```bash
curl -X POST 'http://localhost:3000/api/scrape' \
  -H 'Content-Type: application/json' \
  -d '{
    "url": "https://example.com",
    "crawl": true,
    "incremental": true,
    "max_pages": 100
  }'
```

## Database Schema

### Tables Created/Updated
- `scraped_pages`: Main content storage
- `page_embeddings`: Vector embeddings for search
- `scrape_jobs`: Background job tracking
- `website_content`: Normalized content index

### Automatic Cleanup
- Duplicate page handling via upsert
- Embedding regeneration on content changes
- Job status tracking and cleanup
- Failed page retry mechanism

## Error Handling

### Common Errors
```json
// Invalid URL
{
  "error": "Invalid request data",
  "details": [
    {
      "path": ["url"],
      "message": "Invalid url"
    }
  ]
}

// Service unavailable
{
  "error": "Database connection unavailable"
}

// Crawl job not found
{
  "error": "job_id parameter is required"
}
```

### Retry Logic
- **Page Failures**: Automatic retry with exponential backoff
- **API Failures**: Graceful degradation and error logging
- **Timeout Handling**: Configurable timeout with partial results
- **Resource Limits**: Intelligent resource management

## Rate Limiting & Throttling

### Request Limits
- Standard domain-based rate limiting
- Crawl job concurrency limits
- Embedding API rate limit handling
- Resource-based throttling

### Owned Domain Benefits
- Higher crawl limits
- Priority job processing
- Extended timeout windows
- Enhanced monitoring

## Monitoring & Analytics

### Job Tracking
```json
{
  "job_id": "crawl_20240117_123456_abc123",
  "status": "running",
  "progress": {
    "pages_discovered": 150,
    "pages_scraped": 125,
    "pages_failed": 3,
    "completion_percentage": 83,
    "estimated_remaining": "2 minutes"
  },
  "performance": {
    "pages_per_minute": 25,
    "avg_page_size": "45KB",
    "total_content_size": "5.6MB"
  }
}
```

### Health Monitoring
- Crawler service status
- Redis connection health
- Active job count
- Performance metrics
- Error rate tracking

## Integration

### With Chat System
Scraped content automatically becomes searchable via:
- `/api/chat` - Legacy semantic search
- `/api/chat-intelligent` - Enhanced search with embeddings
- Custom search endpoints

### With WooCommerce
- Product page scraping
- Category indexing
- Inventory synchronization
- Content enhancement

### With Customer Config
- Domain ownership verification
- Automatic scraping triggers
- Configuration-based limits
- Integration status tracking

## Best Practices

### Crawling Strategy
- Start with key pages using single-page scrape
- Use incremental crawling for regular updates
- Set appropriate max_pages for site size
- Enable turbo mode for performance
- Monitor job progress and errors

### Content Quality
- Ensure pages have meaningful content
- Check for duplicate content issues
- Verify embedding generation success
- Monitor search result relevance

### Performance Optimization
- Use owned domain benefits when available
- Implement appropriate retry logic
- Monitor resource usage during crawls
- Schedule large crawls during off-peak hours

## Troubleshooting

### Common Issues
- **Slow Crawling**: Check turbo mode, reduce max_pages
- **Failed Pages**: Review exclude paths, check page accessibility
- **Missing Content**: Verify content extraction, check for JavaScript rendering
- **Poor Search Results**: Ensure embedding generation, check content quality

### Debug Information
- Job logs available via job status endpoint
- Detailed error messages in response
- Performance metrics for optimization
- Health check for service status

## Related Endpoints

- `/api/chat` - Uses scraped content for search
- `/api/chat-intelligent` - Enhanced search with embeddings
- `/api/customer/config` - Domain configuration
- `/api/monitoring/scraping` - Scraping analytics
- `/api/jobs/*` - Job management endpoints