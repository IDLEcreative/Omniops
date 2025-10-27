# Scattered Chunks - Quick Reference

**Quick answers for developers working with the 15-chunk scattered search**

---

## What Are Scattered Chunks?

**Definition:** When `executeGetProductDetails` is called, it returns **15 chunks from MULTIPLE pages** (not all from one page).

**Example:** Query "10mtr extension cables" returns:
- 12 different pages
- Mix of exact matches, related products, category pages
- Total: 15 chunks, ~2100 tokens

---

## Why 15 Chunks?

From `lib/chat/tool-handlers.ts:174`:

```typescript
// Return more chunks (15 instead of 5) to ensure AI gets complete information
// even if some chunks are lower quality. AI can synthesize from multiple chunks.
const searchResults = await searchFn(enhancedQuery, browseDomain, 15, 0.3);
```

**Benefits:**
- ✅ More coverage of product variations
- ✅ Enables comparison shopping (5m, 10m, 20m cables)
- ✅ AI can synthesize across chunks
- ✅ Better for upselling

---

## Scattered vs. Full Page

| Feature | Scattered (`get_product_details`) | Full Page (`get_complete_page_details`) |
|---------|-----------------------------------|----------------------------------------|
| **Chunks** | 15 | 10-40 (depends on page) |
| **Sources** | 12+ pages | 1 page |
| **Use Case** | Product discovery, comparison | Deep dive into specific product |
| **Token Cost** | ~2100 tokens | ~4000-8000 tokens |
| **Speed** | Fast (<2s) | Slower (3-5s) |

**When to Use:**
- Use **scattered** for: "What 10mtr cables do you have?"
- Use **full page** for: "Tell me everything about product X"

---

## Code Locations

### Where 15 Chunks Are Set
```typescript
File: lib/chat/tool-handlers.ts
Line: 174
Function: executeGetProductDetails()

const searchResults = await searchFn(enhancedQuery, browseDomain, 15, 0.3);
//                                                               ^^  ^^^
//                                                               |   |
//                                                               |   similarity threshold (0.3)
//                                                               15 chunks
```

### Where Chunks Are Truncated
```typescript
File: lib/embeddings.ts
Line: 194
Function: searchSimilarContentOptimized()

content: row.content?.substring(0, 500) || '',
//                              ^^^^^^^
//                              500 chars per chunk
```

---

## Key Parameters

```typescript
executeGetProductDetails(
  productQuery: string,        // "10mtr extension cables"
  includeSpecs: boolean,       // true = add "specifications technical details features"
  domain: string,              // "thompsonseparts.co.uk"
  deps: ToolDependencies       // { getCommerceProvider, searchSimilarContent }
)
```

**Important:**
- `includeSpecs: true` → Query becomes "10mtr extension cables specifications technical details features"
- This helps find product pages with technical information

---

## Testing

Run the verification test:

```bash
npx tsx test-scattered-chunks-verification.ts
```

**What it tests:**
- ✅ Returns exactly 15 chunks
- ✅ Chunks from multiple pages (not just one)
- ✅ Contains price and SKU info
- ✅ Shows related products
- ✅ Reasonable token count

---

## Performance Metrics (Real Test Data)

```
Total Time: 1,650ms
├─ Domain Lookup: 62ms (cached)
├─ Generate Embedding: 369ms
├─ Vector Search: 177ms
└─ Total Search: 614ms

Results:
├─ Chunks: 15
├─ Unique Pages: 12
├─ Tokens: ~2,120
└─ Similarity Range: 0.493 - 0.613
```

---

## Fallback Behavior

The system tries commerce providers first, then falls back to semantic search:

```typescript
1. Try commerce provider (WooCommerce/Shopify)
   ↓ [FAILS: 401 Unauthorized]
2. Fall back to semantic search
   ↓ [SUCCESS: 15 chunks returned]
3. Return results to AI
```

**This is correct behavior** - semantic search is the safety net.

---

## Tuning Parameters

### Want More Results?
```typescript
// Change limit from 15 to 20
const searchResults = await searchFn(enhancedQuery, browseDomain, 20, 0.3);
```

### Want Higher Quality?
```typescript
// Increase similarity threshold from 0.3 to 0.4
const searchResults = await searchFn(enhancedQuery, browseDomain, 15, 0.4);
```

### Want Longer Chunks?
```typescript
// In embeddings.ts, change 500 to 1000
content: row.content?.substring(0, 1000) || '',
```

**Trade-offs:**
- More results = more tokens = slower + more expensive
- Higher threshold = fewer results = may miss relevant products
- Longer chunks = more context = more tokens

---

## Common Issues

### Issue: Not Getting 15 Chunks
**Possible Causes:**
- Domain has < 15 pages scraped
- Query too specific (no matches)
- Similarity threshold too high

**Debug:**
```typescript
console.log('[Function Call] Product details returned', searchResults.length, 'results');
```

### Issue: All Chunks from One Page
**This is normal IF:**
- Only one page matches the query well
- Other pages have low similarity scores

**Check:**
- Are there related products in the domain?
- Is the similarity threshold too high? (lower to 0.2)

### Issue: Token Count Too High
**Solution:**
- Reduce chunk truncation length (500 → 300 chars)
- Reduce chunk count (15 → 10 chunks)

---

## Quick Debug Commands

```bash
# Check domain has scraped pages
npx tsx test-database-cleanup.ts stats

# View search cache performance
npx tsx monitor-embeddings-health.ts check

# Test scattered chunks
npx tsx test-scattered-chunks-verification.ts
```

---

## Example Output (Abbreviated)

```
Query: "10mtr extension cables"
Results: 15 chunks from 12 pages

Chunk 1: 20mtr extension cables (similarity: 0.613)
Chunk 2: 10mtr extension cables (similarity: 0.601) ← EXACT MATCH
Chunk 3: 20mtr extension cables (similarity: 0.568)
Chunk 4: ECCO 10m 4-pin cable (similarity: 0.553)
Chunk 5: 5mtr extension cables (similarity: 0.541)
...
Chunk 15: Select range cables (similarity: 0.493)

AI can now:
✅ Answer "Do you have 10mtr cables?" → Yes (chunk 2)
✅ Compare "10mtr vs 20mtr?" → Both present (chunks 1, 2, 3)
✅ Upsell "Need longer?" → 20mtr available (chunk 1)
✅ Show alternatives → 5mtr, 15mtr also visible
```

---

## Related Documentation

- **Full Report:** [SCATTERED_CHUNKS_VERIFICATION_REPORT.md](SCATTERED_CHUNKS_VERIFICATION_REPORT.md)
- **Search Architecture:** [docs/01-ARCHITECTURE/search-architecture.md](docs/01-ARCHITECTURE/search-architecture.md)
- **Full Page Retrieval:** [docs/FULL_PAGE_RETRIEVAL.md](docs/FULL_PAGE_RETRIEVAL.md)
- **Tool Handlers:** [lib/chat/tool-handlers.ts](lib/chat/tool-handlers.ts)
- **Embeddings:** [lib/embeddings.ts](lib/embeddings.ts)

---

## Summary

**Scattered chunks work correctly:**
- ✅ 15 chunks from multiple pages
- ✅ ~2100 tokens (efficient)
- ✅ Includes exact matches + related products
- ✅ Fast performance (<2 seconds)
- ✅ Enables comparison and upselling

**No changes needed** - system is working as designed.
