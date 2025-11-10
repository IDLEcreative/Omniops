/**
 * Customer Config Security Test Setup Utilities
 *
 * Shared setup and teardown helpers for customer config security tests
 * Handles organization, user, and config creation/cleanup
 */

import { insertAsAdmin, deleteAsAdmin, createAdminClient } from '@/test-utils/rls-test-helpers';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface TestDataContext {
  serviceClient: ReturnType<typeof createAdminClient>;
  org1Id: string;
  org2Id: string;
  user1Id: string;
  user2Id: string;
  config1Id: string;
  config2Id: string;
  user1Email: string;
  user2Email: string;
  timestamp: number;
}

/**
 * Initialize test data context with organizations, users, and configs
 */
export async function initializeTestData(): Promise<TestDataContext> {
  const serviceClient = createAdminClient();
  const timestamp = Date.now();

  // Create test organizations
  const org1 = await insertAsAdmin('organizations', {
    name: `Test Org 1 - ${timestamp}`,
    slug: `test-org-1-${timestamp}`
  });

  const org2 = await insertAsAdmin('organizations', {
    name: `Test Org 2 - ${timestamp}`,
    slug: `test-org-2-${timestamp}`
  });

  if (!org1 || !org2) {
    throw new Error('Failed to create test organizations');
  }

  const org1Id = org1.id;
  const org2Id = org2.id;

  // Create test users
  const user1Email = `test-user-1-${timestamp}@example.com`;
  const user2Email = `test-user-2-${timestamp}@example.com`;

  const { data: { user: user1 } } = await serviceClient.auth.admin.createUser({
    email: user1Email,
    password: 'testpassword123',
    email_confirm: true
  });

  const { data: { user: user2 } } = await serviceClient.auth.admin.createUser({
    email: user2Email,
    password: 'testpassword123',
    email_confirm: true
  });

  const user1Id = user1!.id;
  const user2Id = user2!.id;

  // Add user1 as owner of org1
  await insertAsAdmin('organization_members', {
    organization_id: org1Id,
    user_id: user1Id,
    role: 'owner'
  });

  // Add user2 as member (not admin) of org2
  await insertAsAdmin('organization_members', {
    organization_id: org2Id,
    user_id: user2Id,
    role: 'member'
  });

  // Create customer configs for each org
  const config1 = await insertAsAdmin('customer_configs', {
    organization_id: org1Id,
    domain: `test1-${timestamp}.example.com`,
    business_name: 'Test Business 1'
  });

  const config2 = await insertAsAdmin('customer_configs', {
    organization_id: org2Id,
    domain: `test2-${timestamp}.example.com`,
    business_name: 'Test Business 2'
  });

  if (!config1 || !config2) {
    throw new Error('Failed to create test customer configs');
  }

  return {
    serviceClient,
    org1Id,
    org2Id,
    user1Id,
    user2Id,
    config1Id: config1.id,
    config2Id: config2.id,
    user1Email,
    user2Email,
    timestamp
  };
}

/**
 * Clean up all test data in reverse order of dependencies
 */
export async function cleanupTestData(context: TestDataContext): Promise<void> {
  const { serviceClient, config1Id, config2Id, user1Id, user2Id, org1Id, org2Id } = context;

  // Cleanup in reverse order of dependencies
  if (config1Id) {
    await deleteAsAdmin('customer_configs', { id: config1Id });
  }
  if (config2Id) {
    await deleteAsAdmin('customer_configs', { id: config2Id });
  }
  if (user1Id) {
    await deleteAsAdmin('organization_members', { user_id: user1Id });
    await serviceClient.auth.admin.deleteUser(user1Id);
  }
  if (user2Id) {
    await deleteAsAdmin('organization_members', { user_id: user2Id });
    await serviceClient.auth.admin.deleteUser(user2Id);
  }
  if (org1Id) {
    await deleteAsAdmin('organizations', { id: org1Id });
  }
  if (org2Id) {
    await deleteAsAdmin('organizations', { id: org2Id });
  }
}
