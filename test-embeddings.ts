import { createServiceRoleClient } from './lib/supabase-server';
import { searchSimilarContent } from './lib/embeddings';

async function testEmbeddingsSearch() {
  console.log('Testing embeddings search functionality...\n');
  
  const supabase = await createServiceRoleClient();
  
  // 1. Check what domains exist
  console.log('1. Checking domains in database:');
  const { data: domains, error: domainsError } = await supabase
    .from('domains')
    .select('id, domain')
    .order('created_at', { ascending: false })
    .limit(10);
    
  if (domainsError) {
    console.error('Error fetching domains:', domainsError);
    return;
  }
  
  console.log('Found domains:', domains);
  
  // 2. Check scraped content for each domain
  console.log('\n2. Checking scraped content:');
  for (const domain of domains || []) {
    const { data: content, error: contentError } = await supabase
      .from('scraped_content')
      .select('id, url, title')
      .eq('domain', domain.domain)
      .limit(5);
      
    if (contentError) {
      console.error(`Error fetching content for ${domain.domain}:`, contentError);
      continue;
    }
    
    console.log(`  ${domain.domain}: ${content?.length || 0} pages scraped`);
    if (content && content.length > 0) {
      console.log(`    Sample URLs:`);
      content.forEach(c => console.log(`      - ${c.url}`));
    }
  }
  
  // 3. Check embeddings count
  console.log('\n3. Checking embeddings:');
  for (const domain of domains || []) {
    const { data: embeddings, error: embError } = await supabase
      .from('content_embeddings')
      .select('id')
      .eq('domain_id', domain.id)
      .limit(1);
      
    const { count: embedCount } = await supabase
      .from('content_embeddings')
      .select('*', { count: 'exact', head: true })
      .eq('domain_id', domain.id);
      
    console.log(`  ${domain.domain} (ID: ${domain.id}): ${embedCount || 0} embeddings`);
  }
  
  // 4. Test search functionality
  console.log('\n4. Testing search functionality:');
  
  // Test with localhost or the first domain that has content
  const testDomain = domains?.find(d => d.domain === 'localhost') || domains?.[0];
  
  if (testDomain) {
    console.log(`  Testing search for domain: ${testDomain.domain}`);
    
    const testQueries = [
      'what do you sell',
      'products',
      'pricing',
      'services',
      'contact'
    ];
    
    for (const query of testQueries) {
      try {
        console.log(`\n  Query: "${query}"`);
        const results = await searchSimilarContent(
          query,
          testDomain.domain,
          3,
          0.3  // Lower threshold to get more results
        );
        
        if (results.length > 0) {
          console.log(`    Found ${results.length} results:`);
          results.forEach(r => {
            console.log(`      - [${(r.similarity * 100).toFixed(1)}%] ${r.title}`);
            console.log(`        URL: ${r.url}`);
            console.log(`        Content: ${r.content.substring(0, 100)}...`);
          });
        } else {
          console.log(`    No results found`);
        }
      } catch (error) {
        console.error(`    Error searching for "${query}":`, error);
      }
    }
  }
  
  // 5. Check the RPC function exists
  console.log('\n5. Testing RPC function directly:');
  try {
    // Test with a dummy embedding
    const dummyEmbedding = new Array(1536).fill(0.1);
    const { data: rpcTest, error: rpcError } = await supabase.rpc('search_embeddings', {
      query_embedding: dummyEmbedding,
      p_domain_id: testDomain?.id || null,
      match_threshold: 0.1,
      match_count: 1
    });
    
    if (rpcError) {
      console.error('  RPC function error:', rpcError);
    } else {
      console.log('  RPC function works, returned:', rpcTest?.length || 0, 'results');
    }
  } catch (error) {
    console.error('  RPC test error:', error);
  }
}

testEmbeddingsSearch().catch(console.error);