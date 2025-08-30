require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRelationships() {
  try {
    console.log('🔍 Checking data relationships...\n');
    
    // Get domain info
    const { data: domainData } = await supabase
      .from('domains')
      .select('id, domain')
      .eq('domain', 'thompsonseparts.co.uk')
      .single();
    
    console.log('Domain:', domainData);
    
    // Check scraped_pages
    const { count: pagesCount } = await supabase
      .from('scraped_pages')
      .select('*', { count: 'exact', head: true })
      .eq('domain_id', domainData.id);
    
    console.log(`\nScraped pages for domain: ${pagesCount}`);
    
    // Get sample pages
    const { data: samplePages } = await supabase
      .from('scraped_pages')
      .select('id, url, title')
      .eq('domain_id', domainData.id)
      .limit(3);
    
    console.log('\nSample pages:');
    samplePages?.forEach(p => console.log(`  - ${p.url} (id: ${p.id})`));
    
    // Check if embeddings exist for these pages
    if (samplePages && samplePages.length > 0) {
      const pageIds = samplePages.map(p => p.id);
      const { count: embeddingsCount } = await supabase
        .from('page_embeddings')
        .select('*', { count: 'exact', head: true })
        .in('page_id', pageIds);
      
      console.log(`\nEmbeddings for these sample pages: ${embeddingsCount}`);
      
      // Check what page_embeddings actually contains
      const { data: sampleEmbeddings } = await supabase
        .from('page_embeddings')
        .select('id, page_id, domain_id, chunk_text, metadata')
        .limit(5);
      
      console.log('\nSample embeddings structure:');
      sampleEmbeddings?.forEach(e => {
        console.log(`  - page_id: ${e.page_id}, domain_id: ${e.domain_id}`);
        console.log(`    metadata: ${JSON.stringify(e.metadata).substring(0, 100)}...`);
      });
    }
    
    // Check if domain_id is populated in page_embeddings
    const { count: embeddingsWithDomain } = await supabase
      .from('page_embeddings')
      .select('*', { count: 'exact', head: true })
      .eq('domain_id', domainData.id);
    
    console.log(`\n✅ Embeddings with domain_id = ${domainData.id}: ${embeddingsWithDomain}`);
    
    // Check embeddings without domain_id
    const { count: embeddingsWithoutDomain } = await supabase
      .from('page_embeddings')
      .select('*', { count: 'exact', head: true })
      .is('domain_id', null);
    
    console.log(`⚠️  Embeddings with NULL domain_id: ${embeddingsWithoutDomain}`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkRelationships();