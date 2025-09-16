import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testEmbeddingFailure() {
  console.log('=== Testing Embedding Insertion Failure ===\n');

  // Create a test embedding record
  const testEmbedding = {
    page_id: '00000000-0000-0000-0000-000000000000', // Non-existent page ID
    chunk_text: 'This is a test chunk to verify embedding insertion',
    embedding: new Array(1536).fill(0.1), // Dummy embedding vector
    metadata: { test: true, timestamp: new Date().toISOString() }
  };

  // Test 1: Try bulk_insert_embeddings (which doesn't exist)
  console.log('Test 1: Attempting bulk_insert_embeddings...');
  const { data: bulkData, error: bulkError } = await supabase.rpc('bulk_insert_embeddings', {
    embeddings: [testEmbedding]
  });

  if (bulkError) {
    console.log('❌ bulk_insert_embeddings failed:', bulkError.message);
    console.log('   Error code:', bulkError.code);
    console.log('   Full error:', JSON.stringify(bulkError, null, 2));
  } else {
    console.log('✅ bulk_insert_embeddings succeeded:', bulkData);
  }

  // Test 2: Try direct insert (fallback method)
  console.log('\nTest 2: Attempting direct insert (fallback)...');
  const { data: directData, error: directError } = await supabase
    .from('page_embeddings')
    .insert([testEmbedding])
    .select();

  if (directError) {
    console.log('❌ Direct insert failed:', directError.message);
    console.log('   Error code:', directError.code);
    console.log('   Full error:', JSON.stringify(directError, null, 2));
  } else {
    console.log('✅ Direct insert succeeded:', directData);
    
    // Clean up test data
    if (directData && directData[0]) {
      const { error: deleteError } = await supabase
        .from('page_embeddings')
        .delete()
        .eq('id', directData[0].id);
      
      if (!deleteError) {
        console.log('   Test data cleaned up');
      }
    }
  }

  // Test 3: Check if fallback is triggered in actual code
  console.log('\nTest 3: Simulating actual code flow...');
  try {
    // Simulate the actual code flow from embeddings.ts
    const { data, error } = await supabase.rpc('bulk_insert_embeddings', {
      embeddings: [testEmbedding]
    });
    
    if (error) {
      console.log('⚠️ Bulk function failed, should trigger fallback...');
      console.warn('Bulk insert failed, falling back to regular insert:', error);
      
      const { error: fallbackError } = await supabase
        .from('page_embeddings')
        .insert([testEmbedding]);
      
      if (fallbackError) {
        console.log('❌ Fallback also failed:', fallbackError.message);
        throw fallbackError;
      } else {
        console.log('✅ Fallback succeeded!');
      }
    }
  } catch (e: any) {
    console.log('❌ Complete failure:', e.message);
  }

  // Test 4: Check console logs for evidence of fallback attempts
  console.log('\n=== Checking Recent Logs ===\n');
  
  // Get recent pages without embeddings to understand the pattern
  const { data: orphanPages } = await supabase
    .from('scraped_pages')
    .select('id, url, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (orphanPages) {
    // Check which of these have embeddings
    const pageIds = orphanPages.map(p => p.id);
    const { data: embeddings } = await supabase
      .from('page_embeddings')
      .select('page_id')
      .in('page_id', pageIds);
    
    const hasEmbeddings = new Set(embeddings?.map(e => e.page_id) || []);
    const noEmbeddings = orphanPages.filter(p => !hasEmbeddings.has(p.id));
    
    console.log('Recent pages without embeddings:');
    noEmbeddings.forEach(page => {
      console.log(`- ${page.created_at}: ${page.url}`);
      console.log(`  Page ID: ${page.id}`);
    });
  }
}

testEmbeddingFailure().catch(console.error);