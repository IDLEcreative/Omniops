/**
 * Supabase Mock Factory for Recommendation Tests
 *
 * Provides consistent, chainable mocks for Supabase client
 * that work correctly with the async createClient() pattern.
 */

import { jest } from '@jest/globals';

export interface MockSupabaseClient {
  from: jest.MockedFunction<any>;
  select: jest.MockedFunction<any>;
  insert: jest.MockedFunction<any>;
  update: jest.MockedFunction<any>;
  delete: jest.MockedFunction<any>;
  eq: jest.MockedFunction<any>;
  in: jest.MockedFunction<any>;
  not: jest.MockedFunction<any>;
  or: jest.MockedFunction<any>;
  order: jest.MockedFunction<any>;
  limit: jest.MockedFunction<any>;
  rpc: jest.MockedFunction<any>;
}

/**
 * Creates a fresh chainable Supabase mock
 */
export function createMockSupabaseClient(): MockSupabaseClient {
  const mock: any = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    rpc: jest.fn(),
  };

  // Make all methods return the mock for chaining
  Object.keys(mock).forEach((key) => {
    if (key !== 'rpc' && typeof mock[key] === 'function') {
      mock[key].mockReturnThis = () => {
        mock[key].mockReturnValue(mock);
        return mock[key];
      };
    }
  });

  return mock;
}

/**
 * Setup mock with sequential responses
 *
 * Example:
 * ```ts
 * setupSequentialMocks(mockSupabase, [
 *   { data: [...], error: null },  // First call
 *   { data: [...], error: null },  // Second call
 * ]);
 * ```
 */
export function setupSequentialMocks(
  mockClient: MockSupabaseClient,
  responses: Array<{ data: any; error: any }>
) {
  responses.forEach((response) => {
    mockClient.select.mockResolvedValueOnce(response);
  });
}

/**
 * Setup RPC mock response
 */
export function setupRpcMock(
  mockClient: MockSupabaseClient,
  response: { data: any; error: any }
) {
  mockClient.rpc.mockResolvedValue(response);
}

/**
 * Reset all mock call counts and implementations
 */
export function resetMockSupabaseClient(mockClient: MockSupabaseClient) {
  Object.values(mockClient).forEach((fn) => {
    if (typeof fn === 'function' && 'mockClear' in fn) {
      (fn as jest.MockedFunction<any>).mockClear();
    }
  });
}
