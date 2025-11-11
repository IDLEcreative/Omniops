import { MockQueryBuilder } from './types';

/**
 * Creates a chainable query builder mock
 * All methods return `this` to enable chaining
 */
export function createMockQueryBuilder(overrides?: Partial<MockQueryBuilder>): MockQueryBuilder {
  const builder: Partial<MockQueryBuilder> = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    like: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    contains: jest.fn().mockReturnThis(),
    containedBy: jest.fn().mockReturnThis(),
    rangeGt: jest.fn().mockReturnThis(),
    rangeGte: jest.fn().mockReturnThis(),
    rangeLt: jest.fn().mockReturnThis(),
    rangeLte: jest.fn().mockReturnThis(),
    rangeAdjacent: jest.fn().mockReturnThis(),
    overlaps: jest.fn().mockReturnThis(),
    textSearch: jest.fn().mockReturnThis(),
    match: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    filter: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    abortSignal: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    then: jest.fn().mockResolvedValue({ data: [], error: null }),
  };

  if (overrides) {
    Object.assign(builder, overrides);
  }

  return builder as MockQueryBuilder;
}

/**
 * Helper to mock a successful query response
 * Use this for quick inline query mocking
 *
 * @example
 * mockClient.from = jest.fn(() => mockSuccessQuery([{ id: 1, name: 'Test' }]))
 */
export function mockSuccessQuery(data: any): MockQueryBuilder {
  return createMockQueryBuilder({
    single: jest.fn().mockResolvedValue({
      data: Array.isArray(data) ? data[0] : data,
      error: null,
    }),
    maybeSingle: jest.fn().mockResolvedValue({
      data: Array.isArray(data) ? data[0] : data,
      error: null,
    }),
    then: jest.fn().mockResolvedValue({
      data: Array.isArray(data) ? data : [data],
      error: null,
    }),
  });
}

/**
 * Helper to mock a failed query response
 * Use this for quick inline error mocking
 *
 * @example
 * mockClient.from = jest.fn(() => mockErrorQuery('Record not found'))
 */
export function mockErrorQuery(errorMessage: string, code: string = 'PGRST116'): MockQueryBuilder {
  const error = { message: errorMessage, code };

  return createMockQueryBuilder({
    single: jest.fn().mockResolvedValue({ data: null, error }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error }),
    then: jest.fn().mockResolvedValue({ data: null, error }),
  });
}
