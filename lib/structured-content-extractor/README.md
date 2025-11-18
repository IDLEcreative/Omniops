# Structured Content Extractor

**Type:** Utility
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Dependencies:** [Product Content Extractor](/home/user/Omniops/lib/product-content-extractor), [Content Extractor](/home/user/Omniops/lib/content-extractor.ts)
**Estimated Read Time:** 1 minute

## Purpose

Generic structured content extraction system for web scraping with multiple extraction strategies and Schema.org support.

## Keywords
- Structured Content, Web Scraping, Product Extraction, Breadcrumbs, Schema.org, Fallback Strategies

---

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
