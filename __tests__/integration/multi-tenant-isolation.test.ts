/**
 * Multi-Tenant Data Isolation Tests
 * CRITICAL SECURITY: Verify cross-tenant data cannot be accessed
 *
 * These tests ensure that:
 * 1. Organizations cannot access each other's data
 * 2. Conversations are isolated by domain
 * 3. Embeddings are filtered by domain
 * 4. Members cannot access other organizations
 * 5. RLS policies are enforced
 *
 * IMPORTANT: These tests use REAL USER SESSIONS to validate RLS policies.
 * Service keys bypass RLS, so they CANNOT be used for security testing.
 *
 * @jest-environment node
 */

import dotenv from 'dotenv';
import {
  setupRLSTest,
  expectRLSBlocked,
  expectRLSAllowed,
  createTestUser,
  deleteTestUser,
  createUserClient,
  insertAsAdmin,
  queryAsAdmin,
  queryAsUser,
  deleteAsAdmin
} from '@/test-utils/rls-test-helpers';

// Mark as E2E test to use real credentials (not mocks)
process.env.E2E_TEST = 'true';

// Load real environment variables for RLS testing
// The Jest setup file overrides these with mocks, but RLS tests need real credentials
if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('birugqyuqhiahxvxeyqg')) {
  // Force-load from .env.local (override=true)
  dotenv.config({ path: '.env.local', override: true });
}

// Skip if credentials not available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const shouldRun = supabaseUrl &&
  supabaseUrl.includes('supabase.co') && // Ensure it's a real URL, not mock
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  process.env.SUPABASE_SERVICE_ROLE_KEY;

// Skip these tests if running in CI or if explicitly disabled
// These are E2E tests that require real Supabase user authentication
const SKIP_E2E = process.env.CI === 'true' || process.env.SKIP_E2E === 'true';
const describeE2E = SKIP_E2E ? describe.skip : describe;

describeE2E('Multi-Tenant Data Isolation [Requires Real Supabase]', () => {
  const rlsTest = setupRLSTest();
  let configId1: string;
  let configId2: string;
  let domainId1: string;
  let domainId2: string;

  beforeAll(async () => {
    if (!shouldRun) {
      console.warn('Skipping multi-tenant tests - missing Supabase credentials');
      return;
    }

    // Setup users and organizations with proper RLS
    await rlsTest.setup();

    const timestamp = Date.now();

    // Create domains for scraped content
    const domain1 = await insertAsAdmin('domains', {
      organization_id: rlsTest.org1Id,
      domain: `test1-${timestamp}.example.com`,
      name: 'Test Domain 1',
      description: 'Test domain for org 1',
      active: true
    });
    domainId1 = domain1.id;

    const domain2 = await insertAsAdmin('domains', {
      organization_id: rlsTest.org2Id,
      domain: `test2-${timestamp}.example.com`,
      name: 'Test Domain 2',
      description: 'Test domain for org 2',
      active: true
    });
    domainId2 = domain2.id;

    // Create customer configs for chatbot
    const config1 = await insertAsAdmin('customer_configs', {
      organization_id: rlsTest.org1Id,
      domain: `test1-${timestamp}.example.com`,
      business_name: 'Test Business 1',
      business_description: 'E-commerce test business for org 1',
      app_id: `app_test1_${timestamp.toString().slice(-8)}`
    });
    configId1 = config1.id;

    const config2 = await insertAsAdmin('customer_configs', {
      organization_id: rlsTest.org2Id,
      domain: `test2-${timestamp}.example.com`,
      business_name: 'Test Business 2',
      business_description: 'E-commerce test business for org 2',
      app_id: `app_test2_${timestamp.toString().slice(-8)}`
    });
    configId2 = config2.id;
  });

  afterAll(async () => {
    if (!shouldRun) return;

    // Cleanup in proper order (child records first)
    // Only delete if IDs were successfully created
    if (configId1) await deleteAsAdmin('customer_configs', { id: configId1 });
    if (configId2) await deleteAsAdmin('customer_configs', { id: configId2 });
    if (domainId1) await deleteAsAdmin('domains', { id: domainId1 });
    if (domainId2) await deleteAsAdmin('domains', { id: domainId2 });

    // Cleanup RLS test data (organizations and users)
    await rlsTest.teardown();
  });

  describe('Organization Isolation', () => {
    it('should prevent access to other organization\'s customer configs', async () => {
      if (!shouldRun) return;

      // User 1 should NOT be able to see org2's configs
      const user1Configs = await queryAsUser(rlsTest.user1Email, 'customer_configs', {
        id: configId2
      });
      expect(user1Configs.length).toBe(0);

      // User 2 should NOT be able to see org1's configs
      const user2Configs = await queryAsUser(rlsTest.user2Email, 'customer_configs', {
        id: configId1
      });
      expect(user2Configs.length).toBe(0);
    });

    it('should allow access to own organization\'s customer configs', async () => {
      if (!shouldRun) return;

      // User 1 SHOULD be able to see org1's configs
      const user1Configs = await queryAsUser(rlsTest.user1Email, 'customer_configs', {
        id: configId1
      });
      expect(user1Configs.length).toBeGreaterThan(0);
      expect(user1Configs[0].id).toBe(configId1);

      // User 2 SHOULD be able to see org2's configs
      const user2Configs = await queryAsUser(rlsTest.user2Email, 'customer_configs', {
        id: configId2
      });
      expect(user2Configs.length).toBeGreaterThan(0);
      expect(user2Configs[0].id).toBe(configId2);
    });

    it('should prevent listing other organization\'s members', async () => {
      if (!shouldRun) return;

      // User 1 tries to list all organization members
      // Should only see their own org's members
      const members = await queryAsUser(rlsTest.user1Email, 'organization_members', {});
      const orgIds = members.map(m => m.organization_id);

      // Should see org1's members
      expect(orgIds).toContain(rlsTest.org1Id);
      // Should NOT see org2's members
      expect(orgIds).not.toContain(rlsTest.org2Id);
    });
  });

  describe('Conversation Isolation', () => {
    let conv1Id: string;
    let conv2Id: string;

    beforeAll(async () => {
      if (!shouldRun) return;

      // Create conversations for each domain using REST API
      const conv1 = await insertAsAdmin('conversations', {
        domain_id: domainId1,
        session_id: `session-org1-${Date.now()}`
      });
      conv1Id = conv1.id;

      const conv2 = await insertAsAdmin('conversations', {
        domain_id: domainId2,
        session_id: `session-org2-${Date.now()}`
      });
      conv2Id = conv2.id;

      // Add messages to each conversation
      await insertAsAdmin('messages', {
        conversation_id: conv1Id,
        role: 'user',
        content: 'Org 1 secret message'
      });

      await insertAsAdmin('messages', {
        conversation_id: conv2Id,
        role: 'user',
        content: 'Org 2 secret message'
      });
    });

    afterAll(async () => {
      if (!shouldRun) return;

      // Cleanup using REST API - only if conversations were created
      if (conv1Id) {
        await deleteAsAdmin('messages', { conversation_id: conv1Id });
        await deleteAsAdmin('conversations', { id: conv1Id });
      }
      if (conv2Id) {
        await deleteAsAdmin('messages', { conversation_id: conv2Id });
        await deleteAsAdmin('conversations', { id: conv2Id });
      }
    });

    it('should prevent access to other domain\'s conversations', async () => {
      if (!shouldRun) return;

      // User 1 should NOT see user 2's conversation
      const user1Convs = await queryAsUser(rlsTest.user1Email, 'conversations', {
        id: conv2Id
      });
      expect(user1Convs.length).toBe(0);

      // User 2 should NOT see user 1's conversation
      const user2Convs = await queryAsUser(rlsTest.user2Email, 'conversations', {
        id: conv1Id
      });
      expect(user2Convs.length).toBe(0);
    });

    it('should prevent access to other domain\'s messages', async () => {
      if (!shouldRun) return;

      // User 1 queries all messages - should only see org1's messages
      const messages = await queryAsUser(rlsTest.user1Email, 'messages', {});
      const contents = messages.map(m => m.content);

      // Should NOT contain org2's secret message
      expect(contents).not.toContain('Org 2 secret message');

      // User 2 queries all messages - should only see org2's messages
      const messages2 = await queryAsUser(rlsTest.user2Email, 'messages', {});
      const contents2 = messages2.map(m => m.content);

      // Should NOT contain org1's secret message
      expect(contents2).not.toContain('Org 1 secret message');
    });
  });

  describe('Embeddings Isolation', () => {
    let page1Id: string;
    let page2Id: string;
    let embed1Id: string;
    let embed2Id: string;
    const testTimestamp = Date.now();

    beforeAll(async () => {
      if (!shouldRun) return;

      // Clean up any existing test data from previous failed runs
      // This prevents duplicate key violations on the unique url constraint
      try {
        await deleteAsAdmin('scraped_pages', { url: `https://test1-${testTimestamp}.example.com/page1` });
      } catch (e) {
        // Ignore errors if records don't exist
      }
      try {
        await deleteAsAdmin('scraped_pages', { url: `https://test2-${testTimestamp}.example.com/page2` });
      } catch (e) {
        // Ignore errors if records don't exist
      }

      // Create scraped pages for each domain using REST API
      // Use unique URLs per test run to avoid conflicts
      const page1 = await insertAsAdmin('scraped_pages', {
        domain_id: domainId1, // FK references domains.id
        url: `https://test1-${testTimestamp}.example.com/page1`,
        title: 'Org 1 Page',
        content: 'Org 1 content',
        content_hash: `hash1-${testTimestamp}`
      });
      page1Id = page1.id;

      const page2 = await insertAsAdmin('scraped_pages', {
        domain_id: domainId2, // FK references domains.id
        url: `https://test2-${testTimestamp}.example.com/page2`,
        title: 'Org 2 Page',
        content: 'Org 2 content',
        content_hash: `hash2-${testTimestamp}`
      });
      page2Id = page2.id;

      // Create embeddings (with dummy vectors)
      const dummyVector = Array(1536).fill(0.1);

      const embed1 = await insertAsAdmin('page_embeddings', {
        page_id: page1Id,
        domain_id: configId1, // FK references customer_configs.id
        chunk_text: 'Org 1 chunk',
        embedding: dummyVector
      });
      embed1Id = embed1.id;

      const embed2 = await insertAsAdmin('page_embeddings', {
        page_id: page2Id,
        domain_id: configId2, // FK references customer_configs.id
        chunk_text: 'Org 2 chunk',
        embedding: dummyVector
      });
      embed2Id = embed2.id;
    });

    afterAll(async () => {
      if (!shouldRun) return;

      // Cleanup using REST API - only if records were created
      if (embed1Id) await deleteAsAdmin('page_embeddings', { id: embed1Id });
      if (embed2Id) await deleteAsAdmin('page_embeddings', { id: embed2Id });
      if (page1Id) await deleteAsAdmin('scraped_pages', { id: page1Id });
      if (page2Id) await deleteAsAdmin('scraped_pages', { id: page2Id });
    });

    it('should prevent access to other domain\'s embeddings', async () => {
      if (!shouldRun) return;

      // User 1 queries embeddings - should only see org1's
      const embeddings = await queryAsUser(rlsTest.user1Email, 'page_embeddings', {});
      const contents = embeddings.map(e => e.chunk_text);

      // Should NOT contain org2's embeddings
      expect(contents).not.toContain('Org 2 chunk');

      // User 2 queries embeddings - should only see org2's
      const embeddings2 = await queryAsUser(rlsTest.user2Email, 'page_embeddings', {});
      const contents2 = embeddings2.map(e => e.chunk_text);

      // Should NOT contain org1's embeddings
      expect(contents2).not.toContain('Org 1 chunk');
    }, 15000); // Increase timeout to 15 seconds for large embedding tables

    it('should prevent access to other domain\'s scraped pages', async () => {
      if (!shouldRun) return;

      // User 1 should NOT see user 2's pages
      const user1Pages = await queryAsUser(rlsTest.user1Email, 'scraped_pages', {
        id: page2Id
      });
      expect(user1Pages.length).toBe(0);

      // User 2 should NOT see user 1's pages
      const user2Pages = await queryAsUser(rlsTest.user2Email, 'scraped_pages', {
        id: page1Id
      });
      expect(user2Pages.length).toBe(0);
    });
  });

  describe('Query Cache Isolation', () => {
    let cache1Hash: string;
    let cache2Hash: string;

    beforeAll(async () => {
      if (!shouldRun) return;

      cache1Hash = `hash1-${Date.now()}`;
      cache2Hash = `hash2-${Date.now()}`;

      // Insert cached queries for both configs using REST API
      // Note: query_cache.domain_id references customer_configs.id
      await insertAsAdmin('query_cache', {
        domain_id: configId1,
        query_hash: cache1Hash,
        query_text: 'test query org1',
        results: { data: 'org1 response' }
      });

      await insertAsAdmin('query_cache', {
        domain_id: configId2,
        query_hash: cache2Hash,
        query_text: 'test query org2',
        results: { data: 'org2 response' }
      });
    });

    afterAll(async () => {
      if (!shouldRun) return;

      // Cleanup using REST API - only if cache entries were created
      if (cache1Hash) await deleteAsAdmin('query_cache', { query_hash: cache1Hash });
      if (cache2Hash) await deleteAsAdmin('query_cache', { query_hash: cache2Hash });
    });

    it('should prevent access to other domain\'s query cache', async () => {
      if (!shouldRun) return;

      // User 1 queries cache - should only see org1's cache
      const cache = await queryAsUser(rlsTest.user1Email, 'query_cache', {});
      const results = cache.map(c => c.results);

      // Should NOT contain org2's cached results
      expect(results).not.toContainEqual({ data: 'org2 response' });

      // User 2 queries cache - should only see org2's cache
      const cache2 = await queryAsUser(rlsTest.user2Email, 'query_cache', {});
      const results2 = cache2.map(c => c.results);

      // Should NOT contain org1's cached results
      expect(results2).not.toContainEqual({ data: 'org1 response' });
    });
  });
});
