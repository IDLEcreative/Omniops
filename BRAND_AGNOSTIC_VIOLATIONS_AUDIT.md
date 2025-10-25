# Brand-Agnostic Architecture Violations - Complete Audit Report

**Generated:** 2025-10-25
**Audited By:** Multi-agent deep code analysis
**Severity:** CRITICAL - Multiple violations of multi-tenant architecture

---

## Executive Summary

This audit identified **78+ distinct violations** of the brand-agnostic, multi-tenant architecture principle defined in [CLAUDE.md](CLAUDE.md). The violations fall into 5 critical categories:

| Category | Violations | Severity | Impact |
|----------|-----------|----------|---------|
| **Hardcoded Company Names** | 45+ instances | CRITICAL | Thompson's eParts, Cifa, Agri Flip hardcoded |
| **Industry-Specific Assumptions** | 12+ instances | HIGH | E-commerce/equipment-only logic |
| **AI Prompt Violations** | 8 instances | CRITICAL | Brand-specific examples in system prompts |
| **Special Case Logic** | 30+ instances | HIGH | Agri Flip boosting, domain fallbacks |
| **Configuration Hardcoding** | 5 instances | MEDIUM | Supabase project IDs, demo domains |

**CRITICAL FINDING:** The system currently cannot serve non-equipment, non-e-commerce businesses without exposing Thompson's eParts branding and Cifa product references.

---

## Category 1: Hardcoded Company Names & Brand References

### 1.1 Thompson's eParts Hardcoding

#### **File:** `lib/synonym-auto-learner.ts`
- **Lines:** 219-305 (87 lines)
- **Method:** `setupThompsonsSynonyms()`
- **Severity:** CRITICAL

**Code:**
```typescript
/**
 * Setup Thompson's eParts specific synonyms
 * This is a one-time initialization for Thompson's domain
 */
async setupThompsonsSynonyms(): Promise<void> {
  // Hardcoded Thompson's-specific synonym mappings
  const synonymGroups = [
    { canonical: 'hydraulic pump', synonyms: ['pump', 'hydraulic', 'hydro pump'] },
    { canonical: 'chainsaw', synonyms: ['chain saw', 'saw', 'cutting tool'] },
    // ... 80+ more lines of equipment-specific synonyms
  ];
}
```

**Impact:**
- Method name contains "Thompson's" - cannot be reused
- Entire synonym set is equipment/forestry specific
- Hardcoded for single customer

**Affected Tenants:** ❌ Restaurants, ❌ Real Estate, ❌ Healthcare, ❌ Education

---

#### **File:** `lib/synonym-expander-dynamic.ts`
- **Lines:** 286-307
- **Method:** `initializeThompsonsSynonyms()`
- **Severity:** CRITICAL

**Code:**
```typescript
async initializeThompsonsSynonyms(): Promise<void> {
  console.log('🔧 Initializing Thompson\'s eParts synonyms...');
  // ... Thompson's-specific setup
  console.log('✅ Thompson\'s eParts synonyms initialized');
}
```

**Impact:**
- Console logs leak "Thompson's eParts" branding to all tenants
- Other customers would see Thompson's initialization messages
- Method is customer-specific, not reusable

---

#### **File:** `lib/response-post-processor.ts`
- **Lines:** 111, 139, 153
- **Pattern:** `.replace(/ - Thompsons.*$/, '')`
- **Severity:** HIGH

**Code:**
```typescript
// Line 111
productTitle = productTitle.replace(/ - Thompsons.*$/, '');

// Line 139
name = name.replace(/ - Thompsons.*$/, '');

// Line 153
item.name = item.name.replace(/ - Thompsons.*$/, '');
```

**Impact:**
- Hardcoded brand removal logic
- Other tenants' brands won't be stripped
- Creates inconsistent experience

**Fix Needed:** Load brand patterns from `customer_configs.company_name`

---

### 1.2 "Cifa" Product Brand Hardcoding

#### **File:** `lib/agents/customer-service-agent.ts`
- **Line:** 83
- **Severity:** CRITICAL

**Code:**
```typescript
Example product listing (MUST follow this format):
Here are the available options:

• [Cifa Mixer Chute Pump](url)

• [Hydraulic Pump A4VTG71](url)

• [Water Pump Cover](url)
```

**Impact:**
- System prompt teaches AI to reference "Cifa" products
- Restaurant tenant would see "Cifa Mixer Chute Pump" as example format
- Violates brand-agnostic principle in AI training

**Users Affected:** ALL tenants see this in every chat request

---

#### **File:** `lib/cache-warmer.ts`
- **Lines:** 10-21
- **Severity:** CRITICAL

**Code:**
```typescript
const COMMON_QUERIES_BY_DOMAIN: Record<string, string[]> = {
  'thompsonseparts.co.uk': [
    'Cifa',
    'hydraulic pump',
    'tipper',
    'valve',
    'cylinder',
    'Cifa products',
    'all Cifa',
    'pump',
    'parts'
  ]
};
```

**Impact:**
- Hardcodes Thompson's domain in production code
- Hardcodes "Cifa" brand as common query
- Cache warming only works for one customer
- Wastes resources pre-caching queries other tenants won't use

**Fix Needed:** Load common queries from database per domain

---

### 1.3 "Agri Flip" Product Hardcoding

#### **File:** `lib/enhanced-embeddings.ts`
- **Lines:** 113-227 (30+ references)
- **Pattern:** `r.url?.includes('agri-flip')`
- **Severity:** CRITICAL

**Code Samples:**
```typescript
// Line 113-115: Track Agri Flip across all search strategies
const agriFlipInKeywords = keywordResults.some((r: SearchResult) =>
  r.url?.includes('agri-flip')
);
const agriFlipInMetadata = metadataResults.some((r: SearchResult) =>
  r.url?.includes('agri-flip')
);
const agriFlipInSemantic = mapped.some((r: SearchResult) =>
  r.url?.includes('agri-flip')
);

// Line 117-122: Special logging for Agri Flip
if (query.toLowerCase().includes('agri')) {
  console.log('[Enhanced Search] 🔍 Agri Flip tracking:');
  console.log(`  - In keyword results: ${agriFlipInKeywords}`);
  console.log(`  - In metadata results: ${agriFlipInMetadata}`);
  console.log(`  - In semantic results: ${agriFlipInSemantic}`);
}

// Line 190-203: SPECIAL CASE BOOSTING
// Special case: If we're searching for agricultural products and Agri Flip
// is just outside the limit, make sure to include it by boosting its position
if (query.toLowerCase().includes('agri')) {
  const agriFlipIndex = mapped.findIndex((r: SearchResult) =>
    r.url?.includes('agri-flip')
  );
  if (agriFlipIndex >= limit && agriFlipIndex < limit + 5) {
    console.log(`[Enhanced Search] Boosting Agri Flip from position ${agriFlipIndex + 1}`);
    // Move Agri Flip to position 5
    const agriFlipResult = mapped.splice(agriFlipIndex, 1)[0];
    mapped.splice(5, 0, agriFlipResult);
  }
}

// Line 221-222: Final Agri Flip detection
if (final[i].url?.includes('agri-flip')) {
  console.log('[Enhanced Search] 🎯 THIS IS AGRI FLIP!');
}
```

**Impact:** **THIS IS THE "AGRI FLIP" VIOLATION YOU FOUND!**
- **30+ hardcoded references** to "agri-flip" product URL
- **Special case logic** that artificially boosts Agri Flip search rankings
- Preferential treatment for one specific product
- Breaks search fairness across all tenants

**Affected Scenarios:**
- Restaurant searching "agricultural ingredients" → Agri Flip boosted
- Real estate searching "agribusiness property" → Agri Flip boosted
- ANY query with "agri" triggers special handling

**Fix Priority:** IMMEDIATE - Remove all Agri Flip special cases

---

#### **File:** `lib/agents/customer-service-agent.ts`
- **Line:** 71
- **Severity:** CRITICAL

**Code:**
```typescript
CRITICAL RULE FOR VAGUE QUERIES:
- Example: "its for agriculture" → Show Agri Flip if in context, THEN link to category
```

**Impact:**
- System prompt explicitly tells AI to show "Agri Flip" product
- Hardcoded product name in AI instructions
- Only relevant to Thompson's eParts customers

---

### 1.4 SKU/Part Number Hardcoding

#### **File:** `lib/chat/system-prompts.ts`
- **Lines:** 40, 49, 53
- **Severity:** CRITICAL

**Code:**
```typescript
// Line 40
- "the first one" / "the A4VTG90" (mentioned earlier) → Search your previous responses

// Line 49
- When returning to previous topic: "Returning to the A4VTG90 you asked about earlier:"

// Line 53
- "For SKU K2053463 that we discussed:"
```

**Impact:**
- "A4VTG90" is a hydraulic pump part number
- "K2053463" is a specific SKU from Thompson's inventory
- System prompt teaches AI to reference these specific parts
- Restaurant tenant's AI would reference hydraulic pump SKUs

**Fix Needed:** Use generic placeholders: `[PRODUCT_NAME]`, `[SKU_NUMBER]`

---

## Category 2: Industry-Specific Assumptions

### 2.1 E-Commerce Only Assumptions

#### **File:** `lib/chat-context-enhancer-product-extraction.ts`
- **Line:** 97
- **Severity:** CRITICAL

**Code:**
```typescript
.eq('extract_type', 'product')
```

**Impact:**
- Hardcodes extraction type as "product"
- Restaurants have "menu_items", not "products"
- Real estate has "properties"
- Healthcare has "services"
- **Query returns ZERO results for non-e-commerce businesses**

**Fix Needed:**
```typescript
const entityType = businessClassification.primaryEntityType; // From database
.eq('extract_type', entityType)
```

---

#### **File:** `lib/chat-context-enhancer-product-extraction.ts`
- **Line:** 164
- **Severity:** HIGH

**Code:**
```typescript
.or(`url.ilike.%/product/%,title.ilike.%${searchQuery}%`)
```

**Impact:**
- Assumes URLs contain `/product/` path
- Real estate uses `/property/`, `/listing/`, `/homes/`
- Restaurants use `/menu/`, `/dish/`
- Misses 100% of non-e-commerce pages

**Fix Needed:** Load URL patterns from business classification

---

### 2.2 Equipment Industry Assumptions

#### **File:** `lib/synonym-expander.ts`
- **Lines:** 8-78 (entire synonym map)
- **Severity:** HIGH

**Code:**
```typescript
const SYNONYM_MAP: Record<string, string[]> = {
  'hydraulic pump': ['pump', 'hydraulic', 'hydro pump', 'fluid pump'],
  'chainsaw': ['chain saw', 'saw', 'cutting tool'],
  'excavator': ['digger', 'trackhoe', 'shovel'],
  'loader': ['front loader', 'wheel loader', 'payloader'],
  // ... 70+ more equipment-specific synonyms
};
```

**Impact:**
- Synonym expansion only works for equipment industry
- Restaurant searching "saw" gets "chainsaw" synonyms instead of "serrated knife"
- Healthcare searching "pump" gets "hydraulic pump" instead of "infusion pump"
- Real estate searching "loader" gets "wheel loader" instead of "loading dock"

**Fix Needed:** Load synonyms from database table `domain_synonym_mappings`

---

#### **File:** `lib/chat/system-prompts.ts`
- **Line:** 48
- **Severity:** HIGH

**Code:**
```typescript
- When customer changes topics, note it: "Regarding shipping:" or "Back to the pumps:"
```

**Impact:**
- Hardcodes "pumps" as example topic
- Restaurant AI would never say "Back to the pumps"
- Violates brand-agnostic design

**Fix Needed:** Use generic topics: "Back to [TOPIC]" or "Regarding [PREVIOUS_TOPIC]"

---

#### **File:** `lib/ai-query-interpreter.ts`
- **Lines:** 50-66
- **Severity:** HIGH

**Code:**
```typescript
"Your job is to understand what they ACTUALLY want to search for in our product database."

Example: "show me pumps" → searchTerms: ["pump", "pumps"]
Example: "its for agriculture" → searchTerms: ["agricultural", "agriculture equipment"]
Example: "do you sell hydaulics" → searchTerms: ["hydraulics", "hydraulic products"]
```

**Impact:**
- All examples are equipment/agriculture focused
- AI trained on equipment examples will bias all searches
- Restaurant query "show me pumps" would search for hydraulic equipment, not beverage dispensers

**Fix Needed:** Load examples from business classification configuration

---

### 2.3 Variable Naming Violations

#### **File:** `lib/chat-context-enhancer-product-extraction.ts`
- **Lines:** 12-71, 108-146, 177+
- **Severity:** MEDIUM

**Code:**
```typescript
function formatProductAsChunk(product: any): string { ... }
const productName = ...;
const productSku = ...;
const productDesc = ...;
```

**Impact:**
- All variables use "product" nomenclature
- Self-documenting code signals "product-only" system
- Developers extending for restaurants would be confused

**Fix Needed:** Rename to generic terms:
- `productName` → `entityName`
- `productSku` → `primaryIdentifier`
- `formatProductAsChunk()` → `formatEntityAsChunk()`

---

## Category 3: AI Prompt Violations

### 3.1 System Prompt Contains Brand-Specific Examples

#### **File:** `lib/agents/customer-service-agent.ts`
- **Line:** 76
- **Severity:** CRITICAL

**Code:**
```typescript
Formatting Requirements:
- Remove redundant text from product names (e.g., "- Thompsons E Parts")
```

**Impact:**
- "Thompsons E Parts" hardcoded in example
- All tenants' AI sees Thompson's branding in training

---

### 3.2 Archive Documentation Contains Real Brand Examples

#### **File:** `docs/ARCHIVE/analysis/intelligent-agent-prompt.md`
- **Lines:** 28, 114-118
- **Severity:** MEDIUM (archived, but informative)

**Code:**
```markdown
DON'T: "I found 20 products matching your search"
DO: "We carry over 180 Cifa products including mixers, pumps, and parts..."

### Pattern 1: Brand Search
Customer: "Show me all Cifa products"
Response: "Excellent choice! We're a major Cifa supplier with over 180 products..."
```

**Impact:**
- Archive shows historical Cifa-specific prompts
- Documents the violation pattern
- Good reference for what NOT to do

---

## Category 4: Special Case Logic

### 4.1 Demo Environment Domain Fallback

#### **File:** `components/ChatWidget.tsx`
- **Lines:** 152-159, 296-304
- **Severity:** CRITICAL

**Code:**
```typescript
// Line 152-159
const isDemoEnvironment =
  domain === 'localhost' ||
  domain === '127.0.0.1';

if (isDemoEnvironment) {
  console.log(`[ChatWidget] Using thompsonseparts.co.uk for demo/testing`);
  domain = 'thompsonseparts.co.uk';
}

// Line 296-304 - DUPLICATE LOGIC
const isDemoEnvironment =
  domain === 'localhost' ||
  domain === '127.0.0.1';

if (isDemoEnvironment) {
  domain = 'thompsonseparts.co.uk';
}
```

**Impact:**
- **All localhost development defaults to Thompson's domain**
- Impossible to test with other customers locally
- Thompson's gets preferential treatment in development
- Duplicate special-case logic (appears twice)

**Fix Needed:**
```typescript
const DEMO_DOMAIN = process.env.NEXT_PUBLIC_DEMO_DOMAIN || 'demo.example.com';
if (isDemoEnvironment) {
  domain = DEMO_DOMAIN;
}
```

---

### 4.2 WooCommerce API Default Domain

#### **File:** `app/api/woocommerce/products/route.ts`
- **Line:** 120
- **Severity:** CRITICAL

**Code:**
```typescript
const domain = searchParams.get('domain') || 'thompsonseparts.co.uk';
```

**Impact:**
- **Any API call without domain parameter returns Thompson's products**
- Security risk: wrong customer data exposed by default
- Could leak Thompson's inventory to other customers

**Fix Needed:**
```typescript
const domain = searchParams.get('domain');
if (!domain) {
  return NextResponse.json(
    { error: 'domain parameter required' },
    { status: 400 }
  );
}
```

---

### 4.3 Thompson's-Specific Setup Endpoint

#### **File:** `app/api/setup-rag/route.ts`
- **Lines:** 22, 29-36, 53, 60, 80+
- **Severity:** CRITICAL

**Code:**
```typescript
// Line 22
.eq('domain', 'thompsonseparts.co.uk')

// Lines 29-36
{
  domain: 'thompsonseparts.co.uk',
  company_name: 'Thompson eParts',
  business_name: 'Thompson eParts Ltd',
  woocommerce_url: 'https://www.thompsonseparts.co.uk',
  admin_email: 'admin@thompsonseparts.co.uk',
  // ... more hardcoded Thompson's data
}
```

**Impact:**
- Entire setup endpoint is Thompson's-specific
- Cannot be reused for other customers
- Violates DRY principle - need duplicate endpoints per customer

**Fix Needed:** Accept configuration in request body, not hardcoded

---

## Category 5: Configuration Hardcoding

### 5.1 Supabase Project ID Exposure

#### **File:** `.env.monitoring.example`
- **Line:** 5
- **Severity:** CRITICAL

**Code:**
```
SUPABASE_URL=https://birugqyuqhiahxvxeyqg.supabase.co
```

**Impact:**
- Real Supabase project ID exposed in example file
- Violates infrastructure abstraction
- Should use placeholder

**Fix Needed:**
```
SUPABASE_URL=https://your-project.supabase.co
```

---

### 5.2 E-Commerce Focused Default Widget Text

#### **File:** `lib/config.ts`
- **Lines:** 106, 107, 117-122
- **Severity:** MEDIUM

**Code:**
```typescript
headerTitle: z.string().default('Shopping Assistant'),
headerSubtitle: z.string().default('Available 24/7'),
```

**Impact:**
- "Shopping Assistant" assumes e-commerce
- Restaurant would show "Shopping Assistant" instead of "Menu Assistant"
- Healthcare would show shopping terminology

**Fix Needed:**
```typescript
headerTitle: z.string().default('AI Assistant'),
headerSubtitle: z.string().default('How can I help?'),
```

---

## Summary Statistics

### Violations by File

| File | Violations | Severity |
|------|-----------|----------|
| `lib/enhanced-embeddings.ts` | 30+ | CRITICAL |
| `lib/synonym-auto-learner.ts` | 87 lines | CRITICAL |
| `lib/synonym-expander.ts` | 70+ lines | HIGH |
| `lib/agents/customer-service-agent.ts` | 5 | CRITICAL |
| `lib/chat/system-prompts.ts` | 4 | CRITICAL |
| `components/ChatWidget.tsx` | 2 | CRITICAL |
| `lib/cache-warmer.ts` | 12 lines | HIGH |
| `app/api/setup-rag/route.ts` | 15+ lines | CRITICAL |
| `app/api/woocommerce/products/route.ts` | 1 | CRITICAL |
| Other files | 20+ | MEDIUM |

### Violations by Customer/Brand

| Brand/Customer | References | Location |
|----------------|-----------|----------|
| **Thompson's eParts** | 45+ | System-wide |
| **Cifa** | 15+ | Prompts, cache, examples |
| **Agri Flip** | 30+ | Search boosting, logging |
| **Generic Equipment** | 70+ | Synonyms, prompts |

### Business Types That Would Break

| Business Type | Why It Breaks | Severity |
|---------------|---------------|----------|
| 🍽️ **Restaurant** | Product extraction fails, sees pump/hydraulic examples | CRITICAL |
| 🏠 **Real Estate** | URL patterns miss `/property/`, searches fail | CRITICAL |
| 🏥 **Healthcare** | Entity type mismatch, equipment synonyms confuse | CRITICAL |
| 🎓 **Education** | No course/class extraction, e-commerce assumptions | HIGH |
| 🏨 **Hospitality** | No room/service entities, shopping widget text | HIGH |
| 💼 **B2B Services** | Product-focused, no service entity support | HIGH |

---

## Recommended Remediation Plan

### Phase 1: Critical Fixes (Immediate)

1. **Remove Agri Flip special case logic** (`lib/enhanced-embeddings.ts`)
   - Delete all 30+ `agri-flip` references
   - Remove search result boosting
   - Remove special logging

2. **Fix domain fallbacks** (`components/ChatWidget.tsx`, API routes)
   - Replace Thompson's domain with configurable default
   - Require domain parameter in API endpoints

3. **Neutralize system prompts** (`lib/chat/system-prompts.ts`, `lib/agents/customer-service-agent.ts`)
   - Replace "A4VTG90", "K2053463" with `[PRODUCT_NAME]`
   - Replace "pumps" with generic `[CATEGORY]`
   - Remove "Cifa", "Thompson's", "Agri Flip" references

### Phase 2: Architecture Refactoring (High Priority)

4. **Make entity terminology dynamic**
   - Load entity types from `BusinessClassification`
   - Support: products, menu_items, properties, services, courses

5. **Database-driven synonyms**
   - Create `domain_synonym_mappings` table
   - Load synonyms at runtime per domain
   - Remove hardcoded equipment synonyms

6. **Dynamic URL pattern extraction**
   - Store URL patterns in business classification config
   - Support `/product/`, `/menu/`, `/property/`, `/service/`

### Phase 3: Code Cleanup (Medium Priority)

7. **Rename variables generically**
   - `product*` → `entity*`
   - `productSku` → `primaryIdentifier`
   - `formatProductAsChunk` → `formatEntityAsChunk`

8. **Remove customer-specific methods**
   - Delete `setupThompsonsSynonyms()`
   - Delete `initializeThompsonsSynonyms()`
   - Replace with generic `setupDomainSynonyms(config)`

9. **Audit and fix all test files**
   - Use configurable test domains
   - Remove Thompson's from test fixtures

---

## Risk Assessment

### If Not Fixed

**Customer Onboarding Risk:** 🔴 HIGH
- Cannot onboard non-equipment businesses
- Restaurant would see hydraulic pump references
- Real estate would get zero search results

**Data Leakage Risk:** 🟡 MEDIUM
- Thompson's domain fallbacks could expose their data
- Special case logic favors Thompson's products

**Scalability Risk:** 🔴 HIGH
- Each new customer needs custom code changes
- Cannot scale beyond equipment e-commerce

**Reputation Risk:** 🟡 MEDIUM
- Non-Thompson's customers see Thompson's branding
- Appears unprofessional and breaks trust

### After Remediation

**Multi-Tenant Support:** ✅ Full support for any business type
**Scalability:** ✅ Add customers via database config only
**Brand Integrity:** ✅ Each tenant sees only their branding
**Maintenance:** ✅ No customer-specific code to maintain

---

## Testing Checklist

After remediation, verify:

- [ ] Restaurant tenant: Menu items extracted, no pump references
- [ ] Real estate tenant: Properties extracted from `/property/` URLs
- [ ] Healthcare tenant: Services displayed, no equipment synonyms
- [ ] No "Thompson's", "Cifa", or "Agri Flip" in any tenant's responses
- [ ] Localhost development works with any domain (not just Thompson's)
- [ ] All API endpoints require domain parameter (no fallback to Thompson's)
- [ ] System prompts contain only generic examples
- [ ] Search results fair (no Agri Flip boosting)
- [ ] Synonym expansion works per business type

---

## Conclusion

The codebase currently contains **78+ violations** of the brand-agnostic architecture, with **Thompson's eParts, Cifa, and Agri Flip** hardcoded throughout. These violations make it **impossible to serve non-equipment, non-e-commerce businesses** without showing them Thompson's branding and equipment-specific functionality.

**Priority:** CRITICAL - Must fix before onboarding additional customers

**Estimated Effort:** 3-5 days for Phase 1 critical fixes, 1-2 weeks for full remediation

**Files Requiring Changes:** 20+ files across lib/, components/, app/api/

---

**Next Steps:**
1. Review this audit with development team
2. Prioritize Phase 1 critical fixes
3. Create tickets for each remediation item
4. Implement fixes with testing
5. Re-audit after changes
