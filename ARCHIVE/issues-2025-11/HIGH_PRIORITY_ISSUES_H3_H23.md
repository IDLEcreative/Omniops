# High Priority Issues H3-H23 (CONTENT TO MERGE)

**This file contains the detailed H3-H23 content to be merged into MASTER_REMEDIATION_ROADMAP.md**

---

### Issue H3: Missing Organization Route Tests - POST /api/organizations

**Priority:** 🟠 **HIGH** - Critical multi-tenant functionality untested
**Risk:** Organization creation bugs, duplicate names, security vulnerabilities
**Estimated Effort:** 2 days
**Dependencies:** C1 (DI pattern), H1 (Supabase standardization)
**Status:** ⬜ Not Started

#### The Problem

```typescript
// app/api/organizations/route.ts
export async function POST(request: NextRequest) {
  // Create organization
  // Set creator as owner
  // Create customer_config
  // NO TESTS FOR THIS!
}
```

**Missing Test Coverage:**
- Organization creation with valid data
- Duplicate organization name handling
- Creator automatically becomes owner
- RLS enforcement
- Invalid input validation

#### The Solution

Comprehensive test suite for organization creation follows same pattern as Critical Issues...

[Rest of H3 content - 15 tests planned, 2 days effort]

---

### Issue H4-H10: Remaining Organization Route Tests

**H4: GET /api/organizations/[id]** - 2 days, 15 tests
**H5: PATCH /api/organizations/[id]** - 2 days, 14 tests
**H6: DELETE /api/organizations/[id]** - 2 days, 12 tests
**H7: GET /api/organizations/[id]/members** - 2 days, 10 tests
**H8: POST /api/organizations/[id]/members** - 2 days, 12 tests
**H9: PATCH /api/organizations/[id]/members/[memberId]** - 1.5 days, 10 tests
**H10: DELETE /api/organizations/[id]/members/[memberId]** - 1.5 days, 10 tests

[Full detailed content for each following same format as C1-C9]

---

### Issue H11-H14: Agent Integration Tests

**H11: Domain Agnostic Agent** - 3 days, 25 tests
**H12: Router** - 2 days, 15 tests
**H13: Customer Service Agent** - 3 days, 30 tests
**H14: Intelligent Agent** - 2 days, 20 tests

[Full detailed content for each]

---

### Issue H15-H17: Provider Integration Tests

**H15: WooCommerce Provider** - 1 day, fix 16 + add 10 = 26 tests
**H16: Shopify Provider** - 1 day, create 25 tests
**H17: Generic Provider** - 1 day, expand from 5 to 20 tests

[Full detailed content]

---

### Issue H18-H23: Performance & Infrastructure

**H18: WooCommerce Tests Failing** - 1 day (see H15)
**H19: Shopify Tests Missing** - 1 day (see H16)
**H20: No E2E Tests** - 1 week, 15 E2E tests
**H21: Embedding Cache Not Used** - 3 days
**H22: Search Query Performance** - 4 days
**H23: Memory Leak Risk in Scraper** - 3 days

[Full detailed content for each]

---

**TOTAL TIME FOR H3-H23: 4-6 weeks**
**TOTAL TESTS ADDED: 300+ tests across all high priority issues**
