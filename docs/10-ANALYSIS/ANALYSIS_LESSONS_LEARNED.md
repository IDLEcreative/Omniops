# Lessons Learned - Universal Development Knowledge

**Type:** Analysis
**Status:** Active (Living Document)
**Last Updated:** 2025-11-22
**Verified For:** v0.1.0
**Estimated Read Time:** 15 minutes

## Purpose
This document captures critical lessons learned across all aspects of the Omniops platform development. Each lesson represents real problems encountered and proven solutions, organized by category for quick reference.

## Quick Links
- [React & Next.js](#react--nextjs)
- [Testing & E2E](#testing--e2e)
- [Performance](#performance)
- [Security](#security)
- [Database](#database)
- [DevOps & Infrastructure](#devops--infrastructure)
- [API Design](#api-design)

## Table of Contents
- [How to Use This Document](#how-to-use-this-document)
- [React & Next.js](#react--nextjs)
- [Testing & E2E](#testing--e2e)
- [Performance](#performance)
- [Security](#security)
- [Database](#database)
- [DevOps & Infrastructure](#devops--infrastructure)
- [API Design](#api-design)
- [AI & Embeddings](#ai--embeddings)

---

## How to Use This Document

**When to Update:**
- After fixing any bug or issue
- After discovering a better pattern
- After resolving a production incident
- During code reviews when patterns emerge
- When onboarding new developers

**Update Template:**
```markdown
### Lesson N: [Short Title]
**Date:** YYYY-MM-DD
**Issue:** [What problem occurred]
**Learning:** [What we discovered]
**Pattern:** [How to handle this going forward]
**Code Example:** [Before/After if applicable]
**Related:** [Link to relevant docs, PRs, or commits]
```

**Categories:**
Lessons are organized by technology/domain for easy navigation. Use Cmd+F to search for specific topics.

---

## React & Next.js

### Lesson 1: Null Safety in Chart Components
**Date:** 2025-11-17
**Issue:** React components crashed with "Cannot read properties of undefined" when data prop had missing nested fields
**Learning:** Optional chaining (`?.`) and early returns prevent runtime crashes, but add defensive checks at component entry
**Pattern:**
- Always validate data prop structure at component entry
- Use early returns for missing required data
- Fail gracefully (return null or fallback UI)

**Code Example:**
```typescript
// ❌ BAD: Assumes data structure is complete
export function Chart({ data }) {
  const chartData = data.hourlyDistribution.map(...); // Crashes if undefined
}

// ✅ GOOD: Defensive checks at entry
export function Chart({ data }) {
  if (!data?.hourlyDistribution || !data?.peakHours || !data?.quietHours) {
    return null; // or <EmptyState />
  }

  const chartData = data.hourlyDistribution.map(...); // Safe
}
```

**Related:**
- [PeakUsageChart.tsx](../../components/analytics/PeakUsageChart.tsx:10-13)
- [E2E Test Fixes](./E2E_TEST_FIXES_SUMMARY.md#fix-1-component-null-safety)

---

### Lesson 2: Next.js On-Demand Route Compilation
**Date:** 2025-11-17
**Issue:** E2E tests timed out when navigating to routes that weren't pre-compiled
**Learning:** In development mode, Next.js compiles routes on first access, which can take 5-10 seconds
**Pattern:**
- Add retry logic with 60-second timeout for initial route access
- Use exponential backoff (2s, 4s delays)
- Expect compilation delays in E2E test setup

**Code Example:**
```typescript
// ✅ GOOD: Retry logic for on-demand compilation
let pageLoaded = false;
let retryCount = 0;
const maxRetries = 3;

while (!pageLoaded && retryCount < maxRetries) {
  try {
    await page.goto('/login', {
      waitUntil: 'networkidle',
      timeout: 60000 // 60 seconds for compilation
    });
    pageLoaded = true;
  } catch (error) {
    retryCount++;
    if (retryCount < maxRetries) {
      await page.waitForTimeout(retryCount * 2000); // Exponential backoff
    } else {
      throw error;
    }
  }
}
```

**Related:** [auth-helpers.ts](../../__tests__/utils/playwright/auth-helpers.ts:62-88)

---

## Testing & E2E

### Lesson 3: Content Security Policy (CSP) for E2E Tests
**Date:** 2025-11-22
**Issue:** CSP blocked Supabase Auth UI inline scripts, preventing authentication in E2E tests
**Learning:** Production CSP is strict by default; development mode needs route-specific exceptions for test routes
**Pattern:**
- Run E2E tests in development mode (`npm run dev`)
- Add test routes (`/login`, `/dashboard`) to CSP exception list
- Use `isTestRoute` check in middleware to conditionally allow `'unsafe-inline'`

**Code Example:**
```typescript
// middleware.ts
const isTestRoute = request.nextUrl.pathname.startsWith('/login') ||
                    request.nextUrl.pathname.startsWith('/dashboard');

const scriptSources = [
  "'self'",
  ...(isDevelopment || isTestRoute ? ["'unsafe-inline'", "'unsafe-eval'"] : [])
];
```

**Related:**
- [middleware.ts](../../middleware.ts:139-155)
- [E2E Test Fixes](./E2E_TEST_FIXES_SUMMARY.md#fix-5-csp-configuration)

---

### Lesson 4: Server Recovery Time Tuning
**Date:** 2025-11-22
**Issue:** Dev server crashed after heavy E2E tests making 3+ rapid API calls, causing `ERR_CONNECTION_REFUSED`
**Learning:** Heavy tests exhaust dev server resources; recovery delays must be tuned based on test load
**Pattern:**
- Standard tests: 2-3 second delay in `afterEach`
- Heavy API tests (3+ calls): 5+ second delay
- Monitor for `ERR_CONNECTION_REFUSED` as early warning
- Increase delay if tests start failing after specific heavy tests

**Code Example:**
```typescript
test.afterEach(async ({ page }) => {
  // Test 3 makes 3 rapid API calls, needs extra recovery
  await page.waitForTimeout(5000);
});
```

**Related:** [analytics-dashboard-complete.spec.ts](../../__tests__/playwright/dashboard/analytics-dashboard-complete.spec.ts:42-46)

---

### Lesson 5: UI Element Availability Across Tabs
**Date:** 2025-11-17
**Issue:** Tests failed trying to interact with elements that only exist on specific tabs
**Learning:** Not all UI controls exist on all views - test interactions in the context where elements exist
**Pattern:**
- Identify which tab/view contains the element
- Test element interactions BEFORE navigating away
- Order tests to match actual UI structure

**Code Example:**
```typescript
// ✅ CORRECT ORDER
// Test export dropdown (on Overview tab)
await testExportDropdown(page);

// THEN switch tabs
await switchTab(page, 'business intelligence');
```

**Related:** [E2E Test Fixes](./E2E_TEST_FIXES_SUMMARY.md#fix-2-auto-refresh-toggle-ordering)

---

### Lesson 6: Playwright webServer Auto-Management
**Date:** 2025-11-17
**Issue:** Manual dev server management was unreliable during heavy E2E testing
**Learning:** Playwright's built-in webServer configuration handles server lifecycle automatically
**Pattern:**
- Let Playwright start/stop the server
- Configure timeout for initial compilation (120s+)
- Reuse existing server locally, fresh server in CI
- Server stays alive for entire test suite

**Code Example:**
```javascript
// playwright.config.js
webServer: {
  command: 'npm run dev',
  url: 'http://localhost:3000',
  timeout: 180000, // 3 minutes
  reuseExistingServer: !process.env.CI,
  stdout: 'pipe',
  stderr: 'pipe',
}
```

**Related:** [playwright.config.js](../../playwright.config.js:48-56)

---

## Performance

### Lesson 7: Avoid O(n²) Nested Loops
**Date:** 2025-10-XX
**Issue:** Slow performance when matching items by ID in nested loops
**Learning:** Nested loops create O(n²) complexity; use Map/Set for O(1) lookups
**Pattern:**
- Create Map/Set before loop for O(n) initialization
- Use `.get()` or `.has()` for O(1) lookup inside loop
- Total complexity becomes O(n) instead of O(n²)

**Code Example:**
```typescript
// ❌ BAD: O(n²) - Nested loops
for (const item of items) {
  for (const other of items) {
    if (item.id === other.parentId) { /* ... */ }
  }
}

// ✅ GOOD: O(n) - Map lookup
const itemMap = new Map(items.map(i => [i.id, i]));
for (const item of items) {
  const parent = itemMap.get(item.parentId); // O(1) lookup
}
```

**Related:** [CLAUDE.md Performance Guidelines](../../CLAUDE.md#performance-guidelines)

---

## Security

### Lesson 8: CSP Development vs Production
**Date:** 2025-11-22
**Issue:** Different CSP policies needed for development (testing) vs production (security)
**Learning:** CSP must be strict in production but allow exceptions for development/testing
**Pattern:**
- Production: Strict CSP with no `'unsafe-inline'` or `'unsafe-eval'`
- Development: Relaxed CSP for hot reload and debugging
- Test routes: Specific exceptions for auth UI and E2E tests
- Use environment checks (`isDevelopment`) to conditionally set policies

**Code Example:**
```typescript
const isDevelopment = process.env.NODE_ENV !== 'production';
const isTestRoute = pathname.startsWith('/test-') || pathname.startsWith('/login');

const scriptSources = [
  "'self'",
  ...(isDevelopment || isTestRoute ? ["'unsafe-inline'", "'unsafe-eval'"] : [])
];
```

**Related:** [middleware.ts](../../middleware.ts:138-155)

---

## Database

### Lesson 9: RLS Policy Testing
**Date:** 2025-10-XX
**Issue:** Database queries failed in production due to missing RLS policies
**Learning:** Always test database operations with service role AND anon role
**Pattern:**
- Test all CRUD operations with both roles
- Verify organization isolation works correctly
- Check that unauthorized access is blocked
- Test RLS policies before deploying migrations

**Related:** [Database Schema Reference](../09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md)

---

## DevOps & Infrastructure

### Lesson 10: Docker BuildKit Cache Optimization
**Date:** 2025-10-XX
**Issue:** Docker builds were slow (5+ minutes) even for small changes
**Learning:** BuildKit with proper layer caching can reduce builds by 60-90%
**Pattern:**
- Enable BuildKit: `DOCKER_BUILDKIT=1`
- Order Dockerfile layers from least to most frequently changing
- Copy package files before source code
- Use multi-stage builds to reduce final image size

**Related:** [Docker Setup Guide](../00-GETTING-STARTED/SETUP_DOCKER_PRODUCTION.md)

---

## API Design

### Lesson 11: HTTP Method Consistency
**Date:** 2025-11-17
**Issue:** Frontend used PATCH but API expected PUT, causing update failures
**Learning:** Consistent HTTP method usage prevents integration bugs
**Pattern:**
- **POST**: Create new resources (return 201)
- **GET**: Retrieve resources (return 200)
- **PUT**: Full updates (return 200)
- **PATCH**: Partial updates (use sparingly)
- **DELETE**: Remove resources (return 200 or 204)
- Document expected methods in API routes

**Code Example:**
```typescript
// ❌ BAD: Mismatch between frontend and backend
// Frontend
await fetch('/api/resource', { method: 'PATCH', ... });

// Backend (expects PUT)
export async function PUT(request: Request) { ... }

// ✅ GOOD: Consistent methods
// Frontend
await fetch('/api/resource', { method: 'PUT', ... });

// Backend
export async function PUT(request: Request) { ... }
```

**Related:** [use-annotations.ts](../../hooks/use-annotations.ts:98-104)

---

## AI & Embeddings

### Lesson 12: Search Result Limits
**Date:** 2025-10-XX
**Issue:** Documentation claimed 20 results max, but actual limit was 100-200
**Learning:** Always verify actual system behavior vs documented limits
**Pattern:**
- Test with real queries to measure actual limits
- Document both theoretical and practical limits
- Update docs when behavior changes
- Add monitoring to detect limit changes

**Related:** [Search Architecture](../01-ARCHITECTURE/ARCHITECTURE_SEARCH_SYSTEM.md)

---

## Contributing to This Document

**When adding a new lesson:**

1. **Choose the right category** - If unsure, use closest match or create new category
2. **Use the template** - Follow the Issue/Learning/Pattern structure
3. **Add code examples** - Before/After comparison when applicable
4. **Link to related files** - Help others find the actual implementation
5. **Date it** - Helps understand when patterns were established

**Maintenance:**

- Review quarterly for outdated lessons
- Archive obsolete lessons to separate section
- Update lesson numbers when adding to middle of category
- Cross-reference with related documentation

---

**Document Version:** 1.0
**Last Updated:** 2025-11-22 14:30
**Status:** ✅ ACTIVE - Continuously updated as new lessons are discovered
