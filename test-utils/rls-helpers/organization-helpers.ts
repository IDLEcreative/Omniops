/**
 * RLS Test Helpers - Organization Helpers
 * Organization creation, management, and test setup utilities
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import fetch from 'cross-fetch';
import { supabaseRestInsert, supabaseRestDelete, supabaseRestSelect } from './rest-api';
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
 * Get existing user ID by email
 */
async function getExistingUserId(email: string): Promise<string | null> {
  try {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

    const response = await fetch(
      `${supabaseUrl}/auth/v1/admin/users`,
      {
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey
        }
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    const user = data.users?.find((u: any) => u.email === email);
    return user?.id || null;
  } catch (error) {
    return null;
  }
}

/**
 * Get existing organization IDs for a user
 */
async function getExistingOrgIds(userId: string): Promise<string[]> {
  try {
    const members = await supabaseRestSelect(
      'organization_members',
      { user_id: userId },
      { serviceRole: true, select: 'organization_id' }
    );
    return members.map(m => m.organization_id);
  } catch (error) {
    return [];
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
      // Try to get existing users first
      let existingUser1 = await getExistingUserId(user1Email);
      let existingUser2 = await getExistingUserId(user2Email);

      if (existingUser1 && existingUser2) {
        console.log('Using existing test users');
        user1Id = existingUser1;
        user2Id = existingUser2;

        // Get their existing organizations
        const org1Ids = await getExistingOrgIds(user1Id);
        const org2Ids = await getExistingOrgIds(user2Id);

        if (org1Ids.length > 0 && org2Ids.length > 0) {
          org1Id = org1Ids[0];
          org2Id = org2Ids[0];
          console.log('Using existing test organizations');
        } else {
          // Create new organizations
          org1Id = await createTestOrganization('Test Org 1', user1Id);
          org2Id = await createTestOrganization('Test Org 2', user2Id);
        }
      } else {
        // Create fresh users and organizations
        user1Id = await createTestUser(user1Email, { name: 'Test User 1' });
        user2Id = await createTestUser(user2Email, { name: 'Test User 2' });
        org1Id = await createTestOrganization('Test Org 1', user1Id);
        org2Id = await createTestOrganization('Test Org 2', user2Id);
      }

      // Create user clients
      user1Client = await createUserClient(user1Id, user1Email);
      user2Client = await createUserClient(user2Id, user2Email);
    },

    async teardown() {
      if (org1Id) await deleteTestOrganization(org1Id);
      if (org2Id) await deleteTestOrganization(org2Id);
      if (user1Id) await deleteTestUser(user1Id);
      if (user2Id) await deleteTestUser(user2Id);
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
