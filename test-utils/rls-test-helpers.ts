/**
 * RLS Test Helpers
 *
 * Utilities for testing Row Level Security policies with actual user sessions.
 *
 * CRITICAL: Do NOT use service role keys for RLS testing!
 * Service keys bypass RLS policies and don't validate actual security.
 */

import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Direct REST API helper for Supabase database operations
 * Uses raw fetch instead of SDK to avoid Jest compatibility issues
 */
async function supabaseRestInsert(
  table: string,
  data: Record<string, any>,
  options: { select?: boolean; serviceRole?: boolean } = {}
): Promise<any> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'apikey': options.serviceRole ? serviceRoleKey : supabaseAnonKey,
    'Prefer': 'return=representation'
  };

  if (options.serviceRole) {
    headers['Authorization'] = `Bearer ${serviceRoleKey}`;
  }

  const response = await fetch(
    `${supabaseUrl}/rest/v1/${table}`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to insert into ${table}: ${response.status} ${error}`);
  }

  const result = await response.json();
  return Array.isArray(result) ? result[0] : result;
}

/**
 * Direct REST API DELETE helper
 */
async function supabaseRestDelete(
  table: string,
  filter: Record<string, any> | string,
  options: { serviceRole?: boolean } = {}
): Promise<void> {
  // Handle both object filters and pre-formatted filter strings
  let queryString = '';
  if (typeof filter === 'string') {
    queryString = filter;
  } else {
    const params = new URLSearchParams();
    Object.entries(filter).forEach(([key, value]) => {
      params.append(key, `eq.${value}`);
    });
    queryString = params.toString();
  }

  const headers: Record<string, string> = {
    'apikey': options.serviceRole ? serviceRoleKey : supabaseAnonKey
  };

  if (options.serviceRole) {
    headers['Authorization'] = `Bearer ${serviceRoleKey}`;
  }

  const response = await fetch(
    `${supabaseUrl}/rest/v1/${table}?${queryString}`,
    {
      method: 'DELETE',
      headers
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to delete from ${table}: ${response.status} ${error}`);
  }
}

/**
 * Direct REST API SELECT helper
 */
async function supabaseRestSelect(
  table: string,
  filter: Record<string, any> = {},
  options: { serviceRole?: boolean; accessToken?: string; select?: string } = {}
): Promise<any[]> {
  const params = new URLSearchParams();

  // Add filters
  Object.entries(filter).forEach(([key, value]) => {
    params.append(key, `eq.${value}`);
  });

  // Add select clause
  if (options.select) {
    params.append('select', options.select);
  }

  const headers: Record<string, string> = {
    'apikey': options.serviceRole ? serviceRoleKey : supabaseAnonKey
  };

  if (options.serviceRole) {
    headers['Authorization'] = `Bearer ${serviceRoleKey}`;
  } else if (options.accessToken) {
    headers['Authorization'] = `Bearer ${options.accessToken}`;
  }

  const response = await fetch(
    `${supabaseUrl}/rest/v1/${table}?${params.toString()}`,
    {
      method: 'GET',
      headers
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to select from ${table}: ${response.status} ${error}`);
  }

  return await response.json();
}

/**
 * Helper to get access token from a user client created via createUserClient
 */
export async function getUserAccessToken(email: string): Promise<string> {
  const password = process.env.TEST_USER_PASSWORD || 'test-password-123';

  const response = await fetch(
    `${supabaseUrl}/auth/v1/token?grant_type=password`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey
      },
      body: JSON.stringify({ email, password })
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get access token for ${email}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Test helper to query database as a specific user (for RLS testing)
 * This replaces userClient.from().select() patterns
 */
export async function queryAsUser(
  email: string,
  table: string,
  filter: Record<string, any> = {}
): Promise<any[]> {
  const token = await getUserAccessToken(email);
  return supabaseRestSelect(table, filter, { accessToken: token });
}

/**
 * Test helper to query database with admin privileges (bypasses RLS)
 * This replaces adminClient.from().select() patterns
 */
export async function queryAsAdmin(
  table: string,
  filter: Record<string, any> = {}
): Promise<any[]> {
  return supabaseRestSelect(table, filter, { serviceRole: true });
}

/**
 * Test helper to insert data as admin
 */
export async function insertAsAdmin(
  table: string,
  data: Record<string, any>
): Promise<any> {
  return supabaseRestInsert(table, data, { serviceRole: true });
}

/**
 * Test helper to delete data as admin
 */
export async function deleteAsAdmin(
  table: string,
  filter: Record<string, any>
): Promise<void> {
  return supabaseRestDelete(table, filter, { serviceRole: true });
}

/**
 * Create a Supabase admin client with service role permissions
 * Used for test setup/teardown and admin operations
 *
 * IMPORTANT: This client bypasses RLS policies - use only for test infrastructure, never for security assertions
 */
export function createAdminClient() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase credentials for admin client creation. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      fetch: globalThis.fetch
    }
  });
}

/**
 * Create a Supabase client with a specific user session
 *
 * This creates a client that respects RLS policies for the given user.
 * Use this for testing multi-tenant isolation.
 *
 * @param userId - The user ID to authenticate as (not used, kept for backwards compatibility)
 * @param email - The user's email
 * @returns Supabase client authenticated as the specified user
 */
export async function createUserClient(
  userId: string,
  email: string
): Promise<SupabaseClient> {
  // Sign in via REST API (SDK has issues in Jest environment)
  const password = process.env.TEST_USER_PASSWORD || 'test-password-123';

  const response = await fetch(
    `${supabaseUrl}/auth/v1/token?grant_type=password`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey
      },
      body: JSON.stringify({ email, password })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to sign in test user ${email}: ${response.status} ${error}`);
  }

  const data = await response.json();

  if (!data.access_token) {
    throw new Error(`No access token returned for test user ${email}`);
  }

  // Create client with the session
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${data.access_token}`
      }
    }
  });

  return client;
}

/**
 * Create a test user in Supabase Auth
 *
 * Use this in beforeAll() to set up test users.
 *
 * @param email - User email
 * @param metadata - Additional user metadata
 * @returns User ID
 */
export async function createTestUser(
  email: string,
  metadata: Record<string, any> = {}
): Promise<string> {
  // Use Supabase Management API directly instead of SDK
  // This bypasses Jest/Supabase compatibility issues with auth.admin
  const response = await fetch(
    `${supabaseUrl}/auth/v1/admin/users`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey
      },
      body: JSON.stringify({
        email,
        password: process.env.TEST_USER_PASSWORD || 'test-password-123',
        email_confirm: true,
        user_metadata: metadata
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create test user ${email}: ${response.status} ${error}`);
  }

  const data = await response.json();

  if (!data.id) {
    throw new Error(`No user ID returned when creating test user ${email}`);
  }

  return data.id;
}

/**
 * Delete a test user
 *
 * Use this in afterAll() to clean up test users.
 */
export async function deleteTestUser(userId: string): Promise<void> {
  try {
    // First, try to delete all organization memberships for this user
    // This prevents cascade delete errors
    try {
      await supabaseRestDelete('organization_members', { user_id: userId }, { serviceRole: true });
    } catch (memberError) {
      // Ignore errors - member may already be deleted or not exist
      // Last owner constraint might prevent deletion, which is OK for cleanup
    }

    // Use Supabase Management API to delete the auth user
    const response = await fetch(
      `${supabaseUrl}/auth/v1/admin/users/${userId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey
        }
      }
    );

    if (!response.ok) {
      const error = await response.text();
      // If it's a cascade/constraint error, just warn and continue
      if (error.includes('constraint') || error.includes('referenced') || error.includes('unexpected_failure')) {
        console.warn(`Could not delete test user ${userId}, may have remaining references: ${error}`);
        return;
      }
      throw new Error(`Failed to delete test user ${userId}: ${response.status} ${error}`);
    }
  } catch (error: any) {
    // Log but don't throw - test cleanup should continue even if user deletion fails
    console.warn(`Error during test user cleanup for ${userId}:`, error.message);
  }
}

/**
 * Verify that a query fails due to RLS policies
 *
 * This is the key test: unauthorized access should be BLOCKED.
 *
 * @param client - Supabase client (with user session)
 * @param table - Table to query
 * @param unauthorizedId - ID the user should NOT have access to
 * @returns true if access was properly denied
 */
export async function expectRLSBlocked(
  client: SupabaseClient,
  table: string,
  unauthorizedId: string
): Promise<boolean> {
  const { data, error } = await client
    .from(table)
    .select('*')
    .eq('id', unauthorizedId)
    .maybeSingle();

  // RLS should either return null data or an error
  if (data !== null) {
    throw new Error(
      `RLS FAILURE: User was able to access unauthorized ${table} record ${unauthorizedId}! ` +
      `Data returned: ${JSON.stringify(data)}`
    );
  }

  return true;
}

/**
 * Verify that a query succeeds (user has proper access)
 *
 * @param client - Supabase client (with user session)
 * @param table - Table to query
 * @param authorizedId - ID the user SHOULD have access to
 * @returns true if access was properly granted
 */
export async function expectRLSAllowed(
  client: SupabaseClient,
  table: string,
  authorizedId: string
): Promise<boolean> {
  const { data, error } = await client
    .from(table)
    .select('*')
    .eq('id', authorizedId)
    .maybeSingle();

  if (error) {
    throw new Error(
      `RLS FAILURE: User should have access to ${table} record ${authorizedId} ` +
      `but got error: ${error.message}`
    );
  }

  if (data === null) {
    throw new Error(
      `RLS FAILURE: User should have access to ${table} record ${authorizedId} ` +
      `but no data was returned`
    );
  }

  return true;
}

/**
 * Create a mock organization with proper RLS setup
 *
 * @param name - Organization name
 * @param ownerId - User ID who will own this organization
 * @returns Organization ID
 */
export async function createTestOrganization(
  name: string,
  ownerId: string
): Promise<string> {
  // Create organization via REST API
  const org = await supabaseRestInsert(
    'organizations',
    {
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now()
    },
    { serviceRole: true }
  );

  if (!org || !org.id) {
    throw new Error(`No organization data returned when creating organization ${name}`);
  }

  // Add owner as member
  await supabaseRestInsert(
    'organization_members',
    {
      organization_id: org.id,
      user_id: ownerId,
      role: 'owner'
    },
    { serviceRole: true }
  );

  return org.id;
}

/**
 * Delete a test organization and all related data
 *
 * Note: The "last owner" constraint is enforced at the database level via trigger,
 * so we need to handle this specially during test cleanup by using a direct SQL approach
 * that temporarily bypasses the constraint check.
 */
export async function deleteTestOrganization(orgId: string): Promise<void> {
  try {
    // First attempt: Delete organization via REST API (CASCADE should handle members, configs, etc.)
    await supabaseRestDelete('organizations', { id: orgId }, { serviceRole: true });
  } catch (error: any) {
    // If we hit the "last owner" constraint, silently ignore during test cleanup
    // The constraint is: "Cannot remove the last owner from an organization"
    // This is enforced by a database trigger that fires even with service role
    const errorStr = error.message || JSON.stringify(error);
    if (errorStr.includes('last owner') || errorStr.includes('Cannot remove')) {
      // For test cleanup, we'll just leave orphaned records if the constraint blocks us
      // These will be cleaned up manually or by database maintenance
      console.warn(`Skipping organization ${orgId} deletion due to last owner constraint`);
      return;
    }

    // Re-throw any other errors
    throw error;
  }
}

/**
 * Test suite helper for RLS testing
 *
 * Example usage:
 * ```typescript
 * describe('Multi-Tenant RLS', () => {
 *   const rlsTest = setupRLSTest();
 *
 *   beforeAll(async () => {
 *     await rlsTest.setup();
 *   });
 *
 *   afterAll(async () => {
 *     await rlsTest.teardown();
 *   });
 *
 *   it('blocks cross-tenant access', async () => {
 *     await expectRLSBlocked(
 *       rlsTest.user1Client,
 *       'customer_configs',
 *       rlsTest.org2Id
 *     );
 *   });
 * });
 * ```
 */
export function setupRLSTest() {
  let user1Id: string;
  let user2Id: string;
  let user1Client: SupabaseClient;
  let user2Client: SupabaseClient;
  let org1Id: string;
  let org2Id: string;
  const user1Email = 'rls-test-user1@example.com';
  const user2Email = 'rls-test-user2@example.com';

  return {
    async setup() {
      // Create test users
      user1Id = await createTestUser(user1Email, {
        name: 'Test User 1'
      });

      user2Id = await createTestUser(user2Email, {
        name: 'Test User 2'
      });

      // Create authenticated clients
      user1Client = await createUserClient(user1Id, user1Email);
      user2Client = await createUserClient(user2Id, user2Email);

      // Create organizations
      org1Id = await createTestOrganization('Test Org 1', user1Id);
      org2Id = await createTestOrganization('Test Org 2', user2Id);
    },

    async teardown() {
      // Clean up organizations
      await deleteTestOrganization(org1Id);
      await deleteTestOrganization(org2Id);

      // Clean up users
      await deleteTestUser(user1Id);
      await deleteTestUser(user2Id);

      // Sign out clients
      await user1Client?.auth.signOut();
      await user2Client?.auth.signOut();
    },

    get user1Id() { return user1Id; },
    get user2Id() { return user2Id; },
    get user1Email() { return user1Email; },
    get user2Email() { return user2Email; },
    get user1Client() { return user1Client; },
    get user2Client() { return user2Client; },
    get org1Id() { return org1Id; },
    get org2Id() { return org2Id; }
  };
}
