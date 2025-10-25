# Refactoring Orchestration Plan
## Target: 99 Files → 100% Compliance with 300 LOC Limit

**Generated:** 2025-10-25
**Total Files:** 99
**Total Excess LOC:** 16,503
**Average Violation:** 167 LOC over limit
**Worst Offender:** app/dashboard/privacy/page.tsx (1131 LOC)

---

## Strategy Overview

### Phase-Based Approach
1. **Phase 1:** Core Libraries (High Dependency, Critical Infrastructure)
2. **Phase 2:** Dashboard Pages (High LOC, Low Dependency, Isolated)
3. **Phase 3:** API Routes (Medium Risk, Backend Logic)
4. **Phase 4:** React Components (UI Layer, Moderate Dependency)
5. **Phase 5:** Test Files (Zero Production Risk, Can Split Freely)
6. **Phase 6:** Supporting Libraries (Queue, Monitoring, Analytics)
7. **Phase 7:** Integration Files (WooCommerce, Shopify, Customer)

### Validation Checkpoints
- After each phase: TypeScript compilation check
- After Phases 1, 3, 6: Full production build
- After Phase 7: Complete test suite validation
- Continuous: Git commits after each successful phase

---

## PHASE 1: Critical Core Libraries (10 files, ~6,200 LOC)
**Risk Level:** 🔴 HIGH - These are foundation files with many dependencies
**Agent Deployment:** 10 parallel refactoring agents → 1 validation agent → 1 fixer agent

### Files (Priority Order):
1. lib/rate-limiter-enhanced.ts (808 LOC) → Target: 4 modules
2. lib/ecommerce-extractor.ts (800 LOC) → Target: 5 modules
3. lib/ai-metadata-generator.ts (684 LOC) → Target: 4 modules
4. lib/enhanced-embeddings.ts (616 LOC) → Target: 4 modules
5. lib/ai-content-extractor.ts (570 LOC) → Target: 3 modules
6. lib/crawler-config.ts (564 LOC) → Target: 3 modules
7. lib/woocommerce-full.ts (564 LOC) → Target: 4 modules
8. lib/semantic-chunker.ts (551 LOC) → Target: 3 modules
9. lib/business-classifier.ts (533 LOC) → Target: 3 modules
10. lib/chat-context-enhancer.ts (488 LOC) → Target: 3 modules

**Extraction Pattern:**
- types.ts (interfaces, Zod schemas)
- strategies.ts (algorithms, processing logic)
- validators.ts (validation functions)
- utils.ts (helper functions)
- main.ts (orchestrator/re-export shim <300 LOC)

**Validation:**
- `npx tsc --noEmit` (must pass with 0 errors)
- `npm run build` (production build must succeed)
- Git commit with detailed message

---

## PHASE 2: Dashboard Pages (12 files, ~7,800 LOC)
**Risk Level:** 🟡 MEDIUM - UI components, mostly isolated
**Agent Deployment:** 12 parallel refactoring agents → 1 validation agent

### Files (By Size):
1. app/dashboard/privacy/page.tsx (1131 LOC) → Target: 6 components
2. app/dashboard/settings/page.tsx (795 LOC) → Target: 4 components
3. app/dashboard/training/page.tsx (732 LOC) → Target: 4 components
4. app/configure/page.tsx (720 LOC) → Target: 4 components
5. app/page.tsx (662 LOC) → Target: 3 components
6. app/dashboard/page.tsx (634 LOC) → Target: 3 components
7. app/dashboard/help/page.tsx (625 LOC) → Target: 3 components
8. app/dashboard/analytics/page.tsx (503 LOC) → Target: 3 components
9. app/dashboard/telemetry/page.tsx (467 LOC) → Target: 2 components
10. app/dashboard/conversations/page.tsx (458 LOC) → Target: 2 components
11. app/dashboard/layout.tsx (424 LOC) → Target: 2 components
12. app/dashboard/team/page.tsx (423 LOC) → Target: 2 components

**Extraction Pattern (React Pages):**
- components/ subdirectory for page-specific components
- hooks/ subdirectory for page-specific hooks
- utils.ts for data formatting/helpers
- types.ts for page-specific interfaces
- page.tsx (main component <300 LOC)

**Validation:**
- `npx tsc --noEmit`
- Visual check: `npm run dev` → verify pages load
- Git commit

---

## PHASE 3: API Routes (7 files, ~3,200 LOC)
**Risk Level:** 🔴 HIGH - Backend logic, data handling
**Agent Deployment:** 7 parallel refactoring agents → 1 validation agent → 1 fixer agent

### Files:
1. app/api/dashboard/telemetry/route.ts (593 LOC) → Target: 4 modules
2. app/api/customer/config/route.ts (526 LOC) → Target: 3 modules
3. app/api/dashboard/woocommerce/[...path]/route.ts (506 LOC) → Target: 3 modules
4. app/api/widget-config/route.ts (467 LOC) → Target: 3 modules
5. app/api/search/products/route.ts (441 LOC) → Target: 3 modules
6. app/api/health/comprehensive/route.ts (401 LOC) → Target: 3 modules
7. app/api/scrape/route.ts (391 LOC) → Target: 3 modules

**Extraction Pattern (API Routes):**
- handlers.ts (request handlers)
- validators.ts (Zod schemas, input validation)
- services.ts (business logic)
- utils.ts (helper functions)
- route.ts (main entry point <300 LOC)

**Validation:**
- `npx tsc --noEmit`
- `npm run build`
- API smoke test via curl (if dev server running)
- Git commit

---

## PHASE 4: React Components (3 files, ~1,250 LOC)
**Risk Level:** 🟡 MEDIUM - UI layer
**Agent Deployment:** 3 parallel refactoring agents → 1 validation agent

### Files:
1. components/ChatWidget.tsx (542 LOC) → Target: 3 components
2. components/dashboard/business-intelligence-card.tsx (394 LOC) → Target: 2 components
3. components/organizations/upgrade-seats-modal.tsx (319 LOC) → Target: 2 components

**Extraction Pattern:**
- Break into smaller sub-components
- Extract hooks to separate files
- Extract constants/types

**Validation:**
- `npx tsc --noEmit`
- Git commit

---

## PHASE 5: Test Files (23 files, ~10,500 LOC)
**Risk Level:** 🟢 LOW - Zero production impact
**Agent Deployment:** 23 parallel refactoring agents → 1 validation agent

### Strategy: Split by test scenario/feature
Each test file can be split into multiple smaller test files by feature area.

### Files (Largest First):
1. __tests__/utils/integration-test-helpers.ts (888 LOC)
2. __tests__/integration/enhanced-scraper-system.test.ts (877 LOC)
3. __tests__/lib/ecommerce-extractor.test.ts (663 LOC)
4. __tests__/components/auth/UserMenu.test.tsx (612 LOC)
5. __tests__/api/organizations/invitations.test.ts (574 LOC)
6. __tests__/components/ChatWidget.test.tsx (546 LOC)
7. __tests__/lib/chat-service.test.ts (530 LOC)
8. __tests__/lib/pattern-learner.test.ts (519 LOC)
9. __tests__/lib/agents/domain-agnostic-agent.test.ts (492 LOC)
10. __tests__/components/ErrorBoundary.test.tsx (479 LOC)
11. __tests__/lib/analytics/business-intelligence.test.ts (461 LOC)
12. __tests__/lib/pagination-crawler.test.ts (413 LOC)
13. __tests__/hooks/use-gdpr-delete.test.tsx (409 LOC)
14. __tests__/lib/woocommerce.test.ts (400 LOC)
15. __tests__/lib/rate-limiter-enhanced.test.ts (372 LOC)
16. __tests__/lib/agents/providers/shopify-provider.test.ts (366 LOC)
17. __tests__/hooks/use-gdpr-export.test.tsx (362 LOC)
18. __tests__/lib/organization-helpers.test.ts (357 LOC)
19. __tests__/lib/product-normalizer.test.ts (357 LOC)
20. __tests__/api/chat/route-async.test.ts (355 LOC)
21. __tests__/mocks/handlers.ts (336 LOC)
22. __tests__/api/scrape/route.test.ts (335 LOC)
23. __tests__/lib/woocommerce-api.test.ts (312 LOC)
24. __tests__/api/analytics/intelligence.test.ts (310 LOC)
25. __tests__/enhanced-context.test.ts (302 LOC)
26. __tests__/hooks/use-dashboard-overview.test.tsx (302 LOC)

**Validation:**
- `npx tsc --noEmit`
- `npm test` (if time permits, otherwise defer)
- Git commit

---

## PHASE 6: Supporting Libraries (16 files, ~6,100 LOC)
**Risk Level:** 🟡 MEDIUM - Infrastructure support
**Agent Deployment:** 16 parallel refactoring agents → 1 validation agent → 1 fixer agent

### Categories:

**Monitoring & Analytics (4 files):**
1. lib/monitoring/scrape-monitor.ts (596 LOC)
2. lib/analytics/business-intelligence.ts (679 LOC)
3. lib/monitoring/dashboard-data.ts (396 LOC)
4. lib/chat-telemetry.ts (361 LOC)

**Queue Management (3 files):**
5. lib/scrape-job-manager.ts (454 LOC)
6. lib/queue/queue-utils.ts (436 LOC)
7. lib/queue/job-processor.ts (401 LOC)
8. lib/queue/scrape-queue.ts (334 LOC)

**Redis & Caching (2 files):**
9. lib/redis-enhanced.ts (458 LOC)
10. lib/redis-fallback.ts (408 LOC)

**Content Processing (4 files):**
11. lib/reindex-embeddings.ts (397 LOC)
12. lib/metadata-extractor.ts (385 LOC)
13. lib/content-refresh.ts (383 LOC)
14. lib/metadata-extractor-optimized.ts (329 LOC)

**Utilities (3 files):**
15. lib/error-logger.ts (322 LOC)
16. lib/customer-verification.ts (328 LOC)

**Validation:**
- `npx tsc --noEmit`
- `npm run build`
- Git commit

---

## PHASE 7: Integration Files (28 files, ~10,000 LOC)
**Risk Level:** 🟡 MEDIUM - E-commerce integrations
**Agent Deployment:** 28 parallel refactoring agents → 1 validation agent

### Categories:

**WooCommerce (10 files):**
1. lib/woocommerce-customer.ts (426 LOC)
2. lib/woocommerce-order-modifications.ts (364 LOC)
3. lib/woocommerce-customer-actions.ts (337 LOC)
4. lib/chat/woocommerce-tool.ts (357 LOC)
5. lib/product-normalizer.ts (340 LOC)
6. lib/product-content-extractor.ts (310 LOC)
7. app/dashboard/integrations/woocommerce/page.tsx (434 LOC)
8. app/dashboard/integrations/woocommerce/configure/page.tsx (421 LOC)
9. app/dashboard/integrations/woocommerce/page-old.tsx (420 LOC)
10. app/api/organizations/[id]/invitations/route.ts (311 LOC)

**Shopify (2 files):**
11. lib/shopify-api.ts (320 LOC)
12. app/dashboard/integrations/shopify/page.tsx (366 LOC)

**Scraper Infrastructure (8 files):**
13. lib/workers/scraper-worker-service.ts (425 LOC)
14. lib/integrations/customer-scraping-integration.ts (469 LOC)
15. lib/scraper-rate-limit-integration.ts (355 LOC)
16. lib/scraper-config-manager.ts (546 LOC) - Already done, needs re-check
17. lib/scraper-config-presets.ts (429 LOC) - Already done, needs re-check
18. lib/scraper-api-handlers.ts (303 LOC)
19. lib/structured-content-extractor.ts (310 LOC)
20. lib/content-deduplicator.ts (320 LOC)
21. lib/content-deduplicator-compression.ts (384 LOC)

**Dashboard Integration Pages (3 files):**
22. app/dashboard/integrations/page.tsx (363 LOC)
23. app/api/monitoring/chat/route.ts (330 LOC)
24. app/api/dashboard/overview/route.ts (301 LOC)

**Examples & Docs (1 file):**
25. lib/examples/rate-limiter-usage.ts (334 LOC)

**Validation:**
- `npx tsc --noEmit`
- Integration smoke tests (if applicable)
- Git commit

---

## Execution Timeline Estimate

| Phase | Files | Agent Hours | Wall Time (Parallel) | Validation | Total |
|-------|-------|-------------|---------------------|------------|-------|
| Phase 1 | 10 | 20h | ~2h | 30m | 2.5h |
| Phase 2 | 12 | 18h | ~1.5h | 20m | 1.8h |
| Phase 3 | 7 | 14h | ~2h | 30m | 2.5h |
| Phase 4 | 3 | 4h | ~1.5h | 15m | 1.8h |
| Phase 5 | 26 | 30h | ~1.5h | 20m | 1.8h |
| Phase 6 | 16 | 24h | ~1.5h | 30m | 2h |
| Phase 7 | 25 | 30h | ~2h | 30m | 2.5h |
| **TOTAL** | **99** | **140h** | **~12h** | **3h** | **15h** |

**With 10 concurrent agents per phase: ~15 hours total wall time**

---

## Agent Specialization

### Refactoring Agents (the-fixer)
- Extract logical modules from monolithic files
- Maintain backwards compatibility
- Follow extraction patterns
- Verify TypeScript compilation

### Validation Agents (code-quality-validator)
- Run TypeScript type checking
- Identify compilation errors
- Generate error reports
- Confirm production build success

### Fixer Agents (the-fixer)
- Resolve compilation errors from refactoring
- Fix missing imports
- Resolve type conflicts
- Re-validate after fixes

---

## Success Criteria

✅ All 99 files under 300 LOC
✅ TypeScript compilation: 0 errors
✅ Production build: Success
✅ All original exports preserved (100% backwards compatible)
✅ Git history: Clean, atomic commits per phase
✅ No functionality regressions

---

## Rollback Strategy

If any phase fails critically:
1. Git revert to last known good commit
2. Analyze failure with forensic-issue-finder agent
3. Adjust strategy and retry phase
4. Document learnings in this plan

---

## Next Steps

1. ✅ Plan created and documented
2. 🔄 Begin Phase 1 execution (10 parallel agents)
3. ⏳ Validate Phase 1 results
4. ⏳ Proceed to Phase 2
5. ⏳ Continue through Phase 7
6. ⏳ Final validation and celebration 🎉
