**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Test Helpers

# Recommendation Engine Test Utilities

**Status:** Active
**Last Updated:** 2025-11-10
**Type:** Test Helpers

## Purpose

Shared utilities and fixtures for recommendation engine tests to reduce duplication and improve maintainability.

## Modules

### mock-setup.ts
Provides mock creation and management utilities.

**Functions:**
- `createMockSupabaseClient()` - Creates a chainable mock Supabase client
- `getAlgorithmMocks()` - Returns all mocked algorithm functions
- `resetAlgorithmMocks()` - Resets all algorithm mocks to initial state

**Usage:**
```typescript
import { createMockSupabaseClient, getAlgorithmMocks } from '__tests__/utils/recommendations/mock-setup';

const mockSupabase = createMockSupabaseClient();
const mocks = getAlgorithmMocks();
mocks.vectorSimilarity.mockResolvedValue([]);
```

### test-fixtures.ts
Provides test data factories and common test parameters.

**Functions:**
- `createMockRecommendation(overrides)` - Single recommendation with defaults
- `createMockRecommendations(count, scoreOffset)` - Multiple recommendations
- `createMockContext(overrides)` - Context analysis result
- `createMockMetrics(overrides)` - Recommendation metrics
- `createMockRecommendationEvent(overrides)` - Database event record
- `createGetRecommendationsParams(overrides)` - Standard function parameters

**Usage:**
```typescript
import { createMockRecommendations, createGetRecommendationsParams } from '__tests__/utils/recommendations/test-fixtures';

const recs = createMockRecommendations(3);
const params = createGetRecommendationsParams({
  algorithm: 'vector_similarity'
});
```

## Test Data Patterns

All fixtures use sensible defaults that match real-world data:

```typescript
// Vector similarity recommendation
{
  productId: 'prod-1',
  score: 0.9,
  algorithm: 'vector_similarity',
  reason: 'Similar to viewed products'
}

// Standard getRecommendations parameters
{
  domainId: 'domain-123',
  algorithm: 'hybrid',
  limit: 5,
  supabaseClient: {}
}

// Metrics response
{
  totalShown: 100,
  totalClicked: 20,
  totalPurchased: 5,
  clickThroughRate: 0.2,
  conversionRate: 0.05
}
```

## Mock Configuration

The Supabase client mock follows this pattern:

```typescript
{
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  single: jest.fn(),
  rpc: jest.fn(),
}
```

This allows chainable method calls and isolated mock configuration per test.

## Best Practices

1. **Use Factories, Not Literals** - Always use fixture creators to maintain consistency
2. **Override Only What You Need** - Use the `overrides` parameter instead of recreating objects
3. **Keep Mocks Fresh** - Call reset functions in beforeEach hooks
4. **Clear Naming** - Use `create*` prefix for all fixture functions

## Related Files

- [Recommendation Engine Tests](../../lib/recommendations/engine/README.md)
- [get-recommendations.test.ts](../../lib/recommendations/engine/get-recommendations.test.ts)
- [track-recommendation-event.test.ts](../../lib/recommendations/engine/track-recommendation-event.test.ts)
- [get-recommendation-metrics.test.ts](../../lib/recommendations/engine/get-recommendation-metrics.test.ts)
