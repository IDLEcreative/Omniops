/**
 * Database Integration Tests: Conversations & Messages Cascade & Pagination
 *
 * Tests cascade delete behavior and pagination.
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

describe('Database Integration: Conversations & Messages Cascade', () => {
  let supabase: Awaited<ReturnType<typeof createServiceRoleClient>>;
  let testUserId: string;
  let testOrgId: string;
  let testDomainId: string;

  beforeAll(async () => {
    supabase = await createServiceRoleClient();

    const testUserEmail = `conv-cascade-${Date.now()}@example.com`;
    testUserId = await createTestUser(testUserEmail, { name: 'Cascade Test User' });
    testOrgId = await createTestOrganization('Cascade Test Org', testUserId);

    const domain = await insertAsAdmin('domains', {
      organization_id: testOrgId,
      domain: `cascade-test-${Date.now()}.example.com`,
      name: 'Cascade Test Domain',
      active: true
    });
    testDomainId = domain.id;
  });

  afterAll(async () => {
    await deleteAsAdmin('domains', { id: testDomainId });
    await deleteTestOrganization(testOrgId);
    await deleteTestUser(testUserId);
  });

  describe('Delete with Cascade', () => {
    it('should delete messages when conversation is deleted', async () => {
      const { data: conv } = await supabase
        .from('conversations')
        .insert({
          domain_id: testDomainId,
          session_id: `cascade-${Date.now()}`,
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      // Add messages
      const messageIds = [];
      for (let i = 0; i < 3; i++) {
        const { data: msg } = await supabase
          .from('messages')
          .insert({
            conversation_id: conv!.id,
            role: 'user',
            content: `Message ${i}`
          })
          .select()
          .single();

        messageIds.push(msg!.id);
      }

      // Delete conversation
      await supabase.from('conversations').delete().eq('id', conv!.id);

      // Verify messages were deleted
      const { data: deletedMsgs } = await supabase
        .from('messages')
        .select('*')
        .in('id', messageIds);

      expect(deletedMsgs?.length).toBe(0);
    });

    it('should delete telemetry when conversation is deleted', async () => {
      const { data: conv } = await supabase
        .from('conversations')
        .insert({
          domain_id: testDomainId,
          session_id: `telemetry-cascade-${Date.now()}`,
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      // Add telemetry
      const { data: telemetry } = await supabase
        .from('chat_telemetry')
        .insert({
          conversation_id: conv!.id,
          session_id: conv!.session_id,
          model: 'gpt-4',
          start_time: new Date().toISOString(),
          duration_ms: 1000,
          tokens_used: 100,
          success: true
        })
        .select()
        .single();

      expect(telemetry).toBeDefined();

      // Delete conversation
      await supabase.from('conversations').delete().eq('id', conv!.id);

      // Verify telemetry was deleted
      const { data: deletedTelemetry } = await supabase
        .from('chat_telemetry')
        .select('*')
        .eq('id', telemetry!.id)
        .single();

      expect(deletedTelemetry).toBeNull();
    });
  });

  describe('Pagination', () => {
    let conversationId: string;
    let messageIds: string[] = [];

    beforeAll(async () => {
      const { data: conv } = await supabase
        .from('conversations')
        .insert({
          domain_id: testDomainId,
          session_id: `pagination-${Date.now()}`,
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      conversationId = conv!.id;

      // Add 20 messages
      for (let i = 0; i < 20; i++) {
        const { data: msg } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            role: i % 2 === 0 ? 'user' : 'assistant',
            content: `Message ${i}`
          })
          .select()
          .single();

        messageIds.push(msg!.id);
        await new Promise(resolve => setTimeout(resolve, 5));
      }
    });

    afterAll(async () => {
      await supabase.from('conversations').delete().eq('id', conversationId);
    });

    it('should paginate messages with range', async () => {
      // First page (0-9)
      const { data: page1 } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .range(0, 9);

      // Second page (10-19)
      const { data: page2 } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .range(10, 19);

      expect(page1?.length).toBe(10);
      expect(page2?.length).toBe(10);

      // Verify no overlap
      const page1Ids = page1?.map(m => m.id) || [];
      const page2Ids = page2?.map(m => m.id) || [];
      const intersection = page1Ids.filter(id => page2Ids.includes(id));
      expect(intersection.length).toBe(0);
    });

    it('should limit message results', async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(5);

      expect(data?.length).toBe(5);
      // Should be most recent messages
      expect(data?.[0].content).toContain('Message 19');
    });
  });
});
