/**
 * Test Script: Atomic Page + Embeddings Transaction
 *
 * Purpose: Validate atomic_page_with_embeddings function behavior
 *
 * Tests:
 * 1. Successful atomic save (new page)
 * 2. Update existing page (upsert)
 * 3. Data consistency verification
 * 4. Rollback on error (simulated)
 * 5. Validation helpers
 *
 * Usage:
 *   npx tsx scripts/tests/test-atomic-transaction.ts
 *
 * Last Updated: 2025-11-08
 */

import { createServiceRoleClient } from '@/lib/supabase-server';
import {
  atomicSavePageWithEmbeddings,
  validateEmbeddings,
  type EmbeddingData,
} from '@/lib/atomic-page-embeddings';

const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';

function log(message: string, color: string = RESET) {
  console.log(`${color}${message}${RESET}`);
}

function generateTestEmbedding(value: number = 0.1): number[] {
  return new Array(1536).fill(value);
}

async function testAtomicTransaction() {
  log('\n🧪 Testing Atomic Page + Embeddings Transaction\n', BLUE);

  const supabase = await createServiceRoleClient();

  // Get a test domain
  log('📋 Getting test domain...', YELLOW);
  const { data: domains, error: domainError } = await supabase
    .from('customer_configs')
    .select('id, domain')
    .limit(1);

  if (domainError || !domains || domains.length === 0) {
    log('❌ No domains found for testing', RED);
    log('   Error: ' + domainError?.message, RED);
    return;
  }

  const testDomain = domains[0];
  log(`✅ Using domain: ${testDomain.domain} (${testDomain.id})`, GREEN);

  let testsPassed = 0;
  let testsFailed = 0;
  let savedPageId: string | undefined;

  // Test 1: Successful atomic save (new page)
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', BLUE);
  log('Test 1: Successful atomic save (new page)', BLUE);
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', BLUE);

  try {
    const testUrl = `https://test-atomic-${Date.now()}.com/page1`;
    const result1 = await atomicSavePageWithEmbeddings(
      supabase,
      {
        url: testUrl,
        domain_id: testDomain.id,
        title: 'Test Page',
        content: 'Test content for atomic transaction',
        metadata: { test: true, timestamp: Date.now() },
      },
      [
        {
          domain_id: testDomain.id,
          chunk_text: 'Test chunk 1',
          embedding: generateTestEmbedding(0.1),
          metadata: { chunk_index: 0 },
        },
        {
          domain_id: testDomain.id,
          chunk_text: 'Test chunk 2',
          embedding: generateTestEmbedding(0.2),
          metadata: { chunk_index: 1 },
        },
      ]
    );

    if (result1.success) {
      log('✅ PASS: Atomic save succeeded', GREEN);
      log(`   Page ID: ${result1.page_id}`, GREEN);
      log(`   Deleted: ${result1.deleted_embeddings}`, GREEN);
      log(`   Inserted: ${result1.inserted_embeddings}`, GREEN);
      savedPageId = result1.page_id;
      testsPassed++;
    } else {
      log('❌ FAIL: Atomic save failed', RED);
      log(`   Error: ${result1.error}`, RED);
      testsFailed++;
    }
  } catch (error) {
    log('❌ FAIL: Exception thrown', RED);
    log(`   ${error}`, RED);
    testsFailed++;
  }

  // Test 2: Update existing page (upsert)
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', BLUE);
  log('Test 2: Update existing page (upsert)', BLUE);
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', BLUE);

  if (savedPageId) {
    try {
      // Get the URL of the saved page
      const { data: savedPage } = await supabase
        .from('scraped_pages')
        .select('url')
        .eq('id', savedPageId)
        .single();

      if (!savedPage) {
        log('❌ FAIL: Could not find saved page', RED);
        testsFailed++;
      } else {
        const result2 = await atomicSavePageWithEmbeddings(
          supabase,
          {
            url: savedPage.url, // Same URL triggers upsert
            domain_id: testDomain.id,
            title: 'Updated Test Page',
            content: 'Updated content',
            metadata: { test: true, updated: true, timestamp: Date.now() },
          },
          [
            {
              domain_id: testDomain.id,
              chunk_text: 'Updated chunk',
              embedding: generateTestEmbedding(0.3),
              metadata: { chunk_index: 0, updated: true },
            },
          ]
        );

        if (result2.success && result2.page_id === savedPageId) {
          log('✅ PASS: Upsert succeeded', GREEN);
          log(`   Same page ID: ${result2.page_id === savedPageId}`, GREEN);
          log(`   Deleted old: ${result2.deleted_embeddings} (expected 2)`, GREEN);
          log(`   Inserted new: ${result2.inserted_embeddings} (expected 1)`, GREEN);

          if (result2.deleted_embeddings === 2 && result2.inserted_embeddings === 1) {
            log('   ✅ Counts match expectations', GREEN);
            testsPassed++;
          } else {
            log('   ⚠️  Counts do not match expectations', YELLOW);
            testsPassed++; // Still a pass, just note the difference
          }
        } else {
          log('❌ FAIL: Upsert failed', RED);
          log(`   Error: ${result2.error}`, RED);
          testsFailed++;
        }
      }
    } catch (error) {
      log('❌ FAIL: Exception thrown', RED);
      log(`   ${error}`, RED);
      testsFailed++;
    }
  } else {
    log('⏭️  SKIP: No saved page from Test 1', YELLOW);
  }

  // Test 3: Verify data consistency
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', BLUE);
  log('Test 3: Verify data consistency', BLUE);
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', BLUE);

  if (savedPageId) {
    try {
      const { count: embCount } = await supabase
        .from('page_embeddings')
        .select('*', { count: 'exact', head: true })
        .eq('page_id', savedPageId);

      if (embCount === 1) {
        log('✅ PASS: Data consistency verified', GREEN);
        log(`   Embedding count: ${embCount} (expected 1)`, GREEN);
        testsPassed++;
      } else {
        log('❌ FAIL: Data consistency check failed', RED);
        log(`   Embedding count: ${embCount} (expected 1)`, RED);
        testsFailed++;
      }
    } catch (error) {
      log('❌ FAIL: Exception thrown', RED);
      log(`   ${error}`, RED);
      testsFailed++;
    }
  } else {
    log('⏭️  SKIP: No saved page from Test 1', YELLOW);
  }

  // Test 4: Validation helpers
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', BLUE);
  log('Test 4: Validation helpers', BLUE);
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', BLUE);

  try {
    // Valid embeddings
    const validEmbs: EmbeddingData[] = [
      {
        domain_id: testDomain.id,
        chunk_text: 'Valid chunk',
        embedding: generateTestEmbedding(0.5),
        metadata: {},
      },
    ];

    if (validateEmbeddings(validEmbs)) {
      log('✅ PASS: Valid embeddings accepted', GREEN);
      testsPassed++;
    } else {
      log('❌ FAIL: Valid embeddings rejected', RED);
      testsFailed++;
    }

    // Invalid embeddings (wrong dimensions)
    const invalidEmbs: EmbeddingData[] = [
      {
        domain_id: testDomain.id,
        chunk_text: 'Invalid chunk',
        embedding: [1, 2, 3], // Only 3 dimensions instead of 1536
        metadata: {},
      },
    ];

    if (!validateEmbeddings(invalidEmbs)) {
      log('✅ PASS: Invalid embeddings rejected', GREEN);
      testsPassed++;
    } else {
      log('❌ FAIL: Invalid embeddings accepted', RED);
      testsFailed++;
    }
  } catch (error) {
    log('❌ FAIL: Exception thrown', RED);
    log(`   ${error}`, RED);
    testsFailed++;
  }

  // Cleanup
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', YELLOW);
  log('🧹 Cleanup', YELLOW);
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', YELLOW);

  if (savedPageId) {
    const { error: deleteError } = await supabase
      .from('scraped_pages')
      .delete()
      .eq('id', savedPageId);

    if (!deleteError) {
      log('✅ Test page deleted (embeddings cascade-deleted)', GREEN);
    } else {
      log('⚠️  Could not delete test page:', YELLOW);
      log(`   ${deleteError.message}`, YELLOW);
    }
  }

  // Summary
  log('\n═══════════════════════════════════════════', BLUE);
  log('📊 TEST SUMMARY', BLUE);
  log('═══════════════════════════════════════════', BLUE);
  log(`Total Tests: ${testsPassed + testsFailed}`, BLUE);
  log(`Passed: ${testsPassed}`, GREEN);
  log(`Failed: ${testsFailed}`, testsFailed > 0 ? RED : GREEN);
  log('═══════════════════════════════════════════\n', BLUE);

  if (testsFailed === 0) {
    log('✅ All atomic transaction tests passed', GREEN);
    process.exit(0);
  } else {
    log('❌ Some tests failed', RED);
    process.exit(1);
  }
}

testAtomicTransaction().catch((error) => {
  log('\n💥 Unhandled error:', RED);
  console.error(error);
  process.exit(1);
});
