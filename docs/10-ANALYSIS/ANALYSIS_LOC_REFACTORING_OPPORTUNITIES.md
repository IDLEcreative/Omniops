# LOC Refactoring Opportunities Report

**Date:** 2025-11-10
**Status:** Active
**Priority:** High
**LOC Compliance Goal:** All files <300 LOC (production), <500 LOC (tests)

## Executive Summary

**Current State:**
- **Total Files Scanned:** 2,794
- **Compliant Files:** 2,759 (98.7%)
- **Violations:** 35 files (1.3%)
- **Files Approaching Limit:** 14 files

**Severity Breakdown:**
- 🔴 Critical (>1000 LOC): 3 files
- 🟠 High (500-1000 LOC): 4 files
- 🟡 Medium (350-500 LOC): 15 files
- 🟢 Low (300-350 LOC): 13 files

---

## Critical Priority Files (>1000 LOC)

### 1. lib/scraper-worker.js - 1,107 LOC 🔴
**Current LOC:** 1,107 (269% over limit)
**Priority:** CRITICAL
**Complexity:** High

**Refactoring Strategy:**
```
lib/scraper-worker.js (1107 LOC) → Extract into:
├── lib/scraper/worker-core.js (250 LOC)          # Main orchestration
├── lib/scraper/page-processor.js (200 LOC)       # Page processing logic
├── lib/scraper/content-extractor.js (180 LOC)    # Content extraction
├── lib/scraper/link-handler.js (150 LOC)         # Link management
├── lib/scraper/error-handler.js (120 LOC)        # Error handling
├── lib/scraper/queue-manager.js (130 LOC)        # Queue operations
└── lib/scraper/performance-tracker.js (77 LOC)   # Performance monitoring
```

**Estimated Effort:** 4-6 hours
**Impact:** High - Core scraping functionality

**Test Coverage Required:** Integration tests for scraper reliability

---

### 2. servers/commerce/__tests__/woocommerceOperations.test.ts - 1,140 LOC 🔴
**Current LOC:** 1,140 (128% over test limit)
**Priority:** CRITICAL
**Complexity:** Medium

**Refactoring Strategy:**
```
__tests__/woocommerceOperations.test.ts (1140 LOC) → Split into:
├── __tests__/commerce/woocommerce/products.test.ts (200 LOC)
├── __tests__/commerce/woocommerce/orders.test.ts (200 LOC)
├── __tests__/commerce/woocommerce/customers.test.ts (180 LOC)
├── __tests__/commerce/woocommerce/inventory.test.ts (160 LOC)
├── __tests__/commerce/woocommerce/categories.test.ts (150 LOC)
├── __tests__/commerce/woocommerce/variants.test.ts (130 LOC)
└── __tests__/commerce/woocommerce/authentication.test.ts (120 LOC)
```

**Estimated Effort:** 3-4 hours
**Impact:** Medium - Test organization

**Benefits:** Better test categorization, faster test discovery

---

### 3. types/supabase.ts - 1,497 LOC 🔴
**Current LOC:** 1,497 (399% over limit)
**Priority:** CRITICAL
**Complexity:** Low (Auto-generated)

**Refactoring Strategy:**
```
types/supabase.ts (1497 LOC) → Split into:
├── types/supabase/database.ts (300 LOC)          # Database types
├── types/supabase/tables.ts (280 LOC)            # Table schemas
├── types/supabase/views.ts (150 LOC)             # View types
├── types/supabase/functions.ts (200 LOC)         # Function types
├── types/supabase/enums.ts (120 LOC)             # Enum types
├── types/supabase/auth.ts (150 LOC)              # Auth types
├── types/supabase/realtime.ts (130 LOC)          # Realtime types
└── types/supabase/index.ts (167 LOC)             # Re-exports
```

**Estimated Effort:** 2-3 hours
**Impact:** Low - Type organization (auto-generated)

**Note:** May need Supabase CLI configuration update for type generation

---

## High Priority Files (500-1000 LOC)

### 4. __tests__/lib/agents/domain-agnostic-agent-business-types.test.ts - 613 LOC 🟠
**Current LOC:** 613 (23% over test limit)
**Priority:** HIGH
**Suggested Split:**
```
domain-agnostic-agent-business-types.test.ts → Split by business type:
├── __tests__/lib/agents/business-types/ecommerce.test.ts (200 LOC)
├── __tests__/lib/agents/business-types/restaurants.test.ts (200 LOC)
└── __tests__/lib/agents/business-types/services.test.ts (213 LOC)
```
**Estimated Effort:** 2 hours

---

### 5. __tests__/lib/agents/providers/shopify-provider.test.ts - 592 LOC 🟠
**Current LOC:** 592 (18% over test limit)
**Priority:** HIGH
**Suggested Split:**
```
shopify-provider.test.ts → Split by operation:
├── __tests__/lib/agents/providers/shopify/products.test.ts (200 LOC)
├── __tests__/lib/agents/providers/shopify/orders.test.ts (200 LOC)
└── __tests__/lib/agents/providers/shopify/customers.test.ts (192 LOC)
```
**Estimated Effort:** 2 hours

---

### 6. servers/commerce/__tests__/getProductDetails.test.ts - 562 LOC 🟠
**Current LOC:** 562 (12% over test limit)
**Priority:** HIGH
**Suggested Split:**
```
getProductDetails.test.ts → Split by product type:
├── __tests__/commerce/products/simple-products.test.ts (180 LOC)
├── __tests__/commerce/products/variable-products.test.ts (180 LOC)
├── __tests__/commerce/products/grouped-products.test.ts (120 LOC)
└── __tests__/commerce/products/external-products.test.ts (82 LOC)
```
**Estimated Effort:** 2 hours

---

### 7. __tests__/integration/multi-turn-conversation-e2e.test.ts - 512 LOC 🟠
**Current LOC:** 512 (2% over test limit)
**Priority:** HIGH
**Suggested Split:**
```
multi-turn-conversation-e2e.test.ts → Split by conversation type:
├── __tests__/integration/conversation/product-inquiry.test.ts (170 LOC)
├── __tests__/integration/conversation/order-tracking.test.ts (170 LOC)
└── __tests__/integration/conversation/support.test.ts (172 LOC)
```
**Estimated Effort:** 2 hours

---

## Medium Priority Files (350-500 LOC)

### Production Files (9 files):
1. scripts/analysis/profile-database-performance.js - 454 LOC
2. scripts/utilities/validate-thompsons-scrape.ts - 422 LOC
3. scripts/verify-supabase-mcp.js - 421 LOC
4. scripts/monitoring/check-token-anomalies.ts - 420 LOC
5. scripts/testing/load-simulator.ts - 408 LOC
6. scripts/test-customer-flow.js - 401 LOC
7. scripts/optimize-existing-data.ts - 385 LOC
8. scripts/tests/test-performance-analysis.ts - 384 LOC
9. scripts/validate-doc-code-examples.ts - 378 LOC

### Test Files (1 file):
10. __tests__/integration/test-hallucination-prevention.ts - 513 LOC

**Common Pattern:** Most are utility scripts that can be refactored using modular patterns

**Refactoring Approach:**
- Extract reusable utility functions
- Create lib/script-utils/ for common operations
- Split validation logic from execution logic

**Estimated Effort:** 1-2 hours each (9-18 hours total)

---

## Low Priority Files (300-350 LOC)

### Production Files (13 files):
1. test-utils/supabase-test-helpers.ts - 348 LOC
2. test-utils/jest.setup.msw.js - 330 LOC
3. scripts/monitoring/monitor-embeddings-health.ts - 328 LOC
4. scripts/tests/test-chat-responses.ts - 328 LOC
5. scripts/validation-test.js - 328 LOC
6. test-utils/api-test-helpers.ts - 318 LOC
7. scripts/apply-rls-optimization.js - 319 LOC
8. scripts/fix-remaining-rls.js - 313 LOC
9. scripts/tests/test-teng-investigation.ts - 310 LOC
10. scripts/verification/verify-security-migration.ts - 308 LOC
11. scripts/migrations/apply-enhanced-metadata-migration.ts - 305 LOC
12. scripts/database/check-organization-integrity.ts - 347 LOC
13. scripts/tests/test-hallucination-prevention.ts - 349 LOC

**Refactoring Approach:**
- Extract common test utilities into separate modules
- Create test-utils/helpers/ subdirectory structure
- Apply same patterns from search page refactoring

**Estimated Effort:** 30 minutes - 1 hour each (6.5-13 hours total)

---

## Files Approaching Limit (14 files)

These files should be refactored proactively before they exceed limits:

| File | LOC | Distance from Limit | Priority |
|------|-----|---------------------|----------|
| test-utils/mock-helpers.ts | 297 | 3 LOC | Medium |
| __tests__/scripts/compare-mcp-traditional.test.ts | 498 | 2 LOC | Medium |
| scripts/comprehensive-test.js | 297 | 3 LOC | Low |
| scripts/tests/test-improved-search-verification.ts | 300 | 0 LOC (AT LIMIT) | High |
| scripts/tests/verify-analytics-10-features.ts | 297 | 3 LOC | Low |
| scripts/tests/test-metadata-performance.ts | 299 | 1 LOC | Medium |
| scripts/tests/test-telemetry-cleanup.ts | 294 | 6 LOC | Low |
| scripts/tests/test-ai-extractor-verification.ts | 294 | 6 LOC | Low |
| scripts/tests/test-null-data-injection.ts | 300 | 0 LOC (AT LIMIT) | High |
| scripts/tests/test-redis-fallback.ts | 289 | 11 LOC | Low |
| scripts/fix-missing-embeddings-safe.ts | 296 | 4 LOC | Low |
| scripts/utilities/test-chat-responses.js | 296 | 4 LOC | Low |
| scripts/benchmarks/benchmark-vector-graph-analysis.ts | 293 | 7 LOC | Low |
| scripts/optimize-database-performance.js | 290 | 10 LOC | Low |

**Recommendation:** Refactor the 2 files AT LIMIT immediately, then tackle files <5 LOC from limit

---

## Refactoring Effort Estimate

### Total Effort Breakdown:
- **Critical Priority (3 files):** 9-13 hours
- **High Priority (4 files):** 8 hours
- **Medium Priority (10 files):** 10-20 hours
- **Low Priority (13 files):** 6.5-13 hours
- **Approaching Limit (14 files):** 7-14 hours

**Total Estimated Effort:** 40.5 - 68 hours

### Recommended Phases:

**Phase 1 (Week 1): Critical Priority**
- lib/scraper-worker.js (4-6 hours)
- servers/commerce/__tests__/woocommerceOperations.test.ts (3-4 hours)
- types/supabase.ts (2-3 hours)
**Total:** 9-13 hours

**Phase 2 (Week 2): High Priority Tests**
- All 4 high-priority test files (8 hours)
**Total:** 8 hours

**Phase 3 (Week 3): Approaching Limit Files**
- Files at or within 5 LOC of limit (7-10 hours)
**Total:** 7-10 hours

**Phase 4 (Week 4): Medium Priority Scripts**
- Utility scripts 350-500 LOC (10-15 hours)
**Total:** 10-15 hours

**Phase 5 (Week 5): Low Priority Cleanup**
- Remaining files 300-350 LOC (6.5-10 hours)
**Total:** 6.5-10 hours

---

## Common Refactoring Patterns

### Pattern 1: Script Extraction
```javascript
// Before: monolithic-script.js (450 LOC)
function main() {
  const config = loadConfig();
  const data = fetchData();
  const processed = processData(data);
  const validated = validateData(processed);
  saveResults(validated);
}

// After: Extract into modules
import { loadConfig } from './lib/config-loader.js';
import { fetchData } from './lib/data-fetcher.js';
import { processData } from './lib/data-processor.js';
import { validateData } from './lib/data-validator.js';
import { saveResults } from './lib/result-saver.js';

function main() {
  const config = loadConfig();
  const data = fetchData();
  const processed = processData(data);
  const validated = validateData(processed);
  saveResults(validated);
}
```

### Pattern 2: Test Suite Splitting
```typescript
// Before: giant-test.test.ts (600 LOC)
describe('Giant Feature', () => {
  describe('Subfeature A', () => { /* 200 LOC */ });
  describe('Subfeature B', () => { /* 200 LOC */ });
  describe('Subfeature C', () => { /* 200 LOC */ });
});

// After: Split by subfeature
// __tests__/feature/subfeature-a.test.ts (200 LOC)
// __tests__/feature/subfeature-b.test.ts (200 LOC)
// __tests__/feature/subfeature-c.test.ts (200 LOC)
```

### Pattern 3: Type File Organization
```typescript
// Before: types.ts (1500 LOC)
export type DatabaseSchema = { /* 500 LOC */ };
export type APITypes = { /* 500 LOC */ };
export type UITypes = { /* 500 LOC */ };

// After: Split by domain
// types/database.ts (500 LOC)
// types/api.ts (500 LOC)
// types/ui.ts (500 LOC)
// types/index.ts (re-exports all)
```

---

## Automated Refactoring Opportunities

### Candidates for Agent-Assisted Refactoring:
1. **Test File Splitting** - Low complexity, high repetition
2. **Type File Organization** - Auto-generated, structural split
3. **Script Utility Extraction** - Pattern-based, common operations

### Manual Refactoring Required:
1. **lib/scraper-worker.js** - Complex orchestration logic
2. **API test helpers** - Requires deep domain knowledge

---

## Success Metrics

**Goals:**
- [ ] Zero files >500 LOC (tests)
- [ ] Zero files >300 LOC (production)
- [ ] All files >280 LOC proactively refactored
- [ ] 100% pre-commit compliance

**Progress Tracking:**
- Phase 1 Complete: 3/35 files (8.6%)
- Phase 2 Complete: 7/35 files (20%)
- Phase 3 Complete: 21/35 files (60%)
- Phase 4 Complete: 31/35 files (88.6%)
- Phase 5 Complete: 35/35 files (100%)

**Current Status:** Phase 0 Complete (proactive refactoring of search page)

---

## Next Actions

**Immediate (This Session):**
1. ✅ Refactor search page (completed)
2. ⏳ Create this refactoring report
3. ⏳ Create modular architecture documentation
4. 🔜 Choose Phase 1 file to refactor (recommend lib/scraper-worker.js)

**This Week:**
1. Complete Phase 1 refactoring (3 critical files)
2. Update LOC compliance dashboard
3. Document refactoring patterns

**This Month:**
1. Complete Phases 1-3 (eliminate all violations)
2. Create automated refactoring scripts
3. Implement continuous LOC monitoring

---

## Related Documentation

- [LOC Compliance Guide](../02-GUIDES/GUIDE_LOC_COMPLIANCE_STRUCTURE.md)
- [Modular Architecture Benefits](./ANALYSIS_MODULAR_ARCHITECTURE_GUIDE.md) (to be created)
- [Refactoring Patterns](./ANALYSIS_REFACTORING_PATTERNS.md) (to be created)

---

**Report Generated:** 2025-11-10
**Next Review:** After Phase 1 completion
**Maintained By:** Development Team
