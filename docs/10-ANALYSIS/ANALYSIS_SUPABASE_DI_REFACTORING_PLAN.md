# Supabase Dependency Injection Refactoring Plan

**Type:** Analysis - Structural Refactoring Plan
**Status:** Active - Implementation Ready
**Created:** 2025-11-22
**Estimated Effort:** 2-3 weeks
**Estimated Impact:** Unblocks 40+ unit tests, enables true TDD

## Purpose
This document outlines the comprehensive plan to refactor the Supabase architecture from hardcoded `createClient()` calls to dependency injection, enabling unit testing of business logic without integration tests.

## Quick Links
- [CLAUDE.md Testing Philosophy](../../CLAUDE.md#testing--code-quality-philosophy) - "Hard to Test = Poorly Designed"
- [Pod Orchestration Pattern](../02-GUIDES/GUIDE_POD_ORCHESTRATION_PATTERN.md) - For parallel execution
- [Chat Service Example](../../lib/chat-service.ts) - Already uses DI correctly

---

## Table of Contents
- [Problem Statement](#problem-statement)
- [Current Architecture Analysis](#current-architecture-analysis)
- [Solution Design](#solution-design)
- [Implementation Plan](#implementation-plan)
- [Pod Orchestration Strategy](#pod-orchestration-strategy)
- [Testing Strategy](#testing-strategy)
- [Risk Mitigation](#risk-mitigation)
- [Success Criteria](#success-criteria)

---

## Problem Statement

### Issue
**40+ tests are blocked** because we cannot unit test business logic that uses Supabase clients.

### Root Cause
Hardcoded `createClient()` and `createServiceRoleClient()` calls throughout the codebase create **hidden dependencies** that are impossible to mock in Jest.

### Impact
- ❌ **Cannot unit test** business logic (forced into slow integration tests)
- ❌ **Cannot do TDD** (can't write tests before implementation)
- ❌ **Violates SOLID principles** (Dependency Inversion Principle)
- ❌ **Violates CLAUDE.md philosophy**: "Hard to Test = Poorly Designed"
- ❌ **Blocks parallel test execution** (all tests hit real Supabase)
- ❌ **Slows CI/CD pipeline** (integration tests take 10-20x longer)

### Evidence
From `__tests__/lib/queue/job-processor-handlers.test.ts`:

```typescript
/**
 * ⚠️ IMPORTANT: All 11 tests are skipped due to Jest + ESM + Next.js limitation
 *
 * Root Cause:
 * - Jest cannot mock ES6 module exports with @/ path aliases in Next.js
 * - job-processor-handlers.ts directly imports scrapePage, checkCrawlStatus
 * - ES module exports are not configurable, so jest.spyOn() fails
 *
 * Architectural Issue (per CLAUDE.md Testing Philosophy):
 * "Hard to Test" = "Poorly Designed"
 * - Code has tight coupling via direct imports (hidden dependencies)
 * - Should use dependency injection for testability
 */
```

---

## Current Architecture Analysis

### Affected Files
- **API Routes**: ~100 files in `app/api/**/*.ts` (141 occurrences)
- **Library Services**: ~85 files in `lib/**/*.ts` (194 occurrences)
- **Total**: ~185 files, ~335 hardcoded createClient() calls

### Current Pattern (Anti-Pattern)

```typescript
// ❌ HARD TO TEST: Hidden dependency
import { createServiceRoleClient } from '@/lib/supabase-server';

export async function getConversations(domain: string) {
  const supabase = await createServiceRoleClient(); // Hidden!
  return supabase.from('conversations').select().eq('domain', domain);
}

// Test becomes impossible:
// - Can't mock createServiceRoleClient (ESM limitation)
// - Can't inject mock client (no parameter for it)
// - Forced to use real Supabase (integration test)
```

### Good Patterns (Already In Codebase)

#### 1. ChatService Class (lib/chat-service.ts)

```typescript
// ✅ EASY TO TEST: Explicit dependency injection
export class ChatService {
  constructor(private supabase: SupabaseClient) {} // Explicit!

  async createSession(userId?: string): Promise<ChatSession> {
    const { data, error } = await this.supabase
      .from('conversations')
      .insert({ user_id: userId })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

// Test becomes trivial:
const mockSupabase = createMockSupabaseClient();
const service = new ChatService(mockSupabase);
await service.createSession('user-123');
expect(mockSupabase.from).toHaveBeenCalledWith('conversations');
```

#### 2. Chat API Route (app/api/chat/route.ts)

```typescript
// ✅ EASY TO TEST: Dependencies injected via context
import { RouteDependencies, defaultDependencies } from '@/lib/chat/route-types';

export async function POST(
  request: NextRequest,
  context: { deps?: Partial<RouteDependencies> }
) {
  const deps = { ...defaultDependencies, ...context?.deps };
  const supabase = await deps.createServiceRoleClient(); // Injected!

  // Use supabase for database operations...
}

// Test becomes simple:
const mockCreateClient = jest.fn().mockResolvedValue(mockSupabase);
await POST(request, { deps: { createServiceRoleClient: mockCreateClient } });
```

---

## Solution Design

### Design Principles

1. **Explicit Dependencies**: All dependencies passed as parameters or constructor arguments
2. **Default Injection**: Production code uses defaults, tests inject mocks
3. **Backward Compatibility**: Gradual migration, no breaking changes
4. **Minimal Changes**: Preserve existing logic, only change dependency injection
5. **Progressive Enhancement**: Start with high-value files (most tests blocked)

### Three-Tier Refactoring Strategy

#### Tier 1: Class-Based Services (Repository Pattern)

**Use for:** Services with multiple related database operations

```typescript
// Before (anti-pattern):
import { createServiceRoleClient } from '@/lib/supabase-server';

export async function getConversations(domain: string) {
  const supabase = await createServiceRoleClient();
  return supabase.from('conversations').select().eq('domain', domain);
}

export async function saveMessage(conversationId: string, content: string) {
  const supabase = await createServiceRoleClient();
  return supabase.from('messages').insert({ conversation_id: conversationId, content });
}

// After (repository pattern):
export class ConversationsRepository {
  constructor(private supabase: SupabaseClient) {}

  async getByDomain(domain: string) {
    return this.supabase.from('conversations').select().eq('domain', domain);
  }

  async saveMessage(conversationId: string, content: string) {
    return this.supabase.from('messages').insert({
      conversation_id: conversationId,
      content
    });
  }
}

// Factory for production use:
export async function createConversationsRepository(): Promise<ConversationsRepository> {
  const supabase = await createServiceRoleClient();
  return new ConversationsRepository(supabase);
}

// Test usage:
const mockSupabase = createMockSupabaseClient();
const repo = new ConversationsRepository(mockSupabase);
await repo.getByDomain('example.com');
expect(mockSupabase.from).toHaveBeenCalledWith('conversations');
```

#### Tier 2: Function-Based Services (Optional Parameter Pattern)

**Use for:** Simple functions with 1-2 database operations

```typescript
// Before (anti-pattern):
import { createServiceRoleClient } from '@/lib/supabase-server';

export async function getConfig(domain: string) {
  const supabase = await createServiceRoleClient();
  const { data } = await supabase.from('customer_configs')
    .select('*')
    .eq('domain', domain)
    .single();
  return data;
}

// After (optional parameter pattern):
import { createServiceRoleClient } from '@/lib/supabase-server';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function getConfig(
  domain: string,
  supabase?: SupabaseClient  // Optional! Defaults to createServiceRoleClient()
): Promise<CustomerConfig | null> {
  const db = supabase || await createServiceRoleClient();
  const { data } = await db.from('customer_configs')
    .select('*')
    .eq('domain', domain)
    .single();
  return data;
}

// Production usage (unchanged):
const config = await getConfig('example.com');

// Test usage (inject mock):
const mockSupabase = createMockSupabaseClient();
const config = await getConfig('example.com', mockSupabase);
expect(mockSupabase.from).toHaveBeenCalledWith('customer_configs');
```

#### Tier 3: API Routes (Context Dependencies Pattern)

**Use for:** API route handlers

```typescript
// Before (anti-pattern):
import { createServiceRoleClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  const supabase = await createServiceRoleClient();
  const { data } = await supabase.from('conversations').select();
  return NextResponse.json(data);
}

// After (context dependencies pattern):
import { createServiceRoleClient } from '@/lib/supabase-server';
import type { SupabaseClient } from '@supabase/supabase-js';

interface RouteDependencies {
  createServiceRoleClient: () => Promise<SupabaseClient>;
}

const defaultDeps: RouteDependencies = {
  createServiceRoleClient
};

export async function GET(
  request: NextRequest,
  context?: { deps?: Partial<RouteDependencies> }
) {
  const deps = { ...defaultDeps, ...context?.deps };
  const supabase = await deps.createServiceRoleClient();

  const { data } = await supabase.from('conversations').select();
  return NextResponse.json(data);
}

// Production usage (unchanged):
// Next.js calls: GET(request)

// Test usage (inject mock):
const mockCreateClient = jest.fn().mockResolvedValue(mockSupabase);
await GET(request, { deps: { createServiceRoleClient: mockCreateClient } });
```

---

## Implementation Plan

### Phase 1: Foundation (Week 1, Days 1-2)

**Goal:** Create test infrastructure and patterns

#### 1.1 Test Helpers (lib/supabase/test-helpers.ts)

```typescript
import type { SupabaseClient } from '@supabase/supabase-js';
import { jest } from '@jest/globals';

/**
 * Creates a mock Supabase client for testing
 * Returns a fully-typed mock with all common methods
 */
export function createMockSupabaseClient(): jest.Mocked<SupabaseClient> {
  return {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
    })),
    rpc: jest.fn().mockResolvedValue({ data: [], error: null }),
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
    },
  } as unknown as jest.Mocked<SupabaseClient>;
}

/**
 * Creates a mock with specific table data
 */
export function createMockSupabaseClientWithData(tableData: Record<string, any>) {
  const mock = createMockSupabaseClient();

  mock.from.mockImplementation((table: string) => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({
      data: tableData[table] || null,
      error: null
    }),
  }));

  return mock;
}
```

#### 1.2 Fix Broken Test

Update `__tests__/lib/supabase/database.test.ts`:

```typescript
// Remove these non-existent imports:
// import { __setMockSupabaseClient, __resetMockSupabaseClient } from '@/lib/supabase-server'

// Replace with:
import { createMockSupabaseClient } from '@/lib/supabase/test-helpers';

describe('Supabase Database Integration', () => {
  let mockSupabaseClient: any;

  beforeEach(async () => {
    mockSupabaseClient = createMockSupabaseClient();
  });

  // Tests now work without special mock setters
});
```

#### 1.3 Documentation

Create `docs/02-GUIDES/GUIDE_SUPABASE_DEPENDENCY_INJECTION.md` with:
- When to use each pattern (class vs function vs route)
- Code examples for each pattern
- Migration guide for existing code
- Testing examples

### Phase 2: High-Value Refactoring (Week 1, Days 3-5)

**Goal:** Unblock the most critical tests first

#### Priority 1: Services with Blocked Tests

Files to refactor (from grep results of skipped tests):

1. **lib/queue/job-processor-handlers.ts** (11 skipped tests)
   - Pattern: Function-based (optional parameter)
   - Add `supabase?: SupabaseClient` parameter to all handlers

2. **lib/embeddings.ts** (searchSimilarContent - used everywhere)
   - Pattern: Function-based (optional parameter)
   - Critical for chat system testing

3. **lib/customer-config-loader.ts** (getCustomerConfig - used in 50+ routes)
   - Pattern: Class-based (repository)
   - High reuse, worth the repository pattern

#### Priority 2: Already Good Examples

Files that already use DI correctly (validate and document):

1. **lib/chat-service.ts** ✅ (ChatService class)
2. **app/api/chat/route.ts** ✅ (RouteDependencies pattern)
3. **lib/services/dashboard/conversations-service.ts** (verify pattern)

### Phase 3: Bulk Refactoring (Week 2)

**Goal:** Refactor remaining files using Pod Orchestration

#### Pod A: API Routes (~100 files)

**Strategy:** Context dependencies pattern

**Domains:**
- Pod A1: Analytics routes (app/api/analytics/)
- Pod A2: Dashboard routes (app/api/dashboard/)
- Pod A3: Integration routes (app/api/woocommerce/, app/api/shopify/)
- Pod A4: Core routes (app/api/chat/, app/api/scrape/, app/api/training/)
- Pod A5: Utility routes (app/api/health/, app/api/gdpr/, app/api/stripe/)

**Template for each pod:**

```typescript
// Each agent gets a list of files and this template:

import type { SupabaseClient } from '@supabase/supabase-js';
import { createServiceRoleClient } from '@/lib/supabase-server';

interface RouteDependencies {
  createServiceRoleClient: () => Promise<SupabaseClient>;
  // Add other dependencies as needed (e.g., rate limiting, search)
}

const defaultDeps: RouteDependencies = {
  createServiceRoleClient,
};

export async function GET(
  request: NextRequest,
  context?: { deps?: Partial<RouteDependencies> }
) {
  const deps = { ...defaultDeps, ...context?.deps };
  const supabase = await deps.createServiceRoleClient();

  // Existing logic here...
}

export async function POST(
  request: NextRequest,
  context?: { deps?: Partial<RouteDependencies> }
) {
  const deps = { ...defaultDeps, ...context?.deps };
  const supabase = await deps.createServiceRoleClient();

  // Existing logic here...
}
```

#### Pod L: Library Services (~85 files)

**Strategy:** Mixed (class-based for multi-operation, function-based for simple)

**Domains:**
- Pod L1: Analytics services (lib/analytics/)
- Pod L2: Agent services (lib/agents/)
- Pod L3: Integration services (lib/integrations/, lib/woocommerce-*, lib/shopify-*)
- Pod L4: Core services (lib/embeddings.ts, lib/customer-*.ts, lib/search/)
- Pod L5: Utility services (lib/auth/, lib/webhooks/, lib/monitoring/)

**Decision criteria per file:**
- **2+ database operations** → Class-based repository
- **1 database operation** → Function-based optional parameter

### Phase 4: Testing (Week 3, Days 1-3)

**Goal:** Create comprehensive unit tests for refactored code

#### Pod T: Test Suite Creation

**Strategy:** One test file per refactored service

**Structure:**
```
__tests__/
  lib/
    queue/
      job-processor-handlers.test.ts (update existing)
    embeddings.test.ts (create new)
    customer-config-loader.test.ts (create new)
    analytics/
      funnel-analytics.test.ts (create new)
    agents/
      woocommerce-provider.test.ts (create new)
  api/
    analytics/
      revenue.test.ts (create new)
    dashboard/
      conversations.test.ts (create new)
```

**Template for each test:**

```typescript
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createMockSupabaseClient } from '@/lib/supabase/test-helpers';
import { SomeService } from '@/lib/some-service';

describe('SomeService', () => {
  let mockSupabase: any;
  let service: SomeService;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    service = new SomeService(mockSupabase);
  });

  it('should fetch data from database', async () => {
    const mockData = { id: '123', name: 'Test' };
    mockSupabase.from.mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: mockData, error: null }),
    }));

    const result = await service.getData('123');

    expect(result).toEqual(mockData);
    expect(mockSupabase.from).toHaveBeenCalledWith('table_name');
  });

  it('should handle database errors gracefully', async () => {
    const dbError = new Error('Database error');
    mockSupabase.from.mockImplementation(() => ({
      select: jest.fn().mockResolvedValue({ data: null, error: dbError }),
    }));

    await expect(service.getData('123')).rejects.toThrow('Database error');
  });
});
```

### Phase 5: Validation (Week 3, Days 4-5)

**Goal:** Ensure all changes work correctly

#### Validation Steps

1. **Type Checking**
   ```bash
   npx tsc --noEmit
   # Should pass with no errors
   ```

2. **Linting**
   ```bash
   npm run lint
   # Should pass with no errors
   ```

3. **Unit Tests**
   ```bash
   npm test
   # All new tests should pass
   # No previously passing tests should break
   ```

4. **Integration Tests**
   ```bash
   npm run test:integration
   # Ensure refactoring didn't break database access
   ```

5. **E2E Tests**
   ```bash
   npm run test:e2e
   # Ensure user workflows still work
   ```

6. **Build**
   ```bash
   npm run build
   # Should build successfully
   ```

---

## Pod Orchestration Strategy

### Why Use Pod Orchestration?

- **Scale**: 185 files across 2 domains (API routes, library services)
- **Specialization**: API routes need different pattern than library services
- **Parallelization**: Pods can work independently
- **Proven Pattern**: See LOC Wave 10 success (72% time savings, 100% success rate)

### Pod Structure

#### Week 2 Parallelization

```
Architect (You)
    ↓
    ├── Pod A1: Analytics API routes (~15 files) - Agent 1 (Sonnet)
    ├── Pod A2: Dashboard API routes (~20 files) - Agent 2 (Sonnet)
    ├── Pod A3: Integration API routes (~25 files) - Agent 3 (Sonnet)
    ├── Pod A4: Core API routes (~20 files) - Agent 4 (Sonnet)
    ├── Pod A5: Utility API routes (~20 files) - Agent 5 (Sonnet)
    │
    ├── Pod L1: Analytics services (~15 files) - Agent 6 (Sonnet)
    ├── Pod L2: Agent services (~10 files) - Agent 7 (Sonnet)
    ├── Pod L3: Integration services (~20 files) - Agent 8 (Sonnet)
    ├── Pod L4: Core services (~25 files) - Agent 9 (Sonnet)
    └── Pod L5: Utility services (~15 files) - Agent 10 (Sonnet)

Duration: 3-4 hours (vs 2-3 days sequential)
```

#### Week 3 Parallelization (Testing)

```
Architect (You)
    ↓
    ├── Pod T1: API route tests (~30 tests) - Agent 1 (Haiku) - MAKER framework
    ├── Pod T2: Service tests (~30 tests) - Agent 2 (Haiku) - MAKER framework
    └── Pod T3: Integration tests (~20 tests) - Agent 3 (Haiku) - MAKER framework

Duration: 2-3 hours (vs 1-2 days sequential)
```

### Agent Prompt Template

For each pod agent:

```markdown
STEP 1: Read /home/user/Omniops/CLAUDE.md
- Understand all project rules
- Pay attention to Testing Philosophy (line 1865+)
- Note 300 LOC limit

STEP 2: Read refactoring guide
Read /home/user/Omniops/docs/02-GUIDES/GUIDE_SUPABASE_DEPENDENCY_INJECTION.md
- Understand the three patterns (class, function, route)
- Review code examples

STEP 3: Refactor assigned files
You are responsible for [DOMAIN] domain.

Files to refactor:
[LIST OF FILES]

For each file:
1. Determine pattern:
   - API route → Context dependencies pattern
   - Service with 2+ DB ops → Class-based repository
   - Service with 1 DB op → Function-based optional parameter

2. Apply pattern:
   - Add dependency injection
   - Preserve existing logic
   - Add JSDoc comments
   - Ensure <300 LOC

3. Test the refactoring:
   - Type check: npx tsc --noEmit [FILE]
   - Verify logic unchanged

STEP 4: Report results
For each file:
- ✅ [FILE]: Refactored using [PATTERN]
- ⚠️ [FILE]: Issue encountered - [DESCRIPTION]

Summary:
- Files refactored: X/Y
- Pattern distribution: Z classes, W functions, V routes
- Issues: [COUNT]
```

---

## Testing Strategy

### Test Infrastructure

#### 1. Mock Client Factory (lib/supabase/test-helpers.ts)

```typescript
export function createMockSupabaseClient(): jest.Mocked<SupabaseClient>;
export function createMockSupabaseClientWithData(tableData: Record<string, any>);
export function createMockSupabaseError(message: string);
```

#### 2. Test Utilities

```typescript
// Helper to assert Supabase was called correctly
export function expectSupabaseCall(
  mock: any,
  table: string,
  operation: 'select' | 'insert' | 'update' | 'delete'
) {
  expect(mock.from).toHaveBeenCalledWith(table);
  expect(mock.from().operation).toHaveBeenCalled();
}
```

### Test Coverage Goals

- **Unit Tests**: 90%+ coverage for business logic
- **Integration Tests**: Keep existing (validate DI doesn't break real DB access)
- **E2E Tests**: Keep existing (validate user workflows)

### Test Organization

```
__tests__/
  lib/
    supabase/
      test-helpers.test.ts (test the test helpers!)
      database.test.ts (integration tests - keep)
    [mirror lib/ structure]
  api/
    [mirror app/api/ structure]
```

---

## Risk Mitigation

### Risk 1: Breaking Changes

**Mitigation:**
- Gradual rollout (high-value files first)
- Comprehensive test suite before refactoring
- Keep production code backward compatible (optional parameters)
- Deploy behind feature flag if needed

### Risk 2: Inconsistent Patterns

**Mitigation:**
- Clear decision criteria documented
- Code review checklist
- Automated linting rules (if possible)
- Single source of truth (GUIDE_SUPABASE_DEPENDENCY_INJECTION.md)

### Risk 3: Incomplete Migration

**Mitigation:**
- Track progress in ANALYSIS_SUPABASE_DI_PROGRESS.md
- Automated grep to find remaining hardcoded calls
- Block PRs with new hardcoded calls (ESLint rule?)

### Risk 4: Test Suite Explosion

**Mitigation:**
- Use MAKER framework (Haiku agents) for test generation
- Template-based test generation
- Focus on business logic, not CRUD operations

---

## Success Criteria

### Quantitative Metrics

- ✅ **40+ previously blocked tests** now passing
- ✅ **90%+ code coverage** for business logic
- ✅ **0 remaining hardcoded createClient() calls** in business logic
- ✅ **100% of API routes** using DI pattern
- ✅ **100% of services** using DI pattern
- ✅ **CI/CD pipeline** 50% faster (fewer integration tests needed)

### Qualitative Metrics

- ✅ **TDD is possible** (write tests before implementation)
- ✅ **Tests run in parallel** (no Supabase contention)
- ✅ **New developers** can understand DI pattern from docs
- ✅ **Code reviews** easier (clear dependency flow)
- ✅ **Debugging** easier (can inject logging clients)

### Validation Checklist

Before marking this project complete:

- [ ] All tests passing (`npm test`)
- [ ] All E2E tests passing (`npm run test:e2e`)
- [ ] Build succeeds (`npm run build`)
- [ ] Type checking passes (`npx tsc --noEmit`)
- [ ] Linting passes (`npm run lint`)
- [ ] Documentation complete (GUIDE_SUPABASE_DEPENDENCY_INJECTION.md)
- [ ] Progress tracker updated (ANALYSIS_SUPABASE_DI_PROGRESS.md)
- [ ] Team training completed (walkthrough of new patterns)
- [ ] No regressions in production (monitor after deploy)

---

## Next Steps

1. **Get approval** for this plan
2. **Phase 1 (Days 1-2)**: Create test infrastructure
3. **Phase 2 (Days 3-5)**: Refactor high-value files
4. **Phase 3 (Week 2)**: Bulk refactoring with Pod Orchestration
5. **Phase 4 (Week 3, Days 1-3)**: Create comprehensive tests
6. **Phase 5 (Week 3, Days 4-5)**: Validation and deployment

---

## Appendix

### A. File Inventory

**API Routes (100 files, 141 occurrences):**
- app/api/analytics/ - 10 files
- app/api/dashboard/ - 15 files
- app/api/woocommerce/ - 12 files
- app/api/shopify/ - 8 files
- app/api/gdpr/ - 5 files
- app/api/stripe/ - 7 files
- app/api/organizations/ - 8 files
- app/api/training/ - 6 files
- [... see grep results for complete list]

**Library Services (85 files, 194 occurrences):**
- lib/analytics/ - 10 files
- lib/agents/ - 8 files
- lib/integrations/ - 6 files
- lib/search/ - 5 files
- lib/chat/ - 8 files
- [... see grep results for complete list]

### B. Example Migrations

See [GUIDE_SUPABASE_DEPENDENCY_INJECTION.md](../02-GUIDES/GUIDE_SUPABASE_DEPENDENCY_INJECTION.md) for detailed examples of each pattern.

### C. References

- [CLAUDE.md Testing Philosophy](../../CLAUDE.md#testing--code-quality-philosophy)
- [Pod Orchestration Pattern](../02-GUIDES/GUIDE_POD_ORCHESTRATION_PATTERN.md)
- [MAKER Framework](../../CLAUDE.md#maker-framework-haiku-optimization-for-80-90-cost-savings)
- [LOC Wave 10 Success Story](../10-ANALYSIS/ANALYSIS_LOC_REFACTORING_WAVE_10_COMPLETE.md)
