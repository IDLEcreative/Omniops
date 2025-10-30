/**
 * Test to verify search_embeddings RPC returns page_id
 */

import { createServiceRoleClient } from './lib/supabase-server';
import { searchAndReturnFullPage } from './lib/full-page-retrieval';

async function testRPCPageId() {
  console.log('=== Testing RPC search_embeddings Returns page_id ===\n');

  const supabase = await createServiceRoleClient();

  if (!supabase) {
    console.error('Failed to create Supabase client');
    return;
  }

  // Get domain_id for thompsonseparts
  const { data: domainData } = await supabase
    .from('customer_configs')
    .select('id')
    .eq('domain', 'thompsonseparts.co.uk')
    .single();

  if (!domainData) {
    console.error('Domain not found');
    return;
  }

  console.log('Domain ID:', domainData.id);

  // Create a simple test embedding (1536 dimensions of 0.1)
  const testEmbedding = Array(1536).fill(0.1);

  // Call RPC directly
  const { data, error } = await supabase.rpc('search_embeddings', {
    query_embedding: testEmbedding,
    p_domain_id: domainData.id,
    match_threshold: 0.1,
    match_count: 3
  });

  if (error) {
    console.error('RPC Error:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('No results returned');
    return;
  }

  console.log(`\nReturned ${data.length} results\n`);

  const firstResult = data[0];
  console.log('First result object keys:', Object.keys(firstResult).join(', '));
  console.log('\nFirst result structure:');
  console.log('- id:', firstResult.id);
  console.log('- page_id:', firstResult.page_id);
  console.log('- title:', firstResult.title);
  console.log('- similarity:', firstResult.similarity);
  console.log('- url:', firstResult.url);

  console.log('\n✅ RPC DOES return page_id:', 'page_id' in firstResult);

  // Now test the full page retrieval function
  console.log('\n\n=== Testing Full Page Retrieval Function ===\n');

  const result = await searchAndReturnFullPage(
    '10mtr extension cables for all TS Camera systems',
    'thompsonseparts.co.uk',
    15,
    0.3
  );

  console.log('Success:', result.success);
  console.log('Source:', result.source);
  console.log('Results count:', result.results.length);

  if (result.pageInfo) {
    console.log('\n=== Page Info ===');
    console.log('URL:', result.pageInfo.url);
    console.log('Title:', result.pageInfo.title);
    console.log('Total Chunks:', result.pageInfo.totalChunks);

    console.log('\n=== Checking chunks for product info ===');
    let hasPrice = false;
    let hasSKU = false;

    result.results.forEach((chunk, i) => {
      if (chunk.content.includes('25.98')) hasPrice = true;
      if (chunk.content.includes('10M-CC')) hasSKU = true;
    });

    console.log('Has Price (£25.98):', hasPrice);
    console.log('Has SKU (10M-CC):', hasSKU);
    console.log('\n✅ Full page retrieval', result.source === 'full_page' ? 'SUCCESS' : 'FAILED - fell back to chunks');
  }
}

testRPCPageId().catch(e => console.error('Error:', e.message, e.stack));
