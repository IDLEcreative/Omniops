**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# Fuzzy Matching Module

**Type:** Utility
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Dependencies:** [WooCommerce Provider](/home/user/Omniops/lib/agents/providers/woocommerce-provider.ts), [Product Details Tool](/home/user/Omniops/lib/chat/tool-handlers/product-details.ts), [Commerce Provider Interface](/home/user/Omniops/lib/agents/commerce-provider.ts)
**Estimated Read Time:** 3 minutes

## Purpose

Provides fuzzy string matching utilities for SKU suggestions when exact matches fail using Levenshtein distance algorithm.

## Overview

This module implements Levenshtein distance algorithm to suggest similar SKUs when users mistype product codes. Instead of returning "not found", the system suggests similar SKUs the user might have meant.

## Files

### `sku-matcher.ts`
Core fuzzy matching implementation using dynamic programming.

**Key Functions:**
- `findSimilarSkus(targetSku, availableSkus, maxDistance, maxSuggestions)` - Find similar SKUs within edit distance threshold

**Algorithm:** Levenshtein distance (minimum single-character edits)
**Complexity:** O(n*m) for distance calculation, O(k) for k SKUs in catalog
**Performance:** SKU cache in WooCommerce provider reduces repeated lookups by ~90%

## Usage Example

```typescript
import { findSimilarSkus } from '@/lib/fuzzy-matching/sku-matcher';

const availableSkus = ['MU110667602', 'MU110667611', 'BP-001'];
const suggestions = findSimilarSkus('MU110667601', availableSkus, 2, 3);

// Returns: [
//   { sku: 'MU110667602', distance: 1 },
//   { sku: 'MU110667611', distance: 1 }
// ]
```

## Integration Points

**WooCommerce Provider** (`lib/agents/providers/woocommerce-provider.ts`):
- When `getProductDetails()` finds no exact SKU or name match
- Fetches catalog SKUs (cached for 5 minutes)
- Returns suggestions object: `{ suggestions: string[] }`

**Product Details Tool** (`lib/chat/tool-handlers/product-details.ts`):
- Detects suggestions object in provider response
- Formats error message with "Did you mean?" suggestions
- Communicates suggestions to AI for user response

## User Experience

**Before Fuzzy Matching:**
```
User: "MU110667601"
System: "Product MU110667601 not found in catalog"
```

**After Fuzzy Matching:**
```
User: "MU110667601"
System: "Product MU110667601 not found in catalog

Did you mean one of these?
- MU110667602
- MU110667611
- MU110667501"
```

## Configuration

**Default Parameters:**
- `maxDistance`: 2 (allows up to 2 character edits)
- `maxSuggestions`: 3 (returns top 3 closest matches)
- `SKU_CACHE_TTL`: 5 minutes (in WooCommerce provider)

**Tuning Recommendations:**
- Increase `maxDistance` for longer SKUs (>15 chars)
- Decrease `maxDistance` for short SKUs to avoid false positives
- Adjust `SKU_CACHE_TTL` based on catalog update frequency

## Testing

**Unit Tests:** `__tests__/lib/fuzzy-matching/sku-matcher.test.ts`
**Integration Tests:** `__tests__/lib/agents/providers/woocommerce-fuzzy.test.ts`
**Coverage:** 17 unit tests + 10 integration tests = 27 total tests

**Run Tests:**
```bash
npm test -- sku-matcher.test.ts        # Unit tests
npm test -- woocommerce-fuzzy.test.ts  # Integration tests
```

## Performance Characteristics

**SKU Matching:**
- Time: O(n*m) per comparison, where n = target length, m = SKU length
- Space: O(n*m) for DP matrix
- Typical: <5ms for 100 SKUs with 10-char length

**Catalog Caching:**
- First lookup: ~150ms (fetches 100 products from API)
- Cached lookup: <1ms (memory access)
- Cache invalidation: 5 minutes

**Optimization:**
- SKUs cached in provider instance (per customer)
- Fuzzy matching only runs when exact match fails
- Limited to 100 products (adjustable via `per_page`)

## Error Handling

**Graceful Degradation:**
1. Exact SKU match attempted first
2. Name search attempted second
3. Fuzzy matching attempted last
4. If fuzzy match fails, returns `null` (standard not-found)

**Edge Cases:**
- Empty catalog → returns `null`
- No SKUs in catalog → returns `null`
- API error during catalog fetch → returns `null` (logged)
- Products without SKUs → filtered out before matching

## Future Enhancements

**Potential Improvements:**
- [ ] Phonetic matching (Soundex, Metaphone) for verbal queries
- [ ] Partial SKU matching ("110667" matches "MU110667601")
- [ ] Prefix/suffix prioritization (weight early characters higher)
- [ ] Machine learning for common typo patterns
- [ ] Multi-field fuzzy matching (SKU + name combined)

## Related Documentation

- [WooCommerce Provider Tests](../../__tests__/lib/agents/providers/woocommerce-provider.test.ts)
- [Product Details Tool Handler](../chat/tool-handlers/product-details.ts)
- [Commerce Provider Interface](../agents/commerce-provider.ts)
