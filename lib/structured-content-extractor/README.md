**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# Structured Content Extractor

**Purpose:** Extract structured data from web pages (products, breadcrumbs, etc.)
**Last Updated:** 2025-10-30
**Related:** [Product Content Extractor](/lib/product-content-extractor), [Content Extractor](/lib/content-extractor.ts)

## Overview

Generic structured content extraction system for web scraping.

## Files

- **[product-extractor.ts](product-extractor.ts)** - Product data extraction
- **[product-extractors.ts](product-extractors.ts)** - Multiple product extraction strategies
- **[breadcrumb-extractor.ts](breadcrumb-extractor.ts)** - Breadcrumb navigation extraction
- **[types.ts](types.ts)** - TypeScript type definitions

## Usage

```typescript
import { extractProducts } from '@/lib/structured-content-extractor';

const products = await extractProducts(page);
```

## Features

- Multiple extraction strategies
- Fallback mechanisms
- Schema.org support
- Breadcrumb tracking
