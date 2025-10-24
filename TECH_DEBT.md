# Technical Debt Tracker

## 🚨 Critical Priority

### 1. File Length Violations (CLAUDE.md Rule: 300 LOC Max)

**Status**: ⚠️ Needs Refactoring - **94 files exceed limit**

**Automated Checking**: Run `npx tsx scripts/check-file-length.ts` to scan all files

**Top Violations:**

| File | Current LOC | Violation | Priority |
|------|-------------|-----------|----------|
| `lib/content-deduplicator.ts` | 1220 LOC | **407% over** | 🚨 Critical |
| `lib/scraper-config.ts` | 1182 LOC | **394% over** | 🚨 Critical |
| `lib/scraper-api.ts` | 1156 LOC | **385% over** | 🚨 Critical |
| `app/dashboard/privacy/page.tsx` | 1131 LOC | **377% over** | 🚨 Critical |
| `app/api/chat/route.ts` | 519 LOC | **173% over** | 🔶 High |
| `__tests__/api/chat/route.test.ts` | 555 LOC | **185% over** | 🔶 High |

**Impact**:
- Harder to review, maintain, and test
- Violates project's strict modularity guidelines
- Increases cognitive load for developers

**Recommended Refactoring** ([app/api/chat/route.ts](app/api/chat/route.ts:1-1204)):
```
app/api/chat/
├── route.ts (~150 LOC) - Route handler only
├── lib/
│   ├── request-handler.ts (~200 LOC) - Core request processing
│   ├── tool-handlers.ts (~250 LOC) - Tool execution (search_products, etc.)
│   ├── response-builder.ts (~200 LOC) - Response formatting
│   ├── conversation-manager.ts (~200 LOC) - Conversation CRUD
│   └── types.ts (~100 LOC) - Shared types & interfaces
```

**Recommended Test Split** ([__tests__/api/chat/route.test.ts](/__tests__/api/chat/route.test.ts:1-612)):
```
__tests__/api/chat/
├── route.basic.test.ts - Basic chat requests
├── route.commerce.test.ts - Commerce provider integration
├── route.errors.test.ts - Error handling
└── route.tools.test.ts - Tool execution
```

**Effort**: 4-6 hours
**Risk**: Medium (requires careful extraction to avoid breaking changes)

---

## 🔶 High Priority

### 2. Test Infrastructure Issues

**Status**: ✅ RESOLVED (2025-10-24) - See [docs/MOCK_ISOLATION_FIX.md](docs/MOCK_ISOLATION_FIX.md)

| Test | Individual | Batch | Issue |
|------|-----------|-------|-------|
| "should include WooCommerce products" | ✅ PASS | ❌ FAIL | Mock interference |
| "should include Shopify products" | ✅ PASS | ❌ FAIL | Mock interference |
| "should handle commerce provider errors" | ✅ PASS | ❌ FAIL | Mock interference |
| "should handle Supabase errors" | ✅ PASS | ❌ FAIL | Error not propagating |
| "should handle OpenAI API errors" | ✅ PASS | ❌ FAIL | Error not propagating |
| "should include relevant content from embeddings" | ❌ FAIL | ❌ FAIL | Needs investigation |
| "should recover gracefully when tool arguments missing" | ❌ FAIL | ❌ FAIL | Needs investigation |

**Root Cause**:
- Mock state bleeding between tests despite `jest.clearAllMocks()` and `jest.restoreAllMocks()`
- Tests share mock instances that aren't properly isolated
- BeforeEach cleanup is incomplete

**Evidence**:
```bash
# Individual test (PASSES):
$ npm test -- __tests__/api/chat/route.test.ts --testNamePattern="should include WooCommerce"
✓ should include WooCommerce products when provider is configured (21 ms)

# Batch tests (FAILS):
$ npm test -- __tests__/api/chat/route.test.ts
✕ should include WooCommerce products when provider is configured (3 ms)
```

**Solutions**:

**Option A: Fix Mock Isolation** (Recommended)
- Extract shared test setup into separate file
- Use `jest.isolateModules()` for complete mock isolation
- Reset all module state in `beforeEach`

**Option B: Run Tests in Isolation**
- Use `jest --runInBand --forceExit` to run tests sequentially in separate processes
- Slower but guaranteed isolation

**Option C: Rewrite Tests with Dependency Injection**
- Eliminate `jest.mock()` entirely
- Use the new dependency injection pattern throughout
- Pass all mocks explicitly via `deps` parameter

**Resolution**: Implemented singleton-aware mocking strategy. All tests now pass in both individual and batch modes.
- Created `__tests__/setup/isolated-test-setup.ts` with mock factories
- Changed to `beforeAll()` for mock instance creation (preserves singleton references)
- Unified mock strategy using `mockImplementation()` consistently
- Fixed route file syntax errors

**Actual Effort**: 2.5 hours
**Risk**: Low (doesn't affect production code)

---

## 📝 Medium Priority

### 3. Dependency Injection Documentation

**Status**: ✅ COMPLETE (2025-10-24)

**What's Done**:
- ✅ Created `RouteDependencies` interface
- ✅ Implemented dependency injection in `POST` function
- ✅ Updated helper functions to accept deps
- ✅ Zero breaking changes
- ✅ Comprehensive documentation created ([docs/DEPENDENCY_INJECTION.md](docs/DEPENDENCY_INJECTION.md))
- ✅ Migration guide for other routes
- ✅ JSDoc comments added to interfaces
- ✅ Testing best practices documented

**Benefits Realized**:
- Code is testable without complex mocking
- Explicit dependencies (better code clarity)
- Easier to maintain and extend
- Clear patterns for other developers to follow

**Actual Effort**: 1 hour
**Risk**: None (additive changes only)

---

## 📋 Low Priority

### 4. Test Error Message Improvements

**Current**:
```typescript
expect(data.message).toBe('Here are the products from our catalog.')
// Fails with: Received: "This is a helpful response from the AI assistant."
```

**Issue**: Tests expect specific OpenAI responses, but mocks return default text

**Solution**: Update test expectations or improve mock configurations

**Effort**: 30 minutes
**Risk**: None

---

## 🔄 Process Improvements

### 5. Pre-Commit Hooks

**Status**: ✅ COMPLETE (2025-10-24)

**What's Implemented**:
- ✅ Husky installed and configured
- ✅ File length validation (enforces 300 LOC limit with `--strict` mode)
- ✅ TypeScript type checking
- ✅ ESLint validation
- ✅ Test execution before commits
- ✅ Automated file length checker script ([scripts/check-file-length.ts](scripts/check-file-length.ts))

**Pre-Commit Checks**:
1. **File Length**: `npx tsx scripts/check-file-length.ts --strict`
2. **Type Check**: `npx tsc --noEmit`
3. **Linting**: `npm run lint`
4. **Tests**: `npm test -- --bail --passWithNoTests`

**Usage**:
```bash
# Test file lengths manually
npx tsx scripts/check-file-length.ts           # Report violations
npx tsx scripts/check-file-length.ts --fix     # Show refactoring suggestions
npx tsx scripts/check-file-length.ts --strict  # Exit 1 on violations
```

**Actual Effort**: 1 hour
**Risk**: None

---

## 📊 Summary

| Priority | Item | Effort | Status |
|----------|------|--------|--------|
| 🚨 Critical | File Length Violations | 4-6 hrs | ⚠️ Needs Action (94 files) |
| 🔶 High | Test Infrastructure | 2.5 hrs | ✅ Complete |
| 📝 Medium | DI Documentation | 1 hr | ✅ Complete |
| 📋 Low | Test Error Messages | 30 min | 🟢 Optional |
| 🔄 Process | Pre-Commit Hooks | 1 hr | ✅ Complete |

**Completed Effort**: 4.5 hours
**Remaining Effort**: 4-6 hours (file refactoring)

---

## 🎯 Recommended Action Plan

### Week 1: Critical Fixes
1. **Day 1-2**: Refactor `app/api/chat/route.ts` (split into 6 files)
2. **Day 3**: Refactor test file (split into 4 files)
3. **Day 4**: Fix test infrastructure issues
4. **Day 5**: Verify all tests pass, code review

### Week 2: Documentation & Process
5. Document DI pattern
6. Add pre-commit hooks
7. Update CLAUDE.md with lessons learned

---

## 📖 Context

This technical debt was identified during the implementation of dependency injection for improved testability. The core architectural improvement (dependency injection) is **solid and production-ready**. The remaining items are process improvements and code organization.

**Key Insight**: The file length violations existed before the DI refactor - this is inherited debt, not new debt.

---

**Last Updated**: 2025-10-24
**Tracking**: This document should be reviewed quarterly and updated as items are resolved.
