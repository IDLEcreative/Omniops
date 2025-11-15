# List Organizations Test Suite

**Last Updated:** 2025-11-15
**Status:** ✅ Active
**LOC:** 4 files, ~50 LOC each

## Purpose
Tests for `GET /api/organizations` endpoint covering authentication, multi-tenant data isolation, and RLS enforcement.

## Structure

```
list-organizations-tests/
├── authentication.test.ts      # Auth & service availability (35 LOC)
├── success-cases.test.ts       # Organization listing (89 LOC)
├── data-validation.test.ts     # User filtering & response shape (190 LOC)
└── error-handling.test.ts      # Database error handling (36 LOC)
```

## Test Coverage

### Authentication (authentication.test.ts)
- 401 for unauthenticated users
- 503 when Supabase unavailable

### Success Cases (success-cases.test.ts)
- Returns organizations for authenticated user
- Empty array when user has no organizations

### Data Validation (data-validation.test.ts)
- Filters by user ID correctly (multi-tenant isolation)
- Returns proper organization shape with all fields
- Handles multiple organizations

### Error Handling (error-handling.test.ts)
- Handles database errors gracefully

## Running Tests

```bash
# All list-organizations tests
npm test -- --testPathPattern="list-organizations"

# Specific suite
npm test -- __tests__/api/organizations/list-organizations-tests/authentication.test.ts
```

## Dependencies

- **Helpers:** `test-utils/supabase-test-helpers`, `test-utils/api-test-helpers`
- **Mocks:** Supabase server

## Notes

- Tests use orchestrator pattern
- Mock setup centralized in orchestrator file
- Verifies multi-tenant data isolation
- Tests RLS enforcement
