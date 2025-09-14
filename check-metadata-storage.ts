import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkMetadataStorage() {
  console.log('🔍 Checking metadata storage from recent scraping...\n');

  // Check recent scraping activity
  const { data: recentScrapes, error: scrapeError } = await supabase
    .from('scraped_pages')
    .select('url, title, created_at, domain_id')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })
    .limit(10);

  if (scrapeError) {
    console.error('Error fetching recent scrapes:', scrapeError);
    return;
  }

  console.log('📅 Recent scraping activity:');
  recentScrapes?.forEach(scrape => {
    const domain = scrape.url ? new URL(scrape.url).hostname : 'Unknown';
    console.log(`  - ${domain}: ${scrape.title || 'No title'} (${new Date(scrape.created_at).toLocaleString()})`);
  });

  // Get metadata statistics for recent content
  const { data: metadataStats, error: statsError } = await supabase.rpc('execute_sql', {
    query: `
      WITH recent_content AS (
        SELECT 
          wc.*,
          sp.domain
        FROM website_content wc
        JOIN scraped_pages sp ON wc.url = sp.url
        WHERE wc.created_at > NOW() - INTERVAL '24 hours'
      )
      SELECT 
        domain,
        COUNT(*) as total_pages,
        COUNT(metadata->>'brand') as brand_extracted,
        COUNT(metadata->>'category') as category_extracted,
        COUNT(CASE WHEN (metadata->>'is_product')::boolean THEN 1 END) as product_pages,
        COUNT(metadata->>'product_name') as product_names,
        COUNT(metadata->>'product_sku') as product_skus,
        COUNT(metadata->>'product_price') as product_prices,
        COUNT(metadata->>'product_availability') as product_availability,
        COUNT(metadata->'specifications') as specifications,
        COUNT(metadata->>'canonical_url') as canonical_urls,
        COUNT(metadata->>'meta_description') as meta_descriptions
      FROM recent_content
      GROUP BY domain
      ORDER BY total_pages DESC
    `
  });

  if (statsError) {
    // Try alternative approach
    const { data: websiteContent, error: wcError } = await supabase
      .from('website_content')
      .select('url, metadata, created_at')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(10);

    if (wcError) {
      console.error('Error fetching website content:', wcError);
      return;
    }

    console.log('\n📊 Metadata Analysis (last 10 entries):');
    websiteContent?.forEach((content, index) => {
      const meta = content.metadata || {};
      console.log(`\n${index + 1}. ${content.url}`);
      console.log(`   Created: ${new Date(content.created_at).toLocaleString()}`);
      console.log(`   Brand: ${meta.brand || 'NOT EXTRACTED'}`);
      console.log(`   Category: ${meta.category || 'NOT EXTRACTED'}`);
      console.log(`   Is Product: ${meta.is_product || false}`);
      
      if (meta.is_product) {
        console.log(`   Product Name: ${meta.product_name || 'N/A'}`);
        console.log(`   SKU: ${meta.product_sku || 'N/A'}`);
        console.log(`   Price: ${meta.product_price || 'N/A'}`);
        console.log(`   Availability: ${meta.product_availability || 'N/A'}`);
        console.log(`   Specifications: ${meta.specifications ? 'YES' : 'NO'}`);
      }
    });

    // Check embeddings metadata
    const { data: embeddings, error: embError } = await supabase
      .from('page_embeddings')
      .select('chunk_text, metadata, created_at')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(5);

    console.log('\n🔢 Page Embeddings Metadata (last 5):');
    embeddings?.forEach((emb, index) => {
      const meta = emb.metadata || {};
      console.log(`\n${index + 1}. Chunk (${emb.chunk_text.substring(0, 50)}...)`);
      console.log(`   Chunk Index: ${meta.chunk_index || 'N/A'}`);
      console.log(`   Has Metadata: ${Object.keys(meta).length > 0 ? 'YES' : 'NO'}`);
    });
  } else {
    console.log('\n📊 Metadata Storage Statistics by Domain:');
    console.log('═'.repeat(80));
    
    metadataStats?.forEach(stat => {
      const brandRate = ((stat.brand_extracted / stat.total_pages) * 100).toFixed(1);
      const categoryRate = ((stat.category_extracted / stat.total_pages) * 100).toFixed(1);
      const productRate = ((stat.product_pages / stat.total_pages) * 100).toFixed(1);
      
      console.log(`\n🌐 Domain: ${stat.domain}`);
      console.log(`   Total Pages: ${stat.total_pages}`);
      console.log(`   Brand Extraction: ${stat.brand_extracted}/${stat.total_pages} (${brandRate}%)`);
      console.log(`   Category Extraction: ${stat.category_extracted}/${stat.total_pages} (${categoryRate}%)`);
      console.log(`   Product Pages: ${stat.product_pages}/${stat.total_pages} (${productRate}%)`);
      
      if (stat.product_pages > 0) {
        console.log(`   Product Details:`);
        console.log(`     - Names: ${stat.product_names}`);
        console.log(`     - SKUs: ${stat.product_skus}`);
        console.log(`     - Prices: ${stat.product_prices}`);
        console.log(`     - Availability: ${stat.product_availability}`);
        console.log(`     - Specifications: ${stat.specifications}`);
      }
      
      console.log(`   SEO Metadata:`);
      console.log(`     - Canonical URLs: ${stat.canonical_urls}`);
      console.log(`     - Meta Descriptions: ${stat.meta_descriptions}`);
    });
  }

  // Check for any scraping jobs
  const { data: scrapeJobs, error: jobError } = await supabase
    .from('scrape_jobs')
    .select('domain, status, progress, created_at, completed_at')
    .order('created_at', { ascending: false })
    .limit(5);

  console.log('\n📋 Recent Scrape Jobs:');
  scrapeJobs?.forEach(job => {
    const status = job.status === 'completed' ? '✅' : job.status === 'failed' ? '❌' : '⏳';
    console.log(`  ${status} ${job.domain}: ${job.status} (Progress: ${job.progress || 0}%)`);
    if (job.completed_at) {
      const duration = new Date(job.completed_at).getTime() - new Date(job.created_at).getTime();
      console.log(`     Duration: ${(duration / 1000 / 60).toFixed(1)} minutes`);
    }
  });
}

checkMetadataStorage()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });