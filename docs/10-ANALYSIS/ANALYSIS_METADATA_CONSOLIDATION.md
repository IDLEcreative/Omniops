# Metadata Consolidation System

**Type:** Analysis
**Status:** Active
**Last Updated:** 2025-10-29
**Verified For:** v0.1.0
**Estimated Read Time:** 10 minutes

## Purpose
This document describes the unified metadata extraction and consolidation system implemented in the Omniops scraper. The system ensures consistent field naming, eliminates duplication, and provides a single source of truth for product metadata.

## Quick Links
- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Solution Architecture](#solution-architecture)
- [Migration Guide](#migration-guide)
- [Testing](#testing)

## Keywords
analysis, architecture, benefits, consolidation, documentation, files, future, guide, improvements, metadata

---


## Overview

This document describes the unified metadata extraction and consolidation system implemented in the Omniops scraper. The system ensures consistent field naming, eliminates duplication, and provides a single source of truth for product metadata.

## Problem Statement

Previously, the system had two separate metadata extraction mechanisms that created duplicate and inconsistent field names:

1. **Legacy fields**: `price`, `sku`, `brand`, `category`
2. **Consolidated fields**: `productPrice`, `productSku`, `productBrand`, `productCategory`

This duplication caused:
- Only 3% of pages having properly consolidated metadata
- Confusion about which fields to use
- Inconsistent search results
- Maintenance difficulties

## Solution Architecture

### Unified Field Naming

All product-related metadata now uses consistent, prefixed field names:

| Field | Type | Description |
|-------|------|-------------|
| `productSku` | string | Product SKU or unique identifier |
| `productPrice` | string | Formatted price with currency |
| `productInStock` | boolean | Stock availability status |
| `productBrand` | string | Brand or manufacturer name |
| `productCategory` | string | Product category or type |
| `productName` | string | Product display name |
| `lastChecked` | ISO 8601 | Timestamp of extraction |

### Extraction Priority

The system uses a clear priority hierarchy for metadata sources:

```
1. EcommerceExtractor (highest priority)
   ↓ (fallback if not available)
2. extractMetadata() from page HTML
   ↓ (fallback if not available)  
3. null/undefined
```

### Implementation Details

#### 1. Metadata Extraction (`lib/scraper-worker.js`)

The `extractMetadata()` function (lines 544-647) handles initial extraction:

```javascript
function extractMetadata(document) {
  // Extract raw product data
  const productData = extractProductData();
  const structuredData = extractStructuredData();
  
  // Destructure to remove legacy field names
  const { price, sku, brand, category, ...cleanData } = structuredData;
  const { price: prodPrice, sku: prodSku, ...} = productData;
  
  return {
    // Only consolidated field names
    productSku: prodSku || sku || productID,
    productPrice: prodPrice || price || offers?.price,
    productInStock: inStock ?? availability === 'InStock',
    productBrand: brand?.name || brand || manufacturer,
    productCategory: categories || category,
    lastChecked: new Date().toISOString()
  };
}
```

#### 2. Database Storage (`lib/scraper-worker.js`)

The consolidated metadata is stored with priority-based merging (lines 1106-1135):

```javascript
const dbRecord = {
  metadata: {
    ...pageData.metadata, // Base metadata
    // Override with ecommerceData if available
    ...(ecommerceData?.products?.[0] && {
      productSku: ecommerceData.products[0].sku || pageData.metadata?.productSku,
      productPrice: ecommerceData.products[0].price || pageData.metadata?.productPrice,
      // ... other fields with fallbacks
    })
  }
};
```

#### 3. Content Enrichment (`lib/content-enricher.js`)

The ContentEnricher uses consolidated fields for embedding enrichment:

```javascript
ContentEnricher.enrichContent(content, metadata, url, title)
// Uses metadata.productSku, metadata.productPrice, etc.
```

### Security: Log Sanitization

All metadata logging is sanitized to prevent XSS attacks (`lib/log-sanitizer.js`):

```javascript
const { sanitizeForLogging } = require('./log-sanitizer');

console.log('Metadata:', sanitizeForLogging({
  productSku: metadata.productSku,
  productPrice: metadata.productPrice,
  // ... other fields
}));
```

The sanitizer:
- Escapes HTML entities (`<`, `>`, `"`, `'`, etc.)
- Truncates strings longer than 500 characters
- Handles nested objects recursively
- Prevents XSS if logs are displayed in web UIs

## Migration Guide

### For Existing Data

Existing pages in the database may still have legacy field names. To handle this:

```javascript
// Reading existing data
const sku = metadata.productSku || metadata.sku; // Check both
const price = metadata.productPrice || metadata.price;
```

### For New Scrapes

All new scrapes will automatically use consolidated field names. No action required.

### For Forced Rescrapes

Use force rescrape to update existing pages with consolidated metadata:

```bash
FORCE_RESCRAPE=true node lib/scraper-worker.js
```

## Testing

### Verify Consolidation

```bash
# Check metadata consistency
node test-consolidated-metadata.js

# Test field naming fixes
node test-metadata-fixes.js

# Check existing data
node test-check-existing-enrichment.js
```

### Expected Results

- ✅ No legacy field names in new scrapes
- ✅ All product fields prefixed with `product`
- ✅ Consistent field naming across all extraction methods
- ✅ Log sanitization preventing XSS

## Benefits

1. **Consistency**: Single source of truth for metadata fields
2. **Maintainability**: Clear field naming convention
3. **Security**: XSS-proof logging system
4. **Performance**: Reduced duplication and cleaner data structure
5. **Search Quality**: Better embedding enrichment with consistent metadata

## Files Modified

- `lib/scraper-worker.js` - Core consolidation logic
- `lib/log-sanitizer.js` - Security sanitization module (new)
- `lib/content-enricher.js` - Uses consolidated fields
- Various test files for validation

## Future Improvements

1. **Batch Migration**: Script to update all existing pages with consolidated fields
2. **Validation Layer**: Enforce field naming at database level
3. **Type Safety**: TypeScript interfaces for metadata structure
4. **Monitoring**: Track consolidation success rate over time

## Related Documentation

- [Metadata Vectorization Plan](./METADATA_VECTORIZATION_PLAN.md)
- [Database Cleanup](./DATABASE_CLEANUP.md)
- [Turbo vs Force Rescrape](../TURBO_VS_FORCE_RESCRAPE.md)
