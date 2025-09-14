import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRecentMetadata() {
  console.log('🔍 Checking for Recent Metadata Storage\n');
  console.log('═'.repeat(80));

  // 1. Check scraped_pages from today
  console.log('\n📅 Pages Scraped Today:');
  const { data: todayPages, error: pageError } = await supabase
    .from('scraped_pages')
    .select('url, created_at')
    .gte('created_at', new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()) // Last 6 hours
    .order('created_at', { ascending: false })
    .limit(5);

  if (!pageError && todayPages) {
    console.log(`  Found ${todayPages.length} pages scraped in last 6 hours`);
    todayPages.forEach(page => {
      const age = Date.now() - new Date(page.created_at).getTime();
      const hours = Math.floor(age / 1000 / 60 / 60);
      const minutes = Math.floor((age % (1000 * 60 * 60)) / 1000 / 60);
      console.log(`    - ${hours}h ${minutes}m ago: ${page.url.substring(0, 80)}...`);
    });
  }

  // 2. Check website_content table for ANY data
  console.log('\n📊 Website Content Table Status:');
  const { data: contentCount, error: countError } = await supabase
    .from('website_content')
    .select('id', { count: 'exact', head: true });

  if (!countError) {
    console.log(`  Total entries: ${contentCount ? 0 : 0}`);
  }

  // Get the actual count another way
  const { data: allContent, error: allError } = await supabase
    .from('website_content')
    .select('url, metadata, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (!allError) {
    if (!allContent || allContent.length === 0) {
      console.log('  ❌ Table is completely EMPTY - No metadata is being saved!');
    } else {
      console.log(`  ✅ Found ${allContent.length} entries`);
      
      // Analyze metadata quality
      let withBrand = 0;
      let withCategory = 0;
      let withProduct = 0;
      
      allContent.forEach(content => {
        if (content.metadata?.brand) withBrand++;
        if (content.metadata?.category) withCategory++;
        if (content.metadata?.is_product) withProduct++;
      });
      
      console.log('\n  Metadata Quality:');
      console.log(`    Brand extraction: ${withBrand}/${allContent.length}`);
      console.log(`    Category extraction: ${withCategory}/${allContent.length}`);
      console.log(`    Product detection: ${withProduct}/${allContent.length}`);
      
      console.log('\n  Sample Entries:');
      allContent.slice(0, 3).forEach((content, idx) => {
        console.log(`\n    ${idx + 1}. ${content.url.substring(0, 60)}...`);
        console.log(`       Created: ${new Date(content.created_at).toLocaleString()}`);
        if (content.metadata) {
          console.log(`       Brand: ${content.metadata.brand || 'N/A'}`);
          console.log(`       Category: ${content.metadata.category || 'N/A'}`);
          if (content.metadata.is_product) {
            console.log(`       Product: ${content.metadata.product_name || 'N/A'}`);
            console.log(`       Price: ${content.metadata.product_price || 'N/A'}`);
          }
        }
      });
    }
  }

  // 3. Check if metadata extraction is configured
  console.log('\n\n🔧 Configuration Check:');
  
  // Check if metadata extractor exists
  const fs = require('fs');
  const extractorPath = './lib/metadata-extractor-optimized.ts';
  const extractorExists = fs.existsSync(extractorPath);
  console.log(`  Metadata Extractor: ${extractorExists ? '✅ Found' : '❌ Missing'}`);
  
  // Check if it's being imported/used
  const scraperPath = './app/api/scrape/route.ts';
  if (fs.existsSync(scraperPath)) {
    const scraperContent = fs.readFileSync(scraperPath, 'utf-8');
    const usesExtractor = scraperContent.includes('metadata-extractor') || 
                         scraperContent.includes('website_content');
    console.log(`  Scraper uses metadata: ${usesExtractor ? '✅ Yes' : '❌ No'}`);
    
    if (!usesExtractor) {
      console.log('\n  ⚠️  ISSUE: The scraper is NOT using metadata extraction!');
      console.log('  The metadata-extractor exists but is not being called during scraping.');
    }
  }

  // 4. Summary
  console.log('\n\n📈 Summary:');
  if (!allContent || allContent.length === 0) {
    console.log('  ❌ CRITICAL: Metadata extraction is NOT working!');
    console.log('  - The website_content table is empty');
    console.log('  - No brand, category, or product data is being saved');
    console.log('  - The scraper needs to be updated to call metadata extraction');
  } else {
    console.log('  ✅ Metadata extraction is working');
    console.log(`  - ${allContent.length} entries in website_content table`);
  }
}

checkRecentMetadata()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });