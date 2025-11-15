/**
 * Customer Config API Security Tests - PUT Endpoint
 *
 * Tests authentication and authorization for PUT /api/customer/config
 * Verifies:
 * - Unauthenticated requests are rejected
 * - Cross-organization updates are blocked
 * - Regular members cannot update configs
 * - Admins and owners can update their org's configs
 *
 * @jest-environment node
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { updateConfig } from '@/__tests__/utils/customer-config/api-request-helpers';
import { initializeTestData, cleanupTestData, TEST_PASSWORD } from '@/__tests__/utils/customer-config/test-setup';
import { getAuthTokenFor, signOutUser } from '@/__tests__/utils/customer-config/auth-helpers';
import type { TestDataContext } from '@/__tests__/utils/customer-config/test-setup';

/**
 * SKIPPED: Test environment issues with duplicate key constraint violations
 * Same root cause as get.test.ts - test data cleanup not working correctly
 * Tests failing with: "TypeError: fetch failed" and authentication errors
 * TODO: Fix test environment setup/cleanup before re-enabling
 * Related: __tests__/api/customer-config/security/get.test.ts
 */
describe.skip('PUT /api/customer/config - Security', () => {
  let context: TestDataContext;

  beforeAll(async () => {
    context = await initializeTestData();
  });

  afterAll(async () => {
    await cleanupTestData(context);
  });

  it('should reject unauthenticated requests', async () => {
    const response = await updateConfig(context.config1Id, { business_name: 'Updated Business' });

    expect(response.status).toBe(401);
    expect(response.data.error).toContain('Authentication required');
  });

  it('should reject updates to configs from other organizations', async () => {
    // Sign in as user1 (org1)
    const token = await getAuthTokenFor(context.serviceClient, context.user1Email, TEST_PASSWORD);

    // Try to update org2's config
    const response = await updateConfig(context.config2Id, { business_name: 'Hacked Business' }, token);

    expect(response.status).toBe(403);
    expect(response.data.error).toContain('Forbidden');

    await signOutUser({ client: context.serviceClient });
  });

  it('should reject regular members', async () => {
    // Sign in as user2 (member, not admin)
    const token = await getAuthTokenFor(context.serviceClient, context.user2Email, TEST_PASSWORD);

    const response = await updateConfig(context.config2Id, { business_name: 'Updated Business' }, token);

    expect(response.status).toBe(403);
    expect(response.data.error).toContain('admins and owners');

    await signOutUser({ client: context.serviceClient });
  });

  it('should allow admins/owners to update their own org configs', async () => {
    // Sign in as user1 (owner of org1)
    const token = await getAuthTokenFor(context.serviceClient, context.user1Email, TEST_PASSWORD);

    const response = await updateConfig(context.config1Id, { business_name: 'Updated Business 1' }, token);

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);

    await signOutUser({ client: context.serviceClient });
  });
});
