# LOC Refactoring Wave 10 Orchestration Plan

**Type:** Analysis - Execution Plan  
**Status:** ✅ Ready for Execution  
**Date:** 2025-11-11  
**Wave:** 10 of N (covers every remaining violation)  
**Data Source:** `bash scripts/check-loc-compliance.sh` (run 2025-11-11, 03:35 UTC, 3,025 files scanned)

---

## Executive Summary

- **Scope:** 69 TypeScript/JavaScript files currently exceed the strict 300 LOC cap (total **4,611 LOC** above the limit).  
- **Backlog Composition:** 24 tooling scripts, 23 automated tests (integration, API, Playwright, server), 11 library/unit suites, and 11 supporting assets (agents, WooCommerce, utilities, servers).  
- **Risk:** 31 additional files sit between 280-300 LOC and must be guarded during this wave to prevent churn.  
- **Outcome Goal:** Reduce every violating file to ≤200 LOC (stretch), ensure orchestrator files stay under 80 LOC, and bring the warnings list below 10 entries.  
- **Agent Delivery:** A dedicated LOC agent stack (Architect, Planner, Refactor, Verification) plus five execution pods are now defined to allow parallel progress without context thrash.  
- **Verification:** Every pull request must include `bash scripts/check-loc-compliance.sh --staged`, `npx tsx scripts/check-file-length.ts --strict`, targeted Jest/Playwright suites, and lint+type checks.

---

## Current LOC Snapshot (11 Nov 2025)

- **Violations:** 69 files >300 LOC (`.tmp/loc-violations.json` generated from compliance script)  
- **Warnings:** 31 files at 280-300 LOC (`.tmp/loc-warnings.json`)  
- **Worst Offender:** `__tests__/integration/test-hallucination-prevention.ts` (513 LOC)  
- **Average Excess:** 66.8 LOC per violating file

### Category Breakdown

| Category | Files | Avg LOC | Top Offender |
|----------|-------|---------|--------------|
| Tooling Scripts | 24 | 362.5 | `scripts/analysis/profile-database-performance.js` (454 LOC) |
| Library Unit Tests | 11 | 335.1 | `__tests__/lib/search/conversation-search.test.ts` (382 LOC) |
| API Tests | 9 | 354.3 | `__tests__/api/follow-ups/route.test.ts` (414 LOC) |
| Integration Tests | 5 | 440.2 | `__tests__/integration/test-hallucination-prevention.ts` (513 LOC) |
| Playwright Tests | 3 | 410.7 | `__tests__/playwright/advanced-features/automated-follow-ups.spec.ts` (499 LOC) |
| Server Modules | 3 | 455.7 | `servers/content/__tests__/getCompletePageDetails.test.ts` (480 LOC) |
| Test Utilities | 3 | 332.0 | `test-utils/supabase-test-helpers.ts` (348 LOC) |
| Agent Tests | 2 | 357.5 | `__tests__/agents/test-agent-edge-cases.ts` (393 LOC) |
| Database Tests | 2 | 341.5 | `__tests__/database/test-chunk-quality-analysis.ts` (342 LOC) |
| WooCommerce Tests | 2 | 303.0 | `__tests__/woocommerce/test-woocommerce-chat-integration.ts` (304 LOC) |
| Component Tests | 1 | 440.0 | `__tests__/components/ChatWidget/hooks/useParentCommunication-messages.test.ts` (440 LOC) |
| Edge Case Tests | 1 | 332.0 | `__tests__/edge-cases/injection-prevention.test.ts` (332 LOC) |
| Hooks Tests | 1 | 344.0 | `__tests__/hooks/useRecommendations.test.ts` (344 LOC) |
| Script Validation Tests | 1 | 498.0 | `__tests__/scripts/compare-mcp-traditional.test.ts` (498 LOC) |
| System E2E Tests | 1 | 323.0 | `__tests__/e2e/production-readiness.test.ts` (323 LOC) |

---

## Agent Suite (Wave 10)

| Agent | File | Default Model | Mission |
|-------|------|---------------|---------|
| **LOC Architect Agent** | `.claude/agents/loc-architect.md` | Opus | Owns the Wave 10 campaign, refreshes LOC data, prioritizes tiers, spins up pods, and signs off orchestration decisions. |
| **LOC Planner Agent** | `.claude/agents/loc-planner.md` | Sonnet | Consumes architect missions, reads full files, designs module splits, outlines helper moves, and enumerates verification needed per file. |
| **LOC Refactor Agent** | `.claude/agents/loc-refactor.md` | Sonnet | Implements the concrete module breakdown, updates imports/tests, keeps every new file ≤200 LOC, and documents migrations. |
| **LOC Verification Agent** | `.claude/agents/loc-verifier.md` | Haiku | Re-runs compliance + targeted suites, ensures staging diff is clean, and blocks merge if any file exceeds 300 LOC after refactor. |

### Execution Pods

| Pod | Coverage | Staffed Agents | Notes |
|-----|----------|----------------|-------|
| **Pod I – Integration & Server** | Integration, database, system E2E, `servers/**` suites | LOC Architect → Planner → Refactor → Verification | Focus on scenario-based splits, shared fixtures, and handler/service boundaries. |
| **Pod P – Playwright & UI** | Playwright specs, component/hooks tests | LOC Planner + LOC Refactor with Playwright context | Enforce orchestrator <50 LOC, move flows into page objects, and reuse existing helper modules. |
| **Pod A – API & Commerce** | API route tests, WooCommerce suites | Architect assigns; Planner pairs with refactoring specialist for API harness | Split per endpoint/error mode; standardize on `test-utils/api-test-helpers`. |
| **Pod L – Library & Intelligence** | Library/unit/agent/edge-case tests | Planner + Refactor | Extract builders, keep algorithms isolated, ensure typed helpers under `__tests__/lib/**/helpers`. |
| **Pod S – Tooling & Utilities** | CLI scripts, monitoring, verification tools, shared test utilities | Planner + Refactor + Verification | Every script gets `bin` entry + `lib/scripts/**` modules, add Jest smoke tests where missing. |

---

## Execution Phases

1. **Phase 0 – Refresh Data (Daily)**  
   - `bash scripts/check-loc-compliance.sh > .tmp/loc-report.txt || true`  
   - `python scripts/checks/summarize-loc-report.py` (planned) to keep JSON snapshots.  
   - Architect updates Tier tables in this plan if counts change.

2. **Phase 1 – Triage & Scheduling**  
   - Architect runs Pod capacity check, assigns Tier A/B files first.  
   - Planner agents receive 3–5 files each with mission templates referencing sections below.

3. **Phase 2 – Module Design (Planner)**  
   - Read entire file, note responsibilities, propose target module tree, document helper moves, choose validation steps, and hand back plan+line references.

4. **Phase 3 – Refactor Implementation**  
   - Refactor agent executes plan, ensuring each extracted module stays well below 200 LOC, updates imports/tests, and records new files in relevant README.

5. **Phase 4 – Verification & Compliance Gate**  
   - Verification agent runs `bash scripts/check-loc-compliance.sh --staged`, `npx tsx scripts/check-file-length.ts --staged --strict`, targeted Jest/Playwright suites, and `npm run lint`.  
   - Architect receives summary and marks item complete in tracker.

6. **Phase 5 – Documentation & Roll-up**  
   - Update `docs/10-ANALYSIS/LOC_REFACTORING_CAMPAIGN_SUMMARY.md` and wave-specific report(s) with before/after LOC, modules created, and tests preserved.

---

## Prioritized Backlog (Tiers)

The tables below list **all 69 files**, grouped by severity tiers. Each row includes the owning pod and the primary move the Planner+Refactor pair must deliver. Regenerate the tables via `.tmp/loc-tier-tables.md` whenever the compliance report changes.

### Tier A: ≥450 (7 files)
| # | File | LOC | Category | Pod | Primary Refactor Move |
|---|------|-----|----------|-----|-----------------------|
| 1 | `__tests__/integration/test-hallucination-prevention.ts` | 513 | Integration Tests | Pod I - Integration & Server | Split scenarios by feature (hallucination prevention, follow-ups, analytics) and extract shared fixtures into __tests__/integration/utils. |
| 2 | `__tests__/playwright/advanced-features/automated-follow-ups.spec.ts` | 499 | Playwright Tests | Pod P - Playwright & UI | Use page objects + scenario-specific spec files; keep orchestrator <50 LOC. |
| 3 | `__tests__/integration/analytics/export-integration.test.ts` | 498 | Integration Tests | Pod I - Integration & Server | Split scenarios by feature (hallucination prevention, follow-ups, analytics) and extract shared fixtures into __tests__/integration/utils. |
| 4 | `__tests__/scripts/compare-mcp-traditional.test.ts` | 498 | Script Validation Tests | Pod S - Tooling & Utilities | Split verification cases per product and reuse dataset definitions. |
| 5 | `servers/content/__tests__/getCompletePageDetails.test.ts` | 480 | Server Modules | Pod I - Integration & Server | Split route handlers vs domain services and align tests per handler. |
| 6 | `servers/commerce/__tests__/lookupOrder.test.ts` | 456 | Server Modules | Pod I - Integration & Server | Split route handlers vs domain services and align tests per handler. |
| 7 | `scripts/analysis/profile-database-performance.js` | 454 | Tooling Scripts | Pod S - Tooling & Utilities | Separate CLI entry vs pure functions; move reusable logic into lib/scripts/** modules. |

### Tier B: 400-449 (10 files)
| # | File | LOC | Category | Pod | Primary Refactor Move |
|---|------|-----|----------|-----|-----------------------|
| 1 | `__tests__/components/ChatWidget/hooks/useParentCommunication-messages.test.ts` | 440 | Component Tests | Pod P - Playwright & UI | Split hooks/components per concern and reuse render helpers. |
| 2 | `servers/search/__tests__/searchByCategory.test.ts` | 431 | Server Modules | Pod I - Integration & Server | Split route handlers vs domain services and align tests per handler. |
| 3 | `__tests__/integration/test-real-world-conversations.ts` | 426 | Integration Tests | Pod I - Integration & Server | Split scenarios by feature (hallucination prevention, follow-ups, analytics) and extract shared fixtures into __tests__/integration/utils. |
| 4 | `scripts/utilities/validate-thompsons-scrape.ts` | 422 | Tooling Scripts | Pod S - Tooling & Utilities | Separate CLI entry vs pure functions; move reusable logic into lib/scripts/** modules. |
| 5 | `scripts/verify-supabase-mcp.js` | 421 | Tooling Scripts | Pod S - Tooling & Utilities | Separate CLI entry vs pure functions; move reusable logic into lib/scripts/** modules. |
| 6 | `scripts/monitoring/check-token-anomalies.ts` | 420 | Tooling Scripts | Pod S - Tooling & Utilities | Separate CLI entry vs pure functions; move reusable logic into lib/scripts/** modules. |
| 7 | `__tests__/api/follow-ups/route.test.ts` | 414 | API Tests | Pod A - API & Commerce | Split by endpoint/error path and push shared request helpers to test-utils/api. |
| 8 | `scripts/testing/load-simulator.ts` | 408 | Tooling Scripts | Pod S - Tooling & Utilities | Separate CLI entry vs pure functions; move reusable logic into lib/scripts/** modules. |
| 9 | `__tests__/api/analytics/export/route.test.ts` | 403 | API Tests | Pod A - API & Commerce | Split by endpoint/error path and push shared request helpers to test-utils/api. |
| 10 | `scripts/test-customer-flow.js` | 401 | Tooling Scripts | Pod S - Tooling & Utilities | Separate CLI entry vs pure functions; move reusable logic into lib/scripts/** modules. |

### Tier C: 350-399 (17 files)
| # | File | LOC | Category | Pod | Primary Refactor Move |
|---|------|-----|----------|-----|-----------------------|
| 1 | `__tests__/agents/test-agent-edge-cases.ts` | 393 | Agent Tests | Pod L - Library & Intelligence | Separate provider vs behavior cases; relocate fixtures to __tests__/lib/agents/helpers. |
| 2 | `__tests__/playwright/dashboard/widget-customization.spec.ts` | 392 | Playwright Tests | Pod P - Playwright & UI | Use page objects + scenario-specific spec files; keep orchestrator <50 LOC. |
| 3 | `__tests__/integration/test-multi-turn-e2e.ts` | 386 | Integration Tests | Pod I - Integration & Server | Split scenarios by feature (hallucination prevention, follow-ups, analytics) and extract shared fixtures into __tests__/integration/utils. |
| 4 | `scripts/optimize-existing-data.ts` | 385 | Tooling Scripts | Pod S - Tooling & Utilities | Separate CLI entry vs pure functions; move reusable logic into lib/scripts/** modules. |
| 5 | `scripts/tests/test-performance-analysis.ts` | 384 | Tooling Scripts | Pod S - Tooling & Utilities | Separate CLI entry vs pure functions; move reusable logic into lib/scripts/** modules. |
| 6 | `__tests__/lib/search/conversation-search.test.ts` | 382 | Library Unit Tests | Pod L - Library & Intelligence | Split by algorithm/module and extract shared data builders. |
| 7 | `__tests__/integration/follow-ups/follow-up-flow.test.ts` | 378 | Integration Tests | Pod I - Integration & Server | Split scenarios by feature (hallucination prevention, follow-ups, analytics) and extract shared fixtures into __tests__/integration/utils. |
| 8 | `scripts/validate-doc-code-examples.ts` | 378 | Tooling Scripts | Pod S - Tooling & Utilities | Separate CLI entry vs pure functions; move reusable logic into lib/scripts/** modules. |
| 9 | `scripts/schedule-doc-reviews.ts` | 376 | Tooling Scripts | Pod S - Tooling & Utilities | Separate CLI entry vs pure functions; move reusable logic into lib/scripts/** modules. |
| 10 | `__tests__/api/chat/widget-config-e2e.test.ts` | 375 | API Tests | Pod A - API & Commerce | Split by endpoint/error path and push shared request helpers to test-utils/api. |
| 11 | `__tests__/lib/autonomous/agents/shopify-setup-agent.test.ts` | 370 | Library Unit Tests | Pod L - Library & Intelligence | Split by algorithm/module and extract shared data builders. |
| 12 | `scripts/playwright-comprehensive-test.js` | 370 | Tooling Scripts | Pod S - Tooling & Utilities | Separate CLI entry vs pure functions; move reusable logic into lib/scripts/** modules. |
| 13 | `__tests__/lib/follow-ups/analytics.test.ts` | 367 | Library Unit Tests | Pod L - Library & Intelligence | Split by algorithm/module and extract shared data builders. |
| 14 | `scripts/audit-doc-versions.ts` | 364 | Tooling Scripts | Pod S - Tooling & Utilities | Separate CLI entry vs pure functions; move reusable logic into lib/scripts/** modules. |
| 15 | `scripts/performance-benchmark.js` | 362 | Tooling Scripts | Pod S - Tooling & Utilities | Separate CLI entry vs pure functions; move reusable logic into lib/scripts/** modules. |
| 16 | `__tests__/api/test-error-handling-analysis.ts` | 361 | API Tests | Pod A - API & Commerce | Split by endpoint/error path and push shared request helpers to test-utils/api. |
| 17 | `__tests__/api/test-error-handling-analysis.js` | 355 | API Tests | Pod A - API & Commerce | Split by endpoint/error path and push shared request helpers to test-utils/api. |

### Tier D: 320-349 (19 files)
| # | File | LOC | Category | Pod | Primary Refactor Move |
|---|------|-----|----------|-----|-----------------------|
| 1 | `__tests__/lib/autonomous/core/operation-service.test.ts` | 349 | Library Unit Tests | Pod L - Library & Intelligence | Split by algorithm/module and extract shared data builders. |
| 2 | `scripts/tests/test-hallucination-prevention.ts` | 349 | Tooling Scripts | Pod S - Tooling & Utilities | Separate CLI entry vs pure functions; move reusable logic into lib/scripts/** modules. |
| 3 | `test-utils/supabase-test-helpers.ts` | 348 | Test Utilities | Pod S - Tooling & Utilities | Break helper families (API, Supabase, Mock) into submodules; document surfaces. |
| 4 | `scripts/database/check-organization-integrity.ts` | 347 | Tooling Scripts | Pod S - Tooling & Utilities | Separate CLI entry vs pure functions; move reusable logic into lib/scripts/** modules. |
| 5 | `__tests__/hooks/useRecommendations.test.ts` | 344 | Hooks Tests | Pod P - Playwright & UI | Break tests per hook responsibility and centralize mock store builders. |
| 6 | `__tests__/database/test-chunk-quality-analysis.ts` | 342 | Database Tests | Pod I - Integration & Server | Move setup/teardown into db fixtures and separate validation suites per table/policy. |
| 7 | `__tests__/database/test-rls-policies.ts` | 341 | Database Tests | Pod I - Integration & Server | Move setup/teardown into db fixtures and separate validation suites per table/policy. |
| 8 | `__tests__/playwright/integrations/woocommerce-cart-operations-e2e.spec.ts` | 341 | Playwright Tests | Pod P - Playwright & UI | Use page objects + scenario-specific spec files; keep orchestrator <50 LOC. |
| 9 | `__tests__/lib/recommendations/hybrid-ranker.test.ts` | 341 | Library Unit Tests | Pod L - Library & Intelligence | Split by algorithm/module and extract shared data builders. |
| 10 | `__tests__/lib/analytics/export/pdf-exporter.test.ts` | 336 | Library Unit Tests | Pod L - Library & Intelligence | Split by algorithm/module and extract shared data builders. |
| 11 | `__tests__/edge-cases/injection-prevention.test.ts` | 332 | Edge Case Tests | Pod L - Library & Intelligence | Isolate each exploit vector and reuse sanitization helpers. |
| 12 | `test-utils/jest.setup.msw.js` | 330 | Test Utilities | Pod S - Tooling & Utilities | Break helper families (API, Supabase, Mock) into submodules; document surfaces. |
| 13 | `__tests__/api/csrf/csrf-protection.test.ts` | 329 | API Tests | Pod A - API & Commerce | Split by endpoint/error path and push shared request helpers to test-utils/api. |
| 14 | `scripts/tests/test-chat-responses.ts` | 328 | Tooling Scripts | Pod S - Tooling & Utilities | Separate CLI entry vs pure functions; move reusable logic into lib/scripts/** modules. |
| 15 | `scripts/monitoring/monitor-embeddings-health.ts` | 328 | Tooling Scripts | Pod S - Tooling & Utilities | Separate CLI entry vs pure functions; move reusable logic into lib/scripts/** modules. |
| 16 | `scripts/validation-test.js` | 328 | Tooling Scripts | Pod S - Tooling & Utilities | Separate CLI entry vs pure functions; move reusable logic into lib/scripts/** modules. |
| 17 | `__tests__/api/woocommerce/cart-test.test.ts` | 324 | API Tests | Pod A - API & Commerce | Split by endpoint/error path and push shared request helpers to test-utils/api. |
| 18 | `__tests__/e2e/production-readiness.test.ts` | 323 | System E2E Tests | Pod I - Integration & Server | Break flow into smoke vs resilience suites and reuse env harness. |
| 19 | `__tests__/agents/test-ai-agent-real-scenarios.ts` | 322 | Agent Tests | Pod L - Library & Intelligence | Separate provider vs behavior cases; relocate fixtures to __tests__/lib/agents/helpers. |

### Tier E: 300-319 (16 files)
| # | File | LOC | Category | Pod | Primary Refactor Move |
|---|------|-----|----------|-----|-----------------------|
| 1 | `scripts/apply-rls-optimization.js` | 319 | Tooling Scripts | Pod S - Tooling & Utilities | Separate CLI entry vs pure functions; move reusable logic into lib/scripts/** modules. |
| 2 | `scripts/validation/verify-playwright-setup.js` | 319 | Tooling Scripts | Pod S - Tooling & Utilities | Separate CLI entry vs pure functions; move reusable logic into lib/scripts/** modules. |
| 3 | `test-utils/api-test-helpers.ts` | 318 | Test Utilities | Pod S - Tooling & Utilities | Break helper families (API, Supabase, Mock) into submodules; document surfaces. |
| 4 | `__tests__/api/admin/test-lookup-failures-endpoint.ts` | 318 | API Tests | Pod A - API & Commerce | Split by endpoint/error path and push shared request helpers to test-utils/api. |
| 5 | `__tests__/lib/agents/business-types/edge-cases.test.ts` | 313 | Library Unit Tests | Pod L - Library & Intelligence | Split by algorithm/module and extract shared data builders. |
| 6 | `scripts/fix-remaining-rls.js` | 313 | Tooling Scripts | Pod S - Tooling & Utilities | Separate CLI entry vs pure functions; move reusable logic into lib/scripts/** modules. |
| 7 | `__tests__/lib/agents/providers/woocommerce-provider.test.ts` | 312 | Library Unit Tests | Pod L - Library & Intelligence | Split by algorithm/module and extract shared data builders. |
| 8 | `__tests__/api/organizations/list-organizations.test.ts` | 310 | API Tests | Pod A - API & Commerce | Split by endpoint/error path and push shared request helpers to test-utils/api. |
| 9 | `scripts/tests/test-teng-investigation.ts` | 310 | Tooling Scripts | Pod S - Tooling & Utilities | Separate CLI entry vs pure functions; move reusable logic into lib/scripts/** modules. |
| 10 | `__tests__/lib/analytics/export/excel-exporter.test.ts` | 308 | Library Unit Tests | Pod L - Library & Intelligence | Split by algorithm/module and extract shared data builders. |
| 11 | `scripts/verification/verify-security-migration.ts` | 308 | Tooling Scripts | Pod S - Tooling & Utilities | Separate CLI entry vs pure functions; move reusable logic into lib/scripts/** modules. |
| 12 | `__tests__/lib/recommendations/vector-similarity.test.ts` | 306 | Library Unit Tests | Pod L - Library & Intelligence | Split by algorithm/module and extract shared data builders. |
| 13 | `scripts/migrations/apply-enhanced-metadata-migration.ts` | 305 | Tooling Scripts | Pod S - Tooling & Utilities | Separate CLI entry vs pure functions; move reusable logic into lib/scripts/** modules. |
| 14 | `__tests__/woocommerce/test-woocommerce-chat-integration.ts` | 304 | WooCommerce Tests | Pod A - API & Commerce | Divide by operation (cart, chat, checkout) and reuse commerce helpers. |
| 15 | `__tests__/woocommerce/test-woocommerce-operations-corrected.ts` | 302 | WooCommerce Tests | Pod A - API & Commerce | Divide by operation (cart, chat, checkout) and reuse commerce helpers. |
| 16 | `__tests__/lib/shopify-dynamic.test.ts` | 302 | Library Unit Tests | Pod L - Library & Intelligence | Split by algorithm/module and extract shared data builders. |

---

## Warning Watchlist (31 files @ 280-300 LOC)

These files are technically compliant but at immediate risk. Pods should opportunistically refactor them while working adjacent files.

| File | LOC | Suggested Action |
|------|-----|------------------|
| `test-utils/mock-helpers.ts` | 297 | Split immediately (within Pod owning domain). |
| `__tests__/database/test-storage-utilities.ts` | 287 | Schedule refactor next after Tier E. |
| `__tests__/woocommerce/test-all-woocommerce-operations.ts` | 293 | Schedule refactor next after Tier E. |
| `__tests__/integration/search-consistency.test.ts` | 299 | Split immediately (within Pod owning domain). |
| `__tests__/integration/test-real-world-metadata-validation.ts` | 283 | Monitor during upcoming feature work. |
| `__tests__/playwright/dashboard/chat-history-search.spec.ts` | 299 | Split immediately (within Pod owning domain). |
| `__tests__/playwright/error-scenarios/database-conflict.spec.ts` | 293 | Schedule refactor next after Tier E. |
| `__tests__/components/chat/MessageContent.test.tsx` | 295 | Split immediately (within Pod owning domain). |
| `__tests__/hooks/use-dashboard-conversations.test.tsx` | 293 | Schedule refactor next after Tier E. |
| `__tests__/hooks/use-dashboard-analytics.test.tsx` | 294 | Schedule refactor next after Tier E. |
| `__tests__/lib/embeddings.test.ts` | 294 | Schedule refactor next after Tier E. |
| `__tests__/lib/search/hybrid-search.test.ts` | 299 | Split immediately (within Pod owning domain). |
| `__tests__/lib/realtime/event-aggregator.test.ts` | 290 | Schedule refactor next after Tier E. |
| `__tests__/lib/autonomous/security/credential-vault.test.ts` | 293 | Schedule refactor next after Tier E. |
| `__tests__/api/chat/mcp-integration.test.ts` | 281 | Monitor during upcoming feature work. |
| `__tests__/api/chat/route.commerce.test.ts` | 291 | Schedule refactor next after Tier E. |
| `__tests__/api/recommendations/route.test.ts` | 294 | Schedule refactor next after Tier E. |
| `__tests__/api/dashboard/conversations/actions.test.ts` | 300 | Split immediately (within Pod owning domain). |
| `__tests__/api/csrf/protected-endpoints.test.ts` | 288 | Schedule refactor next after Tier E. |
| `scripts/comprehensive-test.js` | 297 | Split immediately (within Pod owning domain). |
| `scripts/tests/test-improved-search-verification.ts` | 300 | Split immediately (within Pod owning domain). |
| `scripts/tests/verify-analytics-10-features.ts` | 297 | Split immediately (within Pod owning domain). |
| `scripts/tests/test-metadata-performance.ts` | 299 | Split immediately (within Pod owning domain). |
| `scripts/tests/test-telemetry-cleanup.ts` | 294 | Schedule refactor next after Tier E. |
| `scripts/tests/test-ai-extractor-verification.ts` | 294 | Schedule refactor next after Tier E. |
| `scripts/tests/test-null-data-injection.ts` | 300 | Split immediately (within Pod owning domain). |
| `scripts/tests/test-redis-fallback.ts` | 289 | Schedule refactor next after Tier E. |
| `scripts/fix-missing-embeddings-safe.ts` | 296 | Split immediately (within Pod owning domain). |
| `scripts/utilities/test-chat-responses.js` | 296 | Split immediately (within Pod owning domain). |
| `scripts/benchmarks/benchmark-vector-graph-analysis.ts` | 293 | Schedule refactor next after Tier E. |
| `scripts/optimize-database-performance.js` | 290 | Schedule refactor next after Tier E. |

---

## Progress Log

| Date | Pod | Files | Outcome |
|------|-----|-------|---------|
| 2025-11-11 | Pod I – Integration & Server | `__tests__/integration/test-hallucination-prevention.ts`, `__tests__/integration/analytics/export-integration.test.ts` | Split hallucination CLI into lightweight entrypoint + six helper modules (all <200 LOC) and decomposed analytics export suite into shared helpers + six focused spec files. Compliance rerun now reports **67** remaining violations. |
| 2025-11-11 | Pod P – Playwright & UI | `__tests__/playwright/advanced-features/automated-follow-ups.spec.ts` | Replaced 499‑line monolith with orchestrator + 5 focused specs and shared helper modules (mocks, chat actions, cancellation). LOC compliance now shows **66** total violations; remaining Tier-A Playwright suites can reuse the new helper utilities. |
| 2025-11-11 | Pod I – Integration & Server / Pod UI – Widget | `servers/content/__tests__/getCompletePageDetails.test.ts`, `servers/commerce/__tests__/lookupOrder.test.ts`, `servers/search/__tests__/searchByCategory.test.ts`, `__tests__/components/ChatWidget/hooks/useParentCommunication-messages.test.ts`, `__tests__/hooks/useRecommendations.test.ts`, `__tests__/lib/recommendations/hybrid-ranker.test.ts` | Converted three MCP suites plus the widget/recommendations hooks and the hybrid ranker suite into orchestrators with helper-backed spec files. Shared harness utilities now power these tests. Compliance down to **58** active violations. |

---

## Verification Protocol

1. `bash scripts/check-loc-compliance.sh --staged`  
2. `npx tsx scripts/check-file-length.ts --staged --strict`  
3. `npm run lint` + `NODE_OPTIONS='--max-old-space-size=4096' npx tsc --noEmit`  
4. Targeted Jest / Playwright suites per pod  
5. Update docs (README per directory + this plan + master summary)

**Blocker Rule:** If any command above fails, Verification agent halts the wave and returns findings to Architect for re-triage.

---

## Launch Checklist

- [ ] Rerun compliance script and refresh `.tmp/loc-violations.json` & `.tmp/loc-tier-tables.md`  
- [ ] Architect assigns Tier A/B files to Pods I/S/P with explicit deadlines  
- [ ] Planner agents confirm they have full file reads + helper docs  
- [ ] Refactor agents branch per pod and begin implementation  
- [ ] Verification agents scheduled (one per pod) with test focus defined  
- [ ] Progress updates posted back to `docs/10-ANALYSIS/LOC_REFACTORING_CAMPAIGN_SUMMARY.md`

**Success Definition:**  
All 69 violations removed, warnings <10, zero regressions in chat widget, analytics, or scraping flows, and documentation updated for every new module created during Wave 10.

---

*Maintainers:* LOC Architect Agent (`.claude/agents/loc-architect.md`) is the single source of truth for adjustments to this plan. Regenerate tables whenever compliance data changes.
