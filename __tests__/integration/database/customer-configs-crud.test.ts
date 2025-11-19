/**
 * Database Integration Tests: Customer Configs
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

  describe('CRUD Operations', () => {
    it('should create customer configuration', async () => {
      const domain = `test-create-${Date.now()}.example.com`;
      const config = await insertAsAdmin('customer_configs', {
        organization_id: org1Id,
        domain,
        business_name: 'Test Business',
        business_description: 'A test business',
        primary_color: '#FF5733',
        welcome_message: 'Welcome!',
        active: true
      });

      expect(config).toBeDefined();
      expect(config.domain).toBe(domain);
      expect(config.business_name).toBe('Test Business');
      expect(config.organization_id).toBe(org1Id);

      // Cleanup
      await deleteAsAdmin('customer_configs', { id: config.id });
    });

    it('should update customer settings', async () => {
      const domain = `test-update-${Date.now()}.example.com`;
      const config = await insertAsAdmin('customer_configs', {
        organization_id: org1Id,
        domain,
        business_name: 'Original Name',
        active: true
      });

      // Update using service role client
      const { data: updated, error } = await supabase
        .from('customer_configs')
        .update({
          business_name: 'Updated Name',
          business_description: 'Updated description'
        })
        .eq('id', config.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(updated?.business_name).toBe('Updated Name');
      expect(updated?.business_description).toBe('Updated description');

      // Cleanup
      await deleteAsAdmin('customer_configs', { id: config.id });
    });

    it('should delete customer with cascade', async () => {
      const domain = `test-delete-${Date.now()}.example.com`;
      const config = await insertAsAdmin('customer_configs', {
        organization_id: org1Id,
        domain,
        business_name: 'To Delete',
        active: true
      });

      // Create related domain synonym
      const synonym = await insertAsAdmin('domain_synonym_mappings', {
        domain_id: config.id,
        term: 'test',
        synonyms: ['testing', 'test case']
      });

      expect(synonym).toBeDefined();

      // Delete config (should cascade to synonyms)
      await deleteAsAdmin('customer_configs', { id: config.id });

      // Verify synonym was deleted
      const { data: deletedSynonym } = await supabase
        .from('domain_synonym_mappings')
        .select()
        .eq('id', synonym.id)
        .single();

      expect(deletedSynonym).toBeNull();
    });
  });

  describe('Encrypted Credentials', () => {
    it('should store encrypted WooCommerce credentials', async () => {
      const domain = `test-woo-${Date.now()}.example.com`;
      const config = await insertAsAdmin('customer_configs', {
        organization_id: org1Id,
        domain,
        business_name: 'WooCommerce Test',
        woocommerce_url: 'https://example.com',
        encrypted_credentials: {
          woocommerce: {
            consumer_key: 'encrypted_key_here',
            consumer_secret: 'encrypted_secret_here'
          }
        },
        active: true
      });

      expect(config.encrypted_credentials).toBeDefined();
      expect(config.encrypted_credentials.woocommerce).toBeDefined();
      expect(config.encrypted_credentials.woocommerce.consumer_key).toBe('encrypted_key_here');

      // Cleanup
      await deleteAsAdmin('customer_configs', { id: config.id });
    });

    it('should store encrypted Shopify credentials', async () => {
      const domain = `test-shopify-${Date.now()}.example.com`;
      const config = await insertAsAdmin('customer_configs', {
        organization_id: org1Id,
        domain,
        business_name: 'Shopify Test',
        shopify_shop: 'test-shop.myshopify.com',
        encrypted_credentials: {
          shopify: {
            access_token: 'encrypted_token_here'
          }
        },
        active: true
      });

      expect(config.encrypted_credentials.shopify).toBeDefined();
      expect(config.shopify_shop).toBe('test-shop.myshopify.com');

      // Cleanup
      await deleteAsAdmin('customer_configs', { id: config.id });
    });
  });

  describe('Domain-Based Isolation', () => {
    let config1Id: string;
    let config2Id: string;

    beforeAll(async () => {
      const config1 = await insertAsAdmin('customer_configs', {
        organization_id: org1Id,
        domain: `isolation1-${Date.now()}.example.com`,
        business_name: 'Business 1',
        active: true
      });
      config1Id = config1.id;

      const config2 = await insertAsAdmin('customer_configs', {
        organization_id: org2Id,
        domain: `isolation2-${Date.now()}.example.com`,
        business_name: 'Business 2',
        active: true
      });
      config2Id = config2.id;
    });

    afterAll(async () => {
      await deleteAsAdmin('customer_configs', { id: config1Id });
      await deleteAsAdmin('customer_configs', { id: config2Id });
    });

    it('should enforce unique domain constraint', async () => {
      const domain = `unique-${Date.now()}.example.com`;

      // Create first config
      const config1 = await insertAsAdmin('customer_configs', {
        organization_id: org1Id,
        domain,
        business_name: 'First',
        active: true
      });

      // Try to create second config with same domain
      const { error } = await supabase
        .from('customer_configs')
        .insert({
          organization_id: org2Id,
          domain, // Duplicate domain
          business_name: 'Second',
          active: true
        });
