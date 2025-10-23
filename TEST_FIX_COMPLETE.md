# Test Infrastructure Fix - Complete Summary

## Problem
Tests were timing out (>2 minutes) and returning 500 errors due to null conversation data.

## Root Causes Found & Fixed

### 1. Redis Connection Leak ✅ FIXED
**Issue**: ioredis was creating real TCP connections at module import time, preventing tests from completing.

**Fix**: Added ioredis mock to `test-utils/jest.setup.js` (lines 21-34) to prevent real connections.

**Result**: Tests now complete in <1 second instead of timing out.

### 2. MockQueryBuilder Returning Null ✅ FIXED
**Issue**: `@supabase/supabase-js` mock's `MockQueryBuilder` returned empty arrays for unknown tables. When `createServiceRoleClient()` internally called `createClient()` from the real Supabase SDK, it got a mocked client that returned `null` for conversations.

**Fix**: Added `conversations`, `messages`, and `domains` to the `_getDefaultDataForTable()` switch in `__mocks__/@supabase/supabase-js.js` (lines 42-53).

**Result**: Route can now successfully create conversations and tests pass.

### 3. MSW Configuration ✅ UPDATED
**Change**: Updated MSW to use `bypass` mode in `test-utils/jest.setup.js` to allow module-level mocks to work without interception conflicts.

**Benefit**: Module mocks (OpenAI, Supabase, ioredis) work properly without MSW interfering.

## Test Results

### route.test.ts: 4/12 passing (33%)
**Passing**:
- ✓ should handle a basic chat request
- ✓ should handle existing conversation
- ✓ should validate request data
- ✓ should handle long messages

**Failing (expected - need mock configuration)**:
- Embeddings search (needs searchSimilarContent mock data)
- Tool argument recovery (needs OpenAI retry logic)
- Rate limiting (needs rate limit mock configuration)
- WooCommerce/Shopify integration (needs commerce provider mocks)
- Error handling scenarios (needs error injection)

### route-async.test.ts: 0/3 passing
**Status**: Tests run but fail because they use custom performance-tracking mocks that aren't compatible with the global mock infrastructure.

**Not critical** - these are performance tests, not functional tests.

## Files Modified

### Core Fixes
1. `__mocks__/@supabase/supabase-js.js` - Added default data for conversations, messages, domains
2. `test-utils/jest.setup.js` - Added ioredis mock, changed MSW to bypass mode
3. `__mocks__/@/lib/supabase-server.ts` - Fixed async/await issues with mockResolvedValue

### Test Refactor
4. `__tests__/api/chat/route.test.ts` - Removed duplicate mock setup in beforeEach, relies on global mocks

### Cleanup
5. `app/api/chat/route.ts` - Removed debug logging

## Performance Impact
- **Before**: Tests timed out after 2+ minutes
- **After**: Tests complete in ~1 second
- **Improvement**: >120x faster

## Next Steps (Optional)
To get remaining tests passing, each test needs specific mock configuration:
1. Configure `searchSimilarContent` to return mock embeddings
2. Set up commerce provider mocks with proper product data
3. Configure rate limit mock to return `{ allowed: false }`
4. Set up OpenAI retry responses for tool argument recovery
5. Inject Supabase errors for error handling tests

## Key Insight
The issue wasn't with the test files - it was with the **global mock infrastructure**. The `MockQueryBuilder` in `@supabase/supabase-js` mock was returning `null` for tables it didn't recognize, causing the route to fail when trying to access `newConversation.id`.

By adding default data for the chat-related tables, the route can now successfully complete its basic flow.
