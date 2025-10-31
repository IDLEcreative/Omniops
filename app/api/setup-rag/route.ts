import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { checkExpensiveOpRateLimit } from '@/lib/rate-limit';

/**
 * DEBUG/SETUP ENDPOINT - Development use only
 *
 * Initializes RAG system for a customer domain
 *
 * Usage:
 *   GET /api/setup-rag?domain=example.com
 *   POST /api/setup-rag (body: {domain: "example.com"})
 */

export async function GET(request: Request) {
  return handleSetup(request);
}

export async function POST(request: Request) {
  return handleSetup(request);
}

async function handleSetup(request: Request) {
  // Prevent use in production without explicit flag
  if (process.env.NODE_ENV === 'production' && !process.env.ENABLE_DEBUG_ENDPOINTS) {
    return NextResponse.json(
      { error: 'Debug endpoints disabled in production' },
      { status: 403 }
    );
  }

      const supabase = await createServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }

  // Extract domain from query params or request body
  const { searchParams } = new URL(request.url);
  let domain = searchParams.get('domain');

  // For POST requests, also check body
  if (!domain && request.method === 'POST') {
    try {
      const body = await request.json();
      domain = body.domain;
    } catch {
      // Body parsing failed, domain will remain null
    }
  }

  if (!domain) {
    return NextResponse.json(
      {
        error: 'domain parameter required',
        usage: {
          GET: '/api/setup-rag?domain=example.com',
          POST: '/api/setup-rag with body: {domain: "example.com"}'
        },
        note: 'This is a development/testing endpoint'
      },
      { status: 400 }
    );
  }

  // Rate limit expensive RAG setup operations
  const rateLimit = checkExpensiveOpRateLimit(domain);

  if (!rateLimit.allowed) {
    const resetDate = new Date(rateLimit.resetTime);
    return NextResponse.json(
      {
        error: 'Rate limit exceeded for RAG setup operations',
        message: 'You have exceeded the RAG setup rate limit. Please try again later.',
        resetTime: resetDate.toISOString(),
        remaining: rateLimit.remaining
      },
      {
        status: 429,
        headers: {
          'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': resetDate.toISOString()
        }
      }
    );
  }

  const results: any = {
    customer_config: null,
    embedding_test: null,
    function_sql: null
  };

  try {
    // Step 1: Add or update customer config
    console.log(`Setting up customer config for ${domain}...`);

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
          company_name: `Customer ${domain}`,
          business_name: `Business ${domain}`,
          woocommerce_enabled: false,
          admin_email: `admin@${domain}`,
          welcome_message: `Welcome! How can I help you today?`,
          primary_color: '#0066cc',
          chat_enabled: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (configError) {
        // Try without optional fields
        const { data: simpleConfig, error: simpleError } = await supabase
          .from('customer_configs')
          .insert({
            domain: domain,
            company_name: `Customer ${domain}`,
            admin_email: `admin@${domain}`,
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
-- IMPORTANT: Run this SQL in your Supabase SQL Editor to enable vector search

-- 1) Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2) Create or replace the vector search function matching the app's RPC call
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

-- 3) (Optional) Add an IVF_FLAT index for speed
-- CREATE INDEX IF NOT EXISTS page_embeddings_embedding_idx
--   ON public.page_embeddings USING ivfflat (embedding vector_l2_ops) WITH (lists = 100);

-- 4) Grant execute permissions
GRANT EXECUTE ON FUNCTION public.search_embeddings TO anon, authenticated, service_role;

-- 5) Verify creation
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_name = 'search_embeddings';
    `.trim();
    
    return NextResponse.json({
      success: true,
      domain,
      results,
      instructions: [
        `✅ Customer config has been set up for ${domain}`,
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
