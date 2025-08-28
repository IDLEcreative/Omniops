import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  // Use YOUR production database credentials
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  // This should be birugqyuqhiahxvxeyqg.supabase.co
  console.log('Connecting to:', supabaseUrl);
  
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  
  const results: any = {
    database_url: supabaseUrl,
    customer_config: null,
    test_embeddings: null,
    test_chat: null
  };
  
  try {
    // Step 1: Create customer config in YOUR database
    console.log('Setting up customer config in production...');
    
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
          business_name: 'Thompson eParts',
          greeting_message: 'Welcome to Thompson eParts! How can I help you find the right parts for your tipper today?',
          primary_color: '#0066cc',
          chat_enabled: true,
          woocommerce_enabled: true,
          woocommerce_url: 'https://www.thompsonseparts.co.uk',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (configError) {
        results.customer_config = { 
          status: 'error', 
          error: configError.message 
        };
      } else {
        results.customer_config = { 
          status: 'created', 
          id: newConfig?.id,
          domain: newConfig?.domain
        };
      }
    } else {
      results.customer_config = { 
        status: 'already_exists', 
        id: existingConfig.id,
        domain: existingConfig.domain
      };
    }
    
    // Step 2: Verify embeddings exist
    const { count: embeddingCount } = await supabase
      .from('page_embeddings')
      .select('*', { count: 'exact', head: true });
    
    results.test_embeddings = {
      count: embeddingCount,
      status: embeddingCount && embeddingCount > 0 ? 'ready' : 'no_embeddings'
    };
    
    // Step 3: Test the chat API with the domain
    const testResponse = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'What tipper sheet systems do you offer?',
        session_id: 'setup-test-' + Date.now(),
        domain: 'thompsonseparts.co.uk',
        config: {
          features: {
            websiteScraping: { enabled: true }
          }
        }
      })
    });
    
    const chatData = await testResponse.json();
    
    results.test_chat = {
      response_preview: chatData.message?.substring(0, 200) + '...',
      sources_found: chatData.sources?.length || 0,
      sources: chatData.sources
    };
    
    // Step 4: Generate the SQL function that needs to be created manually
    const sqlFunction = `
-- Run this in your Supabase SQL Editor at:
-- https://supabase.com/dashboard/project/birugqyuqhiahxvxeyqg/sql/new

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the search function
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
    AND (
      p_domain_id IS NULL 
      OR pe.page_id IN (
        SELECT id FROM scraped_pages 
        WHERE domain = (SELECT domain FROM customer_configs WHERE id = p_domain_id)
      )
    )
  ORDER BY pe.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Verify it was created
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_name = 'search_embeddings';
    `.trim();
    
    return NextResponse.json({
      success: true,
      results,
      sql_to_run: sqlFunction,
      instructions: {
        current_status: {
          '✅ Database': `Connected to ${supabaseUrl.includes('birugqyuqhiahxvxeyqg') ? 'CORRECT' : 'WRONG'} database`,
          '✅ Customer Config': results.customer_config?.status === 'created' || results.customer_config?.status === 'already_exists' ? 'Set up' : 'Failed',
          '✅ Embeddings': `${results.test_embeddings?.count || 0} embeddings found`,
          '⚠️  Search Function': 'Needs manual creation in SQL editor'
        },
        next_steps: [
          '1. Go to: https://supabase.com/dashboard/project/birugqyuqhiahxvxeyqg/sql/new',
          '2. Copy and paste the SQL from sql_to_run field above',
          '3. Click "Run" to create the search function',
          '4. After that, RAG will be fully operational!'
        ]
      }
    });
    
  } catch (err: any) {
    return NextResponse.json({ 
      success: false,
      error: err.message,
      results
    }, { status: 500 });
  }
}