const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkEmbeddings() {
  // Check a specific page that should have been reprocessed
  const testUrl = 'https://www.thompsonseparts.co.uk/news/';
  
  // Get the page
  const { data: page } = await supabase
    .from('scraped_pages')
    .select('id, url, scraped_at, metadata')
    .eq('url', testUrl)
    .single();
    
  if (page) {
    console.log('Page found:', {
      url: page.url,
      scraped_at: page.scraped_at,
      has_business_info: !!page.metadata?.businessInfo
    });
    
    // Check embeddings
    const { data: embeddings, count } = await supabase
      .from('page_embeddings')
      .select('id, created_at', { count: 'exact' })
      .eq('page_id', page.id)
      .limit(1);
      
    console.log('Embeddings for this page:', count || 0);
    if (embeddings && embeddings[0]) {
      console.log('First embedding created at:', embeddings[0].created_at);
    }
  }
}

checkEmbeddings().catch(console.error);
