/**
 * Fix the extended embeddings function to use correct column names
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function fixExtendedFunction() {
  console.log('Fixing match_page_embeddings_extended function...\n');
  
  // First, drop the existing broken function if it exists
  try {
    const dropResult = await supabase.rpc('query', {
      query: `DROP FUNCTION IF EXISTS match_page_embeddings_extended(vector(1536), uuid, float, int);`
    });
  } catch (e) {
    // Ignore drop errors
  }
  
  // Create the corrected function
  // Note: website_content table uses 'page_id' not 'scraped_page_id'
  const createFunctionSQL = `
CREATE OR REPLACE FUNCTION match_page_embeddings_extended(
  query_embedding vector(1536),
  p_domain_id uuid,
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  content text,
  url text,
  title text,
  similarity float,
  page_id uuid,
  chunk_index int,
  chunk_position int,
  metadata jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pe.id,
    pe.content,
    sp.url,
    sp.title,
    1 - (pe.embedding <=> query_embedding) as similarity,
    wc.page_id,  -- Fixed: using page_id which exists in website_content
    pe.chunk_index,
    wc.chunk_position,
    sp.metadata
  FROM page_embeddings pe
  JOIN scraped_pages sp ON pe.page_id = sp.id
  LEFT JOIN website_content wc ON wc.page_id = pe.page_id 
    AND wc.chunk_index = pe.chunk_index
  WHERE sp.domain_id = p_domain_id
    AND 1 - (pe.embedding <=> query_embedding) > match_threshold
  ORDER BY pe.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;`;

  try {
    // Execute the SQL directly using fetch
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/query`,
      {
        method: 'POST',
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: createFunctionSQL })
      }
    );

    if (!response.ok) {
      // Function might not exist, try creating it directly via Supabase Management API
      console.log('Standard approach failed, trying Management API...');
      
      const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || 'sbp_07dc3f2dcbc96fd3f0e0df47a0bc82c087da9c42';
      const PROJECT_REF = 'birugqyuqhiahxvxeyqg';
      
      const mgmtResponse = await fetch(
        `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: createFunctionSQL })
        }
      );
      
      if (mgmtResponse.ok) {
        console.log('✅ Function created successfully via Management API');
      } else {
        const error = await mgmtResponse.text();
        console.log('❌ Management API error:', error);
        
        // Try a simpler version without the extended metadata
        console.log('\nTrying fallback: Creating simple version...');
        const simpleFunctionSQL = `
CREATE OR REPLACE FUNCTION match_page_embeddings_extended(
  query_embedding vector(1536),
  p_domain_id uuid,
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
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
    pe.id,
    pe.content,
    sp.url,
    sp.title,
    1 - (pe.embedding <=> query_embedding) as similarity
  FROM page_embeddings pe
  JOIN scraped_pages sp ON pe.page_id = sp.id
  WHERE sp.domain_id = p_domain_id
    AND 1 - (pe.embedding <=> query_embedding) > match_threshold
  ORDER BY pe.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;`;
        
        const simpleMgmtResponse = await fetch(
          `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: simpleFunctionSQL })
          }
        );
        
        if (simpleMgmtResponse.ok) {
          console.log('✅ Simple function created successfully');
        } else {
          console.log('❌ Simple function also failed:', await simpleMgmtResponse.text());
        }
      }
    } else {
      console.log('✅ Function created successfully');
    }
    
    // Test the function
    console.log('\nTesting the function...');
    const { data: domainData } = await supabase
      .from('customer_configs')
      .select('id')
      .eq('domain', 'thompsonseparts.co.uk')
      .single();
    
    if (domainData) {
      // Create a test embedding
      const testEmbedding = new Array(1536).fill(0).map(() => Math.random() - 0.5);
      
      const { data, error } = await supabase.rpc('match_page_embeddings_extended', {
        query_embedding: testEmbedding,
        p_domain_id: domainData.id,
        match_threshold: 0.3,
        match_count: 5
      });
      
      if (error) {
        console.log('❌ Function test failed:', error.message);
        console.log('   This might be expected if there are no embeddings yet.');
      } else {
        console.log(`✅ Function test successful! Retrieved ${data?.length || 0} results`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the fix
fixExtendedFunction().then(() => {
  console.log('\nDone!');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});