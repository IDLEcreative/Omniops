/**
 * Database Integration Tests: WooCommerce Product Search
 *
 * Tests WooCommerce product catalog operations including:
 * - Entity catalog CRUD
 * - Product search and filtering
 * - JSONB attribute queries
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import {
  createTestUser,
  deleteTestUser,
  createTestOrganization,
  deleteTestOrganization,
  insertAsAdmin,
  deleteAsAdmin
} from '@/test-utils/rls-test-helpers';

describe('Database Integration: WooCommerce Products', () => {
  let supabase: Awaited<ReturnType<typeof createServiceRoleClient>>;
  let testUserId: string;
  let testOrgId: string;
  let testDomainId: string;
  let testConfigId: string;

  beforeAll(async () => {
    supabase = await createServiceRoleClient();

    const userEmail = `woo-test-${Date.now()}@example.com`;
    testUserId = await createTestUser(userEmail, { name: 'Woo Test User' });
    testOrgId = await createTestOrganization('Woo Test Org', testUserId);

    const domain = await insertAsAdmin('domains', {
      organization_id: testOrgId,
      domain: `woo-test-${Date.now()}.example.com`,
      name: 'Woo Test Domain',
      active: true
    });
    testDomainId = domain.id;

    const config = await insertAsAdmin('customer_configs', {
      organization_id: testOrgId,
      domain: `woo-config-${Date.now()}.example.com`,
      business_name: 'WooCommerce Test Store',
      woocommerce_url: 'https://test-store.com',
      encrypted_credentials: {
        woocommerce: {
          consumer_key: 'test_key',
          consumer_secret: 'test_secret'
        }
      },
      active: true
    });
    testConfigId = config.id;
  });

  afterAll(async () => {

        { sku: `PROD-2-${Date.now()}`, category: 'Electronics', price: 150.00 },
        { sku: `PROD-3-${Date.now()}`, category: 'Clothing', price: 30.00 },
        { sku: `PROD-4-${Date.now()}`, category: 'Electronics', price: 200.00 }
      ];

      for (const prod of products) {
        const { data } = await supabase
          .from('entity_catalog')
          .insert({
            domain_id: testConfigId,
            entity_type: 'product',
            primary_identifier: prod.sku,
            name: `Product ${prod.sku}`,
            description: 'Test product',
            price: prod.price,
            primary_category: prod.category,
            is_available: true
          })
          .select()
          .single();

        if (data) productIds.push(data.id);
      }

      const { data: electronics } = await supabase
        .from('entity_catalog')
        .select('*')
        .eq('primary_category', 'Electronics')
        .in('id', productIds);

      expect(electronics?.length).toBe(3);

      const { data: priceRange } = await supabase
        .from('entity_catalog')
        .select('*')
        .gte('price', 50)
        .lte('price', 150)
        .in('id', productIds);

      expect(priceRange?.length).toBe(2);

      await supabase.from('entity_catalog').delete().in('id', productIds);
    });
  });

  describe('Product Search', () => {
    let productIds: string[] = [];

    beforeAll(async () => {
      const products = [
        {
          sku: `SEARCH-1-${Date.now()}`,
          name: 'Wireless Bluetooth Headphones',
          description: 'High-quality wireless headphones with noise cancellation',
          category: 'Electronics'
        },
        {
          sku: `SEARCH-2-${Date.now()}`,
          name: 'USB-C Cable',
          description: 'Fast charging USB-C to USB-A cable',
          category: 'Accessories'
        },
        {
          sku: `SEARCH-3-${Date.now()}`,
          name: 'Wireless Mouse',
          description: 'Ergonomic wireless mouse with USB receiver',
          category: 'Electronics'
        }
      ];

      for (const prod of products) {
        const { data } = await supabase
          .from('entity_catalog')
          .insert({
            domain_id: testConfigId,
            entity_type: 'product',
            primary_identifier: prod.sku,
            name: prod.name,
            description: prod.description,
            primary_category: prod.category,
            price: 49.99,
            is_available: true
          })
          .select()
          .single();

        if (data) productIds.push(data.id);
      }
    });

    afterAll(async () => {
      await supabase.from('entity_catalog').delete().in('id', productIds);
    });

    it('should search products by name', async () => {
      const { data } = await supabase
        .from('entity_catalog')
        .select('*')
        .ilike('name', '%wireless%')
        .in('id', productIds);

      expect(data?.length).toBe(2);
    });

    it('should search products by description', async () => {
      const { data } = await supabase
        .from('entity_catalog')
        .select('*')
        .ilike('description', '%USB%')
        .in('id', productIds);

      expect(data?.length).toBe(2);
    });
  });

  describe('JSONB Attributes Queries', () => {
    let productIds: string[] = [];

    beforeAll(async () => {
      const products = [
        {
          sku: `ATTR-1-${Date.now()}`,
          name: 'Product with Tags',
          attributes: { tags: ['featured', 'sale'], color: 'red' }
        },
        {
          sku: `ATTR-2-${Date.now()}`,
          name: 'Product with Size',
          attributes: { size: 'large', tags: ['featured'] }
        },
        {
          sku: `ATTR-3-${Date.now()}`,
          name: 'Product with Color',
          attributes: { color: 'blue', material: 'cotton' }
        }
      ];

      for (const prod of products) {
        const { data } = await supabase
          .from('entity_catalog')
          .insert({
            domain_id: testConfigId,
            entity_type: 'product',
            primary_identifier: prod.sku,
            name: prod.name,
            description: 'Attribute test',
            price: 50.00,
            attributes: prod.attributes,
            is_available: true
          })
          .select()
          .single();

        if (data) productIds.push(data.id);
      }
    });

    afterAll(async () => {
      await supabase.from('entity_catalog').delete().in('id', productIds);
    });

    it('should query by JSONB attribute', async () => {
      const { data } = await supabase
        .from('entity_catalog')
        .select('*')
        .contains('attributes', { tags: ['featured'] })
        .in('id', productIds);

      expect(data?.length).toBeGreaterThanOrEqual(2);
    });

    it('should query by nested JSONB field', async () => {
      const { data } = await supabase
        .from('entity_catalog')
        .select('*')
        .eq('attributes->>color', 'red')
        .in('id', productIds);

      expect(data?.length).toBe(1);
      expect(data?.[0].name).toBe('Product with Tags');
    });
  });
});
