/**
 * Database Integration Tests: WooCommerce Data Cleanup
 *
 * Tests data cleanup operations and product-page relationships.
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

describe('Database Integration: WooCommerce Cleanup', () => {
  let supabase: Awaited<ReturnType<typeof createServiceRoleClient>>;
  let testUserId: string;
  let testOrgId: string;
  let testDomainId: string;
  let testConfigId: string;

  beforeAll(async () => {
    supabase = await createServiceRoleClient();

    const userEmail = `woo-cleanup-${Date.now()}@example.com`;
    testUserId = await createTestUser(userEmail, { name: 'Cleanup Test User' });
    testOrgId = await createTestOrganization('Cleanup Test Org', testUserId);

    const domain = await insertAsAdmin('domains', {
      organization_id: testOrgId,
      domain: `cleanup-test-${Date.now()}.example.com`,
      name: 'Cleanup Test Domain',
      active: true
    });
    testDomainId = domain.id;

    const config = await insertAsAdmin('customer_configs', {
      organization_id: testOrgId,
      domain: `cleanup-config-${Date.now()}.example.com`,
      business_name: 'Cleanup Test Store',
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

  describe('Data Cleanup Operations', () => {
    it('should delete products by domain', async () => {
      const productIds = [];
      for (let i = 0; i < 5; i++) {
        const { data } = await supabase
          .from('entity_catalog')
          .insert({
            domain_id: testConfigId,
            entity_type: 'product',
            primary_identifier: `CLEANUP-${i}-${Date.now()}`,
            name: `Cleanup Product ${i}`,
            description: 'To be deleted',
            price: 10.00,
            is_available: true
          })
          .select()
          .single();

        if (data) productIds.push(data.id);
      }

      const { error } = await supabase
        .from('entity_catalog')
        .delete()
        .in('id', productIds);

      expect(error).toBeNull();

      const { data: remaining } = await supabase
        .from('entity_catalog')
        .select('*')
        .in('id', productIds);

      expect(remaining?.length).toBe(0);
    });

    it('should mark products as unavailable instead of deleting', async () => {
      const sku = `SOFT-DELETE-${Date.now()}`;
      const { data: product } = await supabase
        .from('entity_catalog')
        .insert({
          domain_id: testConfigId,
          entity_type: 'product',
          primary_identifier: sku,
          name: 'Soft Delete Product',
          description: 'Test soft delete',
          price: 25.00,
          is_available: true
        })
        .select()
        .single();

      await supabase
        .from('entity_catalog')
        .update({ is_available: false })
        .eq('id', product!.id);

      const { data: softDeleted } = await supabase
        .from('entity_catalog')
        .select('*')
        .eq('id', product!.id)
        .single();

      expect(softDeleted).toBeDefined();
      expect(softDeleted?.is_available).toBe(false);

      await supabase.from('entity_catalog').delete().eq('id', product!.id);
    });
  });

  describe('Product Page Relationship', () => {
    it('should link product to scraped page', async () => {
      const { data: page } = await supabase
        .from('scraped_pages')
        .insert({
          domain_id: testDomainId,
          url: `https://test-store.com/product-page-${Date.now()}`,
          title: 'Product Page',
          content: 'Product description and details',
          status: 'completed'
        })
        .select()
        .single();

      const sku = `LINKED-PRODUCT-${Date.now()}`;
      const { data: product, error } = await supabase
        .from('entity_catalog')
        .insert({
          domain_id: testConfigId,
          page_id: page!.id,
          entity_type: 'product',
          primary_identifier: sku,
          name: 'Linked Product',
          description: 'Product with page link',
          price: 100.00,
          source_url: page!.url,
          is_available: true
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(product?.page_id).toBe(page!.id);
      expect(product?.source_url).toBe(page!.url);

      await supabase.from('scraped_pages').delete().eq('id', page!.id);

      const { data: deletedProduct } = await supabase
        .from('entity_catalog')
        .select('*')
        .eq('id', product!.id)
        .single();

      expect(deletedProduct).toBeNull();
    });
  });
});
