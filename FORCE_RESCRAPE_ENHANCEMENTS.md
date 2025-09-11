# Force Rescrape Enhancements Summary

## Overview
Enhanced the force rescrape functionality to properly update all content and metadata, including advanced e-commerce data extraction.

## Key Improvements

### 1. Skip Deduplication on Force Rescrape
**Location:** `lib/scraper-worker.js` line ~743

When `--force` flag is used, the scraper now completely bypasses the deduplicator:
```javascript
if (FORCE_RESCRAPE) {
  console.log(`[Worker ${jobId}] Force rescrape enabled - skipping deduplication for ${pageUrl}`);
  return nonBoilerplateChunks;
}
```
- **Impact:** Ensures all content is reprocessed and saved
- **Benefit:** Updates are guaranteed, not filtered out

### 2. Advanced E-commerce Data Extraction
**Location:** `lib/scraper-worker.js` line ~1020-1058

Integrated the existing but unused `EcommerceExtractor` class:
```javascript
const ecommerceExtracted = await EcommerceExtractor.extractEcommerce(html, pageUrl);
```

This extracts:
- **Product Information:**
  - Name, SKU, description, brand
  - Price (parsed and raw formats)
  - Availability/stock status
  - Product images
  - Ratings and reviews
  - Specifications and variants

- **Page Classification:**
  - Platform detection (WooCommerce, Shopify, etc.)
  - Page type (product, category, search, cart)
  - Breadcrumbs and pagination

- **Extraction Methods (in priority order):**
  1. Learned patterns (AI-based)
  2. JSON-LD structured data
  3. Microdata/Schema.org
  4. DOM scraping with platform-specific selectors

### 3. Comprehensive Metadata Storage
**Location:** `lib/scraper-worker.js` line ~1097-1109

Enhanced metadata now includes:
```javascript
metadata: {
  businessInfo: { phones, emails, addresses, businessHours },
  ecommerceData: { platform, pageType, products, pagination },
  extractedAt: timestamp,
  // Top-level product fields for easy querying
  productName, productSku, productPrice, productInStock
}
```

## What Was Already There

The codebase already had sophisticated extraction capabilities that weren't being utilized:

1. **Business Info Extraction** (`extractBusinessInfo`)
   - Phone numbers, emails, addresses
   - Business hours
   - Contact information

2. **EcommerceExtractor Class** (`lib/ecommerce-extractor.js`)
   - Full product extraction with multiple strategies
   - Platform detection
   - Pattern learning from successful extractions
   - Price parsing with currency support

3. **Supporting Infrastructure:**
   - `ProductNormalizer` - standardizes product data
   - `PatternLearner` - learns extraction patterns
   - `PriceParser` - handles various price formats
   - `MetadataExtractor` - additional metadata extraction

## How It Works Now

When running with `--force`:

1. **Pages are re-downloaded** regardless of recency
2. **Deduplication is completely skipped** 
3. **E-commerce extraction runs first** to get product data
4. **Business info extraction** captures contact details
5. **Records are UPDATED** via upsert (not duplicated)
6. **All metadata is preserved** in JSONB format
7. **Embeddings are regenerated** with fresh content

## Usage

```bash
# Force rescrape with full metadata extraction
npm run scraper:crawl -- https://www.thompsonseparts.co.uk --force
```

## What Gets Updated

- ✅ **Product prices** - captured from multiple selectors
- ✅ **Stock availability** - in-stock/out-of-stock status
- ✅ **Product SKUs** - unique identifiers
- ✅ **Product descriptions** - full text content
- ✅ **Business contact info** - phones, emails, addresses
- ✅ **Page content** - full HTML text extraction
- ✅ **Embeddings** - regenerated for semantic search
- ✅ **Timestamps** - tracks when data was last updated

## Database Impact

The updates are stored in the `scraped_pages` table:
- `content` - full text content
- `metadata` (JSONB) - all structured data including:
  - `businessInfo` - contact details
  - `ecommerceData` - products and page info
  - `productName`, `productSku`, `productPrice`, `productInStock` - denormalized for queries
- `updated_at` - timestamp of last update

## Performance Considerations

- **Memory Usage:** Without deduplication, memory usage will be higher
- **Processing Time:** E-commerce extraction adds ~100-200ms per page
- **Database Writes:** Every page will trigger an update
- **Embeddings:** All embeddings are regenerated (API costs)

## Monitoring

During force rescrape, the logs will show:
```
[Worker] Force rescrape enabled - skipping deduplication for URL
[Worker] Extracted N products from URL
[Worker] Product: { name, sku, price, availability }
[Worker] Force rescrape metadata for URL: { ... }
```

## Next Steps

Consider implementing:
1. Batch database updates for better performance
2. Selective field updates (only changed fields)
3. Webhook notifications for price changes
4. Historical tracking of price/availability changes
5. Scheduled force rescrapes for product monitoring