# Product Content Extractor

**Type:** Utility
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Dependencies:** [Scraper API](/home/user/Omniops/lib/scraper-api-handlers), [Structured Content Extractor](/home/user/Omniops/lib/structured-content-extractor)
**Estimated Read Time:** 1 minute

## Purpose

Specialized extraction system for e-commerce product data including prices, descriptions, images, breadcrumbs, and multi-variant support.

## Keywords
- Product Extraction, Web Scraping, E-commerce, Price Parsing, Schema.org, Breadcrumbs

---

## Overview

Specialized extraction system for e-commerce product data including prices, descriptions, images, and breadcrumbs.

## Files

- **[index.ts](index.ts)** - Main extractor class and exports
- **[selectors.ts](selectors.ts)** - CSS/DOM selectors for product data
- **[parsers.ts](parsers.ts)** - Parsing functions for product fields
- **[formatter.ts](formatter.ts)** - Data formatting utilities
- **[breadcrumb-extractor.ts](breadcrumb-extractor.ts)** - Breadcrumb navigation extraction
- **[types.ts](types.ts)** - TypeScript type definitions

## Usage

```typescript
import { extractProductData } from '@/lib/product-content-extractor';

const product = await extractProductData(htmlContent, url);
// Returns: { name, price, description, images, breadcrumbs }
```

## Features

- Price parsing with currency detection
- Image extraction and optimization
- Breadcrumb navigation tracking
- Multi-variant product support
- Schema.org markup parsing
