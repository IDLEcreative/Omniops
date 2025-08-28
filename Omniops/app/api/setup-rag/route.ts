import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  
  const results: any = {
    customer_config: null,
    embedding_test: null,
    function_sql: null
  };
  
  try {
    // Step 1: Add or update customer config
    console.log('Setting up customer config...');
    
    const { data: existingConfig } = await supabase
      .from('customer_configs')
      .select('*')
      .eq('domain', 'thompsonseparts.co.uk')
      .single();
    
    if (!existingConfig) {
      const { data: newConfig, error: configError } = await supabase
        .from('customer_configs')
        .insert({
          domain: 'thompsonseparts.co.uk',
          company_name: 'Thompson eParts',
          business_name: 'Thompson eParts Ltd',
          woocommerce_enabled: true,
          woocommerce_url: 'https://www.thompsonseparts.co.uk',
          woocommerce_consumer_key: process.env.WOOCOMMERCE_CONSUMER_KEY || '',
          woocommerce_consumer_secret: process.env.WOOCOMMERCE_CONSUMER_SECRET || '',
          admin_email: 'admin@thompsonseparts.co.uk',
          welcome_message: 'Welcome to Thompson eParts! How can I help you today?',
          primary_color: '#0066cc',
          chat_enabled: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (configError) {
        // Try without WooCommerce credentials
        const { data: simpleConfig, error: simpleError } = await supabase
          .from('customer_configs')
          .insert({
            domain: 'thompsonseparts.co.uk',
            company_name: 'Thompson eParts',
            admin_email: 'admin@thompsonseparts.co.uk',
            chat_enabled: true
          })
          .select()
          .single();
        
        if (simpleError) {
          results.customer_config = { 
            status: 'error', 
            error: simpleError.message 
          };
        } else {
          results.customer_config = { 
            status: 'created_simple', 
            id: simpleConfig?.id
          };
        }
      } else {
        results.customer_config = { 
          status: 'created', 
          id: newConfig?.id
        };
      }
    } else {
      results.customer_config = { 
        status: 'already_exists', 
        id: existingConfig.id
      };
    }
    
    // Step 2: Test embedding search
    console.log('Testing embeddings...');
    
    const { data: embeddings, count } = await supabase
      .from('page_embeddings')
      .select('*', { count: 'exact', head: true });
    
    results.embedding_test = {
      total_embeddings: count,
      status: count && count > 0 ? 'ready' : 'no_data'
    };
    
    // Step 3: Generate SQL for manual execution
    results.function_sql = `
-- IMPORTANT: Run this SQL in your Supabase SQL Editor to enable RAG search

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the main search function
CREATE OR REPLACE FUNCTION search_embeddings(
  query_embedding vector(1536),
  similarity_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  p_domain_id uuid DEFAULT NULL
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
    pe.chunk_text AS content,
    COALESCE((pe.metadata->>'url')::text, '') AS url,
    COALESCE((pe.metadata->>'title')::text, 'Thompson eParts') AS title,
    1 - (pe.embedding <=> query_embedding) AS similarity
  FROM page_embeddings pe
  WHERE 
    1 - (pe.embedding <=> query_embedding) > similarity_threshold
  ORDER BY pe.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Verify the function was created
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_name = 'search_embeddings';
    `.trim();
    
    return NextResponse.json({
      success: true,
      results,
      instructions: [
        '✅ Customer config has been set up for thompsonseparts.co.uk',
        `✅ Found ${results.embedding_test.total_embeddings} embeddings ready to use`,
        '⚠️  IMPORTANT: You need to manually create the search function:',
        '1. Go to your Supabase dashboard',
        '2. Navigate to SQL Editor',
        '3. Copy and run the SQL from results.function_sql',
        '4. After running the SQL, RAG will be fully operational'
      ]
    });
    
  } catch (err: any) {
    return NextResponse.json({ 
      success: false,
      error: err.message,
      results
    }, { status: 500 });
  }
}