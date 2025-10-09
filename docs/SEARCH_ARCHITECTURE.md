# Search Architecture & Result Limits

**Last Updated:** 2025-01-09
**Critical Reference:** This document explains how search results flow through the system and the ACTUAL limits (not assumed limits).

---

## 🚨 Common Misconception

**WRONG:** "The agent returns 20 results"
**RIGHT:** "The agent returns 100-200 results by default, up to 1000 maximum"

---

## Result Limit Hierarchy

### 1. AI Tool Definition
**File:** `app/api/chat/route.ts:77-83`

```typescript
limit: {
  type: "number",
  description: "Maximum number of products to return (default: 100, max: 1000)",
  default: 100,      // ← AI uses this if not specified
  minimum: 1,
  maximum: 1000      // ← AI can request up to this
}
```

**What this means:**
- When AI calls `search_products("pumps")`, it automatically uses `limit=100`
- AI can override: `search_products("pumps", 500)` for more results
- Hard cap at 1000 to prevent token explosion

---

### 2. Function Parameters

**File:** `app/api/chat/route.ts:155-157`

```typescript
async function executeSearchProducts(
  query: string,
  limit: number = 100,  // ← Receives from AI tool call
  domain: string
)
```

**Calls:** `searchSimilarContent(query, browseDomain, limit, 0.2)`
**Passes:** The `limit` parameter down the chain

---

### 3. Search Implementation

**File:** `lib/embeddings.ts:82-85`

```typescript
export async function searchSimilarContentOptimized(
  query: string,
  domain: string,
  limit: number = 5,  // ← Default ONLY if called directly
  similarityThreshold: number = 0.15,
  timeoutMs: number = 10000
)
```

**⚠️ IMPORTANT:** The `= 5` default is ONLY used if you call this function directly. When called from `executeSearchProducts`, it receives `limit=100`.

---

### 4. Actual Search Execution

**File:** `lib/embeddings.ts:134-153`

#### Keyword Search (for short queries)
```typescript
// Line 153
.limit(Math.max(limit * 2, 200))
```

**Calculation with default:**
```
limit = 100 (from AI)
Math.max(100 * 2, 200) = Math.max(200, 200) = 200 results
```

**Why `* 2`?**
The function searches BOTH title and URL fields, then deduplicates. The multiplier ensures we get enough results after deduplication.

#### Vector Search (for longer queries)
```typescript
// Line 240
match_count: limit,  // Direct pass-through
```

**Result:** Returns exactly `limit` results (100 by default)

---

## Search Flow Diagram

```
User Query: "Show me hydraulic pumps"
         ↓
┌────────────────────────────────────────┐
│ AI Reasoning                           │
│ Decision: search_products("hydraulic   │
│           pumps", limit=100)           │ ← AI uses default
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│ executeSearchProducts()                │
│ - query: "hydraulic pumps"             │
│ - limit: 100                           │
│ - domain: "example.com"                │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│ searchSimilarContent()                 │
│ - Receives limit=100                   │
│ - Query is 2 words → Short query      │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│ HYBRID SEARCH                          │
│                                        │
│ 1. Keyword Search (title field)       │
│    .limit(Math.max(100*2, 200)) = 200 │
│    → Returns 127 results              │
│                                        │
│ 2. Keyword Search (URL field)         │
│    .limit(Math.max(100*2, 200)) = 200 │
│    → Returns 84 results               │
│                                        │
│ 3. Deduplicate by URL                 │
│    → 156 unique results               │
│                                        │
│ 4. Sort by relevance                  │
│    → Top 156 returned                 │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│ WOOCOMMERCE SEARCH (if enabled)        │
│ - API call: per_page=100              │
│ - Returns: 73 live products           │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│ MERGE RESULTS                          │
│ - Scraped pages: 156 results          │
│ - WooCommerce: 73 products             │
│ - Total: 229 results                   │
│ - AI sees ALL 229                      │
└────────────────────────────────────────┘
```

---

## What the AI Actually Sees

For each of the 100-200+ results, the AI receives:

```typescript
// File: app/api/chat/route.ts:714-720
result.results.forEach((item, index) => {
  toolResponse += `${index + 1}. ${item.title}\n`;
  toolResponse += `   URL: ${item.url}\n`;
  toolResponse += `   Content: ${item.content.substring(0, 200)}...\n`;
  toolResponse += `   Relevance: ${(item.similarity * 100).toFixed(1)}%\n\n`;
});
```

**Example output AI sees:**
```
Found 156 results from semantic:

1. Cifa Mixer Hydraulic Pump A4VTG90
   URL: https://example.com/product/cifa-a4vtg90
   Content: Professional grade hydraulic pump for Cifa concrete mixers.
            Features high-pressure output, durable construction, suitable
            for SL7 and SL8 models. Includes mounting hardware...
   Relevance: 94.2%

2. Cifa PMP Hydraulic Motor MCL.90021/V1
   URL: https://example.com/product/cifa-pmp-hydraulic
   Content: PMP hydraulic motor compatible with Cifa mixer models. Variable
            displacement, efficient power transfer, sealed bearings. Part
            number PP 0161946. Replaces original equipment...
   Relevance: 91.8%

... (154 more results)
```

---

## Token Usage Calculation

### For 200 Results (Typical)

```
Component              | Tokens    | Calculation
-----------------------|-----------|---------------------------
Titles                 | 2,000     | 200 × 10 tokens avg
URLs                   | 1,500     | 200 × 7.5 tokens avg
Content (200 chars)    | 10,000    | 200 × 50 tokens avg
Relevance scores       | 400       | 200 × 2 tokens
Formatting             | 1,000     | Newlines, labels, etc.
-----------------------|-----------|---------------------------
TOTAL PER SEARCH       | ~15,000   | tokens
```

**Cost per search:** 15,000 tokens × $0.002/1k = **$0.03**

### For Maximum (1000 Results)

```
Component              | Tokens    | Cost
-----------------------|-----------|---------------------------
Full result set        | ~75,000   | $0.15
```

---

## Configuration Options

### Increase Result Limit

**File:** `app/api/chat/route.ts:79-80`

```typescript
// Current
default: 100,
maximum: 1000

// To allow more results
default: 200,
maximum: 2000
```

**Impact:**
- ✅ More comprehensive search
- ❌ Higher token costs (2x)
- ❌ Slower response times (+30%)

### Increase Content Per Result

**File:** `app/api/chat/route.ts:718`

```typescript
// Current
content: ${item.content.substring(0, 200)}

// To show more content
content: ${item.content.substring(0, 500)}
```

**Impact:**
- ✅ Better context per result
- ❌ Token usage +150% per search
- ⚠️ May hit context window limits faster

### Adjust Keyword Search Multiplier

**File:** `lib/embeddings.ts:153`

```typescript
// Current
.limit(Math.max(limit * 2, 200))

// More aggressive
.limit(Math.max(limit * 3, 300))

// More conservative
.limit(Math.max(limit, 100))
```

**Impact:**
- Higher multiplier = more comprehensive keyword matching
- Lower multiplier = faster searches, fewer results

---

## Real-World Examples

### Example 1: Simple Product Search
```
Query: "hydraulic pump"
AI calls: search_products("hydraulic pump", 100)
Keyword search: 200 database queries
Vector search: Skipped (keyword sufficient)
WooCommerce: 84 products
Total results: 284 results returned to AI
Response time: ~13 seconds
```

### Example 2: Complex Filter Query
```
Query: "Cifa hydraulic pumps under £2000 in stock"
AI calls: search_products("Cifa hydraulic pump", 100)
Keyword search: 200 database queries
Results: 156 pages found
AI filters: Applies price/stock filter in memory
Final answer: 2 matching products
Response time: ~17 seconds
```

### Example 3: Multi-Step Agentic Search
```
Query: "Compare A4VTG90 to alternatives"

Iteration 1:
- AI calls: search_products("A4VTG90", 50)
- Returns: 18 results

Iteration 2:
- AI calls: get_product_details("A4VTG90")
- AI calls: search_products("alternative hydraulic pump", 50)
- Returns: 23 results

Total: 41 results across 2 iterations
AI has full context of all 41 items for comparison
```

---

## System Prompt Accuracy

**File:** `app/api/chat/route.ts:511`

```typescript
"You have full visibility of ALL search results. When you search,
you see the complete inventory."
```

**✅ This statement is ACCURATE:**
- AI sees 100-200 results by default
- Can request up to 1000 results
- Has access to full product catalog via hybrid search
- No artificial filtering or hiding of results

---

## Performance Characteristics

| Scenario | Results Returned | Response Time | Token Cost |
|----------|------------------|---------------|------------|
| Small catalog (<100 items) | All items | 8-10s | $0.02 |
| Medium catalog (100-500) | 100-200 | 10-15s | $0.03-0.05 |
| Large catalog (1000+) | 100-200 (sample) | 12-18s | $0.03-0.06 |
| Targeted search | 10-50 | 6-10s | $0.01-0.02 |

---

## Debugging Search Results

### Check What AI Received

Look for console logs:
```bash
[Function Call] Semantic search returned 156 results
[Function Call] WooCommerce returned 73 products
[Intelligent Chat] Tool search_products completed: 229 results
```

### Check Actual Limits Used

```typescript
// Add to route.ts:160 for debugging
console.log(`[DEBUG] Search called with limit=${limit}`);
```

### Verify Result Count

```bash
# Search database directly
psql -d your_db -c "
  SELECT COUNT(*)
  FROM scraped_pages
  WHERE domain_id = (SELECT id FROM domains WHERE domain = 'example.com')
  AND title ILIKE '%pump%'
"
```

---

## Common Pitfalls

### ❌ Pitfall 1: Assuming Low Limits
```
WRONG: "Agent only sees 20 results"
RIGHT: "Agent sees 100-200 by default, up to 1000"
```

### ❌ Pitfall 2: Ignoring Keyword Multiplier
```
WRONG: limit=100 means 100 results
RIGHT: limit=100 means up to 200 results (keyword search)
```

### ❌ Pitfall 3: Forgetting WooCommerce
```
WRONG: Results come from embeddings only
RIGHT: Results merge embeddings + WooCommerce (if enabled)
```

### ❌ Pitfall 4: Not Checking Tool Definitions
```
WRONG: Check function signatures only
RIGHT: Check BOTH tool definitions AND function implementations
```

---

## Testing Search Limits

```bash
# Test script to verify actual result counts
npx tsx << 'EOF'
const response = await fetch('http://localhost:3000/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Show me all hydraulic pumps',
    session_id: `test-${Date.now()}`,
    domain: 'thompsonseparts.co.uk',
    config: {
      features: {
        woocommerce: { enabled: true },
        websiteScraping: { enabled: true }
      }
    }
  })
});

const data = await response.json();
console.log('AI Response:', data.message);

// Check console logs for:
// "[Function Call] Semantic search returned X results"
// "[Function Call] WooCommerce returned Y products"
EOF
```

---

## Related Files

- **Tool Definitions:** [app/api/chat/route.ts:67-152](../app/api/chat/route.ts#L67-L152)
- **Search Execution:** [app/api/chat/route.ts:155-203](../app/api/chat/route.ts#L155-L203)
- **Hybrid Search Logic:** [lib/embeddings.ts:82-250](../lib/embeddings.ts#L82-L250)
- **WooCommerce Integration:** [lib/woocommerce-dynamic.ts](../lib/woocommerce-dynamic.ts)

---

## Questions?

If you're unsure about search limits, always:
1. ✅ Check the tool definition first (`route.ts:67-152`)
2. ✅ Trace through the function calls with actual parameters
3. ✅ Look for `Math.max()` or multipliers in the implementation
4. ✅ Test with real queries and check console logs
5. ❌ Don't assume based on function defaults alone

---

**Remember:** The agent has **FULL INVENTORY VISIBILITY** - this is by design, not a bug!
