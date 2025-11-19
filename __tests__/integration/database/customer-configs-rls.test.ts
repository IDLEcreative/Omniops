/**
 * Database Integration Tests: Customer Configs RLS
 *
 * Tests customer configuration operations including:
 * - CRUD operations
 * - Encrypted credentials storage
 * - Domain-based isolation
 * - RLS policy enforcement
 * - Multi-customer isolation
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import {
  createTestUser,
  deleteTestUser,
  createTestOrganization,
  deleteTestOrganization,
  insertAsAdmin,
  queryAsAdmin,
  deleteAsAdmin,
  queryAsUser,
  expectRLSBlocked,
  expectRLSAllowed
} from '@/test-utils/rls-test-helpers';

describe('Database Integration: Customer Configs', () => {
  let supabase: Awaited<ReturnType<typeof createServiceRoleClient>>;
  let user1Id: string;
  let user1Email: string;
  let user2Id: string;
  let user2Email: string;
  let org1Id: string;
  let org2Id: string;

  beforeAll(async () => {
    supabase = await createServiceRoleClient();

    // Create two separate users and organizations for isolation testing
    user1Email = `config-user1-${Date.now()}@example.com`;
    user2Email = `config-user2-${Date.now()}@example.com`;

    user1Id = await createTestUser(user1Email, { name: 'Config User 1' });
    user2Id = await createTestUser(user2Email, { name: 'Config User 2' });

    org1Id = await createTestOrganization('Config Org 1', user1Id);
    org2Id = await createTestOrganization('Config Org 2', user2Id);
  });

  afterAll(async () => {
    await deleteTestOrganization(org1Id);
    await deleteTestOrganization(org2Id);
    await deleteTestUser(user1Id);
    await deleteTestUser(user2Id);
  });



      expect(error).toBeDefined();
      expect(error?.code).toBe('23505'); // Unique violation

      // Cleanup
      await deleteAsAdmin('customer_configs', { id: config1.id });
    });

    it('should allow same domain after deletion', async () => {
      const domain = `reuse-${Date.now()}.example.com`;

      // Create and delete first config
      const config1 = await insertAsAdmin('customer_configs', {
        organization_id: org1Id,
        domain,
        business_name: 'First',
        active: true
      });
      await deleteAsAdmin('customer_configs', { id: config1.id });

      // Should now be able to create new config with same domain
      const config2 = await insertAsAdmin('customer_configs', {
        organization_id: org2Id,
        domain,
        business_name: 'Second',
        active: true
      });

      expect(config2).toBeDefined();
      expect(config2.domain).toBe(domain);

      // Cleanup
      await deleteAsAdmin('customer_configs', { id: config2.id });
    });
  });

  describe('RLS Policy Enforcement', () => {
    let config1Id: string;
    let config2Id: string;

    beforeAll(async () => {
      const config1 = await insertAsAdmin('customer_configs', {
        organization_id: org1Id,
        domain: `rls1-${Date.now()}.example.com`,
        business_name: 'RLS Test 1',
        active: true
      });
      config1Id = config1.id;

      const config2 = await insertAsAdmin('customer_configs', {
        organization_id: org2Id,
        domain: `rls2-${Date.now()}.example.com`,
        business_name: 'RLS Test 2',
        active: true
      });
      config2Id = config2.id;
    });

    afterAll(async () => {
      await deleteAsAdmin('customer_configs', { id: config1Id });
      await deleteAsAdmin('customer_configs', { id: config2Id });
    });

    it('should allow user to access own organization configs', async () => {
      const configs = await queryAsUser(user1Email, 'customer_configs', {
        organization_id: org1Id
      });

      expect(configs.length).toBeGreaterThan(0);
      expect(configs.some(c => c.id === config1Id)).toBe(true);
    });

    it('should prevent cross-organization access', async () => {
      // User 1 should NOT see Org 2's config
      const configs = await queryAsUser(user1Email, 'customer_configs', {
        organization_id: org2Id
      });

      expect(configs.length).toBe(0);
      expect(configs.some(c => c.id === config2Id)).toBe(false);
    });

    it('should allow admin to see all configs', async () => {
      const configs = await queryAsAdmin('customer_configs', {});
      const configIds = configs.map(c => c.id);

      expect(configIds).toContain(config1Id);
      expect(configIds).toContain(config2Id);
    });
  });

  describe('Multiple Customers Isolation', () => {
    let configs: Array<{ id: string; org: string }> = [];

    beforeAll(async () => {
      // Create multiple configs for each org
      for (let i = 0; i < 3; i++) {
        const config1 = await insertAsAdmin('customer_configs', {
          organization_id: org1Id,
          domain: `multi1-${i}-${Date.now()}.example.com`,
          business_name: `Org1 Business ${i}`,
          active: true
        });
        configs.push({ id: config1.id, org: 'org1' });

        const config2 = await insertAsAdmin('customer_configs', {
          organization_id: org2Id,
          domain: `multi2-${i}-${Date.now()}.example.com`,
          business_name: `Org2 Business ${i}`,
          active: true
        });
        configs.push({ id: config2.id, org: 'org2' });
      }
    });

    afterAll(async () => {
      for (const config of configs) {
        await deleteAsAdmin('customer_configs', { id: config.id });
      }
    });

    it('should maintain isolation across multiple configs', async () => {
      // User 1 should see only Org 1 configs
      const user1Configs = await queryAsUser(user1Email, 'customer_configs', {
        organization_id: org1Id
      });

      const user1ConfigIds = user1Configs.map(c => c.id);
      const org1ConfigIds = configs.filter(c => c.org === 'org1').map(c => c.id);
      const org2ConfigIds = configs.filter(c => c.org === 'org2').map(c => c.id);

      // Should see all Org 1 configs
      for (const id of org1ConfigIds) {
        expect(user1ConfigIds).toContain(id);
      }

      // Should NOT see any Org 2 configs
      for (const id of org2ConfigIds) {
        expect(user1ConfigIds).not.toContain(id);
      }
    });

    it('should count configs correctly per organization', async () => {
      const org1Configs = await queryAsUser(user1Email, 'customer_configs', {
        organization_id: org1Id
      });

      const org2Configs = await queryAsUser(user2Email, 'customer_configs', {
        organization_id: org2Id
      });

      // Each should see exactly 3 configs (we created 3 per org)
      const org1Count = org1Configs.filter(c =>
        configs.filter(tc => tc.org === 'org1').map(tc => tc.id).includes(c.id)
      ).length;

      const org2Count = org2Configs.filter(c =>
        configs.filter(tc => tc.org === 'org2').map(tc => tc.id).includes(c.id)
      ).length;

      expect(org1Count).toBe(3);
      expect(org2Count).toBe(3);
    });
  });
});
