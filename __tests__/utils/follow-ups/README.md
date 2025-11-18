**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Test Helpers

# Follow-ups Test Utilities

**Type:** Test Infrastructure
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Estimated Read Time:** 2 minutes

## Purpose

Shared mock data and setup utilities for follow-up system tests, reducing duplication across test files.

## Files

### `mock-helpers.ts` (291 LOC)

Provides:
- **Mock Data Factories**: Pre-built conversation objects
  - `createAbandonedConversation()` - Abandoned conversation
  - `createLowSatisfactionConversation()` - Negative sentiment
  - `createCartAbandonmentConversation()` - Cart but no checkout
  - `createCompletedCheckoutConversation()` - Full purchase flow
  - `createHighSatisfactionConversation()` - Positive sentiment
  - `createTooFewMessagesConversation()` - Filter edge case
  - `createNestedEmailConversation()` - Email in nested metadata
  - `createDirectEmailConversation()` - Email in top-level metadata
  - `createConversationWithAttempts()` - Max attempts tracking

- **Mock Setup Function**: `setupMockSupabase()`
  - Accepts conversation data and follow-up log counts
  - Returns jest-mocked Supabase client
  - Handles table-specific query behavior

## Usage Example

```typescript
import { setupMockSupabase, createAbandonedConversation } from '@/__tests__/utils/follow-ups/mock-helpers';

// Setup test
const conversation = createAbandonedConversation();
const mockSupabase = setupMockSupabase([conversation]);

// Test code
const candidates = await detectFollowUpCandidates(mockSupabase, ['domain-1']);
expect(candidates).toHaveLength(1);
```

## Design Rationale

**Why extract mock data?**
- Avoids repeating 50+ lines of mock setup per test
- Makes tests more readable (focus on behavior, not data)
- Centralizes test data changes
- Enables reuse across multiple test modules

**Why table-specific mocking?**
- Real code queries different tables conditionally
- Mock setup must handle both 'conversations' and 'follow_up_logs'
- Provides realistic behavior without full Supabase emulation

## Related Tests

- `__tests__/lib/follow-ups/detector/detection.test.ts` - Primary consumer
- `__tests__/lib/follow-ups/detector/prioritization.test.ts` - Secondary consumer
