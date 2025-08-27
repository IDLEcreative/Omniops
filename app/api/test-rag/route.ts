import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { searchSimilarContent } from '@/lib/embeddings';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query') || 'What products do you offer?';
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  
  try {
    // Step 1: Get available domains with embeddings
    const { data: domains } = await supabase
      .from('scraped_pages')
      .select('domain')
      .not('domain', 'is', null);
    
    const uniqueDomains = [...new Set(domains?.map(d => d.domain) || [])];
    
    // Step 2: Get sample embeddings to verify structure
    const { data: sampleEmbedding } = await supabase
      .from('page_embeddings')
      .select('*')
      .limit(1);
    
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
    const { data: pageEmbeddingsCount } = await supabase
      .from('page_embeddings')
      .select('*', { count: 'exact', head: true });
    
    const { data: contentEmbeddingsCount } = await supabase
      .from('content_embeddings')
      .select('*', { count: 'exact', head: true });
    
    return NextResponse.json({
      test_query: query,
      available_domains: uniqueDomains,
      embeddings_info: {
        page_embeddings_count: pageEmbeddingsCount,
        content_embeddings_count: contentEmbeddingsCount,
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