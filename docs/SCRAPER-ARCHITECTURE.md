# Scraper Architecture Documentation

## Overview

This document explains the multi-layered scraper architecture used in the customer service agent application. The system uses specialized scrapers that work together to handle different types of web content efficiently.

## Why Multiple Scrapers?

Having multiple specialized scrapers follows the **Single Responsibility Principle** and provides:

1. **Performance** - Use the lightest scraper for the job
2. **Maintainability** - Changes are isolated to specific scrapers
3. **Extensibility** - Easy to add new specialized scrapers
4. **Composability** - Scrapers can inherit and compose functionality

## Architecture Layers

```
┌─────────────────────────────────────────────────┐
│           scraper-api.ts (Orchestrator)         │
│  • Browser automation with Playwright/Crawlee   │
│  • Auto-detection and routing                   │
│  • Rate limiting and job management             │
└─────────────────┬───────────────────────────────┘
                  │ uses
┌─────────────────▼───────────────────────────────┐
│         EcommerceExtractor                      │
│  • E-commerce specific extraction               │
│  • Platform detection (WooCommerce, Shopify)    │
│  • Product normalization                        │
│  • Inherits from ContentExtractor               │
└─────────────────┬───────────────────────────────┘
                  │ extends
┌─────────────────▼───────────────────────────────┐
│         ContentExtractor (Base)                 │
│  • Mozilla Readability integration              │
│  • General content extraction                   │
│  • Image and metadata extraction                │
└──────────────────────────────────────────────────┘

Additional Components:
┌──────────────────────────────────────────────────┐
│         PaginationCrawler                       │
│  • Multi-page catalog crawling                  │
│  • Uses EcommerceExtractor internally           │
│  • Handles pagination following                 │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│         PatternLearner                          │
│  • Machine learning for extraction patterns     │
│  • Saves successful patterns per domain         │
│  • Improves extraction speed over time          │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│         ProductNormalizer                       │
│  • Normalizes messy product data                │
│  • Price parsing and formatting                 │
│  • Specification extraction                     │
└──────────────────────────────────────────────────┘
```

## Component Details

### 1. ContentExtractor (`/lib/content-extractor.ts`)
**Base extraction layer for all content**

- **Purpose**: Extract clean, readable content from any webpage
- **Technology**: Mozilla Readability
- **Use Cases**: 
  - Blog posts and articles
  - Documentation pages
  - General web content
- **Key Features**:
  - Clean text extraction
  - Image extraction with captions
  - Metadata extraction (title, author, date)
  - Content validation and hash generation

### 2. EcommerceExtractor (`/lib/ecommerce-extractor.ts`)
**Specialized e-commerce extraction**

- **Purpose**: Extract structured product data from e-commerce sites
- **Extends**: ContentExtractor (inherits all base functionality)
- **Use Cases**:
  - Product detail pages
  - Category/listing pages
  - Shopping cart pages
- **Key Features**:
  - Platform auto-detection (WooCommerce, Shopify, Magento, etc.)
  - Multi-strategy extraction (JSON-LD → Microdata → DOM)
  - Product variant extraction
  - Specification extraction
  - Pagination detection

### 3. PaginationCrawler (`/lib/pagination-crawler.ts`)
**Multi-page catalog crawler**

- **Purpose**: Crawl entire product catalogs by following pagination
- **Uses**: EcommerceExtractor for each page
- **Use Cases**:
  - Full catalog scraping
  - Category traversal
  - Search result collection
- **Key Features**:
  - Automatic pagination following
  - "Load More" button handling
  - Product deduplication
  - Progress tracking
  - Configurable delays and limits

### 4. scraper-api.ts (`/lib/scraper-api.ts`)
**Main orchestration layer**

- **Purpose**: Coordinate browser automation and content extraction
- **Uses**: Both ContentExtractor and EcommerceExtractor
- **Use Cases**:
  - API endpoint for scraping
  - Job queue management
  - Rate limiting
- **Key Features**:
  - Auto-detection of content type
  - Intelligent fallback (e-commerce → general)
  - Browser resource blocking (ads, trackers)
  - Turbo mode for faster scraping
  - Redis job queue integration

### 5. PatternLearner (`/lib/pattern-learner.ts`)
**Machine learning for extraction patterns**

- **Purpose**: Learn and apply successful extraction patterns
- **Integration**: Used by EcommerceExtractor
- **Use Cases**:
  - Speed up repeated scraping
  - Improve accuracy over time
  - Handle site-specific variations
- **Key Features**:
  - Pattern storage per domain
  - Confidence scoring
  - Platform-specific templates
  - Adaptive learning

### 6. ProductNormalizer (`/lib/product-normalizer.ts`)
**Data normalization utilities**

- **Purpose**: Clean and standardize extracted product data
- **Used By**: EcommerceExtractor, PaginationCrawler
- **Use Cases**:
  - Price parsing from various formats
  - Availability status normalization
  - Specification extraction
- **Key Features**:
  - Multi-currency support
  - VAT and discount handling
  - Stock status interpretation
  - Name and description cleaning

## Auto-Detection Flow

The system automatically detects the type of content and uses the appropriate extractor:

```javascript
// In scraper-api.ts
if (config?.ecommerceMode !== false) {
  // Try e-commerce extraction first
  extracted = await EcommerceExtractor.extractEcommerce(html, url);
  
  // If no e-commerce platform detected, fall back
  if (!extracted.platform) {
    extracted = ContentExtractor.extractWithReadability(html, url);
  }
} else {
  // Use regular extraction
  extracted = ContentExtractor.extractWithReadability(html, url);
}
```

This provides:
- **Automatic detection** - No manual configuration needed
- **Graceful fallback** - Always extracts something useful
- **Optimal performance** - Uses specialized extractors when applicable

## Usage Examples

### Basic Content Scraping
```javascript
import { scrapePage } from '@/lib/scraper-api';

const result = await scrapePage('https://blog.example.com/article');
// Uses ContentExtractor for blog content
```

### E-commerce Product Scraping
```javascript
import { scrapePage } from '@/lib/scraper-api';

const result = await scrapePage('https://shop.example.com/product/123', {
  ecommerceMode: true  // Optional - auto-detected anyway
});
// Uses EcommerceExtractor for product data
```

### Full Catalog Crawling
```javascript
import { PaginationCrawler } from '@/lib/pagination-crawler';

const crawler = new PaginationCrawler({
  maxPages: 50,
  followPagination: true
});

const catalog = await crawler.crawlCatalog(startUrl, page);
// Crawls entire catalog using EcommerceExtractor
```

## Adding New Scrapers

To add a new specialized scraper:

1. **Extend ContentExtractor** for basic functionality
```javascript
export class NewsExtractor extends ContentExtractor {
  // Add news-specific extraction logic
}
```

2. **Add detection logic** in scraper-api.ts
```javascript
if (isNewsWebsite(url)) {
  extracted = await NewsExtractor.extractNews(html, url);
}
```

3. **Follow the pattern**:
   - Single responsibility
   - Clear interfaces
   - Graceful fallbacks
   - Composable design

## Performance Considerations

1. **Turbo Mode** (default enabled):
   - Blocks ads, trackers, fonts
   - Reduces page load time by ~60%
   - Minimal impact on content extraction

2. **Pattern Learning**:
   - First visit: Full extraction (~2-3s)
   - Subsequent visits: Pattern-based (~0.5-1s)
   - Patterns stored in database

3. **Resource Usage**:
   - ContentExtractor: Lightweight, text-focused
   - EcommerceExtractor: Medium weight, structured data
   - PaginationCrawler: Heavy, multiple page loads

## Configuration

Scraper behavior can be configured via `/lib/crawler-config.ts`:

- **Presets**: 'default', 'fast', 'detailed', 'ecommerce'
- **Timeouts**: Navigation, resource load, request handling
- **Rate Limiting**: Per-domain delays, adaptive throttling
- **Content Filters**: Minimum word count, page size limits

## Testing

Each scraper has associated tests:
- Unit tests for extractors
- Integration tests for API routes
- E2E tests for full crawling

Run tests with:
```bash
npm test                 # All tests
npm run test:unit       # Unit tests only
npm run test:integration # Integration tests
```

## Monitoring

Monitor scraper performance via:
- Redis job queue status
- Supabase logs
- Pattern learning success rates
- API response times

## Future Enhancements

Potential areas for expansion:
1. **Social Media Extractor** - For Twitter/LinkedIn/Facebook
2. **News Extractor** - For news articles with author/date
3. **Forum Extractor** - For discussion threads
4. **Video Platform Extractor** - For YouTube/Vimeo metadata
5. **Real Estate Extractor** - For property listings

## Conclusion

The multi-scraper architecture provides:
- **Flexibility** - Right tool for the right job
- **Performance** - Optimized for specific content types
- **Maintainability** - Clear separation of concerns
- **Extensibility** - Easy to add new capabilities

This design ensures the system can handle any type of web content efficiently while remaining maintainable and extensible.