import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { searchSimilarContent } from '@/lib/embeddings';
import OpenAI from 'openai';

/**
 * DEBUG ENDPOINT - Development use only
 * Tests RAG search functionality end-to-end
 *
 * SECURITY: Protected by middleware in production
 */

export async function GET(request: NextRequest) {
  // Additional layer of protection (middleware is primary)
  if (process.env.NODE_ENV === 'production' && !process.env.ENABLE_DEBUG_ENDPOINTS) {
    return NextResponse.json(
      { error: 'Not found' },
      { status: 404 }
    );
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
  });
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query') || 'What products do you offer?';

  const supabase = await createServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }
  
  try {
    // Step 1: Get available domains with embeddings
    const { data: domains, error: domainsError } = await supabase
      .from('scraped_pages')
      .select('domain')
      .not('domain', 'is', null);
    
    if (domainsError) {
      console.error('Error fetching domains:', domainsError);
    }
    
    const uniqueDomains = [...new Set(domains?.map(d => d.domain) || [])];
    
    // Step 2: Get sample embeddings to verify structure
    const { data: sampleEmbedding, error: sampleError } = await supabase
      .from('page_embeddings')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.error('Error fetching sample embedding:', sampleError);
    }
    
    // Step 3: Test the search function with the first available domain
    let searchResults = null;
    let searchError = null;
    let usedDomain = null;
    
    if (uniqueDomains.length > 0) {
      usedDomain = uniqueDomains[0];
      try {
        searchResults = await searchSimilarContent(
          query,
          usedDomain,
          3,
          0.5 // Lower threshold to get more results
        );
      } catch (err: any) {
        searchError = err.message;
      }
    }
    
    // Step 4: Test direct RPC call to search_embeddings
    let rpcResults = null;
    let rpcError = null;
    
    try {
      // Generate embedding for test query
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: query,
      });
      const queryEmbedding = embeddingResponse.data[0]?.embedding;
      
      if (queryEmbedding) {
        // Try calling the RPC function directly
        const { data, error } = await supabase.rpc('search_embeddings', {
          query_embedding: queryEmbedding,
          similarity_threshold: 0.5,
          match_count: 5,
        });
        
        if (error) {
          rpcError = error.message;
        } else {
          rpcResults = data;
        }
      }
    } catch (err: any) {
      rpcError = err.message;
    }
    
    // Step 5: Check table structures
    const { data: pageEmbeddingsCount, error: pageCountError } = await supabase
      .from('page_embeddings')
      .select('*', { count: 'exact', head: true });
    
    if (pageCountError) {
      console.error('Error counting page embeddings:', pageCountError);
    }
    
    const { data: contentEmbeddingsCount, error: contentCountError } = await supabase
      .from('page_embeddings')
      .select('*', { count: 'exact', head: true });
    
    if (contentCountError) {
      console.error('Error counting page embeddings:', contentCountError);
    }
    
    return NextResponse.json({
      test_query: query,
      available_domains: uniqueDomains,
      embeddings_info: {
        page_embeddings_count: pageEmbeddingsCount,
        sample_embedding_structure: sampleEmbedding ? Object.keys(sampleEmbedding[0] || {}) : null
      },
      search_test: {
        domain_used: usedDomain,
        results: searchResults,
        error: searchError
      },
      rpc_test: {
        results: rpcResults,
        error: rpcError
      },
      summary: {
        has_domains: uniqueDomains.length > 0,
        search_working: searchResults !== null && searchResults.length > 0,
        rpc_working: rpcResults !== null,
        total_results_found: searchResults?.length || 0
      }
    });
    
  } catch (err: any) {
    return NextResponse.json({ 
      error: err.message,
      stack: err.stack 
    }, { status: 500 });
  }
}