# Semantic Search & Recommendations Improvements

**Status:** Proposal
**Last Updated:** 2025-11-15
**Type:** Analysis
**Purpose:** Identify opportunities to improve search UX using semantic similarities and intelligent recommendations

## Current State

### What Works Now ✅

**Parallel Search Implementation:**
- ✅ AI uses BOTH tools in parallel for product searches
- ✅ `woocommerce_operations` → Live catalog (prices, stock, SKUs)
- ✅ `search_website_content` → Scraped pages (descriptions, context, URLs)

**Semantic Search:**
- ✅ Vector search DOES return similarity scores (0-1 range)
- ✅ Uses OpenAI embeddings (text-embedding-ada-002)
- ✅ Hybrid search (vector + keyword) for better results

### What's Missing ❌

1. **WooCommerce results have NO similarity scores** - We don't know how relevant each product is to the query
2. **No cross-referencing** - WooCommerce and scraped results aren't matched/enriched
3. **No intelligent recommendations** - We're not using similarity for "related products"
4. **No explanations** - Users don't see WHY products were suggested
5. **No semantic ranking** - Products ranked by WooCommerce relevance only, not semantic similarity

---

## Proposed Improvements

### 1. Add Semantic Similarity to WooCommerce Results

**Problem:** WooCommerce API returns products but no relevance/similarity scores.

**Solution:** Calculate semantic similarity between query and product names/descriptions.

**Implementation:**
```typescript
// lib/agents/providers/woocommerce-provider.ts

import { generateQueryEmbedding } from '@/lib/embeddings/query-embedding';
import { calculateCosineSimilarity } from '@/lib/embeddings/similarity';

async searchProducts(query: string, limit: number = 10): Promise<any[]> {
  try {
    const products = await this.client.getProducts({
      search: query,
      per_page: limit * 2, // Get more, then rank by similarity
      status: 'publish',
    });

    // Generate query embedding
    const queryEmbedding = await generateQueryEmbedding(query, false);

    // Calculate similarity for each product
    const productsWithSimilarity = await Promise.all(
      products.map(async (product) => {
        // Create searchable text from product
        const productText = `${product.name} ${product.short_description || ''} ${product.description || ''}`;

        // Generate product embedding (with caching)
        const productEmbedding = await generateQueryEmbedding(productText, true);

        // Calculate similarity
        const similarity = calculateCosineSimilarity(queryEmbedding, productEmbedding);

        return {
          ...product,
          similarity, // Add similarity score
          relevanceReason: similarity > 0.8 ? 'Highly relevant' :
                          similarity > 0.6 ? 'Moderately relevant' :
                          'Loosely related'
        };
      })
    );

    // Sort by similarity and return top N
    return productsWithSimilarity
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

  } catch (error) {
    console.error('[WooCommerce Provider] Product search error:', error);
    return [];
  }
}
```

**Benefits:**
- 📊 Know exactly how relevant each product is (0-1 score)
- 🎯 Better ranking (sort by semantic similarity, not just keyword match)
- 💡 Can explain WHY a product was recommended

**Caveat:** Adds ~500-1000ms per search (embedding generation). Use caching!

---

### 2. Cross-Reference Enrichment

**Problem:** WooCommerce results and scraped content are separate. We don't link them.

**Solution:** Match WooCommerce products with scraped pages using product URLs/names.

**Implementation:**
```typescript
// lib/chat/search-consolidator.ts

interface ConsolidatedResult {
  product: WooCommerceProduct;
  scrapedContent?: ScrapedPage;
  similarity: number;
  enrichedDescription: string;
  relatedPages: ScrapedPage[];
}

async function consolidateSearchResults(
  woocommerceResults: any[],
  scrapedResults: SearchResult[]
): Promise<ConsolidatedResult[]> {

  return woocommerceResults.map((product) => {
    // Find matching scraped page by URL
    const matchedPage = scrapedResults.find(scraped =>
      scraped.url.includes(product.slug) ||
      scraped.title.includes(product.name)
    );

    // Find related pages by semantic similarity
    const relatedPages = scrapedResults
      .filter(scraped => scraped.similarity > 0.7)
      .slice(0, 3); // Top 3 related

    // Enrich description with scraped content
    const enrichedDescription = matchedPage
      ? `${product.short_description}\n\n${matchedPage.content}`
      : product.short_description;

    return {
      product,
      scrapedContent: matchedPage,
      similarity: product.similarity || matchedPage?.similarity || 0,
      enrichedDescription,
      relatedPages
    };
  });
}
```

**Benefits:**
- 📚 Richer product information (live data + scraped content)
- 🔗 Can show "Related pages" or "Learn more" links
- 📝 Better descriptions for AI to work with

---

### 3. Intelligent Recommendations

**Problem:** No "related products" or "customers also bought" features.

**Solution:** Use semantic similarity to find related products.

**Implementation:**
```typescript
// lib/recommendations/semantic-recommender.ts

async function getRelatedProducts(
  productId: string,
  limit: number = 5
): Promise<RelatedProduct[]> {

  // Get current product
  const product = await woocommerceProvider.getProductDetails(productId);

  // Generate embedding for current product
  const productText = `${product.name} ${product.description}`;
  const productEmbedding = await generateQueryEmbedding(productText, true);

  // Get all products and calculate similarities
  const allProducts = await woocommerceProvider.getAllProducts();

  const similarities = await Promise.all(
    allProducts
      .filter(p => p.id !== productId) // Exclude current product
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

  // Return top N most similar
  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}
```

**Use Cases:**
1. **Product Detail Pages:** "Customers also viewed"
2. **Cart Recommendations:** "You might also need..."
3. **Search Results:** "Similar products you might like"
4. **Out of Stock:** "Try these similar alternatives"

**Example AI Response:**
```
I found the Bodyline Nitrile Gloves you're looking for:
- Bodyline Nitrile Gloves Large — £10.85

Based on semantic similarity, customers who viewed this also looked at:
- Bodyline Nitrile Gloves X-Large — £10.85 (98% similar)
- Anti-Vibration Gloves Large — £43.50 (72% similar - different use case)
- Latex Gloves Disposable — £8.50 (85% similar material)

Would you like to add any of these to your cart?
```

---

### 4. Explain Relevance to Users

**Problem:** Users don't know WHY a product was recommended.

**Solution:** Show similarity scores and reasons in AI responses.

**Implementation:**
```typescript
// Add to system prompt

**When presenting search results:**
1. Show similarity scores for transparency
2. Explain WHY each product was matched
3. Highlight key matching attributes

**Example:**
User: "I need waterproof gloves for working outside"

✅ GOOD Response:
"I found 3 glove options that match your needs:

1. **Heavy Duty Waterproof Gloves** — £24.99 (95% match)
   - ✅ Waterproof (key requirement)
   - ✅ Designed for outdoor use
   - ✅ Heavy-duty construction

2. **Nitrile Work Gloves** — £10.85 (72% match)
   - ✅ Water-resistant (partial match)
   - ⚠️ Not fully waterproof
   - ✅ Good for light outdoor work

3. **Latex Gloves** — £8.50 (45% match)
   - ⚠️ Not waterproof
   - ❌ Not suitable for outdoor work
   - Suggested because: gloves category"

❌ BAD Response:
"Here are some gloves:
1. Heavy Duty Waterproof Gloves — £24.99
2. Nitrile Work Gloves — £10.85
3. Latex Gloves — £8.50"
```

**Benefits:**
- 🎯 Users understand why products were recommended
- 📊 Transparency builds trust
- ✅ Helps users make informed decisions
- ⚡ Reduces "that's not what I wanted" responses

---

### 5. Smart Result Ranking

**Problem:** Results ranked by WooCommerce search only (keyword matching).

**Solution:** Combine multiple ranking signals:

```typescript
// lib/search/result-ranker.ts

interface RankingSignal {
  semanticSimilarity: number;    // 0-1 from embeddings
  keywordMatch: number;          // 0-1 from WooCommerce search
  priceMatch: number;            // 0-1 if within user's budget
  stockAvailability: number;     // 1 if in stock, 0.5 if backorder, 0 if out
  popularity: number;            // 0-1 based on sales/views
  recency: number;               // 0-1 newer = higher
}

function calculateFinalScore(signals: RankingSignal): number {
  // Weighted scoring
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

**Benefits:**
- 🎯 Better results (not just keyword matching)
- 📦 Prioritizes in-stock items
- 💰 Respects user's budget if mentioned
- ⭐ Incorporates popularity/reviews

---

### 6. Conversational Refinement

**Problem:** First search might not be perfect. No way to refine.

**Solution:** Use similarity scores to offer refinements.

**Example Flow:**
```
User: "I need gloves"

AI: "I found 12 glove products. Based on your query, I see:
- Work gloves (8 products, avg similarity: 0.85)
- Medical gloves (3 products, avg similarity: 0.75)
- Winter gloves (1 product, avg similarity: 0.60)

Which type are you interested in? Or I can show you all 12."

User: "Work gloves"

AI: "Great! Here are 8 work glove options, ranked by relevance:
1. Heavy Duty Work Gloves (92% match)
2. Leather Work Gloves (89% match)
..."
```

**Benefits:**
- 🎯 Helps users narrow down results
- 🤔 Handles ambiguous queries gracefully
- 💬 More conversational, less robotic

---

## Implementation Priority

### Phase 1: Quick Wins (1-2 days)
1. ✅ Add similarity scoring to WooCommerce results
2. ✅ Show relevance scores in AI responses
3. ✅ Cross-reference WooCommerce + scraped content by URL

### Phase 2: Recommendations (3-5 days)
4. ✅ Implement semantic product recommendations
5. ✅ Add "related products" to search results
6. ✅ Create recommendation caching layer

### Phase 3: Advanced (1 week)
7. ✅ Multi-signal ranking system
8. ✅ Conversational refinement flows
9. ✅ A/B test different ranking weights

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

## Performance Considerations

### Embedding Generation Costs
- **Per product:** ~500ms + API cost
- **Mitigation:** Cache embeddings in database
- **One-time cost:** Generate embeddings during product sync

### Similarity Calculation
- **Per comparison:** <1ms (cosine similarity is fast)
- **10 products:** ~10ms total
- **Negligible impact**

### Caching Strategy
```typescript
// Cache product embeddings in database
CREATE TABLE product_embeddings (
  product_id TEXT PRIMARY KEY,
  embedding VECTOR(1536),
  updated_at TIMESTAMP DEFAULT NOW()
);

// Invalidate on product update
CREATE OR REPLACE FUNCTION invalidate_product_embedding()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM product_embeddings WHERE product_id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Result:** Subsequent searches are FAST (no re-embedding).

---

## Conclusion

**The parallel search is working great!** Now we can enhance it with:

1. ✅ **Semantic similarity scores** - Know exactly how relevant each product is
2. ✅ **Intelligent recommendations** - "Customers also viewed"
3. ✅ **Cross-referencing** - Enrich WooCommerce with scraped content
4. ✅ **Transparency** - Show users WHY products were suggested
5. ✅ **Smart ranking** - Combine multiple signals for best results

All of this leverages the existing embedding infrastructure and parallel search - we're just using the data more intelligently! 🚀
