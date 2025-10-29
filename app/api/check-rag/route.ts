import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';

/**
 * DEBUG ENDPOINT - Development use only
 * Checks RAG system configuration and status
 *
 * SECURITY: Protected by middleware in production
 */

export async function GET() {
  // Additional layer of protection (middleware is primary)
  if (process.env.NODE_ENV === 'production' && !process.env.ENABLE_DEBUG_ENDPOINTS) {
    return NextResponse.json(
      { error: 'Not found' },
      { status: 404 }
    );
  }

  const supabase = await createServiceRoleClient();
  
  if (!supabase) {
    return NextResponse.json({ error: 'Database connection failed' }, { status: 503 });
  }
  
  try {
    // 1. Check domains
    const { data: domains, error: domainError } = await supabase
      .from('domains')
      .select('id, domain')
      .limit(5);
    
    if (domainError) {
      return NextResponse.json({ error: 'Domain query failed', details: domainError }, { status: 500 });
    }
    
    // 2. Check scraped content for localhost
    const localhostDomain = domains?.find(d => d.domain === 'localhost');
    let contentCount = 0;
    let embeddingsCount = 0;
    
    if (localhostDomain) {
      // Check scraped_content table (old structure)
      const { count: scCount } = await supabase
        .from('scraped_content')
        .select('*', { count: 'exact', head: true })
        .eq('domain', 'localhost');
      
      // Check scraped_pages table (new structure)
      const { count: spCount } = await supabase
        .from('scraped_pages')
        .select('*', { count: 'exact', head: true })
        .eq('domain_id', localhostDomain.id);
      
      contentCount = (scCount || 0) + (spCount || 0);
      
      // Check embeddings
      const { count: ceCount } = await supabase
        .from('page_embeddings')
        .select('*', { count: 'exact', head: true })
        .eq('domain_id', localhostDomain.id);
      
      embeddingsCount = ceCount || 0;
    }
    
    // 3. Quick test of search function
    let functionExists = false;
    try {
      const dummyEmbedding = new Array(1536).fill(0.1);
      const { error } = await supabase.rpc('search_embeddings', {
        query_embedding: dummyEmbedding,
        p_domain_id: localhostDomain?.id || null,
        match_threshold: 0.1,
        match_count: 1
      });
      functionExists = !error;
    } catch {
      functionExists = false;
    }
    
    return NextResponse.json({
      status: 'ok',
      domains: domains?.map(d => d.domain) || [],
      localhost: {
        exists: !!localhostDomain,
        id: localhostDomain?.id,
        content_count: contentCount,
        embeddings_count: embeddingsCount
      },
      search_function_exists: functionExists,
      recommendation: contentCount === 0 
        ? 'No content scraped for localhost. Need to scrape content first.'
        : embeddingsCount === 0
        ? 'Content exists but no embeddings. Need to generate embeddings.'
        : !functionExists
        ? 'Embeddings exist but search function missing. Run fix-search-embeddings.sql in Supabase.'
        : 'System should be working. Check the chat implementation.'
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}