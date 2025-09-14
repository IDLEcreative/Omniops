import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkScrapedPagesDetail() {
  console.log('🔍 Detailed Analysis of Scraped Pages\n');
  console.log('═'.repeat(80));

  // 1. Get overall statistics
  console.log('\n📊 Overall Statistics:');
  const { count: totalCount } = await supabase
    .from('scraped_pages')
    .select('*', { count: 'exact', head: true });
  
  console.log(`  Total pages in database: ${totalCount || 0}`);

  // Get pages from different time periods
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const { count: lastHour } = await supabase
    .from('scraped_pages')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', oneHourAgo.toISOString());

  const { count: lastDay } = await supabase
    .from('scraped_pages')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', oneDayAgo.toISOString());

  const { count: lastWeek } = await supabase
    .from('scraped_pages')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', oneWeekAgo.toISOString());

  console.log(`  Pages scraped in last hour: ${lastHour || 0}`);
  console.log(`  Pages scraped in last 24 hours: ${lastDay || 0}`);
  console.log(`  Pages scraped in last 7 days: ${lastWeek || 0}`);

  // 2. Get the most recent pages with full details
  console.log('\n\n📝 Most Recent Scraped Pages (Last 10):');
  console.log('─'.repeat(80));
  
  const { data: recentPages, error: recentError } = await supabase
    .from('scraped_pages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (recentError) {
    console.error('Error fetching recent pages:', recentError);
    return;
  }

  if (recentPages && recentPages.length > 0) {
    recentPages.forEach((page, index) => {
      console.log(`\n${index + 1}. Page ID: ${page.id}`);
      console.log(`   URL: ${page.url}`);
      console.log(`   Title: ${page.title || 'No title'}`);
      console.log(`   Domain ID: ${page.domain_id || 'NULL'}`);
      console.log(`   Created: ${new Date(page.created_at).toLocaleString()}`);
      console.log(`   Last Scraped: ${page.last_scraped_at ? new Date(page.last_scraped_at).toLocaleString() : 'N/A'}`);
      console.log(`   Content Length: ${page.content ? page.content.length : 0} characters`);
      console.log(`   Content Preview: ${page.content ? page.content.substring(0, 100) + '...' : 'No content'}`);
      
      // Check metadata field
      console.log(`   Metadata Field: ${page.metadata ? 'Present' : 'NULL'}`);
      if (page.metadata) {
        console.log(`   Metadata Contents:`);
        try {
          const metadata = typeof page.metadata === 'string' ? JSON.parse(page.metadata) : page.metadata;
          console.log(`     - Keys: ${Object.keys(metadata).join(', ')}`);
          
          // Check for specific metadata fields
          if (metadata.brand) console.log(`     - Brand: ${metadata.brand}`);
          if (metadata.category) console.log(`     - Category: ${metadata.category}`);
          if (metadata.is_product) console.log(`     - Is Product: ${metadata.is_product}`);
          if (metadata.product_name) console.log(`     - Product Name: ${metadata.product_name}`);
          if (metadata.product_price) console.log(`     - Price: ${metadata.product_price}`);
          if (metadata.product_sku) console.log(`     - SKU: ${metadata.product_sku}`);
          if (metadata.specifications) console.log(`     - Has Specifications: Yes`);
        } catch (e) {
          console.log(`     - Error parsing metadata: ${e}`);
        }
      }
    });
  } else {
    console.log('No pages found in the database.');
  }

  // 3. Check metadata population across all pages
  console.log('\n\n📈 Metadata Population Analysis:');
  console.log('─'.repeat(80));
  
  // Get pages with metadata
  const { data: pagesWithMetadata, count: metadataCount } = await supabase
    .from('scraped_pages')
    .select('metadata', { count: 'exact' })
    .not('metadata', 'is', null)
    .limit(100);

  console.log(`\n  Pages with metadata field populated: ${metadataCount || 0}/${totalCount || 0}`);
  
  if (pagesWithMetadata && pagesWithMetadata.length > 0) {
    let brandCount = 0;
    let categoryCount = 0;
    let productCount = 0;
    let priceCount = 0;
    let skuCount = 0;
    let specsCount = 0;

    pagesWithMetadata.forEach(page => {
      if (page.metadata) {
        const metadata = typeof page.metadata === 'string' ? JSON.parse(page.metadata) : page.metadata;
        if (metadata.brand) brandCount++;
        if (metadata.category) categoryCount++;
        if (metadata.is_product) productCount++;
        if (metadata.product_price) priceCount++;
        if (metadata.product_sku) skuCount++;
        if (metadata.specifications) specsCount++;
      }
    });

    console.log(`\n  Metadata Field Coverage (out of ${pagesWithMetadata.length} samples):`);
    console.log(`    - Brand: ${brandCount} (${((brandCount/pagesWithMetadata.length)*100).toFixed(1)}%)`);
    console.log(`    - Category: ${categoryCount} (${((categoryCount/pagesWithMetadata.length)*100).toFixed(1)}%)`);
    console.log(`    - Product Detection: ${productCount} (${((productCount/pagesWithMetadata.length)*100).toFixed(1)}%)`);
    console.log(`    - Price: ${priceCount} (${((priceCount/pagesWithMetadata.length)*100).toFixed(1)}%)`);
    console.log(`    - SKU: ${skuCount} (${((skuCount/pagesWithMetadata.length)*100).toFixed(1)}%)`);
    console.log(`    - Specifications: ${specsCount} (${((specsCount/pagesWithMetadata.length)*100).toFixed(1)}%)`);
  }

  // 4. Check unique domains
  console.log('\n\n🌐 Domain Analysis:');
  const { data: domains } = await supabase
    .from('scraped_pages')
    .select('domain_id, url')
    .limit(1000);

  if (domains) {
    const domainMap = new Map<string, Set<string>>();
    domains.forEach(d => {
      const domain = d.domain_id || 'NULL';
      if (!domainMap.has(domain)) {
        domainMap.set(domain, new Set());
      }
      try {
        const hostname = new URL(d.url).hostname;
        domainMap.get(domain)!.add(hostname);
      } catch (e) {
        // Invalid URL
      }
    });

    console.log(`  Unique domain IDs: ${domainMap.size}`);
    domainMap.forEach((hostnames, domainId) => {
      console.log(`    - ${domainId}: ${Array.from(hostnames).join(', ')}`);
    });
  }

  // 5. Summary
  console.log('\n\n📋 Summary:');
  if (metadataCount && metadataCount > 0) {
    console.log(`  ✅ Metadata is being stored in scraped_pages table`);
    console.log(`  📊 ${metadataCount} out of ${totalCount} pages have metadata`);
  } else {
    console.log(`  ❌ No metadata found in scraped_pages table`);
    console.log(`  ⚠️  Metadata extraction may not be working`);
  }
}

checkScrapedPagesDetail()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });