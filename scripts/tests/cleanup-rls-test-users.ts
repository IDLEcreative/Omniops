#!/usr/bin/env npx tsx
/**
 * Cleanup RLS Test Users
 *
 * Removes test users created by multi-tenant isolation tests.
 * Run this when tests fail to cleanup properly.
 */

import dotenv from 'dotenv';
import fetch from 'cross-fetch';

// Load environment
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const TEST_USER_EMAILS = [
  'rls-test-user1@example.com',
  'rls-test-user2@example.com'
];

async function getUserByEmail(email: string): Promise<string | null> {
  const response = await fetch(
    `${supabaseUrl}/auth/v1/admin/users`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey
      }
    }
  );

  if (!response.ok) {
    console.error(`Failed to list users: ${response.status}`);
    return null;
  }

  const data = await response.json();
  const user = data.users?.find((u: any) => u.email === email);
  return user?.id || null;
}

async function deleteOrganizationsByUserId(userId: string): Promise<void> {
  try {
    // Get all organizations where user is a member
    const memberResp = await fetch(
      `${supabaseUrl}/rest/v1/organization_members?user_id=eq.${userId}&select=organization_id`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey
        }
      }
    );

    if (!memberResp.ok) return;

    const members = await memberResp.json();
    const orgIds = members.map((m: any) => m.organization_id);

    // Delete each organization (cascade will handle memberships)
    for (const orgId of orgIds) {
      await fetch(
        `${supabaseUrl}/rest/v1/organizations?id=eq.${orgId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
          }
        }
      );
    }
  } catch (error) {
    console.warn(`Error deleting organizations for user ${userId}:`, error);
  }
}

async function deleteUserById(userId: string): Promise<boolean> {
  try {
    // First delete user's organizations (cascade will handle memberships)
    await deleteOrganizationsByUserId(userId);

    // Then delete any remaining organization memberships
    await fetch(
      `${supabaseUrl}/rest/v1/organization_members?user_id=eq.${userId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey
        }
      }
    );

    // Finally delete the user
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

    return response.ok;
  } catch (error) {
    console.error(`Error deleting user ${userId}:`, error);
    return false;
  }
}

async function deleteOrganizationsBySlugPattern(pattern: string): Promise<void> {
  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/organizations?slug=like.*${pattern}*`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey
        }
      }
    );

    if (!response.ok) {
      console.warn(`Failed to list organizations: ${response.status}`);
      return;
    }

    const orgs = await response.json();
    console.log(`Found ${orgs.length} test organizations to clean up`);

    for (const org of orgs) {
      const deleteResp = await fetch(
        `${supabaseUrl}/rest/v1/organizations?id=eq.${org.id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
          }
        }
      );

      if (deleteResp.ok) {
        console.log(`✅ Deleted organization: ${org.slug}`);
      } else {
        console.warn(`⚠️  Failed to delete organization: ${org.slug}`);
      }
    }
  } catch (error) {
    console.error('Error cleaning up organizations:', error);
  }
}

async function main() {
  console.log('🧹 Cleaning up RLS test users...\n');

  // Clean up test organizations first
  await deleteOrganizationsBySlugPattern('test-org');

  // Clean up test users
  for (const email of TEST_USER_EMAILS) {
    console.log(`Checking ${email}...`);

    const userId = await getUserByEmail(email);

    if (!userId) {
      console.log(`  ✅ User not found (already clean)`);
      continue;
    }

    console.log(`  Found user ID: ${userId}`);
    const deleted = await deleteUserById(userId);

    if (deleted) {
      console.log(`  ✅ Deleted successfully`);
    } else {
      console.log(`  ⚠️  Failed to delete`);
    }
  }

  console.log('\n✅ Cleanup complete!');
}

main().catch(console.error);
