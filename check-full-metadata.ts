import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkFullMetadata() {
  console.log('🔍 Comprehensive Metadata Check\n');
  console.log('═'.repeat(80));

  // 1. Check website_content table for recent entries with metadata
  console.log('\n📊 Website Content Metadata (last 7 days):');
  const { data: websiteContent, error: wcError } = await supabase
    .from('website_content')
    .select('url, metadata, created_at, domain_id')
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })
    .limit(20);

  if (wcError) {
    console.error('Error fetching website content:', wcError);
  } else if (!websiteContent || websiteContent.length === 0) {
    console.log('  ⚠️  No website_content entries found in the last 7 days');
  } else {
    // Group by domain and analyze metadata
    const domainStats = new Map<string, any>();
    
    websiteContent.forEach(content => {
      const domain = content.url ? new URL(content.url).hostname : 'unknown';
      if (!domainStats.has(domain)) {
        domainStats.set(domain, {
          total: 0,
          withBrand: 0,
          withCategory: 0,
          products: 0,
          withSpecs: 0,
          withPrice: 0,
          withSku: 0,
          samples: []
        });
      }
      
      const stats = domainStats.get(domain);
      stats.total++;
      
      if (content.metadata) {
        if (content.metadata.brand) stats.withBrand++;
        if (content.metadata.category) stats.withCategory++;
        if (content.metadata.is_product) {
          stats.products++;
          if (content.metadata.specifications) stats.withSpecs++;
          if (content.metadata.product_price) stats.withPrice++;
          if (content.metadata.product_sku) stats.withSku++;
        }
        
        // Keep first 2 samples
        if (stats.samples.length < 2) {
          stats.samples.push({
            url: content.url,
            metadata: content.metadata
          });
        }
      }
    });

    // Display stats
    domainStats.forEach((stats, domain) => {
      console.log(`\n  🌐 ${domain}:`);
      console.log(`     Total pages: ${stats.total}`);
      console.log(`     Brand extraction: ${stats.withBrand}/${stats.total} (${((stats.withBrand/stats.total)*100).toFixed(1)}%)`);
      console.log(`     Category extraction: ${stats.withCategory}/${stats.total} (${((stats.withCategory/stats.total)*100).toFixed(1)}%)`);
      console.log(`     Product pages: ${stats.products}`);
      
      if (stats.products > 0) {
        console.log(`     Product details:`);
        console.log(`       - With prices: ${stats.withPrice}`);
        console.log(`       - With SKUs: ${stats.withSku}`);
        console.log(`       - With specs: ${stats.withSpecs}`);
      }
      
      if (stats.samples.length > 0) {
        console.log(`\n     Sample metadata:`);
        stats.samples.forEach((sample: any, idx: number) => {
          console.log(`       ${idx + 1}. ${sample.url.substring(0, 60)}...`);
          console.log(`          Brand: ${sample.metadata.brand || 'N/A'}`);
          console.log(`          Category: ${sample.metadata.category || 'N/A'}`);
          if (sample.metadata.is_product) {
            console.log(`          Product: ${sample.metadata.product_name || 'N/A'}`);
            console.log(`          Price: ${sample.metadata.product_price || 'N/A'}`);
            console.log(`          SKU: ${sample.metadata.product_sku || 'N/A'}`);
          }
        });
      }
    });
  }

  // 2. Check scraped_pages for recent activity
  console.log('\n\n📅 Scraping Activity Summary (last 7 days):');
  const { data: scrapeSummary, error: scrapeError } = await supabase
    .from('scraped_pages')
    .select('domain_id, created_at')
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  if (!scrapeError && scrapeSummary) {
    const domainCounts = new Map<string, number>();
    scrapeSummary.forEach(page => {
      const count = domainCounts.get(page.domain_id) || 0;
      domainCounts.set(page.domain_id, count + 1);
    });
    
    console.log(`  Total pages scraped: ${scrapeSummary.length}`);
    console.log(`  Domains scraped: ${domainCounts.size}`);
    domainCounts.forEach((count, domainId) => {
      console.log(`    - Domain ${domainId}: ${count} pages`);
    });
  }

  // 3. Check scrape jobs
  console.log('\n\n📋 Scrape Jobs (last 7 days):');
  const { data: jobs, error: jobError } = await supabase
    .from('scrape_jobs')
    .select('*')
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false });

  if (!jobError && jobs) {
    jobs.forEach(job => {
      const status = job.status === 'completed' ? '✅' : job.status === 'failed' ? '❌' : '⏳';
      console.log(`  ${status} ${job.domain || 'N/A'}`);
      console.log(`     Status: ${job.status}`);
      console.log(`     Progress: ${job.progress || 0}%`);
      console.log(`     Started: ${new Date(job.created_at).toLocaleString()}`);
      if (job.completed_at) {
        console.log(`     Completed: ${new Date(job.completed_at).toLocaleString()}`);
      }
      if (job.error) {
        console.log(`     Error: ${job.error}`);
      }
      console.log('');
    });
  }

  // 4. Check if force rescrape flag is being used
  console.log('\n🔧 Recent Force Rescrape Check:');
  const { data: forceRescrapePages, error: frError } = await supabase
    .from('scraped_pages')
    .select('url, created_at')
    .gte('created_at', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })
    .limit(5);

  if (!frError && forceRescrapePages) {
    if (forceRescrapePages.length > 0) {
      console.log(`  Found ${forceRescrapePages.length} pages scraped in last 2 hours`);
      forceRescrapePages.forEach(page => {
        const age = Date.now() - new Date(page.created_at).getTime();
        const minutes = Math.floor(age / 1000 / 60);
        console.log(`    - ${minutes} minutes ago: ${page.url.substring(0, 60)}...`);
      });
    } else {
      console.log('  ⚠️  No pages scraped in the last 2 hours');
      console.log('  💡 You may need to run a force rescrape with:');
      console.log('     SCRAPER_FORCE_RESCRAPE_ALL=true npx tsx run-turbo-force-rescrape.js');
    }
  }
}

checkFullMetadata()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });