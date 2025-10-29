import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import OpenAI from 'openai';

/**
 * DEBUG ENDPOINT - Development use only
 *
 * Debugs RAG system for a specific domain
 *
 * Usage:
 *   GET /api/debug-rag?domain=example.com
 */

export async function GET(request: Request) {
  // Prevent use in production without explicit flag
  if (process.env.NODE_ENV === 'production' && !process.env.ENABLE_DEBUG_ENDPOINTS) {
    return NextResponse.json(
      { error: 'Debug endpoints disabled in production' },
      { status: 403 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 });
  }

  // Extract domain from query params
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get('domain');

  if (!domain) {
    return NextResponse.json(
      {
        error: 'domain parameter required',
        usage: {
          GET: '/api/debug-rag?domain=example.com'
        },
        note: 'This is a development/testing endpoint'
      },
      { status: 400 }
    );
  }

  const supabase = await createServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const debug: any = {};

  try {
    // 1. Check if customer_configs has the domain
    const { data: config, error: configError } = await supabase
      .from('customer_configs')
      .select('*')
      .eq('domain', domain)
      .single();
    
    debug.customer_config = {
      found: !!config,
      id: config?.id,
      error: configError?.message
    };
    
    // 2. Check if search_embeddings function exists
    let functions = null;
    let funcError = null;
    try {
      const { data, error } = await supabase
        .rpc('search_embeddings', {
          query_embedding: new Array(1536).fill(0),
          similarity_threshold: 0.1,
          match_count: 1
        });
      functions = data;
      funcError = error;
    } catch (err: any) {
      funcError = err.message;
    }
    
    debug.search_function = {
      exists: !funcError && funcError !== 'Could not find the function',
      error: funcError,
      test_result: functions
    };
    
    // 3. Test direct embedding search
    const testQuery = "tipper products";
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: testQuery,
    });
    const queryEmbedding = embeddingResponse.data[0]?.embedding;
    
    // 4. Try calling search_embeddings with real embedding
    let searchResults = null;
    let searchError = null;
    
    try {
      const { data, error } = await supabase.rpc('search_embeddings', {
        query_embedding: queryEmbedding,
        similarity_threshold: 0.5,
        match_count: 5,
        p_domain_id: config?.id || null
      });
      searchResults = data;
      searchError = error;
    } catch (e: any) {
      searchError = e.message;
    }
    
    debug.embedding_search = {
      query: testQuery,
      results_count: searchResults?.length || 0,
      results: searchResults?.slice(0, 2),
      error: searchError
    };
    
    // 5. Check what the searchSimilarContent function is doing
    const { searchSimilarContent } = await import('@/lib/embeddings');
    let libSearchResults = null;
    let libSearchError = null;
    
    try {
      libSearchResults = await searchSimilarContent(
        testQuery,
        domain,
        3,
        0.5
      );
    } catch (e: any) {
      libSearchError = e.message;
    }
    
    debug.lib_search = {
      results_count: libSearchResults?.length || 0,
      results: libSearchResults,
      error: libSearchError
    };
    
    // 6. Check raw embeddings data
    const { data: sampleEmbeddings } = await supabase
      .from('page_embeddings')
      .select('chunk_text, metadata')
      .textSearch('chunk_text', 'tipper')
      .limit(3);
    
    debug.raw_data = {
      sample_chunks_with_tipper: sampleEmbeddings?.length || 0,
      samples: sampleEmbeddings
    };
    
    return NextResponse.json({
      domain,
      debug,
      analysis: {
        has_customer_config: !!config,
        has_search_function: !searchError || (typeof searchError === 'string' && !searchError.includes('Could not find')) || (typeof searchError === 'object' && searchError.message && !searchError.message.includes('Could not find')),
        search_returning_results: (searchResults?.length || 0) > 0,
        lib_search_working: (libSearchResults?.length || 0) > 0,
        raw_data_exists: (sampleEmbeddings?.length || 0) > 0
      },
      likely_issue: determineIssue(debug, domain)
    });
    
  } catch (err: any) {
    return NextResponse.json({ 
      error: err.message,
      debug
    }, { status: 500 });
  }
}

function determineIssue(debug: any, domain: string): string {
  if (!debug.customer_config?.found) {
    return `Customer config not found - need to create entry for ${domain}`;
  }
  if (debug.search_function?.error?.includes('Could not find')) {
    return "search_embeddings function doesn't exist - run the SQL in Supabase dashboard";
  }
  if (debug.embedding_search?.error) {
    return `Search function error: ${debug.embedding_search.error}`;
  }
  if (debug.embedding_search?.results_count === 0) {
    return "Search function returns no results - check similarity threshold or embedding generation";
  }
  if (debug.lib_search?.error) {
    return `Library search error: ${debug.lib_search.error}`;
  }
  return "Unknown issue - check the debug output";
}