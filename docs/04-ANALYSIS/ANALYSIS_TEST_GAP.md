# Test Coverage Gap Analysis

**Generated:** 2025-10-21
**Current Coverage:** ~24% lib files, ~13% API routes tested

## Executive Summary

### Critical Gaps (Immediate Action Required)
- **0/9 Agent files** tested - Core AI/chat logic completely untested
- **1/8 Organization routes** tested - Multi-tenant critical path at risk
- **0/4 Provider integrations** fully tested end-to-end
- **Missing multi-tenant isolation tests** - Data leakage risk

### Coverage Statistics
- **Test Files:** 39
- **Source Files:** 163+ lib files, 102 API routes
- **Estimated Coverage:** ~20-25% overall

---

## Priority 1: Critical Path (IMMEDIATE) 🔴

### Core Agent Logic - lib/agents/ (0/9 tested)
**Risk:** High - Core business logic, AI responses, routing

#### Untested Files:
- [ ] `lib/agents/domain-agnostic-agent.ts` (327 LOC) - **CRITICAL**
  - Business type detection and adaptation
  - Multi-tenant terminology handling
  - System prompt generation

- [ ] `lib/agents/router.ts` (24 LOC) - **CRITICAL**
  - Provider selection logic
  - Configuration-based routing

- [ ] `lib/agents/customer-service-agent.ts` - **HIGH**
  - Main chat agent orchestration

- [ ] `lib/agents/customer-service-agent-intelligent.ts` - **HIGH**
  - Enhanced chat with context awareness

- [ ] `lib/agents/ecommerce-agent.ts` - **MEDIUM**
  - E-commerce specific logic

- [ ] `lib/agents/woocommerce-agent.ts` - **MEDIUM**
  - WooCommerce integration agent

- [ ] `lib/agents/commerce-provider.ts` - **MEDIUM**
  - Base commerce provider interface

- [ ] `lib/agents/providers/woocommerce-provider.ts` - **MEDIUM**
  - WooCommerce data provider

- [ ] `lib/agents/providers/shopify-provider.ts` - **MEDIUM**
  - Shopify data provider

**Impact:** Without these tests:
- Regressions in AI responses
- Breaking multi-tenant isolation
- Provider selection bugs
- Incorrect business type handling

---

### Critical API Routes (1/8 tested)

#### Organizations (Multi-Tenant Core)
- [x] `app/api/organizations/invitations.integration.test.ts` ✅
- [ ] `app/api/organizations/route.ts` - List/create orgs - **CRITICAL**
- [ ] `app/api/organizations/[id]/route.ts` - Get/update/delete org - **CRITICAL**
- [ ] `app/api/organizations/[id]/members/route.ts` - Member management - **HIGH**
- [ ] `app/api/organizations/[id]/members/[userId]/route.ts` - Update member - **HIGH**
- [ ] `app/api/organizations/create/route.ts` - Org creation - **MEDIUM** (may be duplicate)

#### Invitations (Auth Flow)
- [ ] `app/api/invitations/accept/route.ts` - Accept invites - **CRITICAL**

**Impact:** Without these tests:
- Multi-tenant data leakage
- Unauthorized access to organizations
- Member permission bugs

---

### Chat System
- [x] `app/api/chat/route.ts` ✅ (has tests, needs expansion)
- [ ] Expand with:
  - Multi-tenant message isolation
  - Provider routing edge cases
  - Error handling for OpenAI failures
  - Rate limiting enforcement

---

## Priority 2: Integration Coverage (NEXT) 🟡

### Provider End-to-End Flows
- [ ] **WooCommerce Full Flow**
  - Configure credentials → Sync products → Search → Chat response
  - Test cart tracking and abandonment

- [ ] **Shopify Full Flow**
  - Configure credentials → Sync products → Search → Chat response
  - Test multi-store scenarios

- [ ] **Generic Provider Flow**
  - Scraping → Embedding → Search → Chat
  - Test fallback when no provider configured

### Scraping Pipeline
- [x] Basic scraping tested ✅
- [ ] Missing:
  - Scrape → Embed → Search end-to-end
  - Pagination handling
  - Error recovery (failed scrapes, timeouts)
  - Deduplication logic

### Multi-Tenant Isolation
**CRITICAL SECURITY TESTS - Currently Missing:**

- [ ] **Data Isolation Tests**
  ```typescript
  describe('Multi-tenant data isolation', () => {
    it('should prevent cross-tenant data access')
    it('should isolate embeddings by domain')
    it('should isolate conversations by domain')
    it('should prevent cross-org member access')
  })
  ```

- [ ] **RLS (Row Level Security) Tests**
  - Verify Supabase RLS policies enforce isolation
  - Test unauthorized access attempts
  - Validate organization-based filtering

---

## Priority 3: Supporting Systems (LOWER) 🟢

### Database Operations
- [x] Basic Supabase operations tested ✅
- [ ] Missing:
  - Migration scripts
  - Cleanup scripts
  - Reindexing logic
  - GDPR deletion verification

### Utilities (lib/)
- [x] Encryption ✅
- [x] Rate limiting ✅
- [x] Embeddings ✅
- [ ] Missing ~140+ utility files (many may be trivial)

### UI Components
- [ ] Dashboard pages (if business logic present)
- [ ] Settings forms (validation logic)
- [ ] Chat widget customization

---

## Test Infrastructure Gaps

### Missing Test Types
1. **Load Tests** - Performance under concurrent requests
2. **Security Tests** - SQL injection, XSS, auth bypass
3. **E2E Tests** - Full user journeys (Playwright has 2, needs more)
4. **Contract Tests** - API contract validation

### CI/CD Integration
- [ ] Pre-commit hooks for tests
- [ ] PR blocking on test failures
- [ ] Coverage threshold enforcement (currently at 70% but not enforced)
- [ ] Automated integration test runs

---

## Recommended Test Files to Create

### Immediate (This Week)
```
__tests__/
├── lib/
│   └── agents/
│       ├── domain-agnostic-agent.test.ts       # Priority 1
│       ├── router.test.ts                       # Priority 1
│       ├── customer-service-agent.test.ts       # Priority 1
│       └── providers/
│           ├── woocommerce-provider.test.ts     # Priority 2
│           └── shopify-provider.test.ts         # Priority 2
├── api/
│   ├── organizations/
│   │   ├── route.test.ts                        # Priority 1
│   │   ├── [id]/route.test.ts                   # Priority 1
│   │   └── [id]/members/route.test.ts           # Priority 1
│   └── invitations/
│       └── accept/route.test.ts                 # Priority 1
└── integration/
    ├── multi-tenant-isolation.test.ts           # Priority 1 - SECURITY
    ├── woocommerce-e2e.test.ts                  # Priority 2
    └── shopify-e2e.test.ts                      # Priority 2
```

### Next Sprint
```
__tests__/
├── integration/
│   ├── scrape-embed-search-flow.test.ts
│   ├── provider-fallback.test.ts
│   └── rls-policies.test.ts
└── security/
    ├── auth-bypass-prevention.test.ts
    └── data-leakage-prevention.test.ts
```

---

## Success Metrics

### Week 1 Target
- ✅ 9 agent tests created
- ✅ 6 critical API route tests created
- ✅ Multi-tenant isolation test suite
- 📈 Coverage increase: 25% → 45%

### Week 2 Target
- ✅ 3 end-to-end provider flows tested
- ✅ Security test suite established
- ✅ CI/CD integration complete
- 📈 Coverage increase: 45% → 60%

### Month 1 Target
- 📈 Coverage: 70%+ (meeting defined threshold)
- ✅ All Priority 1 & 2 tests complete
- ✅ Load testing baseline established
- ✅ Zero critical path untested code

---

## Notes

### Testing Philosophy
- **Focus on behavior, not implementation** - Test what the code does, not how
- **Test edge cases** - Null values, empty arrays, malformed input
- **Test failure modes** - Network errors, timeouts, invalid credentials
- **Test multi-tenancy** - Cross-tenant isolation is CRITICAL

### What NOT to Test
- Simple getters/setters without logic
- Third-party library internals
- Configuration files (test usage, not structure)
- Auto-generated code

### Test Data Strategy
- Use factories for test data generation
- Mock external APIs (OpenAI, WooCommerce, Shopify)
- Use test Supabase instance (or mock)
- Clean up test data after runs
