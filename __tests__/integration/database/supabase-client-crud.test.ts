/**
 * Database Integration Tests: Supabase Client CRUD Operations
 *
 * Tests basic Supabase client CRUD operations and filters.
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

describe('Database Integration: Supabase Client CRUD', () => {
  let supabase: Awaited<ReturnType<typeof createServiceRoleClient>>;
  let testUserId: string;
  let testUserEmail: string;
  let testOrgId: string;
  let testDomainId: string;
  let testConfigId: string;

  beforeAll(async () => {
    supabase = await createServiceRoleClient();

    // Create test user and organization
    testUserEmail = `db-test-${Date.now()}@example.com`;
    testUserId = await createTestUser(testUserEmail, { name: 'DB Test User' });
    testOrgId = await createTestOrganization('DB Test Org', testUserId);

    // Create test domain
    const domain = await insertAsAdmin('domains', {
      organization_id: testOrgId,
      domain: `db-test-${Date.now()}.example.com`,
      name: 'DB Test Domain',
      active: true
    });
    testDomainId = domain.id;

    // Create test config
    const config = await insertAsAdmin('customer_configs', {
      organization_id: testOrgId,
      domain: `config-${Date.now()}.example.com`,
      business_name: 'Test Business',
      active: true
    });
    testConfigId = config.id;
  });

  afterAll(async () => {
    // Cleanup (cascades will handle related records)
    await deleteAsAdmin('customer_configs', { id: testConfigId });
    await deleteAsAdmin('domains', { id: testDomainId });
    await deleteTestOrganization(testOrgId);
    await deleteTestUser(testUserId);
  });

  describe('Basic CRUD Operations', () => {
    it('should insert a record successfully', async () => {
      const { data, error } = await supabase
        .from('scraped_pages')
        .insert({
          domain_id: testDomainId,
          url: `https://test.com/page-${Date.now()}`,
          title: 'Test Page',
          content: 'Test content',
          status: 'completed'
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.title).toBe('Test Page');

      // Cleanup
      if (data?.id) {
        await supabase.from('scraped_pages').delete().eq('id', data.id);
      }
    });

    it('should select records with filters', async () => {
      // Insert test data
      const url = `https://test.com/filter-${Date.now()}`;
      const { data: inserted } = await supabase
        .from('scraped_pages')
        .insert({
          domain_id: testDomainId,
          url,
          title: 'Filter Test',
          content: 'Filter content',
          status: 'completed'
        })
        .select()
        .single();

      // Query with filter
      const { data, error } = await supabase
        .from('scraped_pages')
        .select('*')
        .eq('url', url)
        .single();

      expect(error).toBeNull();
      expect(data?.title).toBe('Filter Test');

      // Cleanup
      if (inserted?.id) {
        await supabase.from('scraped_pages').delete().eq('id', inserted.id);
      }
    });

    it('should update a record', async () => {
      // Insert test data
      const { data: inserted } = await supabase
        .from('scraped_pages')
        .insert({
          domain_id: testDomainId,
          url: `https://test.com/update-${Date.now()}`,
          title: 'Original Title',
          content: 'Original content',
          status: 'pending'
        })
        .select()
        .single();

      // Update
      const { data: updated, error } = await supabase
        .from('scraped_pages')
        .update({ title: 'Updated Title', status: 'completed' })
        .eq('id', inserted!.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(updated?.title).toBe('Updated Title');
      expect(updated?.status).toBe('completed');

      // Cleanup
      await supabase.from('scraped_pages').delete().eq('id', inserted!.id);
    });

    it('should delete a record', async () => {
      // Insert test data
      const { data: inserted } = await supabase
        .from('scraped_pages')
        .insert({
          domain_id: testDomainId,
          url: `https://test.com/delete-${Date.now()}`,
          title: 'To Delete',
          content: 'Delete me',
          status: 'completed'
        })
        .select()
        .single();

      // Delete
      const { error } = await supabase
        .from('scraped_pages')
        .delete()
        .eq('id', inserted!.id);

      expect(error).toBeNull();

      // Verify deletion
      const { data } = await supabase
        .from('scraped_pages')
        .select()
        .eq('id', inserted!.id)
        .single();

      expect(data).toBeNull();
    });
  });

  describe('Filter Operations', () => {
    let pageIds: string[] = [];

    beforeEach(async () => {
      // Insert test data
      const pages = [
        { title: 'Page A', content: 'Alpha content', status: 'completed' },
        { title: 'Page B', content: 'Beta content', status: 'pending' },
        { title: 'Page C', content: 'Gamma content', status: 'completed' },
        { title: 'Page D', content: 'Delta content', status: 'failed' }
      ];

      for (const page of pages) {
        const { data } = await supabase
          .from('scraped_pages')
          .insert({
            domain_id: testDomainId,
            url: `https://test.com/${page.title.toLowerCase().replace(' ', '-')}-${Date.now()}`,
            ...page
          })
          .select()
          .single();

        if (data) pageIds.push(data.id);
      }
    });

    afterEach(async () => {
      // Cleanup
      await supabase.from('scraped_pages').delete().in('id', pageIds);
      pageIds = [];
    });

    it('should filter with eq (equals)', async () => {
      const { data, error } = await supabase
        .from('scraped_pages')
        .select('*')
        .eq('status', 'completed')
        .in('id', pageIds);

      expect(error).toBeNull();
      expect(data?.length).toBe(2);
      expect(data?.every(p => p.status === 'completed')).toBe(true);
    });

    it('should filter with neq (not equals)', async () => {
      const { data, error } = await supabase
        .from('scraped_pages')
        .select('*')
        .neq('status', 'completed')
        .in('id', pageIds);

      expect(error).toBeNull();
      expect(data?.length).toBe(2);
      expect(data?.every(p => p.status !== 'completed')).toBe(true);
    });

    it('should filter with in (array)', async () => {
      const { data, error } = await supabase
        .from('scraped_pages')
        .select('*')
        .in('status', ['pending', 'failed'])
        .in('id', pageIds);

      expect(error).toBeNull();
      expect(data?.length).toBe(2);
    });

    it('should filter with like (pattern matching)', async () => {
      const { data, error } = await supabase
        .from('scraped_pages')
        .select('*')
        .like('title', 'Page%')
        .in('id', pageIds);

      expect(error).toBeNull();
      expect(data?.length).toBe(4);
    });
  });
});
