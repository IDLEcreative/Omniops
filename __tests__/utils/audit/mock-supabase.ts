/**
 * Mock Supabase client for audit logger tests
 * Provides chainable query methods for testing database operations
 */

import { jest } from '@jest/globals';

export const createMockQuery = () => ({
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  neq: jest.fn().mockReturnThis(),
  gt: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lt: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data: null, error: null })
});

export const createMockSupabaseClient = () => ({
  from: jest.fn(() => createMockQuery())
});

export type MockSupabaseClient = ReturnType<typeof createMockSupabaseClient>;
