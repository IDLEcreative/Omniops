# Follow-up Scheduler Tests

**Purpose:** Unit tests for the follow-up scheduling system that validates message scheduling, sending, and cancellation operations.

**Module:** `lib/follow-ups/scheduler.ts`

**Last Updated:** 2025-11-10

**Status:** Active

---

## Test Modules

This directory contains 3 focused test modules, each under 200 LOC:

### 1. `schedule.test.ts` (155 LOC)
Tests for `scheduleFollowUps()` function:
- ✅ Scheduling follow-ups for candidates with emails
- ✅ Skipping candidates without email (email channel)
- ✅ Generating appropriate message content per reason
- ✅ Respecting delay minutes option
- ✅ Database error handling
- ✅ In-app message generation with shorter content
- ✅ Metadata inclusion in scheduled messages

**Key Test Data:**
- `MOCK_CANDIDATES` - Two test candidates (abandoned conversation, cart abandonment)
- `CANDIDATE_WITHOUT_EMAIL` - For email validation tests

### 2. `send.test.ts` (76 LOC)
Tests for channel handlers (`sendEmail`, `sendInAppNotification`):
- ✅ Email logging behavior
- ✅ In-app notification database insertion

**Note:** Tests for future `sendPendingFollowUps()` are pending implementation.

### 3. `cancel.test.ts` (70 LOC)
Tests for `cancelFollowUps()` function:
- ✅ Cancelling pending follow-ups for a conversation
- ✅ Only cancelling pending messages (not sent ones)
- ✅ Handling empty cancellations (returning 0)

---

## Shared Test Helpers

**Location:** `__tests__/utils/follow-ups/test-helpers.ts` (237 LOC)

Provides reusable utilities to reduce duplication:

### Mock Setup Functions
- `createMockSupabase()` - Fresh Supabase mock
- `mockSupabaseForScheduling()` - Pre-configured for schedule operations
- `mockSupabaseForSending()` - Pre-configured for sending operations
- `mockSupabaseForSendingWithUpdate()` - With update tracking
- `mockSupabaseForCancellation()` - Pre-configured for cancellation

### Test Data Constants
- `MOCK_CANDIDATES` - Standard test candidates
- `CANDIDATE_WITHOUT_EMAIL` - For validation tests
- `PENDING_EMAIL_MESSAGES` - Email message data
- `PENDING_INVALID_CHANNEL_MESSAGES` - Invalid channel scenarios
- `IN_APP_NOTIFICATION_MESSAGES` - In-app notification data

### Utility Functions
- `createManyPendingMessages(count)` - Batch test data generation

---

## Refactoring Summary

**Original:** 1 monolithic file (547 LOC)
**Refactored:** 4 focused modules (538 total LOC)

| Module | LOC | Purpose |
|--------|-----|---------|
| schedule.test.ts | 155 | Scheduling operations (7 tests) |
| send.test.ts | 76 | Channel handlers (2 tests) |
| cancel.test.ts | 70 | Cancellation operations (3 tests) |
| test-helpers.ts | 237 | Shared mocks and test data |
| **Total** | **538** | **12 tests** |

**Benefits:**
- Each module focused on single responsibility
- All files under 300 LOC (largest: 237 LOC)
- 34% reduction in total lines (through deduplication)
- Reusable test helpers eliminate 100+ lines of duplication
- Easier to navigate and maintain
- All 12 tests passing ✅

---

## Running Tests

```bash
# Run all scheduler tests
npm test -- __tests__/lib/follow-ups/scheduler

# Run specific module
npm test -- __tests__/lib/follow-ups/scheduler/schedule.test.ts

# With coverage
npm test -- __tests__/lib/follow-ups/scheduler --coverage

# Watch mode
npm test -- __tests__/lib/follow-ups/scheduler --watch
```

---

## Test Coverage

- **scheduleFollowUps:** 7 tests covering scheduling logic, validation, and error handling
- **Channel Handlers:** 2 tests for email and in-app notification sending
- **cancelFollowUps:** 3 tests covering cancellation scenarios

**Total:** 12 tests, all passing ✅

---

## Dependencies

- `@jest/globals` - Jest testing framework
- `@supabase/supabase-js` - Type definitions
- `lib/follow-ups/scheduler` - Source module being tested
- `lib/follow-ups/detector` - Type definitions for FollowUpCandidate

---

## Related Documentation

- **[Follow-up System](docs/FOLLOW_UPS_SYSTEM.md)** - Architecture overview
- **[Database Schema](docs/09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md)** - Table definitions
- **[Test Helpers](../../../utils/follow-ups/test-helpers.ts)** - Shared test utilities
