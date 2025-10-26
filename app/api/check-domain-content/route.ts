import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { searchSimilarContent } from '@/lib/embeddings';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get('domain');
  const query = searchParams.get('query') || 'what do you sell';

  if (!domain) {
    return NextResponse.json({
      error: 'domain parameter is required for security and multi-tenant isolation',
      usage: 'GET /api/check-domain-content?domain=example.com&query=your-query'
    }, { status: 400 });
  }
  
  const supabase = await createServiceRoleClient();
  
  if (!supabase) {
    return NextResponse.json({ error: 'Database connection failed' }, { status: 503 });
  }
  
  try {
    // 1. Get domain info
    const { data: domainData } = await supabase
      .from('domains')
      .select('id, domain')
      .eq('domain', domain.replace('www.', ''))
      .single();

    if (!domainData) {
      return NextResponse.json({
        error: `Domain ${domain} not found in database`,
        suggestion: 'Try one of the existing domains or scrape content for this domain first'
      }, { status: 404 });
    }

    // 2. Check content counts (primary metric: scraped_pages)
    const { count: spCount } = await supabase
      .from('scraped_pages')
      .select('*', { count: 'exact', head: true })
      .eq('domain_id', domainData.id);

    // 3. Detect pgvector RPC availability
    let rpcAvailable = true;
    let vectorOperatorAvailable = true;
    try {
      const dummy = new Array(1536).fill(0.01);
      const { error: rpcErr } = await supabase.rpc('search_embeddings', {
        query_embedding: dummy,
        p_domain_id: domainData.id,
        match_threshold: 0.01,
        match_count: 1,
      });
      if (rpcErr) {
        rpcAvailable = false;
        if (String(rpcErr.message || '').includes('<=>')) vectorOperatorAvailable = false;
      }
    } catch {
      rpcAvailable = false;
    }

    // 4. Embeddings presence (robust, no misleading 0): try join count, else sample pages
    let embeddingsPresent = false;
    let embeddingsCount: number | null = null;
    let embeddingsCountMethod: 'join' | 'sample' | 'unknown' = 'unknown';
    try {
      const { count: joinedCount, error: joinError } = await supabase
        .from('page_embeddings')
        .select('id, scraped_pages!inner(domain_id)', { count: 'exact', head: true })
        .eq('scraped_pages.domain_id', domainData.id);

      if (!joinError) {
        embeddingsCount = joinedCount || 0;
        embeddingsPresent = (joinedCount || 0) > 0;
        embeddingsCountMethod = 'join';
      } else {
        // Fallback: sample first 200 page IDs and count embeddings among them
        const { data: pageIds } = await supabase
          .from('scraped_pages')
          .select('id')
          .eq('domain_id', domainData.id)
          .limit(200);
        const ids = (pageIds || []).map(p => p.id);
        if (ids.length > 0) {
          const { count: sampleCount } = await supabase
            .from('page_embeddings')
            .select('id', { count: 'exact', head: true })
            .in('page_id', ids);
          embeddingsPresent = (sampleCount || 0) > 0;
          embeddingsCount = sampleCount || 0; // sample count only
          embeddingsCountMethod = 'sample';
        }
      }
    } catch {
      // ignore, keep defaults
    }

    // 5. Test search with the domain (now gracefully falls back to keyword search)
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
        scraped_pages: spCount || 0,
      },
      embeddings: {
        present: embeddingsPresent,
        count: embeddingsCount,
        count_method: embeddingsCountMethod,
      },
      vector_support: {
        rpc_available: rpcAvailable,
        operator_available: vectorOperatorAvailable,
      },
      search_test: {
        query: query,
        results_count: searchResults.length,
        results: searchResults,
        error: searchError,
      },
      status: searchResults.length > 0
        ? '✅ RAG is working for this domain (may be using keyword fallback)'
        : !vectorOperatorAvailable
        ? '⚠️ pgvector operator missing; enable extension or use fallback'
        : '⚠️ No results; check scraping/embeddings'
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
