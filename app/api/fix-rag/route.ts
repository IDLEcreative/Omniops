import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

/**
 * DEBUG/SETUP ENDPOINT - Development use only
 *
 * Fixes RAG configuration for a customer domain
 *
 * Usage:
 *   POST /api/fix-rag (body: {domain: "example.com"})
 */

export async function POST(request: Request) {
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

  // Extract domain from request body
  let domain: string | null = null;
  try {
    const body = await request.json();
    domain = body.domain;
  } catch {
    // Body parsing failed
  }

  if (!domain) {
    return NextResponse.json(
      {
        error: 'domain parameter required',
        usage: {
          POST: '/api/fix-rag with body: {domain: "example.com"}'
        },
        note: 'This is a development/testing endpoint'
      },
      { status: 400 }
    );
  }

  const results: any = {
    function_creation: null,
    customer_config: null,
    test_search: null
  };

  try {
    // Step 1: Create the search_embeddings RPC function
    
    const createFunctionSQL = `
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
    `;
    
    // Execute the SQL to create the function
    let functionError;
    try {
      const result = await supabase.rpc('exec_sql', {
        sql: createFunctionSQL
      });
      functionError = result.error;
    } catch (err) {
      // If exec_sql doesn't exist, try another approach
      // We'll create a simple API endpoint to handle this
      functionError = 'Cannot create function via RPC';
    }
    
    if (functionError) {
      // Try alternative: Create a simpler version
      results.function_creation = { 
        status: 'alternative_needed',
        message: 'Need to create function manually or through migration'
      };
    } else {
      results.function_creation = { status: 'success' };
    }
    
    // Step 2: Add customer_configs entry for the domain

    // First check if it already exists
    const { data: existingConfig } = await supabase
      .from('customer_configs')
      .select('id, domain')
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
          created_at: new Date().toISOString()
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
          id: newConfig.id,
          domain: newConfig.domain 
        };
      }
    } else {
      results.customer_config = { 
        status: 'already_exists', 
        id: existingConfig.id,
        domain: existingConfig.domain
      };
    }
    
    // Step 3: Test the search with a simple query
    
    // Since we might not have the RPC function, let's do a direct search
    const { data: testResults } = await supabase
      .from('page_embeddings')
      .select('chunk_text, metadata')
      .textSearch('chunk_text', 'tipper')
      .limit(3);
    
    results.test_search = {
      found: testResults?.length || 0,
      samples: testResults?.map(r => r.chunk_text.substring(0, 100))
    };
    
    return NextResponse.json({
      success: true,
      domain,
      results,
      next_steps: [
        'The search_embeddings function may need to be created via SQL migration',
        `Customer config has been set up for ${domain}`,
        'The chat API should now be able to find and use the training data'
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
