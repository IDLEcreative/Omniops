/**
 * Customer Config Security Test Setup Utilities
 *
 * Shared setup and teardown helpers for customer config security tests
 * Handles organization, user, and config creation/cleanup
 */

import dotenv from 'dotenv';

// Mark as E2E test to use real credentials (not mocks)
process.env.E2E_TEST = 'true';

// Load real environment variables for RLS testing
// The Jest setup file overrides these with mocks, but RLS tests need real credentials
if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('birugqyuqhiahxvxeyqg')) {
  // Force-load from .env.local (override=true)
  dotenv.config({ path: '.env.local', override: true });
}

// Load test-specific variables (e.g., TEST_USER_PASSWORD)
dotenv.config({ path: '.env.test', override: false }); // Don't override existing values

import { insertAsAdmin, deleteAsAdmin, createAdminClient, createTestUser, deleteTestUser } from '@/test-utils/rls-test-helpers';
import type { SupabaseClient } from '@supabase/supabase-js';

// Standard test password used by createTestUser helper
export const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'test-password-123';

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

  const user1Id = await createTestUser(user1Email);
  const user2Id = await createTestUser(user2Email);

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
    business_name: 'Test Business 1',
    app_id: `app_test1_${timestamp.toString().slice(-8)}`
  });

  const config2 = await insertAsAdmin('customer_configs', {
    organization_id: org2Id,
    domain: `test2-${timestamp}.example.com`,
    business_name: 'Test Business 2',
    app_id: `app_test2_${timestamp.toString().slice(-8)}`
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
export async function cleanupTestData(context?: TestDataContext): Promise<void> {
  if (!context) {
    return; // Nothing to clean up
  }
  const { serviceClient, config1Id, config2Id, user1Id, user2Id, org1Id, org2Id } = context;

  // Cleanup in reverse order of dependencies
  // 1. Delete configs (depend on organizations)
  if (config1Id) {
    await deleteAsAdmin('customer_configs', { id: config1Id });
  }
  if (config2Id) {
    await deleteAsAdmin('customer_configs', { id: config2Id });
  }

  // 2. Delete users (which also removes organization_members via deleteTestUser)
  if (user1Id) {
    await deleteTestUser(user1Id);
  }
  if (user2Id) {
    await deleteTestUser(user2Id);
  }

  // 3. Delete organizations (only after all members are removed)
  if (org1Id) {
    try {
      await deleteAsAdmin('organizations', { id: org1Id });
    } catch (error: any) {
      // Ignore "last owner" errors - this is expected if database has constraints
      const errorStr = error.message || JSON.stringify(error);
      if (!errorStr.includes('last owner') && !errorStr.includes('Cannot remove')) {
        console.warn(`Failed to delete org ${org1Id}:`, error.message);
      }
    }
  }
  if (org2Id) {
    try {
      await deleteAsAdmin('organizations', { id: org2Id });
    } catch (error: any) {
      // Ignore "last owner" errors - this is expected if database has constraints
      const errorStr = error.message || JSON.stringify(error);
      if (!errorStr.includes('last owner') && !errorStr.includes('Cannot remove')) {
        console.warn(`Failed to delete org ${org2Id}:`, error.message);
      }
    }
  }
}
