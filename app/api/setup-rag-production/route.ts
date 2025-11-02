import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  // Use YOUR production database credentials
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  // This should be birugqyuqhiahxvxeyqg.supabase.co
  console.log('Connecting to:', supabaseUrl);

  const supabase = await createServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }

  // Get domain and business details from request body
  const body = await request.json();
  const { domain, business_name, woocommerce_url } = body;

  if (!domain || !business_name) {
    return NextResponse.json({
      error: 'domain and business_name are required',
      usage: 'POST /api/setup-rag-production with body: { domain: "example.com", business_name: "Business Name", woocommerce_url: "https://example.com" (optional) }'
    }, { status: 400 });
  }

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
      .eq('domain', domain)
      .single();
    
    if (!existingConfig) {
      const { data: newConfig, error: configError } = await supabase
        .from('customer_configs')
        .insert({
          domain: domain,
          business_name: business_name,
          greeting_message: `Welcome to ${business_name}! How can I help you today?`,
          primary_color: '#0066cc',
          chat_enabled: true,
          woocommerce_enabled: !!woocommerce_url,
          woocommerce_url: woocommerce_url || null,
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
        message: 'What products or services do you offer?',
        session_id: 'setup-test-' + Date.now(),
        domain: domain,
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
CREATE OR REPLACE FUNCTION public.search_embeddings(
  query_embedding vector(1536),
  p_domain_id uuid DEFAULT NULL,
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  content text,
  url text,
  title text,
  similarity float
)
LANGUAGE sql STABLE AS $$
  SELECT 
    pe.chunk_text AS content,
    COALESCE((pe.metadata->>'url')::text, sp.url) AS url,
    COALESCE((pe.metadata->>'title')::text, sp.title) AS title,
    1 - (pe.embedding <-> query_embedding) AS similarity
  FROM page_embeddings pe
  JOIN scraped_pages sp ON sp.id = pe.page_id
  WHERE (p_domain_id IS NULL OR sp.domain_id = p_domain_id)
    AND 1 - (pe.embedding <-> query_embedding) > match_threshold
  ORDER BY pe.embedding <-> query_embedding
  LIMIT match_count;
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
