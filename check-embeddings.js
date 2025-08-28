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
    // Check content_embeddings table
    const { data: embeddings, error: embError } = await supabase
      .from('content_embeddings')
      .select('id, content_id, metadata')
      .limit(5);
    
    console.log('\n=== Content Embeddings ===');
    if (embError) {
      console.error('Error fetching embeddings:', embError);
    } else {
      console.log(`Found ${embeddings?.length || 0} embeddings`);
      if (embeddings && embeddings.length > 0) {
        console.log('Sample embeddings:', JSON.stringify(embeddings.slice(0, 2), null, 2));
      }
    }
    
    // Check website_content table
    const { data: content, error: contentError } = await supabase
      .from('website_content')
      .select('id, domain, url, title, created_at')
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
    
    // Check scraped_pages table (legacy)
    const { data: scraped, error: scrapedError } = await supabase
      .from('scraped_pages')
      .select('id, domain, url, title, created_at')
      .limit(5);
    
    console.log('\n=== Scraped Pages (Legacy) ===');
    if (scrapedError) {
      console.error('Error fetching scraped pages:', scrapedError);
    } else {
      console.log(`Found ${scraped?.length || 0} scraped pages`);
      if (scraped && scraped.length > 0) {
        console.log('Sample scraped pages:', JSON.stringify(scraped, null, 2));
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
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkEmbeddings();