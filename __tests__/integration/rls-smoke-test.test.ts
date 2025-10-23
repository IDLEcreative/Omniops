/**
 * RLS Smoke Test - Minimal test to verify REST API approach works
 */

import {
  createTestUser,
  deleteTestUser,
  createTestOrganization,
  deleteTestOrganization,
  insertAsAdmin,
  queryAsUser,
  queryAsAdmin,
  deleteAsAdmin,
  getUserAccessToken
} from '@/test-utils/rls-test-helpers';

describe('RLS Smoke Test', () => {
  let user1Id: string;
  let user1Email: string;
  let user2Id: string;
  let user2Email: string;
  let org1Id: string;
  let org2Id: string;
  let config1Id: string;
  let config2Id: string;

  beforeAll(async () => {
    // Create test users
    user1Email = `rls-smoke-user1-${Date.now()}@example.com`;
    user2Email = `rls-smoke-user2-${Date.now()}@example.com`;

    user1Id = await createTestUser(user1Email, { name: 'User 1' });
    user2Id = await createTestUser(user2Email, { name: 'User 2' });

    // Create organizations
    org1Id = await createTestOrganization('Smoke Org 1', user1Id);
    org2Id = await createTestOrganization('Smoke Org 2', user2Id);

    // Create customer configs
    const config1 = await insertAsAdmin('customer_configs', {
      organization_id: org1Id,
      domain: `smoke-test1-${Date.now()}.example.com`,
      business_name: 'Smoke Test 1',
      business_description: 'Test business for RLS smoke test'
    });
    config1Id = config1.id;

    const config2 = await insertAsAdmin('customer_configs', {
      organization_id: org2Id,
      domain: `smoke-test2-${Date.now()}.example.com`,
      business_name: 'Smoke Test 2',
      business_description: 'Test business 2 for RLS smoke test'
    });
    config2Id = config2.id;
  });

  afterAll(async () => {
    // Cleanup
    await deleteAsAdmin('customer_configs', { id: config1Id });
    await deleteAsAdmin('customer_configs', { id: config2Id });
    await deleteTestOrganization(org1Id);
    await deleteTestOrganization(org2Id);
    await deleteTestUser(user1Id);
    await deleteTestUser(user2Id);
  });

  it('should prevent cross-organization access via RLS', async () => {
    // User 1 should be able to see org1's config
    const user1Configs = await queryAsUser(user1Email, 'customer_configs', {
      organization_id: org1Id
    });
    expect(user1Configs.length).toBeGreaterThan(0);
    expect(user1Configs[0].id).toBe(config1Id);

    // User 1 should NOT be able to see org2's config (RLS should block)
    const user1BlockedConfigs = await queryAsUser(user1Email, 'customer_configs', {
      organization_id: org2Id
    });
    expect(user1BlockedConfigs.length).toBe(0);
  });

  it('should allow admin to see all data', async () => {
    // Admin should see both configs
    const allConfigs = await queryAsAdmin('customer_configs', {});
    const configIds = allConfigs.map(c => c.id);

    expect(configIds).toContain(config1Id);
    expect(configIds).toContain(config2Id);
  });
});
