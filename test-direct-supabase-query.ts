import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testCifaQuery() {
  // First get domain ID
  const { data: domainData } = await supabase
    .from('customer_configs')
    .select('id')
    .eq('domain', 'thompsonseparts.co.uk')
    .single();
    
  if (!domainData) {
    console.log('Domain not found');
    return;
  }
  
  console.log('Domain ID:', domainData.id);
  
  // Test the exact query from embeddings.ts
  const searchConditions = [
    'url.ilike.%cifa%',
    'title.ilike.%cifa%', 
    'content.ilike.%cifa%'
  ];
  
  const { data: searchResults, error, count } = await supabase
    .from('scraped_pages')
    .select('url, title', { count: 'exact' })
    .eq('domain_id', domainData.id)
    .or(searchConditions.join(','))
    .limit(1000);
    
  console.log('Error:', error);
  console.log('Results found:', searchResults?.length);
  console.log('Total count:', count);
  
  // Show first few results
  if (searchResults) {
    console.log('\nFirst 5 results:');
    searchResults.slice(0, 5).forEach(r => {
      console.log(`- ${r.title}`);
    });
  }
}

testCifaQuery().catch(console.error);
