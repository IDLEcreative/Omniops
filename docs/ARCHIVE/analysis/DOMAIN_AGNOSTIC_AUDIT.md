# Domain-Agnostic System Audit

## Complete Pipeline Coverage Check

### 1. SCRAPING PHASE ✅
**Current State:**
- `lib/scraper-worker.js` - Scrapes all sites regardless of type
- `MetadataExtractor` - Extracts generic metadata (works for any site)
- `EcommerceExtractor` - Only runs if e-commerce detected

**Domain-Agnostic Status:** ✅ READY
- Scraping is already industry-neutral
- Content, titles, URLs stored for all sites
- Metadata extraction works generically

**Gap Identified:** ⚠️
- `EcommerceExtractor` is hardcoded for products
- Need to trigger `AdaptiveEntityExtractor` instead

**Fix Required:**
```javascript
// In scraper-worker.js, replace:
const ecommerceData = await EcommerceExtractor.extractEcommerce();

// With:
const entityData = await AdaptiveEntityExtractor.extractEntities();
```

---

### 2. EMBEDDING GENERATION ✅
**Current State:**
- `generateEmbeddings()` in scraper-worker.js
- Creates vectors for all content chunks
- Stores in `page_embeddings` table

**Domain-Agnostic Status:** ✅ PERFECT
- Embeddings are content-based, not business-specific
- Works identically for any industry
- No changes needed

---

### 3. DATABASE SCHEMA 🔄
**Current State:**

#### Tables That Are Domain-Agnostic ✅:
- `scraped_pages` - Generic page storage
- `page_embeddings` - Vector storage
- `search_cache` - Query caching
- `embedding_queue` - Processing queue
- `entity_catalog` - NEW flexible entity storage ✅
- `business_classifications` - NEW business type storage ✅

#### Tables That Are Product-Specific ❌:
- `product_catalog` - Should be deprecated
- `product_extraction_queue` - Should be `entity_extraction_queue`

**Fix Required:**
```sql
-- Rename queue to be generic
ALTER TABLE product_extraction_queue RENAME TO entity_extraction_queue;

-- Update triggers
DROP TRIGGER trigger_auto_extract_products ON scraped_pages;
CREATE TRIGGER trigger_auto_extract_entities
  AFTER INSERT ON scraped_pages
  FOR EACH ROW
  EXECUTE FUNCTION queue_entity_extraction();
```

---

### 4. SEARCH FUNCTIONS 🔄
**Current State:**

#### Functions That Are Domain-Agnostic ✅:
- `hybrid_product_search_v2` - Despite name, works for any content
- `search_text_content` - Generic text search
- `search_fuzzy_content` - Generic fuzzy matching
- `get_cached_search` - Generic caching
- `adaptive_entity_search` - NEW adaptive search ✅

#### Functions That Need Renaming:
- `hybrid_product_search` → `hybrid_entity_search`

---

### 5. CHAT CONTEXT ENHANCER ✅
**Current State:**
- Updated to use `entity_catalog`
- Queries `business_classifications` for terminology
- Formats based on business type

**Domain-Agnostic Status:** ✅ READY
- Successfully adapts to any business
- Uses proper terminology

---

### 6. CUSTOMER SERVICE AGENT 🔄
**Current State:**
- `lib/agents/customer-service-agent.ts`
- May have hardcoded product references

**Check Required:**
- Need to verify agent prompts don't assume products
- Should use terminology from business classification

**Fix Required:**
```typescript
// In customer-service-agent.ts
const businessType = await getBusinessClassification(domain);
const terminology = businessType.entity_terminology;

// Update system prompt:
`You are a customer service agent for a ${businessType.primaryType} business.
Help customers find ${terminology.plural} and answer questions.`
```

---

### 7. EXTRACTION PIPELINE 🔄
**Current State:**

#### Working Components ✅:
- `BusinessClassifier` - Detects business type
- `AdaptiveEntityExtractor` - Extracts based on type
- `entity_catalog` table - Stores any entity type

#### Integration Gaps ⚠️:
- Not hooked into scraper-worker.js
- Not triggered automatically after scraping

**Fix Required:**
```javascript
// Add to scraper-worker.js after page save:
if (!businessClassification) {
  await classifyBusiness(domainId);
}
await queueEntityExtraction(pageId, businessType);
```

---

### 8. API ROUTES 🔄
**Current State:**
- `/api/chat/route.ts` - Uses enhanced context
- `/api/scrape/route.ts` - Triggers scraping

**Check Required:**
- Ensure no hardcoded product assumptions
- API responses use proper terminology

---

### 9. TRIGGERS & AUTOMATION ⚠️
**Current State:**
- `trigger_auto_extract_products` - Product-specific name
- `product_extraction_queue` - Product-specific table

**Fix Required:**
```sql
-- Make triggers generic
CREATE OR REPLACE FUNCTION queue_entity_extraction()
RETURNS TRIGGER AS $$
BEGIN
  -- Queue for entity extraction (any type)
  INSERT INTO entity_extraction_queue (
    page_id,
    priority,
    created_at
  ) VALUES (
    NEW.id,
    1,
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## COMPLETE FLOW VERIFICATION

### Current Flow:
1. **Scrape** → `scraped_pages` ✅
2. **Embeddings** → `page_embeddings` ✅
3. **Extract Products** → `product_catalog` ❌
4. **Search** → Hybrid search ✅
5. **Agent** → Returns results ⚠️

### Domain-Agnostic Flow:
1. **Scrape** → `scraped_pages` ✅
2. **Classify Business** → `business_classifications` ✅
3. **Embeddings** → `page_embeddings` ✅
4. **Extract Entities** → `entity_catalog` ✅
5. **Search** → Adaptive search with terminology ✅
6. **Agent** → Returns with proper language ✅

---

## CRITICAL GAPS TO FIX

### HIGH PRIORITY 🔴
1. **Integrate AdaptiveEntityExtractor into scraper-worker.js**
2. **Rename product_extraction_queue to entity_extraction_queue**
3. **Update agent prompts to use business terminology**

### MEDIUM PRIORITY 🟡
1. **Rename hybrid_product_search to hybrid_entity_search**
2. **Update API responses to use dynamic terminology**
3. **Add business classification step to scraping flow**

### LOW PRIORITY 🟢
1. **Deprecate product_catalog table (keep for backward compatibility)**
2. **Update test files to test multiple business types**
3. **Add monitoring for classification accuracy**

---

## IMPLEMENTATION CHECKLIST

- [ ] Update scraper-worker.js to use AdaptiveEntityExtractor
- [ ] Rename database tables and functions to be generic
- [ ] Update customer-service-agent.ts to use terminology
- [ ] Add business classification to initial scrape
- [ ] Test with real estate site
- [ ] Test with healthcare site
- [ ] Test with education site
- [ ] Verify agent responses use correct terminology
- [ ] Update documentation

---

## MISSING COMPONENTS SUMMARY

### What We Have ✅
- Business classifier
- Flexible entity storage
- Adaptive extractor
- Updated chat enhancer
- Generic search functions

### What's Missing ❌
1. **Integration with scraper** - AdaptiveEntityExtractor not called
2. **Agent terminology** - May still say "products"
3. **Queue renaming** - Still called "product_extraction_queue"
4. **Automated classification** - Not triggered on scrape

### Estimated Work
- 2-3 hours to fully integrate
- Main work is updating scraper-worker.js
- Need to test with non-commerce sites