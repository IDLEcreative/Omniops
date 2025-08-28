import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  
  try {
    // Check what URLs are stored with embeddings that contain "trailer sheet"
    const { data: embeddings } = await supabase
      .from('page_embeddings')
      .select('chunk_text, metadata, page_id')
      .textSearch('chunk_text', 'trailer sheet')
      .limit(5);
    
    // Check if there are any scraped_pages entries
    const { data: scrapedPages } = await supabase
      .from('scraped_pages')
      .select('id, url, title')
      .limit(5);
    
    // Check unique URLs in embeddings
    const { data: allEmbeddings } = await supabase
      .from('page_embeddings')
      .select('metadata')
      .limit(100);
    
    const uniqueUrls = new Set();
    allEmbeddings?.forEach(emb => {
      if (emb.metadata?.url) {
        uniqueUrls.add(emb.metadata.url);
      }
    });
    
    return NextResponse.json({
      trailer_sheet_embeddings: embeddings?.map(e => ({
        text_preview: e.chunk_text.substring(0, 100),
        url: e.metadata?.url,
        page_id: e.page_id
      })),
      scraped_pages_sample: scrapedPages,
      unique_urls_in_embeddings: Array.from(uniqueUrls),
      analysis: {
        total_unique_urls: uniqueUrls.size,
        has_scraped_pages: (scrapedPages?.length || 0) > 0,
        issue: uniqueUrls.size <= 10 
          ? "Only a few pages were scraped - mostly main navigation pages"
          : "Many pages scraped - check if product pages are included"
      }
    });
    
  } catch (err: any) {
    return NextResponse.json({ 
      error: err.message
    }, { status: 500 });
  }
}