import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  
  try {
    // Get scraped pages with their IDs
    const { data: scrapedPages, error: pagesError } = await supabase
      .from('scraped_pages')
      .select('id, url, title, domain')
      .limit(5);
    
    if (pagesError) {
      console.error('Error fetching scraped pages:', pagesError);
    }
    
    // Get page embeddings with their page_ids
    const { data: pageEmbeddings, error: embeddingsError } = await supabase
      .from('page_embeddings')
      .select('id, page_id, chunk_text, metadata')
      .limit(5);
    
    if (embeddingsError) {
      console.error('Error fetching page embeddings:', embeddingsError);
    }
    
    // Get customer configs to see available domains
    const { data: customerConfigs, error: configsError } = await supabase
      .from('customer_configs')
      .select('id, domain, company_name, woocommerce_enabled')
      .limit(5);
    
    if (configsError) {
      console.error('Error fetching customer configs:', configsError);
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
    
    return NextResponse.json({
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
    });
    
  } catch (err: any) {
    return NextResponse.json({ 
      error: err.message,
      details: err 
    }, { status: 500 });
  }
}