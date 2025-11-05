# Code Issues Discovered During Testing

**Date:** 2025-10-22
**Context:** Issues revealed while building test suite

---

## 🔴 Critical Issues

### 1. Untestable Architecture - Supabase Integration

**Location:** `lib/supabase/server.ts`, all API routes

**Problem:**
```typescript
// lib/supabase/server.ts
export async function createClient() {
  const cookieStore = await cookies()  // Hard-coded Next.js dependency
  return createServerClient(...)
}

// app/api/organizations/route.ts
export async function GET() {
  const supabase = await createClient();  // Can't be mocked in tests
  // ...
}
```

**Why This Is Bad:**
- **Hard to Test:** 40+ tests blocked by inability to mock
- **Tight Coupling:** Routes directly depend on framework internals
- **Not Portable:** Can't test without Next.js runtime
- **Violates DIP:** Depend on abstraction, not concrete implementation

**Impact:**
- All API route tests failing or timing out
- No unit test coverage for business logic in routes
- Forces integration testing for simple validation

**Recommendation:**
```typescript
// Better: Dependency Injection
export async function GET(
  request?: NextRequest,
  supabase?: SupabaseClient  // Accept as parameter
) {
  const client = supabase || await createClient();  // Use provided or create
  // ... testable business logic
}

// Test becomes trivial:
const mockClient = createMockSupabaseClient();
const response = await GET(undefined, mockClient);
```

**Effort:** ~50 API route files need refactoring
**Priority:** HIGH - Blocks all API testing

---

### 2. Dynamic Imports Break Testing

**Location:** `lib/woocommerce-dynamic.ts`, `lib/shopify-dynamic.ts`

**Problem:**
```typescript
export async function getDynamicWooCommerceClient(domain: string) {
  // Dynamic import prevents Jest mocking
  const config = await getCustomerConfig(domain);
  // ...
}
```

**Why This Is Bad:**
- **Can't Mock:** Jest doesn't handle async module imports well
- **Test Dependency:** Tests need the entire dependency chain
- **Slow Tests:** Can't isolate unit under test

**Impact:**
- 37 provider tests blocked
- Can't test provider logic in isolation
- Forces integration tests

**Recommendation:**
```typescript
// Better: Factory pattern with injection
export class WooCommerceClientFactory {
  constructor(
    private configProvider = getCustomerConfig  // Inject dependency
  ) {}

  async createClient(domain: string) {
    const config = await this.configProvider(domain);
    // ...
  }
}

// Test becomes:
const mockConfigProvider = jest.fn().mockResolvedValue(mockConfig);
const factory = new WooCommerceClientFactory(mockConfigProvider);
```

**Effort:** 2 files, ~30 lines each
**Priority:** HIGH - Blocks provider testing

---

### 3. Mixed Static/Instance Methods Pattern

**Location:** All agent files

**Problem:**
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

**Why This Is Bad:**
- **Confusing API:** Two ways to call the same thing
- **Maintenance Burden:** Update both static and instance
- **No Real Benefit:** Instance methods add no value
- **Legacy Pattern:** Trying to satisfy interface AND provide static API

**Impact:**
- Code duplication (boilerplate instance methods)
- Confusion about which to use
- Tests need to verify both match

**Recommendation:**
```typescript
// Option 1: Pure static (if no state needed)
export class CustomerServiceAgent {
  static getEnhancedSystemPrompt(level: string, data: boolean): string {
    // logic
  }
}

// Option 2: Pure instance (if state needed later)
export class CustomerServiceAgent {
  getEnhancedSystemPrompt(level: string, data: boolean): string {
    // logic (can access this.config later)
  }
}

// Don't mix both!
```

**Effort:** 5 agent files
**Priority:** MEDIUM - Works but confusing

---

## 🟡 Moderate Issues

### 4. `any` Types Everywhere

**Location:** Throughout agent files

**Problem:**
```typescript
formatOrdersForAI(orders: any[]): string {
  return orders.map((order, index) => `
    Order ${index + 1}:
    - Order Number: #${order.number}  // ← What if order.number doesn't exist?
    - Total: ${order.currency} ${order.total}  // ← Runtime error possible
  `).join('\n');
}
```

**Why This Is Bad:**
- **No Type Safety:** Typos not caught at compile time
- **Runtime Errors:** Missing properties cause crashes
- **Poor IDE Support:** No autocomplete
- **Harder to Refactor:** Don't know what properties exist

**Impact:**
- Tests need to guess correct shape
- Production errors from wrong property names
- Maintenance difficulty

**Recommendation:**
```typescript
interface Order {
  id: string | number;
  number: string;
  status: string;
  date_created: string;
  total: string;
  currency: string;
  line_items_count?: number;
}

formatOrdersForAI(orders: Order[]): string {
  return orders.map((order, index) => `
    Order ${index + 1}:
    - Order Number: #${order.number}  // ← Type-safe!
  `).join('\n');
}
```

**Effort:** Define interfaces for Order, Product, Customer
**Priority:** MEDIUM - Improves safety and DX

---

### 5. Massive Prompt Strings in Code

**Location:** All agent files

**Problem:**
```typescript
static getEnhancedSystemPrompt(level: string, data: boolean): string {
  return `You are a helpful Customer Service Agent with FULL ACCESS...

  CRITICAL: Never recommend or link to external...

  Product Query Philosophy:
  - When customers ask about products, ALWAYS show...
  - NEVER ask "which type do you need?" before...

  // ... 200+ more lines
  `;
}
```

**Why This Is Bad:**
- **Hard to Maintain:** Finding/editing prompts in code is painful
- **No Version Control:** Can't track prompt changes separately
- **Can't A/B Test:** Prompts hardcoded in code
- **Violates SRP:** Code file responsible for prompts
- **FILE LENGTH:** Many files exceed 300 LOC limit due to prompts

**Impact:**
- agent files are 319 lines (exceeds 300 LOC limit)
- Prompt changes require code deployment
- Can't test different prompt versions

**Recommendation:**
```typescript
// prompts/customer-service/full-access.md
// prompts/customer-service/basic-access.md
// prompts/customer-service/unverified.md

class CustomerServiceAgent {
  static async getEnhancedSystemPrompt(level: string): Promise<string> {
    const promptPath = `./prompts/customer-service/${level}-access.md`;
    return await readPromptFile(promptPath);
  }
}
```

**Benefits:**
- Prompts version controlled separately
- Easy to edit without code changes
- Can deploy prompt updates without code deployment
- Reduces file length significantly

**Effort:** Extract to ~15 prompt files
**Priority:** MEDIUM - Improves maintainability

---

### 6. Inconsistent Error Handling

**Location:** API routes, provider functions

**Problem:**
```typescript
// Some routes return 500 for all errors
catch (error) {
  console.error('Error:', error);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

// Others have specific error codes
if (!validation.success) {
  return NextResponse.json(
    { error: 'Invalid request', details: validation.error.errors },
    { status: 400 }
  );
}

// Others return null
catch (error) {
  console.error('[Provider] Error:', error);
  return null;  // Caller has to check for null
}
```

**Why This Is Bad:**
- **Inconsistent API:** Different error patterns per route
- **Lost Context:** Generic 500 errors hide root cause
- **Poor DX:** Callers don't know what errors to expect
- **Hard to Debug:** No structured error information

**Impact:**
- Production debugging is harder
- Tests can't verify specific error cases
- API consumers confused by inconsistent responses

**Recommendation:**
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

// Consistent error handling
export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message, details: error.details },
      { status: error.statusCode }
    );
  }

  console.error('Unexpected error:', error);
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}

// Usage:
try {
  // logic
} catch (error) {
  return handleApiError(error);
}
```

**Effort:** Create error utilities, update ~50 routes
**Priority:** LOW - Works but inconsistent

---

## 🟢 Minor Issues

### 7. Rate Limiting Testability Issues

**Location:** `lib/rate-limit.ts`

**Problem:**
```typescript
// Module-level global state
const rateLimitMap = new Map<string, RateLimitEntry>();

// Non-deterministic cleanup
if (Math.random() < 0.01) {  // Only 1% of requests trigger cleanup
  for (const [key, value] of rateLimitMap.entries()) {
    if (value.resetTime < now) {
      rateLimitMap.delete(key);
    }
  }
}

// Background interval that can't be stopped
cleanupInterval = setInterval(() => {
  // Cleanup logic
}, 30000);
```

**Why This Is Bad:**
- **Global State:** Map persists across all requests, can't be reset for tests
- **Non-Deterministic:** `Math.random()` makes cleanup unpredictable
- **Background Process:** `setInterval` runs forever, no way to stop
- **Memory Leak Risk:** Cleanup is probabilistic, not guaranteed
- **Test Interference:** Tests must mock `Date.now()` and `Math.random()` to work around issues

**Impact:**
- Tests pass but only because they work around the problems
- Production may accumulate stale entries if cleanup doesn't trigger
- No way to forcefully clear rate limits (e.g., for admin override)
- Background interval persists across test suite

**Recommendation:**
```typescript
// Better: Injectable storage
export class RateLimiter {
  private storage: Map<string, RateLimitEntry>;
  private cleanupInterval?: NodeJS.Timeout;

  constructor(storage = new Map()) {
    this.storage = storage;
  }

  check(identifier: string, maxRequests: number, windowMs: number) {
    // Use this.storage instead of global
    // Deterministic cleanup based on counter, not random
  }

  // For tests and admin use
  reset(identifier?: string) {
    if (identifier) {
      this.storage.delete(identifier);
    } else {
      this.storage.clear();
    }
  }

  stopCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Usage:
const defaultLimiter = new RateLimiter();
export function checkRateLimit(...args) {
  return defaultLimiter.check(...args);
}
```

**Effort:** Refactor 1 file, update ~10 call sites
**Priority:** LOW - Works but not ideal
**Status:** Tests pass (14/14) but tests work around the issues

---

### 8. Testing-Specific Issues

**Location:** Test files we created

**Problem:**
```typescript
// Tests assume implementation details
expect(formatted).toContain('No orders found');  // ❌ Assumed
expect(formatted).toBe('No recent orders found.');  // ✅ Actual
```

**Why This Happened:**
- Didn't read full implementation before writing tests
- Made assumptions about return values
- Tests failed, then fixed

**Lesson Learned:**
> **"ALWAYS read the entire implementation before writing tests"**

This is now documented in our testing philosophy.

**Impact:** Initially had 6 failing tests, all fixed

---

### 8. No Separation of Business Logic

**Location:** API routes

**Problem:**
```typescript
export async function POST(request: NextRequest) {
  // 100+ lines mixing:
  // - Request parsing
  // - Validation
  // - Database operations
  // - Business logic
  // - Response formatting
}
```

**Why This Is Bad:**
- **Untestable:** Can't test business logic without HTTP
- **Hard to Reuse:** Logic locked in route handler
- **Violates SRP:** Route does everything
- **Hard to Unit Test:** Must use integration tests

**Recommendation:**
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

// app/api/organizations/route.ts
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const user = await getUser(supabase);
  const body = await request.json();

  const service = new OrganizationService(supabase);
  const org = await service.createOrganization(user.id, body);

  return NextResponse.json({ organization: org }, { status: 201 });
}
```

**Effort:** Extract to service layer (~20 files)
**Priority:** MEDIUM - Enables better testing

---

## 📊 Summary

### Critical (Fix Soon)
1. ✅ **Untestable Supabase Architecture** - 40+ blocked tests
2. ✅ **Dynamic Imports Break Testing** - 37 blocked tests

### Important (Plan to Fix)
3. ✅ **Mixed Static/Instance Pattern** - Confusing API
4. ✅ **`any` Types Everywhere** - No type safety
5. ✅ **Massive Prompts in Code** - Hard to maintain, exceeds file length limits

### Nice to Have
6. ✅ **Inconsistent Error Handling** - Poor DX
7. ✅ **Rate Limiting Testability** - Global state, non-deterministic
8. ✅ **Encryption Inconsistencies** - Shopify vs WooCommerce handling differs
9. ✅ **No Business Logic Separation** - Hard to test
10. ✅ **Tests Assumed Implementation** - Fixed, lesson learned

---

## 🎯 Recommended Action Plan

### Phase 1: Unblock Testing (Week 1)
- [ ] Implement MSW for Supabase mocking (immediate)
- [ ] Refactor 2-3 critical routes to dependency injection (proof of concept)
- [ ] Document MSW pattern for team

### Phase 2: Type Safety (Week 2-3)
- [ ] Define TypeScript interfaces for Order, Product, Customer, Organization
- [ ] Replace `any[]` with proper types in agents
- [ ] Add Zod schemas for validation

### Phase 3: Code Organization (Month 1)
- [ ] Extract prompts to separate files
- [ ] Create service layer for business logic
- [ ] Standardize error handling

### Phase 4: Refactor for Testability (Month 2+)
- [ ] Gradually refactor routes to dependency injection
- [ ] Remove mixed static/instance pattern
- [ ] Achieve >70% test coverage with proper unit tests

---

## 💡 Key Insight

> **Testing doesn't just verify code works - it reveals design problems.**

The difficulty we faced mocking Supabase and providers isn't a testing framework issue - it's a code design issue. When code is hard to test, it's usually because it's:
1. Too coupled to frameworks/dependencies
2. Doing too much in one place
3. Not following SOLID principles

**The test suite expansion uncovered technical debt that was hidden before.**

Now we have a clear roadmap to fix it!
