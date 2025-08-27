import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  
  try {
    // Check customer_configs table for WooCommerce
    const { data: customerConfigs, count: configCount } = await supabase
      .from('customer_configs')
      .select('*', { count: 'exact', head: false })
      .limit(1);

    // Check scraped_pages table
    const { data: scrapedPages, count: scrapedCount } = await supabase
      .from('scraped_pages')
      .select('*', { count: 'exact', head: false })
      .limit(1);

    // Check website_content table  
    const { data: websiteContent, count: websiteCount } = await supabase
      .from('website_content')
      .select('*', { count: 'exact', head: false })
      .limit(1);

    // Check page_embeddings table
    const { data: pageEmbeddings, count: pageEmbCount } = await supabase
      .from('page_embeddings')
      .select('*', { count: 'exact', head: false })
      .limit(1);

    // Check content_embeddings table
    const { data: contentEmbeddings, count: contentEmbCount } = await supabase
      .from('content_embeddings')
      .select('*', { count: 'exact', head: false })
      .limit(1);

    // Get sample customer configs
    const { data: sampleConfigs } = await supabase
      .from('customer_configs')
      .select('domain, business_name, woocommerce_enabled, woocommerce_url')
      .limit(3);

    // Get sample data from each table
    const { data: sampleScraped } = await supabase
      .from('scraped_pages')
      .select('id, url, title, domain, created_at')
      .limit(3);

    const { data: sampleContent } = await supabase
      .from('website_content')
      .select('id, url, title, domain, created_at')
      .limit(3);

    // Check if embeddings have the vector column
    let embeddingColumns = null;
    try {
      const { data } = await supabase.rpc('query', {
        query_text: `
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name IN ('page_embeddings', 'content_embeddings')
          AND table_schema = 'public'
          ORDER BY table_name, ordinal_position
        `
      });
      embeddingColumns = data;
    } catch (e) {
      // RPC might not exist, ignore
    }

    return NextResponse.json({
      table_counts: {
        customer_configs: configCount || 0,
        scraped_pages: scrapedCount || 0,
        website_content: websiteCount || 0,
        page_embeddings: pageEmbCount || 0,
        content_embeddings: contentEmbCount || 0
      },
      samples: {
        customer_configs: sampleConfigs || [],
        scraped_pages: sampleScraped || [],
        website_content: sampleContent || []
      },
      embedding_columns: embeddingColumns || [],
      summary: {
        has_customer_configs: (configCount || 0) > 0,
        has_scraped_data: (scrapedCount || 0) > 0 || (websiteCount || 0) > 0,
        has_embeddings: (pageEmbCount || 0) > 0 || (contentEmbCount || 0) > 0,
        total_content: (scrapedCount || 0) + (websiteCount || 0),
        total_embeddings: (pageEmbCount || 0) + (contentEmbCount || 0)
      }
    });

  } catch (err: any) {
    return NextResponse.json({ 
      error: err.message,
      details: err.details || err.hint || ''
    }, { status: 500 });
  }
}