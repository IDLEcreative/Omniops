#!/usr/bin/env npx tsx
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function main() {
  console.log('🔍 CHECKING DATABASE CONNECTION:\n');
  console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('Using service role key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Yes' : 'No');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }
  );

  // Check scraped_pages
  const { count: totalCount, error: countError } = await supabase
    .from('scraped_pages')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.log('\n❌ Error counting scraped_pages:', countError);
  } else {
    console.log('\n✅ Total scraped_pages:', totalCount);
  }

  // Check Thompson's specifically
  const { count: thompsonCount, error: thompsonError } = await supabase
    .from('scraped_pages')
    .select('*', { count: 'exact', head: true })
    .eq('domain', 'thompsonseparts.co.uk');

  if (thompsonError) {
    console.log('❌ Error counting Thompson pages:', thompsonError);
  } else {
    console.log('✅ Thompson\'s pages:', thompsonCount);
  }

  // Get sample Thompson's products
  const { data: products, error: productsError } = await supabase
    .from('scraped_pages')
    .select('url, title')
    .eq('domain', 'thompsonseparts.co.uk')
    .like('url', '%/product/%')
    .limit(10);

  if (productsError) {
    console.log('❌ Error fetching products:', productsError);
  } else if (products && products.length > 0) {
    console.log('\n📦 Sample Thompson\'s Products:');
    products.forEach(p => console.log(`  • ${p.title || p.url}`));
  } else {
    console.log('\n⚠️ No Thompson\'s product pages found');
  }

  // Check page_embeddings
  const { count: embeddingCount } = await supabase
    .from('page_embeddings')
    .select('*', { count: 'exact', head: true });

  console.log('\n📊 Total embeddings:', embeddingCount);

  // Check if embeddings link to scraped_pages properly
  const { data: embeddingsSample } = await supabase
    .from('page_embeddings')
    .select('page_id')
    .limit(1);

  if (embeddingsSample && embeddingsSample.length > 0) {
    const { data: linkedPage } = await supabase
      .from('scraped_pages')
      .select('domain')
      .eq('id', embeddingsSample[0].page_id)
      .single();
    
    if (linkedPage) {
      console.log('✅ Embeddings properly linked to scraped_pages');
      console.log('   Sample linked domain:', linkedPage.domain);
    } else {
      console.log('⚠️ Embeddings may be orphaned (not linked to scraped_pages)');
    }
  }
}

main().catch(console.error);