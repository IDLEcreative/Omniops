/**
 * RLS Test Helpers
 *
 * Utilities for testing Row Level Security policies with actual user sessions.
 *
 * CRITICAL: Do NOT use service role keys for RLS testing!
 * Service keys bypass RLS policies and don't validate actual security.
 */

// Re-export all helpers from modules
export {
  supabaseRestInsert,
  supabaseRestDelete,
  supabaseRestSelect,
  queryAsUser,
  queryAsAdmin,
  insertAsAdmin,
  deleteAsAdmin
} from './rls-helpers/rest-api';

export {
  getUserAccessToken,
  createAdminClient,
  createUserClient,
  createTestUser,
  deleteTestUser
} from './rls-helpers/user-management';

export {
  expectRLSBlocked,
  expectRLSAllowed,
  createTestOrganization,
  deleteTestOrganization,
  setupRLSTest
} from './rls-helpers/organization-helpers';
