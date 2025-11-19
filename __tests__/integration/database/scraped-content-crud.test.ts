/**
 * Database Integration Tests: Scraped Content CRUD Operations
 *
 * Tests basic scraped pages operations including:
 * - Insert/update/delete scraped pages
 * - Metadata storage and querying
 * - Status transitions
 * - Cleanup operations
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

describe('Database Integration: Scraped Content CRUD', () => {
  let supabase: Awaited<ReturnType<typeof createServiceRoleClient>>;
  let testUserId: string;
  let testOrgId: string;
  let testDomainId: string;
  let testConfigId: string;

  beforeAll(async () => {
    supabase = await createServiceRoleClient();

    // Setup test environment
    const userEmail = `scraped-test-${Date.now()}@example.com`;
    testUserId = await createTestUser(userEmail, { name: 'Scraped Test User' });
    testOrgId = await createTestOrganization('Scraped Test Org', testUserId);

    const domain = await insertAsAdmin('domains', {
      organization_id: testOrgId,
      domain: `scraped-test-${Date.now()}.example.com`,
      name: 'Scraped Test Domain',
      active: true
    });
    testDomainId = domain.id;

    const config = await insertAsAdmin('customer_configs', {
      organization_id: testOrgId,
      domain: `config-${Date.now()}.example.com`,
      business_name: 'Test Business',
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

  describe('Scraped Pages Operations', () => {
    it('should insert scraped page successfully', async () => {
      const url = `https://test.com/page-${Date.now()}`;
      const { data, error } = await supabase
        .from('scraped_pages')
        .insert({
          domain_id: testDomainId,
          url,
          title: 'Test Page',
          content: 'This is test content for the page',
          excerpt: 'Test excerpt',
          status: 'completed',
          metadata: { category: 'test', tags: ['integration'] }
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.url).toBe(url);
      expect(data?.title).toBe('Test Page');
      expect(data?.metadata).toEqual({ category: 'test', tags: ['integration'] });

      // Cleanup
      if (data) {
        await supabase.from('scraped_pages').delete().eq('id', data.id);
      }
    });

    it('should update scraped page content', async () => {
      const url = `https://test.com/update-page-${Date.now()}`;
      const { data: page } = await supabase
        .from('scraped_pages')
        .insert({
          domain_id: testDomainId,
          url,
          title: 'Original Title',
          content: 'Original content',
          status: 'pending'
        })
        .select()
        .single();

      // Update page
      const { data: updated, error } = await supabase
        .from('scraped_pages')
        .update({
          title: 'Updated Title',
          content: 'Updated content',
          status: 'completed',
          last_scraped_at: new Date().toISOString()
        })
        .eq('id', page!.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(updated?.title).toBe('Updated Title');
      expect(updated?.content).toBe('Updated content');
      expect(updated?.status).toBe('completed');
      expect(updated?.last_scraped_at).toBeDefined();

      // Cleanup
      await supabase.from('scraped_pages').delete().eq('id', page!.id);
    });

    it('should handle page status transitions', async () => {
      const url = `https://test.com/status-${Date.now()}`;
      const { data: page } = await supabase
        .from('scraped_pages')
        .insert({
          domain_id: testDomainId,
          url,
          title: 'Status Test',
          content: 'Content',
          status: 'pending'
        })
        .select()
        .single();

      // Pending -> Completed
      await supabase
        .from('scraped_pages')
        .update({ status: 'completed' })
        .eq('id', page!.id);

      let { data } = await supabase
        .from('scraped_pages')
        .select('status')
        .eq('id', page!.id)
        .single();

      expect(data?.status).toBe('completed');

      // Completed -> Failed
      await supabase
        .from('scraped_pages')
        .update({ status: 'failed' })
        .eq('id', page!.id);

      ({ data } = await supabase
        .from('scraped_pages')
        .select('status')
        .eq('id', page!.id)
        .single());

      expect(data?.status).toBe('failed');

      // Failed -> Deleted
      await supabase
        .from('scraped_pages')
        .update({ status: 'deleted' })
        .eq('id', page!.id);

      ({ data } = await supabase
        .from('scraped_pages')
        .select('status')
        .eq('id', page!.id)
        .single());

      expect(data?.status).toBe('deleted');

      // Cleanup
      await supabase.from('scraped_pages').delete().eq('id', page!.id);
    });

    it('should store and query metadata', async () => {
      const url = `https://test.com/metadata-${Date.now()}`;
      const metadata = {
        category: 'products',
        price: 99.99,
        sku: 'TEST-123',
        tags: ['featured', 'new'],
        custom_field: 'custom_value'
      };

      const { data: page } = await supabase
        .from('scraped_pages')
        .insert({
          domain_id: testDomainId,
          url,
          title: 'Metadata Test',
          content: 'Content',
          status: 'completed',
          metadata
        })
        .select()
        .single();

      expect(page?.metadata).toEqual(metadata);

      // Query by metadata
      const { data: found } = await supabase
        .from('scraped_pages')
        .select('*')
        .eq('id', page!.id)
        .single();

      expect(found?.metadata.category).toBe('products');
      expect(found?.metadata.price).toBe(99.99);
      expect(found?.metadata.tags).toEqual(['featured', 'new']);

      // Cleanup
      await supabase.from('scraped_pages').delete().eq('id', page!.id);
    });
  });

  describe('Cleanup Operations', () => {
    it('should mark pages as deleted', async () => {
      const url = `https://test.com/to-delete-${Date.now()}`;
      const { data: page } = await supabase
        .from('scraped_pages')
        .insert({
          domain_id: testDomainId,
          url,
          title: 'To Delete',
          content: 'Will be deleted',
          status: 'completed'
        })
        .select()
        .single();

      // Mark as deleted
      await supabase
        .from('scraped_pages')
        .update({
          status: 'deleted',
          last_scraped_at: new Date().toISOString()
        })
        .eq('id', page!.id);

      const { data: deleted } = await supabase
        .from('scraped_pages')
        .select('*')
        .eq('id', page!.id)
        .single();

      expect(deleted?.status).toBe('deleted');
      expect(deleted?.last_scraped_at).toBeDefined();

      // Cleanup
      await supabase.from('scraped_pages').delete().eq('id', page!.id);
    });

    it('should clean up old deleted pages', async () => {
      const thirtyOneDaysAgo = new Date();
      thirtyOneDaysAgo.setDate(thirtyOneDaysAgo.getDate() - 31);

      const url = `https://test.com/old-deleted-${Date.now()}`;
      const { data: page } = await supabase
        .from('scraped_pages')
        .insert({
          domain_id: testDomainId,
          url,
          title: 'Old Deleted',
          content: 'Old content',
          status: 'deleted',
          last_scraped_at: thirtyOneDaysAgo.toISOString()
        })
        .select()
        .single();

      // Find old deleted pages
      const { data: oldDeleted } = await supabase
        .from('scraped_pages')
        .select('*')
        .eq('status', 'deleted')
        .lt('last_scraped_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .eq('id', page!.id);

      expect(oldDeleted?.length).toBeGreaterThan(0);

      // Cleanup
      await supabase.from('scraped_pages').delete().eq('id', page!.id);
    });
  });
});
