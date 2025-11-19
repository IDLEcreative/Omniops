/**
 * Database Integration Tests: Scraped Content Embeddings
 *
 * Tests embeddings operations including:
 * - Embeddings cascade behavior
 * - Embedding queue operations
 * - Retry logic
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

describe('Database Integration: Scraped Content Embeddings', () => {
  let supabase: Awaited<ReturnType<typeof createServiceRoleClient>>;
  let testUserId: string;
  let testOrgId: string;
  let testDomainId: string;
  let testConfigId: string;

  beforeAll(async () => {
    supabase = await createServiceRoleClient();

    // Setup test environment
    const userEmail = `scraped-embeddings-${Date.now()}@example.com`;
    testUserId = await createTestUser(userEmail, { name: 'Embeddings Test User' });
    testOrgId = await createTestOrganization('Embeddings Test Org', testUserId);

    const domain = await insertAsAdmin('domains', {
      organization_id: testOrgId,
      domain: `embeddings-test-${Date.now()}.example.com`,
      name: 'Embeddings Test Domain',
      active: true
    });
    testDomainId = domain.id;

    const config = await insertAsAdmin('customer_configs', {
      organization_id: testOrgId,
      domain: `emb-config-${Date.now()}.example.com`,
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

  describe('Embeddings Cascade Behavior', () => {
    it('should delete embeddings when page is deleted', async () => {
      const url = `https://test.com/cascade-${Date.now()}`;

      // Create page
      const { data: page } = await supabase
        .from('scraped_pages')
        .insert({
          domain_id: testDomainId,
          url,
          title: 'Cascade Test',
          content: 'Content for cascade test',
          status: 'completed'
        })
        .select()
        .single();

      // Create embeddings
      const embedding1 = await supabase
        .from('page_embeddings')
        .insert({
          page_id: page!.id,
          domain_id: testConfigId,
          chunk_text: 'First chunk',
          embedding: Array(1536).fill(0.1)
        })
        .select()
        .single();

      const embedding2 = await supabase
        .from('page_embeddings')
        .insert({
          page_id: page!.id,
          domain_id: testConfigId,
          chunk_text: 'Second chunk',
          embedding: Array(1536).fill(0.2)
        })
        .select()
        .single();

      expect(embedding1.data).toBeDefined();
      expect(embedding2.data).toBeDefined();

      // Delete page
      await supabase.from('scraped_pages').delete().eq('id', page!.id);

      // Verify embeddings were deleted (cascade)
      const { data: deletedEmb1 } = await supabase
        .from('page_embeddings')
        .select()
        .eq('id', embedding1.data!.id)
        .single();

      const { data: deletedEmb2 } = await supabase
        .from('page_embeddings')
        .select()
        .eq('id', embedding2.data!.id)
        .single();

      expect(deletedEmb1).toBeNull();
      expect(deletedEmb2).toBeNull();
    });

    it('should maintain embeddings when page is updated', async () => {
      const url = `https://test.com/update-embeddings-${Date.now()}`;

      // Create page
      const { data: page } = await supabase
        .from('scraped_pages')
        .insert({
          domain_id: testDomainId,
          url,
          title: 'Update Test',
          content: 'Original content',
          status: 'completed'
        })
        .select()
        .single();

      // Create embedding
      const { data: embedding } = await supabase
        .from('page_embeddings')
        .insert({
          page_id: page!.id,
          domain_id: testConfigId,
          chunk_text: 'Embedding chunk',
          embedding: Array(1536).fill(0.3)
        })
        .select()
        .single();

      // Update page
      await supabase
        .from('scraped_pages')
        .update({ content: 'Updated content', title: 'Updated Title' })
        .eq('id', page!.id);

      // Verify embedding still exists
      const { data: stillExists } = await supabase
        .from('page_embeddings')
        .select()
        .eq('id', embedding!.id)
        .single();

      expect(stillExists).toBeDefined();
      expect(stillExists?.page_id).toBe(page!.id);

      // Cleanup
      await supabase.from('scraped_pages').delete().eq('id', page!.id);
    });
  });

  describe('Embedding Queue Operations', () => {
    it('should add page to embedding queue', async () => {
      const url = `https://test.com/queue-${Date.now()}`;
      const { data: page } = await supabase
        .from('scraped_pages')
        .insert({
          domain_id: testDomainId,
          url,
          title: 'Queue Test',
          content: 'Content to embed',
          status: 'completed'
        })
        .select()
        .single();

      // Add to queue
      const { data: queued, error } = await supabase
        .from('embedding_queue')
        .insert({
          page_id: page!.id,
          status: 'pending',
          retry_count: 0
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(queued?.page_id).toBe(page!.id);
      expect(queued?.status).toBe('pending');

      // Cleanup (will cascade delete queue entry)
      await supabase.from('scraped_pages').delete().eq('id', page!.id);
    });

    it('should handle embedding queue retry logic', async () => {
      const url = `https://test.com/retry-${Date.now()}`;
      const { data: page } = await supabase
        .from('scraped_pages')
        .insert({
          domain_id: testDomainId,
          url,
          title: 'Retry Test',
          content: 'Content',
          status: 'completed'
        })
        .select()
        .single();

      const { data: queued } = await supabase
        .from('embedding_queue')
        .insert({
          page_id: page!.id,
          status: 'failed',
          retry_count: 0,
          error_message: 'Initial failure'
        })
        .select()
        .single();

      // Increment retry count
      const { data: retried, error } = await supabase
        .from('embedding_queue')
        .update({
          retry_count: 1,
          status: 'pending',
          error_message: null
        })
        .eq('id', queued!.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(retried?.retry_count).toBe(1);
      expect(retried?.status).toBe('pending');

      // Cleanup
      await supabase.from('scraped_pages').delete().eq('id', page!.id);
    });
  });
});
