# Search Enhancement Roadmap - Phase 2

**Date:** 2025-11-15
**Status:** Planning
**Type:** Analysis
**Purpose:** Prioritized improvements now that parallel search is working

## Current State: 8/10 ⭐⭐⭐⭐⭐⭐⭐⭐

### ✅ What's Working
- Parallel tool execution (2 tools simultaneously)
- Result consolidation (WooCommerce + scraped content)
- Search tracking and telemetry
- Semantic similarity for scraped content (0.9 relevance scores)

### ❌ What's Missing
- WooCommerce results have NO similarity scores (hardcoded relevance = 1)
- No cross-referencing between WooCommerce products and scraped pages
- No "related products" recommendations
- No explanations of WHY products were suggested
- Single-signal ranking (WooCommerce relevance only)

---

## 🎯 Priority 1: Add Semantic Scoring to WooCommerce Results
**Impact:** HIGH | **Effort:** MEDIUM | **Time:** 1-2 days

### Problem
WooCommerce API returns products but we don't know HOW relevant they are:
```json
{
  "title": "Bodyline Nitrile Gloves",
  "relevance": 1  // ❌ Hardcoded, not calculated
}
```

### Solution
Calculate semantic similarity between query and product names/descriptions:

```typescript
// lib/agents/providers/woocommerce-provider.ts

async searchProducts(query: string, limit: number = 10): Promise<any[]> {
  // 1. Get products from WooCommerce API
  const products = await this.client.getProducts({
    search: query,
    per_page: limit * 2, // Get more, then rank by similarity
  });

  // 2. Generate query embedding
  const queryEmbedding = await generateQueryEmbedding(query, false);

  // 3. Calculate similarity for each product
  const productsWithSimilarity = await Promise.all(
    products.map(async (product) => {
      const productText = `${product.name} ${product.short_description || ''}`;
      const productEmbedding = await generateQueryEmbedding(productText, true);
      const similarity = calculateCosineSimilarity(queryEmbedding, productEmbedding);

      return {
        ...product,
        similarity,
        relevanceReason: similarity > 0.8 ? 'Highly relevant' :
                        similarity > 0.6 ? 'Moderately relevant' :
                        'Loosely related'
      };
    })
  );

  // 4. Sort by similarity and return top N
  return productsWithSimilarity
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}
```

### Benefits
- 📊 Know exactly how relevant each product is (0-1 score)
- 🎯 Better ranking (semantic similarity > keyword match)
- 💡 Can explain WHY products were recommended
- 🔍 Filter out loosely-related results

### Performance Impact
- **Cost:** ~500-1000ms per search (embedding generation)
- **Mitigation:** Cache product embeddings in database
- **One-time setup:** Pre-generate embeddings for all products

### Implementation Steps
1. Create `lib/embeddings/product-embeddings.ts` for embedding generation
2. Add `calculateCosineSimilarity()` function
3. Update WooCommerceProvider to calculate similarities
4. Add database table for cached product embeddings
5. Create migration script to pre-generate embeddings

---

## 🎯 Priority 2: Cross-Reference Results
**Impact:** HIGH | **Effort:** MEDIUM | **Time:** 2-3 days

### Problem
WooCommerce products and scraped pages are separate - no linking:
```
WooCommerce says:
  - Bodyline Nitrile Gloves, £10.85, SKU: BDPBNGL

Scraped content says:
  - URL: /product/nitrile-gloves-large-box-100/
  - Description: "Premium quality nitrile gloves..."

They're NOT linked! ❌
```

### Solution
Match products with their scraped pages by URL/name:

```typescript
// lib/chat/result-consolidator.ts

interface EnrichedProduct {
  product: WooCommerceProduct;
  scrapedPage?: ScrapedPage;
  similarity: number;
  enrichedDescription: string;
  relatedPages: ScrapedPage[];
}

async function consolidateResults(
  woocommerceResults: any[],
  scrapedResults: SearchResult[]
): Promise<EnrichedProduct[]> {

  return woocommerceResults.map((product) => {
    // Find matching scraped page by URL slug
    const matchedPage = scrapedResults.find(scraped =>
      scraped.url.includes(product.slug) ||
      scraped.title.toLowerCase().includes(product.name.toLowerCase())
    );

    // Find related pages by semantic similarity
    const relatedPages = scrapedResults
      .filter(scraped => scraped.similarity > 0.7)
      .slice(0, 3);

    // Enrich description with scraped content
    const enrichedDescription = matchedPage
      ? `${product.short_description}\n\n${matchedPage.content}`
      : product.short_description;

    return {
      product,
      scrapedPage: matchedPage,
      similarity: product.similarity || matchedPage?.similarity || 0,
      enrichedDescription,
      relatedPages
    };
  });
}
```

### Benefits
- 📚 Richer product information (live data + scraped content)
- 🔗 Can show "Learn more" links to product pages
- 📝 Better descriptions for AI to work with
- 🎯 More context for better responses

### Example Output
```
Before:
  - Bodyline Nitrile Gloves, £10.85

After:
  - Bodyline Nitrile Gloves, £10.85
  - Learn more: thompsonseparts.co.uk/product/nitrile-gloves-large
  - "Premium quality nitrile gloves ideal for general use..."
  - Related: Safety Glasses, Work Boots
```

---

## 🎯 Priority 3: Intelligent Recommendations
**Impact:** MEDIUM-HIGH | **Effort:** MEDIUM-HIGH | **Time:** 3-5 days

### Problem
No personalized product suggestions when customers are already browsing specific items.

### Solution
Use semantic similarity to find related products and present them conversationally:

```typescript
// lib/recommendations/semantic-recommender.ts

async function getRelatedProducts(
  productId: string,
  limit: number = 5
): Promise<RelatedProduct[]> {

  // Get current product
  const product = await getProductDetails(productId);

  // Generate embedding for current product
  const productText = `${product.name} ${product.description}`;
  const productEmbedding = await generateQueryEmbedding(productText, true);

  // Get all products and calculate similarities
  const allProducts = await getAllProducts();

  const similarities = await Promise.all(
    allProducts
      .filter(p => p.id !== productId)
      .map(async (p) => {
        const pText = `${p.name} ${p.description}`;
        const pEmbedding = await generateQueryEmbedding(pText, true);
        const similarity = calculateCosineSimilarity(productEmbedding, pEmbedding);

        return {
          product: p,
          similarity,
          reason: similarity > 0.85 ? 'Very similar product' :
                  similarity > 0.75 ? 'Related product' :
                  'In same category'
        };
      })
  );

  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}
```

### Use Cases
1. **During Product Search:** "Since you're looking at X, you might also like..."
2. **Cart Suggestions:** "You might also need..."
3. **Search Results:** "You might also like these similar options..."
4. **Out of Stock:** "How about these similar alternatives?"

### Example AI Response
```
User: "Do you have nitrile gloves?"

AI: "Yes! I found Bodyline Nitrile Gloves Large for £10.85.

Since you're looking at nitrile gloves, you might also like:
- Bodyline Nitrile Gloves X-Large — £10.85 (if you need a larger size)
- Latex Gloves Disposable — £8.50 (similar protection, different material)
- Anti-Vibration Gloves — £43.50 (for heavy-duty work requiring hand protection)

Would you like more details about any of these?"
```

**Why This Works:**
- **Personal:** Uses "you" instead of "customers" or third-person language
- **Persuasive:** Frames suggestions as helpful options, not just data
- **Natural:** Sounds like a helpful salesperson, not a database query
- **Contextual:** Explains WHY each suggestion makes sense for their search

### Benefits
- 📈 Increase cart sizes through natural, helpful suggestions
- 🔍 Better product discovery with personalized recommendations
- 💰 Higher average order value without feeling pushy
- ✨ Conversational, personal shopping experience (not robotic)

---

## 🎯 Priority 4: Relevance Explanations
**Impact:** MEDIUM | **Effort:** LOW-MEDIUM | **Time:** 1-2 days

### Problem
Users don't know WHY products were recommended:

```
❌ BAD:
"Here are some gloves:
1. Nitrile Gloves — £10.85
2. Anti-Vibration Gloves — £43.50"

✅ GOOD:
"I found these glove options ranked by relevance:

1. Nitrile Gloves — £10.85 (98% match)
   ✅ Exact match: disposable gloves
   ✅ Popular choice for general use

2. Anti-Vibration Gloves — £43.50 (72% match)
   ⚠️ Different use case (vibration dampening)
   ✅ Still protective gloves for work"
```

### Solution
Update system prompt to include relevance explanations:

```typescript
// lib/chat/system-prompts/sections/response-formatting.ts

**When presenting search results:**
1. Show similarity scores for transparency (if > 0.8)
2. Explain WHY each product was matched
3. Highlight key matching attributes
4. Use checkmarks ✅ for matches, warnings ⚠️ for caveats

**Example:**
User: "I need waterproof gloves"

Response:
"I found 3 glove options:

1. **Heavy Duty Waterproof Gloves** — £24.99 (95% match)
   - ✅ Waterproof (key requirement met)
   - ✅ Designed for outdoor use
   - ✅ Heavy-duty construction

2. **Nitrile Work Gloves** — £10.85 (72% match)
   - ✅ Water-resistant (partial match)
   - ⚠️ Not fully waterproof
   - ✅ Good for light outdoor work"
```

### Benefits
- 🎯 Users understand why products were suggested
- 📊 Transparency builds trust
- ✅ Helps users make informed decisions
- ⚡ Reduces "that's not what I wanted" responses

---

## 🎯 Priority 5: Multi-Signal Ranking
**Impact:** HIGH | **Effort:** HIGH | **Time:** 5-7 days

### Problem
Results ranked by WooCommerce search only (keyword matching).

### Solution
Combine multiple ranking signals:

```typescript
// lib/search/result-ranker.ts

interface RankingSignal {
  semanticSimilarity: number;    // 0-1 from embeddings
  keywordMatch: number;          // 0-1 from WooCommerce search
  priceMatch: number;            // 0-1 if within user's budget
  stockAvailability: number;     // 1 if in stock, 0.5 backorder, 0 out
  popularity: number;            // 0-1 based on sales/views
  recency: number;               // 0-1 newer = higher
}

function calculateFinalScore(signals: RankingSignal): number {
  return (
    signals.semanticSimilarity * 0.40 +  // 40% - most important
    signals.keywordMatch * 0.25 +        // 25% - still important
    signals.stockAvailability * 0.20 +   // 20% - in stock preferred
    signals.priceMatch * 0.10 +          // 10% - budget consideration
    signals.popularity * 0.03 +          // 3% - social proof
    signals.recency * 0.02               // 2% - freshness
  );
}
```

### Benefits
- 🎯 Much better result quality
- 📦 Prioritizes in-stock items
- 💰 Respects user's budget (if mentioned)
- ⭐ Incorporates popularity/reviews

### Example
```
User: "I need affordable gloves under £15"

Current: Returns all gloves sorted by WooCommerce relevance
Improved: Returns gloves under £15, sorted by similarity + price + stock
```

---

## 🎯 Priority 6: Conversational Refinement
**Impact:** MEDIUM | **Effort:** MEDIUM | **Time:** 2-3 days

### Problem
First search might not be perfect - no way to refine.

### Solution
Use similarity scores to offer refinements:

```
User: "I need gloves"

AI: "I found 12 glove products. Based on your query, I see:
- Work gloves (8 products, avg similarity: 0.85)
- Medical gloves (3 products, avg similarity: 0.75)
- Winter gloves (1 product, avg similarity: 0.60)

Which type are you interested in?"

User: "Work gloves"

AI: "Great! Here are 8 work glove options, ranked by relevance:
1. Heavy Duty Work Gloves (92% match)
2. Leather Work Gloves (89% match)
..."
```

### Benefits
- 🎯 Helps users narrow down results
- 🤔 Handles ambiguous queries gracefully
- 💬 More conversational, less robotic

---

## Implementation Strategy

### Phase 2A: Quick Wins (Week 1)
1. ✅ Add semantic scoring to WooCommerce results
2. ✅ Show relevance scores in AI responses
3. ✅ Cross-reference WooCommerce + scraped content by URL

**Goal:** 8/10 → 8.5/10

### Phase 2B: Recommendations (Week 2-3)
4. ✅ Implement semantic product recommendations
5. ✅ Add "related products" to search results
6. ✅ Create recommendation caching layer

**Goal:** 8.5/10 → 9/10

### Phase 2C: Advanced (Week 4)
7. ✅ Multi-signal ranking system
8. ✅ Conversational refinement flows
9. ✅ A/B test different ranking weights

**Goal:** 9/10 → 9.5/10 ⭐⭐⭐⭐⭐⭐⭐⭐⭐☆

---

## Expected Impact

### User Experience
- 📈 **Better relevance:** Users find what they want faster
- 🎯 **More discoveries:** Semantic similarity reveals related products
- 💬 **More natural:** AI explains why products were suggested
- ⚡ **Faster decisions:** Clear relevance scores + explanations

### Business Metrics
- 📊 **Higher conversion:** Better product matches = more sales
- 🛒 **Larger cart sizes:** Related product recommendations
- ⭐ **Better satisfaction:** Fewer "that's not what I wanted"
- 🔄 **Lower returns:** More accurate matches = right products ordered

### Technical Benefits
- 🚀 **Reusable components:** Similarity functions work for any domain
- 📊 **Data insights:** Learn what products are truly related
- 🎯 **Better AI:** Richer context = smarter responses
- 🔧 **Easy A/B testing:** Try different ranking strategies

---

## Which Should We Build First?

**Recommendation:** Start with **Priority 1 (Semantic Scoring)** because:
1. **Foundation for everything else** - Need similarity scores for recommendations, ranking, explanations
2. **High impact, medium effort** - Best ROI
3. **Visible improvement** - Users immediately see better ranked results
4. **Enables A/B testing** - Can compare semantic vs keyword ranking

Would you like me to implement Priority 1 first?
