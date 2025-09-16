/**
 * Direct verification script for DC66-10P products
 * This script directly queries the database to show what's actually stored
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Expected DC66-10P products
const EXPECTED_SKUS = [
  'DC66-10P-24-V2',
  'DC66-10Pxxx', 
  'DC66-10P/2-5700-IG2P10DD25A',
  'DC66-10P-12v'
];

async function main() {
  console.log('🔍 DC66-10P Product Verification');
  console.log('=' .repeat(80));
  
  // 1. Check scraped_pages for DC66 content
  console.log('\n1. SCRAPED PAGES WITH DC66 CONTENT:');
  console.log('-'.repeat(40));
  
  const { data: scrapedPages, error: scrapedError } = await supabase
    .from('scraped_pages')
    .select('id, url, title, content, domain_id')
    .ilike('content', '%DC66-10P%')
    .limit(5);
  
  if (scrapedPages && scrapedPages.length > 0) {
    console.log(`Found ${scrapedPages.length} pages with DC66-10P content:\n`);
    
    for (const page of scrapedPages) {
      console.log(`📄 Page ID: ${page.id}`);
      console.log(`   URL: ${page.url}`);
      console.log(`   Title: ${page.title}`);
      console.log(`   Domain: ${page.domain_id}`);
      
      // Extract DC66 product mentions from content
      const dc66Matches = page.content.match(/DC66-10P[^\s,;]*/g) || [];
      const uniqueMatches = [...new Set(dc66Matches)];
      
      if (uniqueMatches.length > 0) {
        console.log(`   Found SKUs: ${uniqueMatches.join(', ')}`);
      }
      
      // Show content snippet around DC66
      const dc66Index = page.content.indexOf('DC66-10P');
      if (dc66Index !== -1) {
        const start = Math.max(0, dc66Index - 100);
        const end = Math.min(page.content.length, dc66Index + 200);
        const snippet = page.content.substring(start, end);
        console.log(`   Context: "...${snippet}..."\n`);
      }
    }
  } else {
    console.log('❌ No pages found with DC66-10P content');
    if (scrapedError) console.log('   Error:', scrapedError);
  }
  
  // 2. Check structured_extractions for products
  console.log('\n2. STRUCTURED PRODUCT EXTRACTIONS:');
  console.log('-'.repeat(40));
  
  const { data: extractions, error: extractError } = await supabase
    .from('structured_extractions')
    .select('*')
    .eq('extraction_type', 'products')
    .limit(10);
  
  if (extractions && extractions.length > 0) {
    console.log(`Found ${extractions.length} product extractions\n`);
    
    let dc66Found = false;
    for (const extraction of extractions) {
      const content = typeof extraction.content === 'string' ? 
        JSON.parse(extraction.content) : extraction.content;
      
      const contentStr = JSON.stringify(content);
      if (contentStr.includes('DC66')) {
        dc66Found = true;
        console.log(`✅ Found DC66 product in extraction ID: ${extraction.id}`);
        console.log(`   Domain: ${extraction.domain_id}`);
        console.log(`   Content: ${contentStr.substring(0, 300)}...\n`);
      }
    }
    
    if (!dc66Found) {
      console.log('❌ No DC66 products found in structured extractions');
      console.log('   Sample extraction:', JSON.stringify(extractions[0]?.content, null, 2).substring(0, 500));
    }
  } else {
    console.log('❌ No product extractions found');
    if (extractError) console.log('   Error:', extractError);
  }
  
  // 3. Verify specific Thompson's E Parts pages
  console.log('\n3. THOMPSON\'S E PARTS ELECTRICAL CATEGORY:');
  console.log('-'.repeat(40));
  
  const electricalUrl = 'https://www.thompsonseparts.co.uk/product-category/tipper-trailer-sheeting-systems-spares/electrical-parts-motors/';
  
  const { data: thompsonPage } = await supabase
    .from('scraped_pages')
    .select('id, url, title, content')
    .eq('url', electricalUrl)
    .single();
  
  if (thompsonPage) {
    console.log(`✅ Found Thompson's electrical parts page`);
    console.log(`   Title: ${thompsonPage.title}`);
    
    // Search for each expected SKU
    console.log('\n   Checking for expected SKUs:');
    for (const sku of EXPECTED_SKUS) {
      const found = thompsonPage.content.includes(sku);
      console.log(`   ${found ? '✅' : '❌'} ${sku}`);
      
      if (found) {
        // Find price and description near the SKU
        const skuIndex = thompsonPage.content.indexOf(sku);
        const context = thompsonPage.content.substring(skuIndex - 50, skuIndex + 150);
        console.log(`      Context: "${context}"`);
      }
    }
    
    // Check for relay-related content
    const relayMatches = thompsonPage.content.match(/relay/gi) || [];
    const albrightMatches = thompsonPage.content.match(/albright|allbright/gi) || [];
    
    console.log(`\n   Relay mentions: ${relayMatches.length}`);
    console.log(`   Albright/Allbright mentions: ${albrightMatches.length}`);
  } else {
    console.log(`❌ Thompson's electrical page not found in scraped_pages`);
    console.log(`   URL: ${electricalUrl}`);
  }
  
  // 4. Check page_embeddings coverage
  console.log('\n4. EMBEDDING COVERAGE:');
  console.log('-'.repeat(40));
  
  const { data: embeddingStats } = await supabase
    .from('page_embeddings')
    .select('id')
    .limit(1);
  
  const hasEmbeddings = embeddingStats && embeddingStats.length > 0;
  
  if (hasEmbeddings) {
    // Check if pages with DC66 content have embeddings
    const { data: dc66PagesWithEmbeddings } = await supabase
      .from('scraped_pages')
      .select(`
        id,
        url,
        page_embeddings!inner(id)
      `)
      .ilike('content', '%DC66-10P%')
      .limit(5);
    
    if (dc66PagesWithEmbeddings && dc66PagesWithEmbeddings.length > 0) {
      console.log(`✅ ${dc66PagesWithEmbeddings.length} DC66 pages have embeddings`);
    } else {
      console.log('❌ DC66 pages do not have embeddings generated');
    }
  } else {
    console.log('❌ No embeddings found in database');
  }
  
  // 5. Summary and Recommendations
  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY & RECOMMENDATIONS:');
  console.log('='.repeat(80));
  
  if (scrapedPages && scrapedPages.length > 0) {
    console.log('\n✅ DC66-10P products ARE present in scraped content');
    console.log('   The products exist on thompsonseparts.co.uk electrical parts page');
    
    console.log('\n🔧 REQUIRED FIXES:');
    console.log('1. Product extraction is not capturing these products properly');
    console.log('2. Embeddings need to be generated for these pages');
    console.log('3. Search needs to be configured to find these products');
    
    console.log('\n📋 IMMEDIATE ACTIONS:');
    console.log('1. Run product extraction on Thompson\'s electrical pages');
    console.log('2. Generate embeddings for pages with DC66 content');
    console.log('3. Test search with exact SKUs after fixes');
  } else {
    console.log('\n❌ DC66-10P products NOT found in database');
    console.log('\n📋 IMMEDIATE ACTIONS:');
    console.log('1. Re-scrape thompsonseparts.co.uk, especially:');
    console.log('   - /product-category/tipper-trailer-sheeting-systems-spares/electrical-parts-motors/');
    console.log('2. Ensure scraper follows product links and pagination');
    console.log('3. Verify scraper is extracting product details (SKU, price, description)');
  }
}

main().catch(console.error);