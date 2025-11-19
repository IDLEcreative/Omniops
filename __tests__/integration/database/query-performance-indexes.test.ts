/**
 * Database Integration Tests: Query Performance
 *
 * Tests database query performance including:
 * - Index usage verification
 * - Query execution time benchmarks
 * - N+1 query prevention
 * - Connection pooling behavior
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

describe('Database Integration: Query Performance', () => {
  let supabase: Awaited<ReturnType<typeof createServiceRoleClient>>;
  let testUserId: string;
  let testOrgId: string;
  let testDomainId: string;
  let testConfigId: string;

  beforeAll(async () => {
    supabase = await createServiceRoleClient();

    // Setup test environment
    const userEmail = `perf-test-${Date.now()}@example.com`;
    testUserId = await createTestUser(userEmail, { name: 'Perf Test User' });
    testOrgId = await createTestOrganization('Perf Test Org', testUserId);

    const domain = await insertAsAdmin('domains', {
      organization_id: testOrgId,
      domain: `perf-test-${Date.now()}.example.com`,
      name: 'Perf Test Domain',
      active: true
    });
    testDomainId = domain.id;

    const config = await insertAsAdmin('customer_configs', {
      organization_id: testOrgId,
      domain: `perf-config-${Date.now()}.example.com`,
      business_name: 'Performance Test',
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

  describe('Index Usage Verification', () => {
    it('should use index for domain lookup', async () => {
      const domain = `index-test-${Date.now()}.example.com`;
      const { data: config } = await supabase
        .from('customer_configs')
        .insert({
          organization_id: testOrgId,
          domain,
          business_name: 'Index Test',
          active: true
        })
        .select()
        .single();

      const startTime = Date.now();

      // Query by domain (should use idx_customer_configs_domain index)
      const { data, error } = await supabase
        .from('customer_configs')
        .select('*')
        .eq('domain', domain)
        .single();

      const queryTime = Date.now() - startTime;

      expect(error).toBeNull();
      expect(data?.id).toBe(config!.id);
      // Query should be fast (<100ms) when using index
      expect(queryTime).toBeLessThan(100);

      // Cleanup
      await supabase.from('customer_configs').delete().eq('id', config!.id);
    });

    it('should use index for foreign key joins', async () => {
      // Create conversation with messages
      const { data: conv } = await supabase
        .from('conversations')
        .insert({
          domain_id: testDomainId,
          session_id: `index-join-${Date.now()}`,
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      // Add 10 messages
      const messageInserts = [];
      for (let i = 0; i < 10; i++) {
        messageInserts.push({
          conversation_id: conv!.id,
          role: 'user',
          content: `Message ${i}`
        });
      }
      await supabase.from('messages').insert(messageInserts);

      const startTime = Date.now();

      // Join query (should use idx_messages_conversation_id)
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          messages (
            id,
            role,
            content
          )
        `)
        .eq('id', conv!.id)
        .single();

      const queryTime = Date.now() - startTime;

      expect(error).toBeNull();
      expect(data?.messages.length).toBe(10);
      // Join should be fast (<100ms) when using index
      expect(queryTime).toBeLessThan(100);

      // Cleanup
      await supabase.from('conversations').delete().eq('id', conv!.id);
    });

    it('should use JSONB index for metadata queries', async () => {
      const url = `https://test.com/jsonb-index-${Date.now()}`;
      const { data: page } = await supabase
        .from('scraped_pages')
        .insert({
          domain_id: testDomainId,
          url,
          title: 'JSONB Test',
          content: 'Content',
          status: 'completed',
          metadata: { category: 'test-category', priority: 'high' }
        })
        .select()
        .single();

      const startTime = Date.now();

      // JSONB query (should use idx_scraped_pages_metadata_gin)
      const { data, error } = await supabase
        .from('scraped_pages')
        .select('*')
        .eq('metadata->>category', 'test-category')
        .eq('id', page!.id)
        .single();

      const queryTime = Date.now() - startTime;

      expect(error).toBeNull();
      expect(data?.id).toBe(page!.id);
      // JSONB query should be fast (<100ms) with GIN index
      expect(queryTime).toBeLessThan(100);

      // Cleanup
      await supabase.from('scraped_pages').delete().eq('id', page!.id);
    });
  });

  describe('Query Execution Time Benchmarks', () => {
    let pageIds: string[] = [];

    beforeAll(async () => {
      // Create 100 test pages for performance testing
      const inserts = [];
      for (let i = 0; i < 100; i++) {
        inserts.push({
          domain_id: testDomainId,
          url: `https://test.com/perf-${i}-${Date.now()}`,
          title: `Performance Test Page ${i}`,
          content: `Content for page ${i}`,
          status: 'completed',
          metadata: { index: i, category: i % 5 === 0 ? 'featured' : 'normal' }
        });
      }

      const { data } = await supabase
        .from('scraped_pages')
        .insert(inserts)
        .select('id');

      pageIds = data?.map(p => p.id) || [];
    });

    afterAll(async () => {
      if (pageIds.length > 0) {
        await supabase.from('scraped_pages').delete().in('id', pageIds);
      }
    });

    it('should execute simple SELECT in <100ms', async () => {
      const startTime = Date.now();

      const { data, error } = await supabase
        .from('scraped_pages')
        .select('id, title, url')
        .in('id', pageIds.slice(0, 10))
        .limit(10);

      const queryTime = Date.now() - startTime;

      expect(error).toBeNull();
      expect(data?.length).toBe(10);
      expect(queryTime).toBeLessThan(100);
    });

    it('should execute filtered SELECT in <100ms', async () => {
      const startTime = Date.now();

      const { data, error } = await supabase
        .from('scraped_pages')
        .select('*')
        .eq('status', 'completed')
        .eq('metadata->>category', 'featured')
        .in('id', pageIds);

      const queryTime = Date.now() - startTime;

      expect(error).toBeNull();
      expect(queryTime).toBeLessThan(100);
    });

    it('should execute COUNT query in <100ms', async () => {
      const startTime = Date.now();

      const { count, error } = await supabase
        .from('scraped_pages')
        .select('*', { count: 'exact', head: true })
        .in('id', pageIds);

      const queryTime = Date.now() - startTime;

      expect(error).toBeNull();
      expect(count).toBe(100);
      expect(queryTime).toBeLessThan(100);
    });

    it('should execute ORDER BY with LIMIT in <100ms', async () => {
      const startTime = Date.now();

      const { data, error } = await supabase
        .from('scraped_pages')
        .select('*')
        .in('id', pageIds)
        .order('created_at', { ascending: false })
        .limit(20);

      const queryTime = Date.now() - startTime;

      expect(error).toBeNull();
      expect(data?.length).toBe(20);
      expect(queryTime).toBeLessThan(100);
    });
  });

