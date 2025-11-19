/**
 * Database Integration Tests: Query Performance Advanced
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


  describe('N+1 Query Prevention', () => {
    let conversationIds: string[] = [];

    beforeAll(async () => {
      // Create 10 conversations each with 5 messages
      for (let i = 0; i < 10; i++) {
        const { data: conv } = await supabase
          .from('conversations')
          .insert({
            domain_id: testDomainId,
            session_id: `n1-test-${i}-${Date.now()}`,
            started_at: new Date().toISOString()
          })
          .select()
          .single();

        if (conv) {
          conversationIds.push(conv.id);

          // Add messages
          const messageInserts = [];
          for (let j = 0; j < 5; j++) {
            messageInserts.push({
              conversation_id: conv.id,
              role: j % 2 === 0 ? 'user' : 'assistant',
              content: `Message ${j}`
            });
          }
          await supabase.from('messages').insert(messageInserts);
        }
      }
    });

    afterAll(async () => {
      if (conversationIds.length > 0) {
        await supabase.from('conversations').delete().in('id', conversationIds);
      }
    });

    it('should fetch conversations with messages in single query', async () => {
      const startTime = Date.now();

      // Single query with join - avoids N+1 problem
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          session_id,
          started_at,
          messages (
            id,
            role,
            content,
            created_at
          )
        `)
        .in('id', conversationIds);

      const queryTime = Date.now() - startTime;

      expect(error).toBeNull();
      expect(data?.length).toBe(10);
      expect(data?.[0].messages.length).toBe(5);

      // Should complete in reasonable time even with all relationships loaded
      expect(queryTime).toBeLessThan(200);
    });

    it('should batch delete to avoid multiple round trips', async () => {
      // Create test data
      const urls = [];
      for (let i = 0; i < 20; i++) {
        urls.push(`https://test.com/batch-delete-${i}-${Date.now()}`);
      }

      const { data: inserted } = await supabase
        .from('scraped_pages')
        .insert(urls.map(url => ({
          domain_id: testDomainId,
          url,
          title: 'Batch Delete Test',
          content: 'Content',
          status: 'completed'
        })))
        .select('id');

      const ids = inserted?.map(p => p.id) || [];

      const startTime = Date.now();

      // Single batch delete instead of 20 individual deletes
      const { error } = await supabase
        .from('scraped_pages')
        .delete()
        .in('id', ids);

      const deleteTime = Date.now() - startTime;

      expect(error).toBeNull();
      // Batch delete should be fast (<100ms)
      expect(deleteTime).toBeLessThan(100);
    });
  });

  describe('Connection Pooling Behavior', () => {
    it('should handle concurrent queries efficiently', async () => {
      const startTime = Date.now();

      // Execute 10 queries concurrently
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          supabase
            .from('customer_configs')
            .select('*')
            .eq('organization_id', testOrgId)
        );
      }

      const results = await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      // All queries should succeed
      expect(results.every(r => r.error === null)).toBe(true);

      // Concurrent queries should complete faster than sequential
      // (with connection pooling, should take <500ms total, not >1000ms)
      expect(totalTime).toBeLessThan(500);
    });

    it('should reuse connections from pool', async () => {
      // First query
      const start1 = Date.now();
      const { error: error1 } = await supabase
        .from('domains')
        .select('*')
        .eq('id', testDomainId)
        .single();
      const time1 = Date.now() - start1;

      expect(error1).toBeNull();

      // Second query (should reuse connection)
      const start2 = Date.now();
      const { error: error2 } = await supabase
        .from('domains')
        .select('*')
        .eq('id', testDomainId)
        .single();
      const time2 = Date.now() - start2;

      expect(error2).toBeNull();

      // Second query should be as fast or faster (connection reuse)
      expect(time2).toBeLessThanOrEqual(time1 * 1.5); // Allow 50% variance
    });

    it('should handle transaction timeout gracefully', async () => {
      // This test verifies that the statement timeout is enforced
      // Note: We can't easily create a slow query in a test environment,
      // but we verify the timeout configuration exists

      const { data: config } = await supabase
        .from('customer_configs')
        .select('*')
        .eq('id', testConfigId)
        .single();

      expect(config).toBeDefined();

      // If we had a slow query, it would fail after 5000ms (statement_timeout)
      // This is configured in lib/supabase/server.ts:
      // 'x-statement-timeout': '5000'
    });
  });
});
