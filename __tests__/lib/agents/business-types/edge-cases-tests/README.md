# DomainAgnosticAgent Edge Cases Test Suite

**Type:** Test Documentation
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Estimated Read Time:** 2 minutes

**LOC:** 3 files, ~100 LOC each

## Purpose
Tests edge cases and error handling for `DomainAgnosticAgent` covering null values, malformed data, and unusual queries.

## Structure

```
edge-cases-tests/
├── data-handling.test.ts       # Null values, missing fields (149 LOC)
├── query-intent.test.ts        # Query parsing edge cases (63 LOC)
└── context-building.test.ts    # Context generation edge cases (67 LOC)
```

## Test Coverage

### Data Handling (data-handling.test.ts)
- Null entity attributes
- Missing price field
- Very low confidence scores
- Database query errors
- Undefined business_type
- Empty search results
- Malformed entity data

### Query Intent Detection (query-intent.test.ts)
- Queries with multiple intents
- Empty query string
- Very long query strings
- Special characters in queries
- Non-English characters

### Context Building (context-building.test.ts)
- Very large search result sets (100 items)
- Null customer context
- Empty string query

## Running Tests

```bash
# All edge-cases tests
npm test -- --testPathPattern="edge-cases"

# Specific suite
npm test -- __tests__/lib/agents/business-types/edge-cases-tests/data-handling.test.ts
```

## Dependencies

- **Agent:** `lib/agents/domain-agnostic-agent`
- **Mocks:** Supabase client

## Notes

- Tests verify robust error handling
- All tests use mock Supabase client
- Tests ensure graceful degradation
- Validates multi-language support
- Tests large-scale data handling
