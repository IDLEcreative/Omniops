/**
 * Database Integration Tests: WooCommerce Product Data
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
    await deleteAsAdmin('customer_configs', { id: testConfigId });
    await deleteAsAdmin('domains', { id: testDomainId });
    await deleteTestOrganization(testOrgId);
    await deleteTestUser(testUserId);
  });

  describe('Entity Catalog - Product Sync', () => {
    it('should insert product into entity catalog', async () => {
      const sku = `TEST-PRODUCT-${Date.now()}`;
      const { data, error } = await supabase
        .from('entity_catalog')
        .insert({
          domain_id: testConfigId,
          entity_type: 'product',
          primary_identifier: sku,
          name: 'Test Product',
          description: 'A test product from WooCommerce',
          price: 99.99,
          primary_category: 'Electronics',
          attributes: {
            stock_status: 'instock',
            stock_quantity: 50,
            weight: '1.5kg',
            dimensions: { length: 10, width: 5, height: 3 },
            tags: ['featured', 'new']
          },
          is_available: true,
          source_url: 'https://test-store.com/product/test-product'
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.primary_identifier).toBe(sku);
      expect(data?.entity_type).toBe('product');
      expect(data?.price).toBe('99.99');
      expect(data?.attributes.stock_status).toBe('instock');

      if (data) {
        await supabase.from('entity_catalog').delete().eq('id', data.id);
      }
    });

    it('should enforce unique SKU per domain', async () => {
      const sku = `UNIQUE-SKU-${Date.now()}`;

      const { data: first } = await supabase
        .from('entity_catalog')
        .insert({
          domain_id: testConfigId,
          entity_type: 'product',
          primary_identifier: sku,
          name: 'First Product',
          description: 'First',
          price: 50.00,
          is_available: true
        })
        .select()
        .single();

      const { data: second, error } = await supabase
        .from('entity_catalog')
        .insert({
          domain_id: testConfigId,
          entity_type: 'product',
          primary_identifier: sku,
          name: 'Second Product',
          description: 'Second',
          price: 60.00,
          is_available: true
        })
        .select()
        .single();

      expect(error).toBeDefined();
      expect(error?.code).toBe('23505');
      expect(second).toBeNull();

      await supabase.from('entity_catalog').delete().eq('id', first!.id);
    });

    it('should update product availability and stock', async () => {
      const sku = `UPDATE-PRODUCT-${Date.now()}`;
      const { data: product } = await supabase
        .from('entity_catalog')
        .insert({
          domain_id: testConfigId,
          entity_type: 'product',
          primary_identifier: sku,
          name: 'Stock Test Product',
          description: 'Test stock updates',
          price: 75.00,
          attributes: { stock_quantity: 100, stock_status: 'instock' },
          is_available: true
        })
        .select()
        .single();

      const { data: updated, error } = await supabase
        .from('entity_catalog')
        .update({
          attributes: { stock_quantity: 0, stock_status: 'outofstock' },
          is_available: false
        })
        .eq('id', product!.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(updated?.is_available).toBe(false);
      expect(updated?.attributes.stock_quantity).toBe(0);
      expect(updated?.attributes.stock_status).toBe('outofstock');

      await supabase.from('entity_catalog').delete().eq('id', product!.id);
    });

    it('should filter products by category and price', async () => {
      const productIds: string[] = [];

      const products = [
        { sku: `PROD-1-${Date.now()}`, category: 'Electronics', price: 50.00 },
