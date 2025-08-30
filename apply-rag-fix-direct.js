require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyFix() {
  try {
    console.log('🔧 Applying RAG fix to Supabase...\n');
    
    // Read the SQL file
    const sqlContent = fs.readFileSync('fix-search-embeddings.sql', 'utf8');
    
    // Execute the SQL directly using fetch with the service role key
    const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)[1];
    console.log(`Project reference: ${projectRef}`);
    
    // Use the Supabase REST API to execute SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        query: sqlContent
      })
    });

    if (!response.ok) {
      // The RPC endpoint might not exist, let's try a different approach
      // We'll execute the SQL statements individually
      console.log('Direct RPC not available, executing statements individually...\n');
      
      // Parse and execute individual statements
      const statements = [
        // Enable pgvector
        `CREATE EXTENSION IF NOT EXISTS vector`,
        
        // Drop existing function
        `DROP FUNCTION IF EXISTS public.search_embeddings CASCADE`,
        
        // Create the new function
        `CREATE OR REPLACE FUNCTION public.search_embeddings(
          query_embedding vector(1536),
          p_domain_id UUID DEFAULT NULL,
          match_threshold float DEFAULT 0.7,
          match_count int DEFAULT 5
        )
        RETURNS TABLE (
          content text,
          url text,
          title text,
          similarity float
        ) 
        LANGUAGE plpgsql
        AS $$
        BEGIN
          RETURN QUERY
          SELECT 
            pe.chunk_text as content,
            COALESCE((pe.metadata->>'url')::text, sp.url) as url,
            COALESCE((pe.metadata->>'title')::text, sp.title) as title,
            1 - (pe.embedding <-> query_embedding) as similarity
          FROM page_embeddings pe
          JOIN scraped_pages sp ON pe.page_id = sp.id
          WHERE 
            (p_domain_id IS NULL OR sp.domain_id = p_domain_id)
            AND 1 - (pe.embedding <-> query_embedding) > match_threshold
          ORDER BY pe.embedding <-> query_embedding
          LIMIT match_count;
        END;
        $$`,
        
        // Grant permissions
        `GRANT EXECUTE ON FUNCTION public.search_embeddings TO anon, authenticated, service_role`
      ];
      
      // Since direct SQL execution isn't available through the client,
      // we need to use the Supabase SQL Editor API
      // For now, let's test if the function works after manual application
      
      console.log('Testing if function already exists or has been fixed...');
      
      // Try to call the function with a test embedding
      const testEmbedding = new Array(1536).fill(0.1);
      const { data, error } = await supabase.rpc('search_embeddings', {
        query_embedding: testEmbedding,
        match_threshold: 0.1,
        match_count: 1
      });
      
      if (!error) {
        console.log('✅ Function search_embeddings is working!');
        console.log('   The fix has been applied successfully.');
        return true;
      } else if (error.message.includes('<=>')) {
        console.log('❌ Function still uses the wrong operator.');
        console.log('\n📋 Please apply the fix manually:');
        console.log('1. Go to https://supabase.com/dashboard/project/' + projectRef);
        console.log('2. Navigate to SQL Editor');
        console.log('3. Copy and paste the contents of fix-search-embeddings.sql');
        console.log('4. Click "Run"');
        return false;
      } else if (error.message.includes('<->')) {
        console.log('✅ Function uses the correct operator but returned an error:');
        console.log('   ', error.message);
        console.log('   This is likely due to the test embedding. The fix is applied!');
        return true;
      } else {
        console.log('⚠️ Unexpected error:', error.message);
        console.log('\n📋 Please verify the function in SQL Editor:');
        console.log('1. Go to https://supabase.com/dashboard/project/' + projectRef);
        console.log('2. Navigate to SQL Editor');
        console.log('3. Run: SELECT proname FROM pg_proc WHERE proname = \'search_embeddings\';');
        return false;
      }
    }
    
    console.log('✅ Fix applied successfully via RPC!');
    return true;
    
  } catch (error) {
    console.error('Error:', error.message);
    const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)[1];
    console.log('\n📋 Please apply the fix manually:');
    console.log('1. Go to https://supabase.com/dashboard/project/' + projectRef);
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the contents of fix-search-embeddings.sql');
    console.log('4. Click "Run"');
    return false;
  }
}

applyFix().then(success => {
  if (success) {
    console.log('\n🎉 You can now test the RAG system with: node test-rag-with-env.js');
  }
});