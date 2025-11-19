/**
 * Database Integration Tests: Conversations & Messages RLS
 *
 * Tests Row Level Security enforcement for conversations and messages.
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import {
  createTestUser,
  deleteTestUser,
  createTestOrganization,
  deleteTestOrganization,
  insertAsAdmin,
  deleteAsAdmin,
  queryAsUser
} from '@/test-utils/rls-test-helpers';

describe('Database Integration: Conversations & Messages RLS', () => {
  let supabase: Awaited<ReturnType<typeof createServiceRoleClient>>;
  let user1Id: string;
  let user1Email: string;
  let user2Id: string;
  let user2Email: string;
  let org1Id: string;
  let org2Id: string;
  let domain1Id: string;
  let domain2Id: string;
  let conv1Id: string;
  let conv2Id: string;

  beforeAll(async () => {
    supabase = await createServiceRoleClient();

    // Create two users with separate organizations and domains
    user1Email = `rls-conv1-${Date.now()}@example.com`;
    user2Email = `rls-conv2-${Date.now()}@example.com`;

    user1Id = await createTestUser(user1Email, { name: 'RLS User 1' });
    user2Id = await createTestUser(user2Email, { name: 'RLS User 2' });

    org1Id = await createTestOrganization('RLS Org 1', user1Id);
    org2Id = await createTestOrganization('RLS Org 2', user2Id);

    const domain1 = await insertAsAdmin('domains', {
      organization_id: org1Id,
      domain: `rls-domain1-${Date.now()}.example.com`,
      name: 'RLS Domain 1',
      active: true
    });
    domain1Id = domain1.id;

    const domain2 = await insertAsAdmin('domains', {
      organization_id: org2Id,
      domain: `rls-domain2-${Date.now()}.example.com`,
      name: 'RLS Domain 2',
      active: true
    });
    domain2Id = domain2.id;

    // Create conversations
    const { data: conv1 } = await supabase
      .from('conversations')
      .insert({
        domain_id: domain1Id,
        session_id: `rls-session1-${Date.now()}`,
        started_at: new Date().toISOString()
      })
      .select()
      .single();
    conv1Id = conv1!.id;

    const { data: conv2 } = await supabase
      .from('conversations')
      .insert({
        domain_id: domain2Id,
        session_id: `rls-session2-${Date.now()}`,
        started_at: new Date().toISOString()
      })
      .select()
      .single();
    conv2Id = conv2!.id;
  });

  afterAll(async () => {
    await supabase.from('conversations').delete().eq('id', conv1Id);
    await supabase.from('conversations').delete().eq('id', conv2Id);
    await deleteAsAdmin('domains', { id: domain1Id });
    await deleteAsAdmin('domains', { id: domain2Id });
    await deleteTestOrganization(org1Id);
    await deleteTestOrganization(org2Id);
    await deleteTestUser(user1Id);
    await deleteTestUser(user2Id);
  });

  describe('RLS Enforcement', () => {
    it('should allow user to access own domain conversations', async () => {
      const conversations = await queryAsUser(user1Email, 'conversations', {
        domain_id: domain1Id
      });

      expect(conversations.length).toBeGreaterThan(0);
      expect(conversations.some(c => c.id === conv1Id)).toBe(true);
    });

    it('should prevent cross-domain access', async () => {
      // User 1 should NOT see Domain 2's conversations
      const conversations = await queryAsUser(user1Email, 'conversations', {
        domain_id: domain2Id
      });

      expect(conversations.length).toBe(0);
      expect(conversations.some(c => c.id === conv2Id)).toBe(false);
    });
  });
});
