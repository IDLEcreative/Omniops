/**
 * Database Integration Tests: Conversations & Messages CRUD
 *
 * Tests basic conversation and message operations.
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

describe('Database Integration: Conversations & Messages CRUD', () => {
  let supabase: Awaited<ReturnType<typeof createServiceRoleClient>>;
  let testUserId: string;
  let testOrgId: string;
  let testDomainId: string;

  beforeAll(async () => {
    supabase = await createServiceRoleClient();

    const testUserEmail = `conv-test-${Date.now()}@example.com`;
    testUserId = await createTestUser(testUserEmail, { name: 'Conv Test User' });
    testOrgId = await createTestOrganization('Conv Test Org', testUserId);

    const domain = await insertAsAdmin('domains', {
      organization_id: testOrgId,
      domain: `conv-test-${Date.now()}.example.com`,
      name: 'Conv Test Domain',
      active: true
    });
    testDomainId = domain.id;
  });

  afterAll(async () => {
    await deleteAsAdmin('domains', { id: testDomainId });
    await deleteTestOrganization(testOrgId);
    await deleteTestUser(testUserId);
  });

  describe('Conversation Operations', () => {
    it('should create a conversation', async () => {
      const sessionId = `session-${Date.now()}`;
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          domain_id: testDomainId,
          session_id: sessionId,
          started_at: new Date().toISOString(),
          metadata: { source: 'test', user_agent: 'jest' }
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.session_id).toBe(sessionId);
      expect(data?.domain_id).toBe(testDomainId);
      expect(data?.metadata).toEqual({ source: 'test', user_agent: 'jest' });

      // Cleanup
      if (data) {
        await supabase.from('conversations').delete().eq('id', data.id);
      }
    });

    it('should update conversation metadata', async () => {
      const { data: conv } = await supabase
        .from('conversations')
        .insert({
          domain_id: testDomainId,
          session_id: `update-session-${Date.now()}`,
          started_at: new Date().toISOString(),
          metadata: { status: 'active' }
        })
        .select()
        .single();

      // Update metadata
      const { data: updated, error } = await supabase
        .from('conversations')
        .update({
          metadata: { status: 'completed', rating: 5 },
          ended_at: new Date().toISOString()
        })
        .eq('id', conv!.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(updated?.metadata).toEqual({ status: 'completed', rating: 5 });
      expect(updated?.ended_at).toBeDefined();

      // Cleanup
      await supabase.from('conversations').delete().eq('id', conv!.id);
    });

    it('should retrieve conversation by session_id', async () => {
      const sessionId = `find-session-${Date.now()}`;
      const { data: conv } = await supabase
        .from('conversations')
        .insert({
          domain_id: testDomainId,
          session_id: sessionId,
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      // Find by session_id
      const { data: found, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      expect(error).toBeNull();
      expect(found?.id).toBe(conv!.id);

      // Cleanup
      await supabase.from('conversations').delete().eq('id', conv!.id);
    });
  });

  describe('Message Operations', () => {
    let conversationId: string;

    beforeEach(async () => {
      const { data: conv } = await supabase
        .from('conversations')
        .insert({
          domain_id: testDomainId,
          session_id: `msg-test-${Date.now()}`,
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      conversationId = conv!.id;
    });

    afterEach(async () => {
      await supabase.from('conversations').delete().eq('id', conversationId);
    });

    it('should add messages to conversation', async () => {
      const messages = [
        { role: 'user', content: 'Hello, how can I help you?' },
        { role: 'assistant', content: 'I can answer questions about our products.' },
        { role: 'user', content: 'Tell me about product X' }
      ];

      const insertedMessages = [];
      for (const msg of messages) {
        const { data, error } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            role: msg.role,
            content: msg.content
          })
          .select()
          .single();

        expect(error).toBeNull();
        expect(data?.content).toBe(msg.content);
        insertedMessages.push(data);
      }

      expect(insertedMessages.length).toBe(3);
    });

    it('should retrieve conversation history', async () => {
      // Add messages
      const messages = [
        { role: 'user', content: 'First message' },
        { role: 'assistant', content: 'Second message' },
        { role: 'user', content: 'Third message' }
      ];

      for (const msg of messages) {
        await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            role: msg.role,
            content: msg.content
          });
      }

      // Retrieve with join
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
      expect(data?.messages.length).toBe(3);
      expect(data?.messages[0].content).toBe('First message');
    });

    it('should maintain message order by timestamp', async () => {
      // Insert messages with small delays to ensure different timestamps
      const messages = [];
      for (let i = 0; i < 5; i++) {
        const { data } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            role: i % 2 === 0 ? 'user' : 'assistant',
            content: `Message ${i}`
          })
          .select()
          .single();

        messages.push(data);
        // Small delay to ensure different timestamps
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // Retrieve ordered by created_at
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      expect(error).toBeNull();
      expect(data?.length).toBe(5);

      // Verify order
      for (let i = 0; i < 5; i++) {
        expect(data?.[i].content).toBe(`Message ${i}`);
      }
    });

    it('should filter messages by role', async () => {
      // Add mixed messages
      await supabase.from('messages').insert([
        { conversation_id: conversationId, role: 'user', content: 'User 1' },
        { conversation_id: conversationId, role: 'assistant', content: 'Assistant 1' },
        { conversation_id: conversationId, role: 'user', content: 'User 2' },
        { conversation_id: conversationId, role: 'assistant', content: 'Assistant 2' }
      ]);

      // Get only user messages
      const { data: userMsgs } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('role', 'user');

      // Get only assistant messages
      const { data: assistantMsgs } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('role', 'assistant');

      expect(userMsgs?.length).toBe(2);
      expect(assistantMsgs?.length).toBe(2);
    });
  });
});
