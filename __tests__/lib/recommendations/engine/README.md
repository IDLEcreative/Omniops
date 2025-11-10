# Recommendation Engine Tests

**Status:** Active
**Last Updated:** 2025-11-10
**Type:** Unit Tests

## Purpose

Focused test suites for the recommendation engine, split by function to maintain <300 LOC per file.

## Files

- **setup-mocks.ts** - Central mock configuration (must be imported first)
- **get-recommendations.test.ts** - Tests for main recommendation routing (11 tests, 261 LOC)
- **track-recommendation-event.test.ts** - Tests for event tracking (4 tests, 63 LOC)
- **get-recommendation-metrics.test.ts** - Tests for metrics retrieval (3 tests, 61 LOC)

## Test Coverage

**Total Tests:** 18
**Total Test LOC:** 385 (refactored from 531 original)
**Modules:** 4

### Test Breakdown

| Function | Tests | LOC | Algorithms | Coverage |
|----------|-------|-----|-----------|----------|
| getRecommendations | 11 | 261 | vector, collaborative, content, hybrid | routing, filtering, limits, tracking |
| trackRecommendationEvent | 4 | 63 | N/A | click, purchase, errors |
| getRecommendationMetrics | 3 | 61 | N/A | fetch, defaults, errors |

## Mock Setup

All mocks are configured in `setup-mocks.ts` and must be imported first in each test file:

```typescript
// MUST be first import
import './setup-mocks';

import { describe, it, expect } from '@jest/globals';
import { getRecommendations } from '@/lib/recommendations/engine';
```

## Utilities

Shared test utilities are in `__tests__/utils/recommendations/`:

- **mock-setup.ts** - Mock creation and reset functions
- **test-fixtures.ts** - Test data factories

## Running Tests

```bash
# Run all recommendation engine tests
npm test -- __tests__/lib/recommendations/engine/

# Run specific test suite
npm test -- __tests__/lib/recommendations/engine/get-recommendations.test.ts

# Run with coverage
npm test -- __tests__/lib/recommendations/engine/ --coverage
```

## Key Design Decisions

1. **Separate Files by Function** - Each API function (getRecommendations, trackRecommendationEvent, getRecommendationMetrics) has its own test file
2. **Centralized Mocks** - setup-mocks.ts handles all Jest mock configuration
3. **Shared Fixtures** - Test data factories in test-fixtures.ts reduce duplication
4. **Helper Functions** - mock-setup.ts provides reusable mock creation and reset
5. **Clear Import Order** - setup-mocks.ts must be imported first to ensure mocks are configured before code under test

## Related Documentation

- [Recommendation Engine Architecture](../../../docs/01-ARCHITECTURE/ARCHITECTURE_RECOMMENDATIONS.md) (if exists)
- [Test Utilities](../../../__tests__/utils/recommendations/README.md)
