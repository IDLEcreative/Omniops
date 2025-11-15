/**
 * DomainAgnosticAgent - Edge Cases and Error Handling - Test Orchestrator
 *
 * Entry point for all edge case and error handling tests.
 * Individual test suites are organized in ./edge-cases-tests/
 *
 * Test Coverage:
 * - Data handling (null values, missing fields, malformed data, low confidence)
 * - Query intent detection (multiple intents, empty queries, special characters)
 * - Context building (large result sets, null contexts, empty queries)
 *
 * @see __tests__/lib/agents/business-types/edge-cases-tests/data-handling.test.ts
 * @see __tests__/lib/agents/business-types/edge-cases-tests/query-intent.test.ts
 * @see __tests__/lib/agents/business-types/edge-cases-tests/context-building.test.ts
 */

import '@/__tests__/lib/agents/business-types/edge-cases-tests/data-handling.test';
import '@/__tests__/lib/agents/business-types/edge-cases-tests/query-intent.test';
import '@/__tests__/lib/agents/business-types/edge-cases-tests/context-building.test';

describe('DomainAgnosticAgent - Edge Cases and Error Handling', () => {
  it('should have all test suites loaded', () => {
    // This orchestrator ensures all tests run together
    expect(true).toBe(true);
  });
});
