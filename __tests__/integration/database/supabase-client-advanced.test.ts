/**
 * Database Integration Tests: Supabase Client Advanced Operations
 *
 * Tests pagination, joins, and batch operations.
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

describe('Database Integration: Supabase Client Advanced', () => {
  let supabase: Awaited<ReturnType<typeof createServiceRoleClient>>;
  let testUserId: string;
  let testOrgId: string;
  let testDomainId: string;
  let testConfigId: string;

  beforeAll(async () => {
    supabase = await createServiceRoleClient();

    const userEmail = `db-advanced-${Date.now()}@example.com`;
    testUserId = await createTestUser(userEmail, { name: 'Advanced Test User' });
    testOrgId = await createTestOrganization('Advanced Test Org', testUserId);

    const domain = await insertAsAdmin('domains', {
      organization_id: testOrgId,
      domain: `advanced-test-${Date.now()}.example.com`,
      name: 'Advanced Test Domain',
      active: true
    });
    testDomainId = domain.id;

    const config = await insertAsAdmin('customer_configs', {
      organization_id: testOrgId,
      domain: `adv-config-${Date.now()}.example.com`,
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

  describe('Pagination', () => {
    let pageIds: string[] = [];

    beforeAll(async () => {
      // Insert 10 test pages
      for (let i = 0; i < 10; i++) {
        const { data } = await supabase
          .from('scraped_pages')
          .insert({
            domain_id: testDomainId,
            url: `https://test.com/page-${i}-${Date.now()}`,
            title: `Page ${i}`,
            content: `Content ${i}`,
            status: 'completed'
          })
          .select()
          .single();

        if (data) pageIds.push(data.id);
      }
    });

    afterAll(async () => {
      await supabase.from('scraped_pages').delete().in('id', pageIds);
    });

    it('should paginate with range', async () => {
      const { data: page1, error: error1 } = await supabase
        .from('scraped_pages')
        .select('*')
        .in('id', pageIds)
        .order('created_at')
        .range(0, 4); // First 5 records

      expect(error1).toBeNull();
      expect(page1?.length).toBe(5);

      const { data: page2, error: error2 } = await supabase
        .from('scraped_pages')
        .select('*')
        .in('id', pageIds)
        .order('created_at')
        .range(5, 9); // Next 5 records

      expect(error2).toBeNull();
      expect(page2?.length).toBe(5);

      // Verify no overlap
      const page1Ids = page1?.map(p => p.id) || [];
      const page2Ids = page2?.map(p => p.id) || [];
      const intersection = page1Ids.filter(id => page2Ids.includes(id));
      expect(intersection.length).toBe(0);
    });

    it('should limit results', async () => {
      const { data, error } = await supabase
        .from('scraped_pages')
        .select('*')
        .in('id', pageIds)
        .limit(3);

      expect(error).toBeNull();
      expect(data?.length).toBeLessThanOrEqual(3);
    });
  });

  describe('Join Operations', () => {
    let conversationId: string;
    let messageIds: string[] = [];

    beforeAll(async () => {
      // Create conversation
      const { data: conv } = await supabase
        .from('conversations')
        .insert({
          domain_id: testDomainId,
          session_id: `test-session-${Date.now()}`,
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      conversationId = conv!.id;

      // Create messages
      for (let i = 0; i < 3; i++) {
        const { data: msg } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            role: i % 2 === 0 ? 'user' : 'assistant',
            content: `Message ${i}`
          })
          .select()
          .single();

        if (msg) messageIds.push(msg.id);
      }
    });

    afterAll(async () => {
      await supabase.from('conversations').delete().eq('id', conversationId);
    });

    it('should perform foreign key join', async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          messages (
            id,
            role,
            content,
            created_at
          )
        `)
        .eq('id', conversationId)
        .single();

      expect(error).toBeNull();
      expect(data?.messages).toBeDefined();
      expect(Array.isArray(data?.messages)).toBe(true);
      expect(data?.messages.length).toBe(3);
    });
  });

  describe('Batch Operations', () => {
    it('should insert multiple records', async () => {
      const records = [
        {
          domain_id: testDomainId,
          url: `https://test.com/batch-1-${Date.now()}`,
          title: 'Batch 1',
          content: 'Batch content 1',
          status: 'completed'
        },
        {
          domain_id: testDomainId,
          url: `https://test.com/batch-2-${Date.now()}`,
          title: 'Batch 2',
          content: 'Batch content 2',
          status: 'completed'
        },
        {
          domain_id: testDomainId,
          url: `https://test.com/batch-3-${Date.now()}`,
          title: 'Batch 3',
          content: 'Batch content 3',
          status: 'completed'
        }
      ];

      const { data, error } = await supabase
        .from('scraped_pages')
        .insert(records)
        .select();

      expect(error).toBeNull();
      expect(data?.length).toBe(3);

      // Cleanup
      if (data) {
        const ids = data.map(d => d.id);
        await supabase.from('scraped_pages').delete().in('id', ids);
      }
    });

    it('should update multiple records', async () => {
      // Insert test data
      const { data: inserted } = await supabase
        .from('scraped_pages')
        .insert([
          {
            domain_id: testDomainId,
            url: `https://test.com/multi-update-1-${Date.now()}`,
            title: 'Multi 1',
            content: 'Content',
            status: 'pending'
          },
          {
            domain_id: testDomainId,
            url: `https://test.com/multi-update-2-${Date.now()}`,
            title: 'Multi 2',
            content: 'Content',
            status: 'pending'
          }
        ])
        .select();

      const ids = inserted?.map(d => d.id) || [];

      // Update all
      const { data: updated, error } = await supabase
        .from('scraped_pages')
        .update({ status: 'completed' })
        .in('id', ids)
        .select();

      expect(error).toBeNull();
      expect(updated?.every(p => p.status === 'completed')).toBe(true);

      // Cleanup
      await supabase.from('scraped_pages').delete().in('id', ids);
    });
  });
});
