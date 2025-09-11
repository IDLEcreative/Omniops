require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndFix() {
  try {
    console.log('📊 Checking page_embeddings table...\n');
    
    // Check how many embeddings we have
    const { count, error: countError } = await supabase
      .from('page_embeddings')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Error counting embeddings:', countError);
      return;
    }
    
    console.log(`Found ${count} embeddings in page_embeddings table`);
    
    // Check for thompsonseparts.co.uk specifically
    const { data: domainData } = await supabase
      .from('domains')
      .select('id')
      .eq('domain', 'thompsonseparts.co.uk')
      .single();
    
    if (domainData) {
      const { count: domainCount } = await supabase
        .from('page_embeddings')
        .select('*', { count: 'exact', head: true })
        .eq('domain_id', domainData.id);
      
      console.log(`Found ${domainCount} embeddings for thompsonseparts.co.uk\n`);
    }
    
    // Test with a simpler query first
    console.log('Testing search function with lower threshold...');
    const testEmbedding = new Array(1536).fill(0.1);
    
    const { data, error } = await supabase.rpc('search_embeddings', {
      query_embedding: testEmbedding,
      p_domain_id: domainData?.id,
      match_threshold: 0.1,  // Very low threshold
      match_count: 1
    });
    
    if (error) {
      console.error('Search error:', error);
      
      if (error.message.includes('timeout')) {
        console.log('\n⚠️  Query is timing out. The index needs to be created.');
        console.log('\n📋 Please run this SQL in your Supabase SQL Editor to create the index:\n');
        console.log(`-- Create index for faster vector search
CREATE INDEX IF NOT EXISTS page_embeddings_embedding_idx
ON public.page_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Analyze the table to update statistics
ANALYZE page_embeddings;

-- Increase statement timeout for complex queries
ALTER DATABASE postgres SET statement_timeout = '60s';`);
      }
    } else {
      console.log('✅ Search function is working!');
      if (data && data.length > 0) {
        console.log(`Found ${data.length} results`);
      }
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkAndFix();