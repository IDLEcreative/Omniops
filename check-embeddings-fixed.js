const { createClient } = require('@supabase/supabase-js');

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEmbeddings() {
  try {
    // Check page_embeddings table (correct name)
    const { data: embeddings, error: embError } = await supabase
      .from('page_embeddings')
      .select('id, page_id, metadata')
      .limit(5);
    
    console.log('\n=== Page Embeddings ===');
    if (embError) {
      console.error('Error fetching embeddings:', embError);
    } else {
      console.log(`Found ${embeddings?.length || 0} embeddings`);
      if (embeddings && embeddings.length > 0) {
        console.log('Sample embeddings:', JSON.stringify(embeddings.slice(0, 2), null, 2));
      }
    }
    
    // Check website_content table with correct column
    const { data: content, error: contentError } = await supabase
      .from('website_content')
      .select('id, domain_id, url, title, created_at')
      .limit(5);
    
    console.log('\n=== Website Content ===');
    if (contentError) {
      console.error('Error fetching content:', contentError);
    } else {
      console.log(`Found ${content?.length || 0} content items`);
      if (content && content.length > 0) {
        console.log('Sample content:', JSON.stringify(content, null, 2));
      }
    }
    
    // Check scraped_pages table with correct column
    const { data: scraped, error: scrapedError } = await supabase
      .from('scraped_pages')
      .select('id, domain_id, url, title, created_at')
      .limit(5);
    
    console.log('\n=== Scraped Pages ===');
    if (scrapedError) {
      console.error('Error fetching scraped pages:', scrapedError);
    } else {
      console.log(`Found ${scraped?.length || 0} scraped pages`);
      if (scraped && scraped.length > 0) {
        console.log('Sample scraped pages:', JSON.stringify(scraped, null, 2));
      }
    }
    
    // Check domains table to see what's actually been scraped
    const { data: domains, error: domainError } = await supabase
      .from('domains')
      .select('id, domain, last_scraped_at')
      .limit(10);
    
    console.log('\n=== Domains ===');
    if (domainError) {
      console.error('Error fetching domains:', domainError);
    } else {
      console.log(`Found ${domains?.length || 0} domains`);
      if (domains && domains.length > 0) {
        console.log('Domains:', JSON.stringify(domains, null, 2));
      }
    }
    
    // Check customer_configs to see which domains are configured
    const { data: configs, error: configError } = await supabase
      .from('customer_configs')
      .select('domain, business_name, created_at')
      .limit(10);
    
    console.log('\n=== Customer Configs ===');
    if (configError) {
      console.error('Error fetching configs:', configError);
    } else {
      console.log(`Found ${configs?.length || 0} configured domains`);
      if (configs && configs.length > 0) {
        console.log('Configured domains:', configs.map(c => c.domain));
      }
    }
    
    // Check if the search_embeddings RPC function exists
    console.log('\n=== Testing search_embeddings RPC ===');
    const testEmbedding = new Array(1536).fill(0.1); // Create a dummy embedding
    const { data: searchTest, error: searchError } = await supabase.rpc('search_embeddings', {
      query_embedding: testEmbedding,
      match_threshold: 0.1,
      match_count: 1
    });
    
    if (searchError) {
      console.error('Error calling search_embeddings RPC:', searchError);
    } else {
      console.log('search_embeddings RPC works. Found results:', searchTest?.length || 0);
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkEmbeddings();