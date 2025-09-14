#!/usr/bin/env node

/**
 * Check existing scraped data in the database
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkData() {
  console.log('\\n🔍 Checking existing scraped data...');
  console.log('─'.repeat(50));
  
  // Get unique URLs to extract domains
  const { data: pages, error: domainError } = await supabase
    .from('scraped_pages')
    .select('url')
    .not('url', 'is', null)
    .limit(20);
  
  if (domainError) {
    console.error('Error fetching domains:', domainError);
    return;
  }
  
  // Extract domains from URLs
  const uniqueDomains = [...new Set(pages?.map(p => {
    try {
      const url = new URL(p.url);
      return url.hostname;
    } catch {
      return null;
    }
  }).filter(Boolean) || [])];
  console.log(`\\n📌 Found ${uniqueDomains.length} unique domains:`);
  uniqueDomains.forEach(d => console.log(`  • ${d}`));
  
  // Get recent pages with metadata
  const { data: pagesWithMetadata, error: metaError } = await supabase
    .from('scraped_pages')
    .select('url, title, metadata, scraped_at')
    .not('metadata', 'is', null)
    .order('scraped_at', { ascending: false })
    .limit(5);
  
  if (!metaError && pagesWithMetadata?.length > 0) {
    console.log(`\\n📄 Recent pages with metadata (${pagesWithMetadata.length}):`);
    
    for (const page of pagesWithMetadata) {
      console.log(`\\n  ${page.url}`);
      const domain = new URL(page.url).hostname;
      console.log(`    Domain: ${domain}`);
      console.log(`    Title: ${page.title}`);
      
      if (page.metadata) {
        const hasProductData = !!(
          page.metadata.productSku || 
          page.metadata.productPrice ||
          page.metadata.sku ||
          page.metadata.price
        );
        
        if (hasProductData) {
          console.log('    ✅ Has product metadata:');
          if (page.metadata.productSku || page.metadata.sku) {
            console.log(`      SKU: ${page.metadata.productSku || page.metadata.sku}`);
          }
          if (page.metadata.productPrice || page.metadata.price) {
            console.log(`      Price: ${page.metadata.productPrice || page.metadata.price}`);
          }
        } else {
          console.log('    ⚠️  Has metadata but no product data');
        }
      }
    }
  } else {
    console.log('\\n❌ No pages with metadata found');
  }
  
  // Suggest a domain to test with
  if (uniqueDomains.length > 0) {
    const testDomain = uniqueDomains[0];
    console.log('\\n💡 Suggestion:');
    console.log(`  Use domain "${testDomain}" for testing`);
    
    // Get a sample URL from that domain
    const { data: samplePages } = await supabase
      .from('scraped_pages')
      .select('url')
      .limit(100);
    
    const samplePage = samplePages?.find(p => {
      try {
        return new URL(p.url).hostname === testDomain;
      } catch {
        return false;
      }
    });
    
    if (samplePage) {
      console.log(`  Sample URL: ${samplePage.url}`);
      console.log('\\n  To test with force rescrape:');
      console.log(`    curl -X POST http://localhost:3000/api/scrape \\\\`);
      console.log(`      -H "Content-Type: application/json" \\\\`);
      console.log(`      -d '{"url": "${samplePage.url}", "crawl": true, "max_pages": 3, "turbo": true}'`);
    }
  }
}

checkData().catch(console.error);