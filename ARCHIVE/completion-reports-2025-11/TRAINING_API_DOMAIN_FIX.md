# Training API Domain Constraint Fix

**Date Completed:** 2025-11-16
**Issue:** Database constraint violation preventing all training data creation
**Status:** ✅ RESOLVED

## Problem Summary

Both training API endpoints (`/api/training/text` and `/api/training/qa`) were throwing a database constraint violation error:

```
null value in column "domain" of relation "training_data" violates not-null constraint
```

The root cause: both endpoints were attempting to insert training data records without specifying a `domain` value, but the `training_data` table has a `NOT NULL` constraint on the `domain` column.

## Root Cause Analysis

**Database Schema (from migration 20251020_create_training_data.sql):**
```sql
CREATE TABLE public.training_data (
  ...
  domain TEXT NOT NULL,
  ...
);
```

**Affected Endpoints:**
- `/app/api/training/text/route.ts` (lines 89-97)
- `/app/api/training/qa/route.ts` (lines 89-97)

Both were missing the required `domain` field in their insert statements.

## Solution Implemented

Added `domain: 'training.omniops.local'` to both training data insert statements.

### Rationale

Training data is system-managed knowledge base material that is not tied to a specific customer domain. Using `'training.omniops.local'` as a sentinel value:

1. **Satisfies the database constraint** - `domain` is now always provided
2. **Preserves multi-tenancy architecture** - Training data is clearly separated from customer domains
3. **Is consistent across all training data** - All training submissions use the same domain
4. **Is easily filterable** - Can distinguish system training from customer-specific content via domain value

## Files Modified

### 1. `/Users/jamesguy/Omniops/app/api/training/text/route.ts`

**Change (lines 88-100):**

```typescript
// BEFORE (broken):
const { data: trainingData, error: insertError } = await adminSupabase
  .from('training_data')
  .insert({
    user_id: user.id,
    type: 'text',
    content: content.substring(0, 200),
    metadata: { fullContent: content },
    status: 'processing',
    // Missing: domain field
  })

// AFTER (fixed):
const { data: trainingData, error: insertError } = await adminSupabase
  .from('training_data')
  .insert({
    user_id: user.id,
    domain: 'training.omniops.local',  // ADDED
    type: 'text',
    content: content.substring(0, 200),
    metadata: { fullContent: content },
    status: 'processing',
  })
```

### 2. `/Users/jamesguy/Omniops/app/api/training/qa/route.ts`

**Change (lines 88-100):**

```typescript
// BEFORE (broken):
const { data: trainingData, error: insertError } = await adminSupabase
  .from('training_data')
  .insert({
    user_id: user.id,
    type: 'qa',
    content: question,
    metadata: { question, answer },
    status: 'processing',
    // Missing: domain field
  })

// AFTER (fixed):
const { data: trainingData, error: insertError } = await adminSupabase
  .from('training_data')
  .insert({
    user_id: user.id,
    domain: 'training.omniops.local',  // ADDED
    type: 'qa',
    content: question,
    metadata: { question, answer },
    status: 'processing',
  })
```

## Test Coverage

Created comprehensive test suites to verify the fix and prevent regression:

### 1. `/Users/jamesguy/Omniops/__tests__/api/training/text.test.ts`
- 14 test cases covering:
  - Request validation (empty content, whitespace)
  - Database schema compliance (domain field presence, type correctness)
  - Response format validation
  - Authorization checks
  - Rate limiting
  - Error handling
  - Type validation

### 2. `/Users/jamesguy/Omniops/__tests__/api/training/qa.test.ts`
- 14 test cases covering:
  - Request validation (missing question/answer)
  - Database schema compliance (domain field presence)
  - Type validation (qa type)
  - Metadata storage (question, answer)
  - Response format validation
  - Authorization checks
  - Rate limiting
  - Error handling
  - Content embedding

**Test Results:**
```
Test Suites: 2 passed, 2 total
Tests:       28 passed, 28 total
Time:        1.033s
```

## Verification

### ✅ Build Status
- Next.js build: **SUCCESS** (no TypeScript errors)
- No warnings related to training APIs

### ✅ Test Status
- Unit tests: **PASS** (28/28 tests pass)
- Training tests: **PASS**
- No linting issues

### ✅ Type Safety
- TypeScript compilation: **SUCCESS**
- No type errors in modified files

## Success Criteria Met

- [x] Both `/api/training/text` and `/api/training/qa` include `domain` in insert statements
- [x] Database inserts will no longer throw NOT NULL constraint violations
- [x] Tests can create training data without HTTP 500 errors
- [x] Domain value is consistent across both endpoints (`'training.omniops.local'`)
- [x] Build passes (npm run build)
- [x] All tests pass (npm test)
- [x] No linting issues (npm run lint)
- [x] No TypeScript errors

## Impact Assessment

### Endpoints Fixed
1. **POST /api/training/text** - Submit custom training text
2. **POST /api/training/qa** - Submit Q&A training pairs

### Risk Level
**LOW** - Changes are minimal and surgical:
- Only added one required field to prevent constraint violations
- No changes to business logic
- No changes to response format
- No changes to error handling
- Backward compatible (simply fixes a bug preventing any requests from working)

### Side Effects
**NONE** - This is a pure bug fix with no side effects:
- Does not affect user authentication
- Does not affect rate limiting logic
- Does not affect response format
- Does not affect embeddings generation
- Training data will now be correctly inserted

## Future Considerations

### Multi-Tenancy Notes
If in the future training data needs to be associated with specific customer domains, the `domain` value can be updated to `request.headers.get('x-domain')` or similar, maintaining the same structure.

### Domain Filtering
Training data can now be filtered/queried using:
```sql
-- Get all system training data
SELECT * FROM training_data WHERE domain = 'training.omniops.local';

-- Get customer-specific data (if implemented later)
SELECT * FROM training_data WHERE domain = 'customer.example.com';
```

## References

- **Schema Definition:** `supabase/migrations/20251020_create_training_data.sql`
- **Text Endpoint:** `app/api/training/text/route.ts`
- **QA Endpoint:** `app/api/training/qa/route.ts`
- **Test Suite:** `__tests__/api/training/`

## Commit Message

```
fix: add missing domain field to training API insert statements

- Fix: Add domain: 'training.omniops.local' to /api/training/text insert
- Fix: Add domain: 'training.omniops.local' to /api/training/qa insert
- Test: Create 28 test cases for training API endpoints
- Reason: Database constraint violation - training_data.domain is NOT NULL

The training_data table requires a domain field (NOT NULL constraint),
but both training API endpoints were inserting without it. This caused
all training data creation requests to fail with HTTP 500 errors.

Using 'training.omniops.local' as domain value indicates system-managed
training material (not customer-specific), preserving multi-tenant isolation.

Verified: Build passes, all 28 tests pass, no TypeScript errors.
```
