# Follow-up Detector Tests

**Type:** Test Suite
**Status:** Active
**Last Updated:** 2025-11-10
**Verified For:** v0.1.0

## Purpose

Comprehensive test suite for the follow-up detection system, validating candidate identification and prioritization logic.

## Directory Structure

- `detection.test.ts` (168 LOC) - Tests for candidate detection
- `prioritization.test.ts` (79 LOC) - Tests for prioritization logic

## What's Tested

### Detection Tests (`detection.test.ts`)

- **Abandoned Conversations**: Detecting conversations needing follow-up
- **Low Satisfaction**: Sentiment-based detection via keyword analysis
- **Cart Abandonment**: E-commerce-specific abandonment detection
- **Max Attempts**: Enforcing follow-up attempt limits
- **Email Extraction**: Handling nested and direct metadata locations
- **Edge Cases**: Empty results, few messages filtering

### Prioritization Tests (`prioritization.test.ts`)

- **Priority Sorting**: High → Medium → Low ordering
- **Stable Sort**: Maintaining order for same priority
- **Empty Handling**: Graceful handling of empty arrays

## Test Data

Mock conversations are defined in `__tests__/utils/follow-ups/mock-helpers.ts`:

- `createAbandonedConversation()` - 30+ minutes without response
- `createLowSatisfactionConversation()` - Negative sentiment keywords
- `createCartAbandonmentConversation()` - Cart activity without checkout
- `createCompletedCheckoutConversation()` - Checkout completed
- `createHighSatisfactionConversation()` - Positive sentiment
- Plus helpers for email extraction and attempt tracking

## Running Tests

```bash
# Run all detector tests
npm test -- __tests__/lib/follow-ups/detector

# Run specific module
npm test -- __tests__/lib/follow-ups/detector/detection.test.ts
npm test -- __tests__/lib/follow-ups/detector/prioritization.test.ts

# Watch mode
npm test -- __tests__/lib/follow-ups/detector --watch
```

## Related Documentation

- **Implementation**: `lib/follow-ups/detector.ts`
- **Test Helpers**: `__tests__/utils/follow-ups/mock-helpers.ts`
- **Scheduler Tests**: `__tests__/lib/follow-ups/scheduler.test.ts`
- **Analytics Tests**: `__tests__/lib/follow-ups/analytics.test.ts`
