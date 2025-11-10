/**
 * Customer Config API Security Tests - GET Endpoint
 *
 * Tests authentication and authorization for GET /api/customer/config
 * Verifies:
 * - Unauthenticated requests are rejected
 * - Only organization configs are returned
 * - Cross-organization isolation is enforced
 *
 * @jest-environment node
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { getConfigs } from '@/__tests__/utils/customer-config/api-request-helpers';
import { initializeTestData, cleanupTestData } from '@/__tests__/utils/customer-config/test-setup';
import { getAuthTokenFor, signOutUser } from '@/__tests__/utils/customer-config/auth-helpers';
import type { TestDataContext } from '@/__tests__/utils/customer-config/test-setup';

describe('GET /api/customer/config - Security', () => {
  let context: TestDataContext;

  beforeAll(async () => {
    context = await initializeTestData();
  });

  afterAll(async () => {
    await cleanupTestData(context);
  });

  it('should reject unauthenticated requests', async () => {
    const response = await getConfigs();
    expect(response.status).toBe(401);
    expect(response.data.error).toContain('Authentication required');
  });

  it('should only return configs for authenticated user\'s organization', async () => {
    // Sign in as user1
    const token = await getAuthTokenFor(context.serviceClient, context.user1Email, 'testpassword123');

    const response = await getConfigs(token);

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data.length).toBeGreaterThan(0);
    expect(response.data.data.every((c: any) => c.organization_id === context.org1Id)).toBe(true);

    // Sign out
    await signOutUser({ client: context.serviceClient });
  });

  it('should not allow user to access another organization\'s configs', async () => {
    // Sign in as user1 (org1)
    const token = await getAuthTokenFor(context.serviceClient, context.user1Email, 'testpassword123');

    const response = await getConfigs(token);

    // Should not see org2's config
    const hasOrg2Config = response.data.data.some((c: any) => c.id === context.config2Id);
    expect(hasOrg2Config).toBe(false);

    await signOutUser({ client: context.serviceClient });
  });
});
