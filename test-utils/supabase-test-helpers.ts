/**
 * Barrel file exposing Supabase test helper utilities.
 * Implementation details live in modular files under ./supabase-test-helpers.
 */
export type { MockQueryBuilder, MockSupabaseAuth, MockSupabaseStorage, MockSupabaseClient } from './supabase-test-helpers/types';

export { createMockSupabaseClient } from './supabase-test-helpers/client';
export {
  createAuthenticatedMockClient,
  createUnauthenticatedMockClient,
  createMockClientWithTableData,
  createErrorMockClient,
  createServiceRoleMockClient,
} from './supabase-test-helpers/scenarios';

export { mockSuccessQuery, mockErrorQuery } from './supabase-test-helpers/query-builder';

export { isMockSupabaseClient, resetSupabaseMocks } from './supabase-test-helpers/utils';
