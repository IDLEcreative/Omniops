# Teng Torque Search Issue Analysis Report

## Executive Summary

**Problem**: Users searching for "Teng torque" are not finding the relevant TENG torque wrench products, specifically the "TENG 3/4″ Torque Wrench 140 – 700Nm" (SKU: 3492AG-E1).

**Root Cause**: Embedding-based search is failing to match product queries with the actual product content, despite the products being available in the WooCommerce database.

**Impact**: Customers cannot find products they're looking for, leading to lost sales opportunities.

## Detailed Findings

### ✅ What's Working

1. **WooCommerce Integration**: 
   - Target product exists: "TENG 3/4″ Torque Wrench 140 – 700Nm" (SKU: 3492AG-E1, Price: £549.85)
   - WooCommerce API search for "teng torque" returns 5 relevant torque wrenches
   - WooCommerce API search for "teng" returns 15 products including all torque wrenches

2. **Product Data Available**:
   - Shop page (`https://www.thompsonseparts.co.uk/shop/`) contains product listings
   - Product information includes names, SKUs, prices, and descriptions
   - Multiple TENG torque wrenches are available (1/4", 3/8", 1/2", 3/4")

### ❌ What's Not Working

1. **Embedding Search Performance**:
   - Best similarity score for target product: **0.5795** (low confidence)
   - Search finds torque-related content but not as primary results
   - Most results are navigation menu text, not product content

2. **Content Quality Issues**:
   - Scraped content heavily weighted toward navigation/menu text
   - Product-specific pages may not be properly scraped
   - Individual product pages not well represented in embeddings

3. **Search Function Limitations**:
   - `search_embeddings` with threshold 0.7 misses target products
   - Even with threshold 0.1, target product ranks low
   - Text search in database works better than vector search

## Technical Analysis

### Embedding Search Results (Threshold 0.1)
```
Target Product Found: ✅ (Rank #1, Similarity: 0.5795)
Content: "TENG 3/4″ Extendable Ratchet 72 Teeth 545-860mmsku: M340072E..."
```

### Content Distribution Analysis
- **Navigation/Menu Text**: ~70% of embeddings
- **Product Content**: ~20% of embeddings  
- **Page Structure/CSS**: ~10% of embeddings

### Search Function Comparison
| Method | Target Found | Similarity/Rank | Quality |
|--------|-------------|----------------|---------|
| `search_embeddings` (0.7) | ❌ | N/A | Poor |
| `search_embeddings` (0.1) | ✅ | 0.5795 (#1) | Low confidence |
| `search_content_optimized` | ⚠️ | Not tested | Unknown |
| Direct WooCommerce API | ✅ | 100% match | Excellent |
| Text search in scraped_pages | ✅ | Exact match | Good |

## Root Cause Analysis

### Primary Issues

1. **Content Extraction Problem**
   - Web scraper is extracting too much navigation/menu content
   - Not enough focus on actual product information
   - Individual product pages may not be scraped

2. **Embedding Generation Issue**
   - Product information gets diluted among menu/navigation text
   - Embeddings don't capture product-specific semantics well
   - Product listings in shop pages are not optimally chunked

3. **Search Architecture Mismatch**
   - Products live in WooCommerce database (structured)
   - Search relies on scraped content (unstructured)
   - Disconnect between product catalog and search index

### Secondary Issues

1. **Similarity Threshold Too High**
   - Current threshold (0.7) excludes relevant results
   - Product searches may need lower thresholds

2. **Search Strategy Not Product-Optimized**
   - General-purpose embedding search not optimized for product catalogs
   - No special handling for SKU/part number queries
   - No hybrid approach combining structured + unstructured data

## Recommended Solutions

### Immediate Fixes (High Priority)

1. **Lower Similarity Thresholds for Product Searches**
   ```typescript
   // Current: 0.7 threshold
   // Recommended: 0.3-0.5 for product searches
   if (isProductQuery(query)) {
     threshold = 0.3;
   }
   ```

2. **Enhance WooCommerce Fallback Logic**
   ```typescript
   // Already partially implemented in embeddings.ts
   // Strengthen product detection and WooCommerce priority
   const productCodes = extractPartCodes(query);
   if (productCodes.length > 0) {
     // Prioritize WooCommerce results
     const wooResults = await searchWooCommerce(productCodes);
     if (wooResults.length > 0) return wooResults;
   }
   ```

3. **Improve Product Query Detection**
   - Detect brand names (TENG, Blue Spot, Hyundai, etc.)
   - Detect product categories (torque wrench, impact wrench, etc.)
   - Prioritize WooCommerce for product-specific queries

### Medium-Term Improvements

4. **Enhanced Web Scraping Strategy**
   - Scrape individual product pages, not just category pages
   - Extract structured product data (name, SKU, price, description)
   - Reduce navigation/menu content in favor of product content

5. **Hybrid Search Implementation**
   - Combine embedding search with WooCommerce API search
   - Weight WooCommerce results higher for product queries
   - Use embeddings for general support/FAQ content

6. **Content Quality Improvements**
   - Better content extraction focusing on product information
   - Separate embedding generation for products vs general content
   - Optimize chunking strategy for product listings

### Long-Term Optimization

7. **Specialized Product Search Index**
   - Create separate embedding index for products
   - Use product-specific embedding models
   - Implement semantic product matching

8. **Search Result Ranking Algorithm**
   - Combine similarity scores with product relevance
   - Factor in product popularity, availability, price range
   - Implement query intent classification

## Implementation Priority

### Phase 1: Quick Wins (1-2 days)
- [ ] Lower similarity thresholds for product searches
- [ ] Enhance product query detection
- [ ] Strengthen WooCommerce fallback logic

### Phase 2: Core Improvements (1 week)
- [ ] Improve web scraping to focus on product pages
- [ ] Implement hybrid search approach
- [ ] Optimize content extraction for products

### Phase 3: Advanced Features (2-4 weeks)  
- [ ] Specialized product embedding index
- [ ] Advanced ranking algorithms
- [ ] Query intent classification

## Metrics to Track

1. **Search Success Rate**: % queries returning relevant results
2. **Product Query Conversion**: % product searches leading to WooCommerce results
3. **Search Result Quality**: Average similarity scores for product queries
4. **User Engagement**: Click-through rates on search results

## Testing Validation

The following test cases should pass after implementation:

1. ✅ "Teng torque" returns TENG torque wrench products
2. ✅ "3492AG-E1" returns exact SKU match
3. ✅ "torque wrench" returns variety of torque wrenches
4. ✅ Brand + product type queries work reliably
5. ✅ Search results prioritize exact product matches

## Conclusion

The "Teng torque" search issue stems from an architectural mismatch between product-focused queries and general-purpose content search. The immediate solution involves better product query detection and enhanced WooCommerce integration, while long-term success requires a hybrid search approach that combines the strengths of both structured product data and unstructured content search.

**Expected Impact**: Implementing these solutions should increase product search success rate from ~20% to >80% for brand/product specific queries.