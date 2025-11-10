/**
 * Mock Supabase Client for Metadata Tests
 * Provides consistent mock setup for all metadata test suites
 */

export function createMockSupabaseClient() {
  return {
    from: jest.fn(() => mockChain),
    select: jest.fn(() => mockChain),
    insert: jest.fn(() => mockChain),
    eq: jest.fn(() => mockChain),
    in: jest.fn(() => mockChain),
    gte: jest.fn(() => mockChain),
    order: jest.fn(() => mockChain),
    single: jest.fn(() => ({ data: null, error: null })),
    then: jest.fn((callback) => callback({ data: [], error: null })),
  };
}

export function createChainableMockSupabaseClient() {
  const mock = {
    from: jest.fn(),
    select: jest.fn(),
    eq: jest.fn(),
    single: jest.fn(),
    update: jest.fn(),
    insert: jest.fn()
  };

  mock.from.mockReturnValue(mock);
  mock.select.mockReturnValue(mock);
  mock.eq.mockReturnValue(mock);
  mock.update.mockReturnValue(mock);
  mock.insert.mockReturnValue(mock);

  return mock;
}

const mockChain = {
  from: jest.fn(() => mockChain),
  select: jest.fn(() => mockChain),
  insert: jest.fn(() => mockChain),
  eq: jest.fn(() => mockChain),
  in: jest.fn(() => mockChain),
  gte: jest.fn(() => mockChain),
  order: jest.fn(() => mockChain),
  single: jest.fn(() => ({ data: null, error: null })),
  then: jest.fn((callback) => callback({ data: [], error: null })),
};
