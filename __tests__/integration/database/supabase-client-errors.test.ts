/**
 * Database Integration Tests: Supabase Client Error Handling
 *
 * Tests error handling and transaction behavior.
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

describe('Database Integration: Supabase Client Errors', () => {
  let supabase: Awaited<ReturnType<typeof createServiceRoleClient>>;
  let testUserId: string;
  let testOrgId: string;
  let testDomainId: string;
  let testConfigId: string;

  beforeAll(async () => {
    supabase = await createServiceRoleClient();

    const userEmail = `db-errors-${Date.now()}@example.com`;
    testUserId = await createTestUser(userEmail, { name: 'Errors Test User' });
    testOrgId = await createTestOrganization('Errors Test Org', testUserId);

    const domain = await insertAsAdmin('domains', {
      organization_id: testOrgId,
      domain: `errors-test-${Date.now()}.example.com`,
      name: 'Errors Test Domain',
      active: true
    });
    testDomainId = domain.id;

    const config = await insertAsAdmin('customer_configs', {
      organization_id: testOrgId,
      domain: `err-config-${Date.now()}.example.com`,
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

  describe('Error Handling', () => {
    it('should handle unique constraint violation', async () => {
      const url = `https://test.com/unique-${Date.now()}`;

      // Insert first record
      const { data: first } = await supabase
        .from('scraped_pages')
        .insert({
          domain_id: testDomainId,
          url,
          title: 'First',
          content: 'Content',
          status: 'completed'
        })
        .select()
        .single();

      // Try to insert duplicate URL
      const { data: second, error } = await supabase
        .from('scraped_pages')
        .insert({
          domain_id: testDomainId,
          url, // Same URL - should fail
          title: 'Second',
          content: 'Content',
          status: 'completed'
        })
        .select()
        .single();

      expect(error).toBeDefined();
      expect(error?.code).toBe('23505'); // Unique violation
      expect(second).toBeNull();

      // Cleanup
      if (first) {
        await supabase.from('scraped_pages').delete().eq('id', first.id);
      }
    });

    it('should handle foreign key constraint violation', async () => {
      const nonExistentDomainId = '00000000-0000-0000-0000-000000000000';

      const { data, error } = await supabase
        .from('scraped_pages')
        .insert({
          domain_id: nonExistentDomainId,
          url: `https://test.com/fk-violation-${Date.now()}`,
          title: 'FK Test',
          content: 'Content',
          status: 'completed'
        })
        .select()
        .single();

      expect(error).toBeDefined();
      expect(error?.code).toBe('23503'); // Foreign key violation
      expect(data).toBeNull();
    });

    it('should handle null constraint violation', async () => {
      const { data, error } = await supabase
        .from('scraped_pages')
        .insert({
          domain_id: testDomainId,
          // url is required but missing
          title: 'Null Test',
          content: 'Content',
          status: 'completed'
        } as any)
        .select()
        .single();

      expect(error).toBeDefined();
      expect(data).toBeNull();
    });
  });

  describe('Transaction Behavior', () => {
    it('should handle cascade delete', async () => {
      // Create page
      const { data: page } = await supabase
        .from('scraped_pages')
        .insert({
          domain_id: testDomainId,
          url: `https://test.com/cascade-${Date.now()}`,
          title: 'Cascade Test',
          content: 'Content for cascade',
          status: 'completed'
        })
        .select()
        .single();

      // Create embedding for the page
      const { data: embedding } = await supabase
        .from('page_embeddings')
        .insert({
          page_id: page!.id,
          domain_id: testConfigId,
          chunk_text: 'Test chunk',
          embedding: Array(1536).fill(0) // OpenAI embedding dimensions
        })
        .select()
        .single();

      expect(embedding).toBeDefined();

      // Delete page (should cascade to embedding)
      await supabase.from('scraped_pages').delete().eq('id', page!.id);

      // Verify embedding was deleted
      const { data: deletedEmbedding } = await supabase
        .from('page_embeddings')
        .select()
        .eq('id', embedding!.id)
        .single();

      expect(deletedEmbedding).toBeNull();
    });
  });
});
