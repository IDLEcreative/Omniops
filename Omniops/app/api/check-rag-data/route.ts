import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

export async function GET(request: Request) {
  // Performance: Mark start time
  const startTime = performance.now();
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  
  try {
    // Performance: Batch all database queries with Promise.all
    const [pagesResult, embeddingsResult, configsResult] = await Promise.all([
      supabase
        .from('scraped_pages')
        .select('id, url, title, domain')
        .limit(5),
      supabase
        .from('page_embeddings')
        .select('id, page_id, chunk_text, metadata')
        .limit(5),
      supabase
        .from('customer_configs')
        .select('id, domain, company_name, woocommerce_enabled')
        .limit(5)
    ]);
    
    const scrapedPages = pagesResult.data;
    const pageEmbeddings = embeddingsResult.data;
    const customerConfigs = configsResult.data;
    
    if (pagesResult.error) {
      console.error('Error fetching scraped pages:', pagesResult.error);
    }
    if (embeddingsResult.error) {
      console.error('Error fetching page embeddings:', embeddingsResult.error);
    }
    if (configsResult.error) {
      console.error('Error fetching customer configs:', configsResult.error);
    }
    
    // Check if there's a function for searching
    let functions = null;
    try {
      const { data } = await supabase.rpc('get_functions', {});
      functions = data;
    } catch (e) {
      // Function might not exist
    }
    
    // Try to find embeddings linked to scraped pages
    let linkedData = null;
    if (scrapedPages && scrapedPages.length > 0 && pageEmbeddings && pageEmbeddings.length > 0) {
      const firstPage = scrapedPages[0];
      if (firstPage) {
        const pageId = firstPage.id;
        const { data: linked, error: linkedError } = await supabase
          .from('page_embeddings')
          .select('*')
          .eq('page_id', pageId)
          .limit(1);
        
        if (linkedError) {
          console.error('Error fetching linked embeddings:', linkedError);
        } else {
          linkedData = linked;
        }
      }
    }
    
    const responseData = {
      scraped_pages_sample: scrapedPages,
      page_embeddings_sample: pageEmbeddings,
      customer_configs: customerConfigs,
      available_functions: functions,
      linked_embedding_example: linkedData,
      analysis: {
        has_scraped_content: (scrapedPages?.length || 0) > 0,
        has_embeddings: (pageEmbeddings?.length || 0) > 0,
        has_customer_configs: (customerConfigs?.length || 0) > 0,
        scraped_pages_have_domains: scrapedPages?.some(p => p.domain),
        embeddings_have_page_ids: pageEmbeddings?.every(e => e.page_id),
        potential_domain_sources: customerConfigs?.map(c => c.domain).filter(Boolean)
      }
    };
    
    // Generate ETag based on response content
    const etag = createHash('md5')
      .update(JSON.stringify(responseData))
      .digest('hex');
    
    // Check if client has cached version
    const ifNoneMatch = request.headers.get('if-none-match');
    if (ifNoneMatch === `"${etag}"`) {
      // Performance: Log cache hit and timing
      const endTime = performance.now();
      console.log(`[Performance] check-rag-data cache hit: ${(endTime - startTime).toFixed(2)}ms`);
      return new NextResponse(null, { 
        status: 304,
        headers: {
          'ETag': `"${etag}"`,
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=30'
        }
      });
    }
    
    // Performance: Log timing
    const endTime = performance.now();
    console.log(`[Performance] check-rag-data completed: ${(endTime - startTime).toFixed(2)}ms`);
    
    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=30',
        'ETag': `"${etag}"`,
        'X-Response-Time': `${(endTime - startTime).toFixed(2)}ms`
      }
    });
    
  } catch (err: any) {
    return NextResponse.json({ 
      error: err.message,
      details: err 
    }, { status: 500 });
  }
}