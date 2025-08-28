import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { searchSimilarContent } from '@/lib/embeddings';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get('domain') || 'thompsonseparts.co.uk';
  const query = searchParams.get('query') || 'what do you sell';
  
  const supabase = await createServiceRoleClient();
  
  if (!supabase) {
    return NextResponse.json({ error: 'Database connection failed' }, { status: 503 });
  }
  
  try {
    // 1. Get domain info
    const { data: domainData } = await supabase
      .from('domains')
      .select('id, domain')
      .eq('domain', domain)
      .single();
    
    if (!domainData) {
      return NextResponse.json({ 
        error: `Domain ${domain} not found in database`,
        suggestion: 'Try one of the existing domains or scrape content for this domain first'
      }, { status: 404 });
    }
    
    // 2. Check content counts
    const { count: scCount } = await supabase
      .from('scraped_content')
      .select('*', { count: 'exact', head: true })
      .eq('domain', domain);
    
    const { count: spCount } = await supabase
      .from('scraped_pages')
      .select('*', { count: 'exact', head: true })
      .eq('domain_id', domainData.id);
    
    // 3. Check embeddings count
    const { count: ceCount } = await supabase
      .from('content_embeddings')
      .select('*', { count: 'exact', head: true })
      .eq('domain_id', domainData.id);
    
    const { count: peCount } = await supabase
      .from('page_embeddings')
      .select('*', { count: 'exact', head: true })
      .eq('page_id', domainData.id);
    
    // 4. Test search with the domain
    let searchResults: any[] = [];
    let searchError: string | null = null;
    
    try {
      searchResults = await searchSimilarContent(query, domain, 5, 0.3);
    } catch (error: any) {
      searchError = error.message;
    }
    
    return NextResponse.json({
      domain: domain,
      domain_id: domainData.id,
      content: {
        scraped_content: scCount || 0,
        scraped_pages: spCount || 0,
        total: (scCount || 0) + (spCount || 0)
      },
      embeddings: {
        content_embeddings: ceCount || 0,
        page_embeddings: peCount || 0,
        total: (ceCount || 0) + (peCount || 0)
      },
      search_test: {
        query: query,
        results_count: searchResults.length,
        results: searchResults,
        error: searchError
      },
      status: searchResults.length > 0 
        ? '✅ RAG is working for this domain'
        : searchError
        ? `❌ Search error: ${searchError}`
        : (ceCount || 0) + (peCount || 0) === 0
        ? '⚠️ No embeddings found - need to generate embeddings'
        : '⚠️ Embeddings exist but search returns no results - check similarity threshold'
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}