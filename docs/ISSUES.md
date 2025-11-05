# Project Issues Tracker

**Type:** Reference
**Status:** Active
**Last Updated:** 2025-11-05
**Purpose:** Single source of truth for all bugs, technical debt, and problems discovered in the codebase

## Quick Reference

**Total Issues:** 20
- 🔴 Critical: 2
- 🟠 High: 5
- 🟡 Medium: 7
- 🟢 Low: 6

**Status Breakdown:**
- Open: 20
- In Progress: 0
- Resolved: 0

---

## How to Use This Document

### When to Add an Issue
- Discovered a bug or error
- Found technical debt or code smell
- Identified performance bottleneck
- Noticed security vulnerability
- Found missing test coverage
- Detected inconsistency or anti-pattern

### Issue Format
```markdown
### [SEVERITY] Issue Title {#issue-XXX}

**Status:** Open | In Progress | Resolved
**Severity:** Critical | High | Medium | Low
**Category:** Bug | Tech Debt | Performance | Security | Testing | Other
**Location:** `file/path.ts:123`
**Discovered:** 2025-11-05
**Assigned:** @username (optional)

**Description:**
[Clear description of the issue]

**Impact:**
[How this affects the system/users]

**Steps to Reproduce:** (for bugs)
1. Step one
2. Step two

**Proposed Solution:**
[Suggested fix or approach]

**Related Issues:** #issue-XXX, #issue-YYY

**Resolution:** (when resolved)
[What was done to fix it - include commit hash]
```

---

## Open Issues

### 🔴 [CRITICAL] Untestable Supabase Architecture {#issue-001}

**Status:** Open
**Severity:** Critical
**Category:** Tech Debt
**Location:** `lib/supabase/server.ts`, all API routes (~50 files)
**Discovered:** 2025-10-22
**Effort:** 2-3 weeks

**Description:**
Hard-coded `createClient()` calls in API routes prevent dependency injection and mocking, making 40+ tests blocked or forced into integration testing.

**Impact:**
- 40+ tests blocked or using workarounds
- Tight coupling to Next.js framework internals
- Forces integration testing for simple validation
- No unit test coverage for business logic in routes

**Root Cause:**
```typescript
// Current (untestable):
export async function GET() {
  const supabase = await createClient();  // Can't be mocked
  const { data } = await supabase.from('table').select();
}
```

**Proposed Solution:**
Implement dependency injection pattern:
```typescript
// Better: Dependency Injection
export async function GET(
  request?: NextRequest,
  deps?: { supabase?: SupabaseClient }
) {
  const supabase = deps?.supabase || await createClient();
  const { data } = await supabase.from('table').select();
}
```

**Related Issues:** #issue-005, #issue-007

**References:**
- [CODE_ISSUES_FROM_TESTING.md](ARCHIVE/issues-2025-11/CODE_ISSUES_FROM_TESTING.md) (archived)
- [ANALYSIS_TECHNICAL_DEBT_TRACKER.md](ARCHIVE/issues-2025-11/ANALYSIS_TECHNICAL_DEBT_TRACKER.md) (archived)

---

### 🔴 [CRITICAL] Legacy customer_id Architecture {#issue-002}

**Status:** Open
**Severity:** Critical
**Category:** Tech Debt
**Location:** 111 files, ~550 references across migrations, lib/, app/api/, tests/, docs/
**Discovered:** 2025-10-22
**Effort:** 3-4 days

**Description:**
Migration from customer-centric to organization-centric architecture is incomplete. Git commit claims "complete" but 550+ references remain. Both `customer_id` and `organization_id` coexist in database schema.

**Impact:**
- Confusing for new developers (two patterns coexist)
- Potential bugs from mixing old/new patterns
- Harder to maintain
- Ambiguous database queries

**Root Cause:**
```sql
-- CURRENT STATE: Both exist!
CREATE TABLE page_embeddings (
  customer_id UUID,        -- ⚠️ Legacy field
  organization_id UUID,    -- ⚠️ New field
  -- Which one should queries use???
);
```

**Proposed Solution:**
1. Complete systematic rename: `customer_id` → `organization_id`
2. Backfill organization_id from customer_configs
3. Add NOT NULL constraint
4. Drop legacy column after verification
5. Update all code references

**Related Issues:** #issue-001

**References:**
- [ANALYSIS_CRITICAL_ISSUES.md](ARCHIVE/issues-2025-11/ANALYSIS_CRITICAL_ISSUES.md) (archived)
- Lines 95-262 of archived doc

---

### 🟠 [HIGH] Dynamic Imports Break Testing {#issue-003}

**Status:** Open
**Severity:** High
**Category:** Testing
**Location:** `lib/woocommerce-dynamic.ts`, `lib/shopify-dynamic.ts`, `lib/agents/providers/*.ts`
**Discovered:** 2025-10-22
**Effort:** 3-4 days

**Description:**
Dynamic imports in commerce providers prevent Jest from mocking dependencies, blocking 37 provider tests.

**Impact:**
- 37 provider tests blocked
- Can't test provider logic in isolation
- Slow tests (needs entire dependency chain)
- Forces integration tests

**Root Cause:**
```typescript
export async function getDynamicWooCommerceClient(domain: string) {
  const config = await getCustomerConfig(domain);  // Can't mock this
  // ...
}
```

**Proposed Solution:**
Factory pattern with dependency injection:
```typescript
export class WooCommerceClientFactory {
  constructor(
    private configProvider = getCustomerConfig  // Inject dependency
  ) {}

  async createClient(domain: string) {
    const config = await this.configProvider(domain);
    // ...
  }
}
```

**Related Issues:** #issue-001, #issue-004, #issue-005

**References:**
- [CODE_ISSUES_FROM_TESTING.md](ARCHIVE/issues-2025-11/CODE_ISSUES_FROM_TESTING.md) (archived)

---

### 🟠 [HIGH] Supabase Client Import Inconsistency {#issue-004}

**Status:** Open
**Severity:** High
**Category:** Tech Debt
**Location:** lib/supabase-server.ts, lib/supabase/server.ts, ~111 files
**Discovered:** 2025-10-22
**Effort:** 1 week

**Description:**
4 different Supabase client import patterns exist across codebase, causing mocking nightmares and async/sync confusion.

**Impact:**
- Test mocking nightmares (mocks don't work consistently)
- Async/sync confusion across codebase
- Blocks test development

**Current Patterns:**
```typescript
// Pattern 1 - lib/supabase-server.ts
import { createClient } from '@/lib/supabase-server'

// Pattern 2 - lib/supabase/server.ts
import { createClient } from '@/lib/supabase/server'

// Pattern 3 - Direct import
import { createClient } from '@supabase/supabase-js'

// Pattern 4 - Test-specific
import { createServerClient } from '@/lib/supabase/server'
```

**Proposed Solution:**
1. Standardize on `@/lib/supabase/server`
2. Create `test-utils/supabase-test-helpers.ts`
3. Update all ~111 files with old imports
4. Update all ~23 test files

**Related Issues:** #issue-001, #issue-005

**References:**
- [ANALYSIS_CRITICAL_ISSUES.md](ARCHIVE/issues-2025-11/ANALYSIS_CRITICAL_ISSUES.md) (archived)
- Lines 264-397 of archived doc

---

### 🟠 [HIGH] WooCommerce Provider Tests Failing {#issue-005}

**Status:** Open
**Severity:** High
**Category:** Testing
**Location:** `__tests__/lib/agents/providers/woocommerce-provider.test.ts`
**Discovered:** 2025-10-22
**Effort:** 1 day (after #issue-004 resolved)

**Description:**
16 tests written but encountering mocking issues due to Supabase import inconsistency.

**Impact:**
- Provider functionality untested
- Can't verify order lookup and product search
- Blocked by #issue-004

**Proposed Solution:**
1. Fix #issue-004 first (standardize Supabase imports)
2. Apply same standardization to WooCommerce client
3. Create `test-utils/woocommerce-test-helpers.ts`
4. Update provider tests to use helpers

**Related Issues:** #issue-003, #issue-004

**References:**
- [ANALYSIS_CRITICAL_ISSUES.md](ARCHIVE/issues-2025-11/ANALYSIS_CRITICAL_ISSUES.md) (archived)

---

### 🟠 [HIGH] Shopify Provider Tests Missing {#issue-006}

**Status:** Open
**Severity:** High
**Category:** Testing
**Location:** `lib/agents/providers/shopify-provider.ts` (no tests exist)
**Discovered:** 2025-10-22
**Effort:** 1 day

**Description:**
No tests exist for Shopify provider. Should test product search, order lookup, and multi-store scenarios.

**Impact:**
- Shopify integration untested
- Risk of regressions
- No validation of multi-store support

**Proposed Solution:**
1. Create `__tests__/lib/agents/providers/shopify-provider.test.ts`
2. Follow WooCommerce provider test patterns
3. Test: product search, order lookup, multi-store scenarios

**Related Issues:** #issue-005

**References:**
- [ANALYSIS_CRITICAL_ISSUES.md](ARCHIVE/issues-2025-11/ANALYSIS_CRITICAL_ISSUES.md) (archived)

---

### 🟠 [HIGH] MSW Test Performance {#issue-007}

**Status:** Open
**Severity:** High
**Category:** Performance
**Location:** `test-utils/jest.setup.msw.js` (410 lines), `__tests__/mocks/server.ts`
**Discovered:** 2025-10-23
**Effort:** 2-4 hours (phased approach)

**Description:**
Integration tests timeout (>30 seconds) due to MSW internal debug logging creating 200x slowdown. Three compounding factors: internal debug mode, 410 lines of polyfills, 9 event listeners per test.

**Impact:**
- Cannot run integration tests locally
- CI/CD pipeline blocked
- Test suite cannot complete
- Deployment velocity blocked

**Proposed Solution (3 phases):**

**Phase 1 - Quick Win (5 mins):**
- Set `NODE_ENV=production` in MSW setup to disable verbose logging
- Expected: 50-70% improvement

**Phase 2 - Conditional Loading (30 mins):**
- Add environment guards to polyfill loading
- Load only when MSW actually needed

**Phase 3 - Test Stratification (2-4 hours):**
- Create separate Jest configs for unit/integration/e2e tests
- Unit tests without MSW
- Integration tests with minimal MSW

**Related Issues:** #issue-001, #issue-003, #issue-004

**References:**
- [ISSUE_MSW_TEST_PERFORMANCE.md](ARCHIVE/issues-2025-11/ISSUE_MSW_TEST_PERFORMANCE.md) (archived)

---

### 🟡 [MEDIUM] Rate Limit Cleanup Non-Deterministic {#issue-008}

**Status:** Open
**Severity:** Medium
**Category:** Performance
**Location:** `lib/rate-limit.ts`
**Discovered:** 2025-10-22
**Effort:** 2-3 hours

**Description:**
Rate limit cleanup uses `Math.random()` with 1% probability, making it non-deterministic and creating potential memory leak risk.

**Impact:**
- Probabilistic cleanup (could theoretically never trigger)
- Memory leak risk in long-running servers
- Tests must mock Math.random to verify cleanup
- Unpredictable performance

**Root Cause:**
```typescript
function checkRateLimit(identifier: string, maxRequests: number, windowMs: number) {
  // Probabilistic cleanup (1% chance)
  if (Math.random() < 0.01) {
    cleanupOldEntries();
  }
}
```

**Proposed Solution:**
Replace with deterministic cleanup:
```typescript
const CLEANUP_THRESHOLD = 1000;
let checkCount = 0;

export function checkRateLimit(...) {
  checkCount++;

  if (checkCount >= CLEANUP_THRESHOLD) {
    cleanupOldEntries();
    checkCount = 0;
  }
}
```

**References:**
- [ANALYSIS_CRITICAL_ISSUES.md](ARCHIVE/issues-2025-11/ANALYSIS_CRITICAL_ISSUES.md) (archived)
- Lines 399-488 of archived doc

---

### 🟡 [MEDIUM] Mixed Static/Instance Methods Pattern {#issue-009}

**Status:** Open
**Severity:** Medium
**Category:** Code Quality
**Location:** All agent files in `lib/agents/`
**Discovered:** 2025-10-22
**Effort:** 1 day

**Description:**
Agent classes mix static and instance methods confusingly. Instance methods just call static methods with same name.

**Impact:**
- Confusing API (two ways to call same thing)
- Code duplication (boilerplate instance methods)
- Maintenance burden (update both)
- Tests need to verify both match

**Root Cause:**
```typescript
export class CustomerServiceAgent {
  // Instance method that just calls static
  getEnhancedSystemPrompt(level: string, data: boolean): string {
    return CustomerServiceAgent.getEnhancedSystemPrompt(level, data);
  }

  // Static method with actual logic
  static getEnhancedSystemPrompt(level: string, data: boolean): string {
    // 200 lines of logic
  }
}
```

**Proposed Solution:**
Choose one pattern:
- Pure static (if no state needed)
- Pure instance (if state needed later)
- Don't mix both!

**References:**
- [CODE_ISSUES_FROM_TESTING.md](ARCHIVE/issues-2025-11/CODE_ISSUES_FROM_TESTING.md) (archived)

---

### 🟡 [MEDIUM] `any` Types Throughout Agents {#issue-010}

**Status:** Open
**Severity:** Medium
**Category:** Code Quality
**Location:** Throughout agent files, especially `lib/agents/`
**Discovered:** 2025-10-22
**Effort:** 1 week

**Description:**
Extensive use of `any` types eliminates type safety, allowing runtime errors from missing properties.

**Impact:**
- No type safety (typos not caught at compile time)
- Runtime errors from missing properties
- Poor IDE support (no autocomplete)
- Harder to refactor

**Example:**
```typescript
formatOrdersForAI(orders: any[]): string {
  return orders.map((order, index) => `
    Order ${index + 1}:
    - Order Number: #${order.number}  // ← What if order.number doesn't exist?
    - Total: ${order.currency} ${order.total}  // ← Runtime error possible
  `).join('\n');
}
```

**Proposed Solution:**
Define proper TypeScript interfaces for Order, Product, Customer, etc.

**Related Issues:** #issue-009

**References:**
- [CODE_ISSUES_FROM_TESTING.md](ARCHIVE/issues-2025-11/CODE_ISSUES_FROM_TESTING.md) (archived)

---

### 🟡 [MEDIUM] Massive Prompt Strings in Code {#issue-011}

**Status:** Open
**Severity:** Medium
**Category:** Code Quality
**Location:** All agent files (causes file length violations)
**Discovered:** 2025-10-22
**Effort:** 1 day

**Description:**
System prompts hardcoded as 200+ line strings in agent files, causing maintainability issues and file length violations.

**Impact:**
- Hard to maintain (finding/editing prompts in code is painful)
- No version control for prompts separately
- Can't A/B test prompts without code deployment
- Violates SRP (code file responsible for prompts)
- Files exceed 300 LOC limit

**Proposed Solution:**
Extract prompts to separate markdown files:
```
prompts/customer-service/full-access.md
prompts/customer-service/basic-access.md
prompts/customer-service/unverified.md
```

Load dynamically:
```typescript
static async getEnhancedSystemPrompt(level: string): Promise<string> {
  const promptPath = `./prompts/customer-service/${level}-access.md`;
  return await readPromptFile(promptPath);
}
```

**References:**
- [CODE_ISSUES_FROM_TESTING.md](ARCHIVE/issues-2025-11/CODE_ISSUES_FROM_TESTING.md) (archived)

---

### 🟡 [MEDIUM] Inconsistent Error Handling {#issue-012}

**Status:** Open
**Severity:** Medium
**Category:** Code Quality
**Location:** API routes, provider functions (~50 routes)
**Discovered:** 2025-10-22
**Effort:** 1 week

**Description:**
Different error handling patterns across routes: some return 500 for all errors, others have specific codes, others return null.

**Impact:**
- Inconsistent API (different error patterns per route)
- Lost context (generic 500 errors hide root cause)
- Poor DX (callers don't know what errors to expect)
- Hard to debug (no structured error information)

**Proposed Solution:**
Create standardized error handling utilities:
```typescript
// lib/api-errors.ts
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: any
  ) {
    super(message);
  }
}

export function handleApiError(error: unknown): NextResponse {
  // Consistent handling
}
```

**References:**
- [CODE_ISSUES_FROM_TESTING.md](ARCHIVE/issues-2025-11/CODE_ISSUES_FROM_TESTING.md) (archived)

---

### 🟡 [MEDIUM] No Business Logic Separation {#issue-013}

**Status:** Open
**Severity:** Medium
**Category:** Architecture
**Location:** API routes (~20 files)
**Discovered:** 2025-10-22
**Effort:** 2-3 weeks

**Description:**
API routes mix request parsing, validation, database operations, business logic, and response formatting in single 100+ line functions.

**Impact:**
- Untestable (can't test business logic without HTTP)
- Hard to reuse (logic locked in route handler)
- Violates SRP (route does everything)
- Hard to unit test (must use integration tests)

**Proposed Solution:**
Extract to service layer:
```typescript
// lib/services/organization-service.ts
export class OrganizationService {
  async createOrganization(
    userId: string,
    data: CreateOrgInput
  ): Promise<Organization> {
    // Pure business logic - easily testable
  }
}
```

**Related Issues:** #issue-001

**References:**
- [CODE_ISSUES_FROM_TESTING.md](ARCHIVE/issues-2025-11/CODE_ISSUES_FROM_TESTING.md) (archived)

---

### 🟢 [LOW] Brand-Agnostic Violation in Tests {#issue-014}

**Status:** Open
**Severity:** Low
**Category:** Code Quality
**Location:** `__tests__/lib/agents/domain-agnostic-agent.test.ts:286`
**Discovered:** 2025-10-22
**Effort:** 30 minutes

**Description:**
Tests use industry-specific terminology like "pumps" despite CLAUDE.md prohibition.

**Impact:**
- Violates multi-tenant design principles
- Sets bad example for other developers
- Cosmetic (doesn't affect functionality)

**Example:**
```typescript
it('should detect availability query intent', () => {
  const queries = [
    'Do you have any pumps?' // ⚠️ Industry-specific!
  ];
});
```

**Proposed Solution:**
```typescript
const queries = [
  'Do you have any products?',      // ✅ Generic
  'What items are available?',       // ✅ Generic
  'Do you have X in stock?'          // ✅ Generic with placeholder
];
```

**References:**
- [ANALYSIS_CRITICAL_ISSUES.md](ARCHIVE/issues-2025-11/ANALYSIS_CRITICAL_ISSUES.md) (archived)

---

### 🟢 [LOW] Test Error Message Improvements {#issue-015}

**Status:** Open
**Severity:** Low
**Category:** Testing
**Location:** Various test files
**Discovered:** 2025-10-26
**Effort:** 30 minutes

**Description:**
Tests expect specific OpenAI responses, but mocks return default text causing confusing error messages.

**Impact:**
- Confusing test failures
- Hard to debug test issues
- Low priority (tests still validate behavior)

**Example:**
```typescript
expect(data.message).toBe('Here are the products from our catalog.')
// Fails with: Received: "This is a helpful response from the AI assistant."
```

**Proposed Solution:**
Update test expectations or improve mock configurations to return expected values.

**References:**
- [ANALYSIS_TECHNICAL_DEBT_TRACKER.md](ARCHIVE/issues-2025-11/ANALYSIS_TECHNICAL_DEBT_TRACKER.md) (archived)

---

### 🟢 [LOW] Web Search Tool Integration {#issue-016}

**Status:** Open
**Severity:** Low
**Category:** Feature Request
**Location:** `lib/chat/ai-processor.ts:46`
**Discovered:** 2025-11-05 (from code scan)
**Effort:** 1-2 weeks

**Description:**
TODO comment indicates planned web search tool integration for the AI chat processor.

**Impact:**
- Missing feature: Can't search web in real-time during conversations
- Could enhance answer accuracy with current information
- Currently using only scraped/cached data

**Proposed Solution:**
Implement web search tool that integrates with the AI processor's tool system.

**Related Issues:** None

---

### 🟡 [MEDIUM] Database-Driven Synonym Loading {#issue-017}

**Status:** Open
**Severity:** Medium
**Category:** Feature Request
**Location:** `lib/synonym-auto-learner.ts:226`
**Discovered:** 2025-11-05 (from code scan)
**Effort:** 3-5 days

**Description:**
TODO comment indicates need to implement database-driven synonym loading instead of hardcoded synonyms.

**Impact:**
- Currently using hardcoded synonym mappings
- Can't update synonyms without code deployment
- No customer-specific synonym customization
- Harder to maintain and test synonym quality

**Proposed Solution:**
Create database table for synonyms and load them dynamically:
1. Create `synonyms` table (word, synonym, organization_id)
2. Load from database instead of hardcoded arrays
3. Add admin interface for managing synonyms
4. Cache loaded synonyms for performance

**Related Issues:** None

---

### 🟡 [MEDIUM] Modify search_embeddings RPC for page_id {#issue-018}

**Status:** Open
**Severity:** Medium
**Category:** Feature Request
**Location:** `lib/full-page-retrieval.ts:210`
**Discovered:** 2025-11-05 (from code scan)
**Effort:** 1-2 days

**Description:**
TODO comment indicates search_embeddings RPC function needs to include page_id in results for full-page retrieval.

**Impact:**
- Can't efficiently retrieve full pages after embedding search
- May require additional queries to get page_id
- Performance impact on search results

**Proposed Solution:**
Modify the `search_embeddings` RPC function in Supabase to return page_id along with embedding results.

**Related Issues:** None

---

### 🟢 [LOW] Deduplication Tracking in Queue Stats {#issue-019}

**Status:** Open
**Severity:** Low
**Category:** Feature Request
**Location:** `lib/queue/queue-manager/stats.ts:33`
**Discovered:** 2025-11-05 (from code scan)
**Effort:** 1-2 days

**Description:**
TODO comment indicates need to implement actual deduplication tracking in queue stats.

**Impact:**
- Can't track how many duplicate jobs are being deduplicated
- Missing visibility into queue efficiency
- No metrics for deduplication effectiveness

**Proposed Solution:**
Implement tracking for:
1. Number of jobs deduplicated
2. Deduplication rate (%)
3. Top deduplicated job types
4. Save metrics to database or logs

**Related Issues:** None

---

### 🟢 [LOW] Feedback Notification System {#issue-020}

**Status:** Open
**Severity:** Low
**Category:** Feature Request
**Location:** `app/api/feedback/route.ts:201`
**Discovered:** 2025-11-05 (from code scan)
**Effort:** 2-3 days

**Description:**
TODO comment indicates need to implement notification system for feedback (email, Slack, etc.).

**Impact:**
- Feedback submissions not notified to team
- Manual checking required to see new feedback
- Slower response time to user feedback

**Proposed Solution:**
Implement notification system:
1. Email notifications to configured address
2. Optional Slack webhook integration
3. Configurable notification preferences per organization
4. Include feedback details and link to admin panel

**Related Issues:** None

---

## In Progress Issues

<!-- Issues currently being worked on -->

---

## Resolved Issues

<!-- Archive resolved issues here for reference -->

---

## Issue Categories

### Severity Levels
- 🔴 **Critical**: System broken, data loss, security breach (fix immediately)
- 🟠 **High**: Major functionality impaired, significant user impact (fix within 1 week)
- 🟡 **Medium**: Minor functionality impaired, workaround exists (fix within 1 month)
- 🟢 **Low**: Cosmetic, tech debt, future improvement (backlog)

### Category Definitions
- **Bug**: Something that doesn't work as intended
- **Tech Debt**: Code quality issues, refactoring needed
- **Performance**: Slow execution, inefficient algorithms
- **Security**: Vulnerabilities, exposed data, unsafe practices
- **Testing**: Missing or broken tests
- **Architecture**: Design issues, separation of concerns
- **Code Quality**: Maintainability, readability, consistency
- **Other**: Documentation, tooling, configuration issues

---

## Statistics

**Most Common Categories:**
- Tech Debt: 5 issues
- Testing: 4 issues
- Code Quality: 4 issues
- Feature Request: 5 issues (new)
- Architecture: 1 issue
- Performance: 2 issues

**Most Affected Areas:**
- Testing infrastructure: 5 issues (#001, #003, #004, #005, #007)
- Agent files: 3 issues (#009, #010, #011)
- API routes: 3 issues (#001, #012, #013)
- Missing features: 5 issues (#016, #017, #018, #019, #020)

**Average Effort:**
- Critical: 2-3 weeks
- High: 3-8 days
- Medium: 1-5 days
- Low: 1-3 days

---

## Archived Documentation

**Previous issue tracking documents (archived 2025-11-05):**
- ANALYSIS_CRITICAL_ISSUES.md → `ARCHIVE/issues-2025-11/`
- HIGH_PRIORITY_ISSUES_H3_H23.md → `ARCHIVE/issues-2025-11/`
- ANALYSIS_TECHNICAL_DEBT_TRACKER.md → `ARCHIVE/issues-2025-11/`
- CODE_ISSUES_FROM_TESTING.md → `ARCHIVE/issues-2025-11/`
- ISSUE_MSW_TEST_PERFORMANCE.md → `ARCHIVE/issues-2025-11/`

All issues from these documents have been consolidated into this single source of truth.

---

## Maintenance Notes

- Review this document weekly
- Update status as work progresses
- Add new issues as discovered
- Archive resolved issues older than 3 months to `ARCHIVE/issues-[year]-[month]/`
- Update statistics section monthly
- Cross-reference with GitHub Issues when applicable
