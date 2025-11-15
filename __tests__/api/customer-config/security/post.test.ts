/**
 * Customer Config API Security Tests - POST Endpoint
 *
 * Tests authentication and authorization for POST /api/customer/config
 * Verifies:
 * - Unauthenticated requests are rejected
 * - Regular members cannot create configs
 * - Admins and owners can create configs
 *
 * @jest-environment node
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createConfig } from '@/__tests__/utils/customer-config/api-request-helpers';
import { initializeTestData, cleanupTestData, TEST_PASSWORD } from '@/__tests__/utils/customer-config/test-setup';
import { getAuthTokenFor, signOutUser } from '@/__tests__/utils/customer-config/auth-helpers';
import type { TestDataContext } from '@/__tests__/utils/customer-config/test-setup';

describe('POST /api/customer/config - Security', () => {
  let context: TestDataContext;

  beforeAll(async () => {
    context = await initializeTestData();
  });

  afterAll(async () => {
    await cleanupTestData(context);
  });

  it('should reject unauthenticated requests', async () => {
    const response = await createConfig(`test-new-${context.timestamp}.example.com`, 'New Business');

    expect(response.status).toBe(401);
    expect(response.data.error).toContain('Authentication required');
  });

  it('should reject regular members (non-admin/owner)', async () => {
    // Sign in as user2 (member, not admin)
    const token = await getAuthTokenFor(context.serviceClient, context.user2Email, TEST_PASSWORD);

    const response = await createConfig(
      `test-new-${context.timestamp}.example.com`,
      'New Business',
      token
    );

    expect(response.status).toBe(403);
    expect(response.data.error).toContain('admins and owners');

    await signOutUser({ client: context.serviceClient });
  });

  it('should allow admins and owners to create configs', async () => {
    // Sign in as user1 (owner)
    const token = await getAuthTokenFor(context.serviceClient, context.user1Email, TEST_PASSWORD);

    const newDomain = `test-create-${context.timestamp}.example.com`;
    const response = await createConfig(newDomain, 'New Business', token);

    // Should succeed (201 or 409 if domain exists)
    expect([201, 409]).toContain(response.status);

    // Cleanup if created
    if (response.status === 201) {
      await context.serviceClient
        .from('customer_configs')
        .delete()
        .eq('id', response.data.data.config.id);
    }

    await signOutUser({ client: context.serviceClient });
  });
});
