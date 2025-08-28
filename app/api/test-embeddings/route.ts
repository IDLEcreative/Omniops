import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { searchSimilarContent } from '@/lib/embeddings';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get('domain') || 'localhost';
  const query = searchParams.get('query') || 'what do you sell';
  
  const supabase = await createServiceRoleClient();
  
  if (!supabase) {
    return NextResponse.json({ error: 'Database connection failed' }, { status: 503 });
  }
  
  const results: any = {
    domain,
    query,
    domains: [],
    scraped_content: {},
    embeddings_count: {},
    search_results: []
  };
  
  // 1. Check domains
  const { data: domains } = await supabase
    .from('domains')
    .select('id, domain')
    .order('created_at', { ascending: false })
    .limit(10);
    
  results.domains = domains || [];
  
  // 2. Check scraped content for each domain
  for (const d of domains || []) {
    const { count } = await supabase
      .from('scraped_content')
      .select('*', { count: 'exact', head: true })
      .eq('domain', d.domain);
      
    results.scraped_content[d.domain] = count || 0;
  }
  
  // 3. Check embeddings count
  for (const d of domains || []) {
    const { count } = await supabase
      .from('content_embeddings')
      .select('*', { count: 'exact', head: true })
      .eq('domain_id', d.id);
      
    results.embeddings_count[d.domain] = count || 0;
  }
  
  // 4. Test search
  try {
    const searchResults = await searchSimilarContent(
      query,
      domain,
      5,
      0.3
    );
    results.search_results = searchResults;
  } catch (error: any) {
    results.search_error = error.message;
  }
  
  // 5. Check if RPC function exists
  try {
    const dummyEmbedding = new Array(1536).fill(0.1);
    const { data: rpcTest, error: rpcError } = await supabase.rpc('search_embeddings', {
      query_embedding: dummyEmbedding,
      p_domain_id: domains?.[0]?.id || null,
      match_threshold: 0.1,
      match_count: 1
    });
    
    results.rpc_test = {
      success: !rpcError,
      error: rpcError?.message,
      results_count: rpcTest?.length || 0
    };
  } catch (error: any) {
    results.rpc_test = {
      success: false,
      error: error.message
    };
  }
  
  return NextResponse.json(results, { status: 200 });
}