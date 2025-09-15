import { createClient  } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function validatePriceDetection() {
  console.log('🔍 Validating Price Detection on Product Pages...\n');
  
  // Check product pages with price information
  const { data: embeddings, error: embError } = await supabase
    .from('page_embeddings')
    .select('page_id, metadata, chunk_metadata')
    .not('metadata->price_range', 'is', null)
    .limit(10);
    
  if (embError) {
    console.error('Error fetching embeddings:', embError);
    return;
  }
  
  // Get URLs from scraped_pages
  const pageIds = embeddings?.map(e => e.page_id) || [];
  const { data: productPages, error } = await supabase
    .from('scraped_pages')
    .select('id, url, title')
    .in('id', pageIds)
    .like('url', '%/product/%');
    
  if (error) {
    console.error('Error fetching product pages:', error);
    return;
  }
  
  console.log(`Found ${productPages?.length || 0} product pages with prices:\n`);
  
  // Match embeddings with pages
  productPages?.forEach((page, idx) => {
    const embedding = embeddings?.find(e => e.page_id === page.id);
    console.log(`${idx + 1}. ${page.url}`);
    console.log(`   Title: ${page.title}`);
    if (embedding?.metadata?.price_range) {
      console.log(`   💰 Price: ${JSON.stringify(embedding.metadata.price_range)}`);
    }
    if (embedding?.metadata?.entities?.skus?.length > 0) {
      console.log(`   📦 SKUs: ${embedding.metadata.entities.skus.join(', ')}`);
    }
    console.log();
  });
  
  // Check overall price detection stats for product pages
  const { data: allProductPages } = await supabase
    .from('scraped_pages')
    .select('id')
    .like('url', '%thompsonseparts%')
    .like('url', '%/product/%');
    
  const productPageIds = allProductPages?.map(p => p.id) || [];
  
  const { data: stats } = await supabase
    .from('page_embeddings')
    .select('metadata')
    .in('page_id', productPageIds);
    
  const withPrices = stats?.filter(s => s.metadata?.price_range).length || 0;
  const total = productPageIds.length;
  
  console.log('📊 Price Detection Statistics:');
  console.log(`   Total product pages: ${total}`);
  console.log(`   Pages with prices detected: ${withPrices}`);
  console.log(`   Detection rate: ${total > 0 ? ((withPrices/total)*100).toFixed(1) : 0}%`);
}

validatePriceDetection().catch(console.error);