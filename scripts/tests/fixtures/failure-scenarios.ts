/**
 * Production Failure Test Scenarios
 *
 * Test scenarios for validating error handling and resilience.
 */

/**
 * Test Scenario 1: TypeError Crashes (Null Array Access)
 */
export const typeErrorScenarios = [
  {
    name: 'Null products array',
    test: () => {
      const products = null;
      const result = (products || []).map((p: any) => p.name);
      return result.length === 0;
    }
  },
  {
    name: 'Undefined search results',
    test: () => {
      const searchResults = undefined;
      const result = (searchResults || []).slice(0, 10);
      return result.length === 0;
    }
  },
  {
    name: 'Null metadata search log',
    test: () => {
      const searchLog = null;
      const count = (searchLog || []).length;
      return count === 0;
    }
  },
  {
    name: 'Nested null access',
    test: () => {
      const data: any = { results: null };
      const filtered = (data.results || []).filter((x: any) => x);
      return filtered.length === 0;
    }
  }
];

/**
 * Test Scenario 2: Unhandled Promise Rejections
 */
export const promiseRejectionScenarios = [
  {
    name: 'Database operation fails',
    operation: async () => {
      const results = await Promise.allSettled([
        Promise.resolve({ data: 'success' }),
        Promise.reject(new Error('Database connection failed')),
        Promise.resolve({ data: 'success2' })
      ]);
      return results[1].status === 'rejected' && results[0].status === 'fulfilled';
    }
  },
  {
    name: 'API timeout',
    operation: async () => {
      const results = await Promise.allSettled([
        Promise.resolve('data'),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10))
      ]);
      return results[1].status === 'rejected';
    }
  },
  {
    name: 'Multiple concurrent failures',
    operation: async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        i % 3 === 0
          ? Promise.reject(new Error(`Failure ${i}`))
          : Promise.resolve(`Success ${i}`)
      );
      const results = await Promise.allSettled(promises);
      const failures = results.filter(r => r.status === 'rejected').length;
      return failures === 4;
    }
  }
];

/**
 * Test Scenario 3: JSON.parse Crashes
 */
export const jsonParseScenarios = [
  { name: 'Incomplete JSON', data: '{incomplete' },
  { name: 'Invalid syntax', data: '{key: "value"}' },
  { name: 'Trailing comma', data: '{"key": "value",}' },
  { name: 'Single quotes', data: "{'key': 'value'}" },
  { name: 'Undefined value', data: '{"key": undefined}' },
  { name: 'NaN value', data: '{"key": NaN}' },
];
