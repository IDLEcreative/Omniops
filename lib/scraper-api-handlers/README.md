# Scraper API Handlers

**Purpose:** API request handlers and utilities for web scraping system
**Last Updated:** 2025-10-30
**Related:** [Scraper API](/lib/scraper-api.ts), [Queue](/lib/queue)

## Overview

Core handlers for scraping API requests including error handling, AI optimization, and resource blocking.

## Files

- **[index.ts](index.ts)** - Main exports and handler orchestration
- **[error-handler.ts](error-handler.ts)** - Scraping error handling and retry logic
- **[ai-optimizer.ts](ai-optimizer.ts)** - AI-powered scraping optimization
- **[resource-blocker.ts](resource-blocker.ts)** - Block unnecessary resources (ads, trackers)
- **[types.ts](types.ts)** - TypeScript type definitions

## Usage

```typescript
import { handleScrapeRequest } from '@/lib/scraper-api-handlers';

const result = await handleScrapeRequest({
  url: 'https://example.com',
  options: { crawl: true, maxPages: 50 }
});
```

## Features

- Intelligent error recovery
- Resource blocking for faster scraping
- AI-based content optimization
- Request validation
