/**
 * Customer Config API Security Tests - DELETE Endpoint
 *
 * Tests authentication and authorization for DELETE /api/customer/config
 * Verifies:
 * - Unauthenticated requests are rejected
 * - Cross-organization deletes are blocked
 * - Regular members cannot delete configs
 * - Admins and owners can delete their org's configs
 *
 * @jest-environment node
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { deleteConfig } from '@/__tests__/utils/customer-config/api-request-helpers';
import { initializeTestData, cleanupTestData, TEST_PASSWORD } from '@/__tests__/utils/customer-config/test-setup';
import { getAuthTokenFor, signOutUser } from '@/__tests__/utils/customer-config/auth-helpers';
import { insertAsAdmin, deleteAsAdmin } from '@/test-utils/rls-test-helpers';
import type { TestDataContext } from '@/__tests__/utils/customer-config/test-setup';

describe('DELETE /api/customer/config - Security', () => {
  let context: TestDataContext;
  let tempConfigId: string;

  beforeAll(async () => {
    context = await initializeTestData();

    // Create a temp config to delete
    const data = await insertAsAdmin('customer_configs', {
      organization_id: context.org1Id,
      domain: `test-delete-${context.timestamp}.example.com`,
      business_name: 'Delete Me'
    });

    if (!data) {
      throw new Error('Failed to create temp config for DELETE test');
    }

    tempConfigId = data.id;
  });

  afterAll(async () => {
    await cleanupTestData(context);
  });

  it('should reject unauthenticated requests', async () => {
    const response = await deleteConfig(tempConfigId);

    expect(response.status).toBe(401);
    expect(response.data.error).toContain('Authentication required');
  });

  it('should reject deletion of configs from other organizations', async () => {
    // Sign in as user1 (org1)
    const token = await getAuthTokenFor(context.serviceClient, context.user1Email, TEST_PASSWORD);

    // Try to delete org2's config
    const response = await deleteConfig(context.config2Id, token);

    expect(response.status).toBe(403);
    expect(response.data.error).toContain('Forbidden');

    await signOutUser({ client: context.serviceClient });
  });

  it('should reject regular members', async () => {
    // Create temp config in org2
    const tempConfig = await insertAsAdmin('customer_configs', {
      organization_id: context.org2Id,
      domain: `test-delete-member-${context.timestamp}.example.com`,
      business_name: 'Delete Me 2'
    });

    if (!tempConfig) {
      throw new Error('Failed to create temp config for member test');
    }

    // Sign in as user2 (member, not admin)
    const token = await getAuthTokenFor(context.serviceClient, context.user2Email, TEST_PASSWORD);

    const response = await deleteConfig(tempConfig.id, token);

    expect(response.status).toBe(403);
    expect(response.data.error).toContain('admins and owners');

    // Cleanup
    await deleteAsAdmin('customer_configs', { id: tempConfig.id });

    await signOutUser({ client: context.serviceClient });
  });

  it('should allow admins/owners to delete their own org configs', async () => {
    // Sign in as user1 (owner of org1)
    const token = await getAuthTokenFor(context.serviceClient, context.user1Email, TEST_PASSWORD);

    const response = await deleteConfig(tempConfigId, token);

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);

    await signOutUser({ client: context.serviceClient });
  });
});
