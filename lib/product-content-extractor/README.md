**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# Product Content Extractor

**Purpose:** Extract and parse product information from web pages
**Last Updated:** 2025-10-30
**Related:** [Scraper API](/lib/scraper-api-handlers), [Structured Content Extractor](/lib/structured-content-extractor)

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
