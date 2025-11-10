/**
 * RLS Test Helpers - Organization Helpers
 * Organization creation, management, and test setup utilities
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { supabaseRestInsert, supabaseRestDelete } from './rest-api';
import { createTestUser, createUserClient, deleteTestUser } from './user-management';

/**
 * Verify that a query fails due to RLS policies
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

  if (data !== null) {
    throw new Error(
      `RLS FAILURE: User was able to access unauthorized ${table} record ${unauthorizedId}!`
    );
  }

  return true;
}

/**
 * Verify that a query succeeds (user has proper access)
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
      `RLS FAILURE: User should have access to ${table} record ${authorizedId} but got error: ${error.message}`
    );
  }

  if (data === null) {
    throw new Error(
      `RLS FAILURE: User should have access to ${table} record ${authorizedId} but no data was returned`
    );
  }

  return true;
}

/**
 * Create a mock organization with proper RLS setup
 */
export async function createTestOrganization(
  name: string,
  ownerId: string
): Promise<string> {
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
 */
export async function deleteTestOrganization(orgId: string): Promise<void> {
  try {
    await supabaseRestDelete('organizations', { id: orgId }, { serviceRole: true });
  } catch (error: any) {
    const errorStr = error.message || JSON.stringify(error);
    if (errorStr.includes('last owner') || errorStr.includes('Cannot remove')) {
      console.warn(`Skipping organization ${orgId} deletion due to last owner constraint`);
      return;
    }
    throw error;
  }
}

/**
 * Test suite helper for RLS testing
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
      user1Id = await createTestUser(user1Email, { name: 'Test User 1' });
      user2Id = await createTestUser(user2Email, { name: 'Test User 2' });
      user1Client = await createUserClient(user1Id, user1Email);
      user2Client = await createUserClient(user2Id, user2Email);
      org1Id = await createTestOrganization('Test Org 1', user1Id);
      org2Id = await createTestOrganization('Test Org 2', user2Id);
    },

    async teardown() {
      await deleteTestOrganization(org1Id);
      await deleteTestOrganization(org2Id);
      await deleteTestUser(user1Id);
      await deleteTestUser(user2Id);
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
