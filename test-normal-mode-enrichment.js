/**
 * Test to verify that metadata enrichment works in NORMAL mode
 * Not just in force rescrape mode
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testNormalModeEnrichment() {
  console.log('🧪 Testing metadata enrichment in NORMAL mode (not force rescrape)');
  console.log('================================================\n');

  // Test with a product page that hasn't been scraped yet
  const testUrl = 'https://www.thompsonseparts.co.uk/product/brake-pad-set-123';
  
  try {
    // 1. First, check if this URL has been scraped before
    console.log('1️⃣ Checking if URL has existing embeddings...');
    const { data: existingPages } = await supabase
      .from('scraped_pages')
      .select('id, url, metadata')
      .eq('url', testUrl)
      .limit(1);

    if (existingPages && existingPages.length > 0) {
      console.log('⚠️ URL already exists in database. Checking embeddings...');
      
      const { data: embeddings } = await supabase
        .from('page_embeddings')
        .select('id')
        .eq('page_id', existingPages[0].id)
        .limit(1);
      
      if (embeddings && embeddings.length > 0) {
        console.log('❌ This URL already has embeddings. For a clean test, use a new URL.');
        console.log('💡 Suggestion: Add a unique parameter like ?test=' + Date.now());
        return;
      }
    }

    // 2. Trigger a normal scrape (NOT force rescrape)
    console.log('\n2️⃣ Triggering NORMAL scrape (not force rescrape)...');
    const scrapeResponse = await fetch('http://localhost:3000/api/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://www.thompsonseparts.co.uk',
        crawl: false,  // Just single page for testing
        max_pages: 1,
        turbo: false   // Normal mode, not turbo
        // Note: NOT setting force rescrape - this is normal mode
      })
    });

    if (!scrapeResponse.ok) {
      throw new Error(`Scrape failed: ${await scrapeResponse.text()}`);
    }

    const { job_id } = await scrapeResponse.json();
    console.log(`✅ Scrape started with job ID: ${job_id}`);

    // 3. Wait for scrape to complete
    console.log('\n3️⃣ Waiting for scrape to complete...');
    let attempts = 0;
    let jobComplete = false;
    
    while (!jobComplete && attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const statusResponse = await fetch(`http://localhost:3000/api/scrape/status?job_id=${job_id}`);
      if (statusResponse.ok) {
        const status = await statusResponse.json();
        console.log(`   Status: ${status.status} (${status.processed_pages || 0} pages processed)`);
        
        if (status.status === 'completed' || status.status === 'failed') {
          jobComplete = true;
          if (status.status === 'failed') {
            console.error('❌ Job failed:', status.error);
            return;
          }
        }
      }
      attempts++;
    }

    // 4. Check the scraped data for metadata enrichment
    console.log('\n4️⃣ Checking for metadata enrichment...');
    
    // Get the most recently scraped pages
    const { data: recentPages, error } = await supabase
      .from('scraped_pages')
      .select('url, metadata, scraped_at')
      .eq('domain', 'www.thompsonseparts.co.uk')
      .order('scraped_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error fetching pages:', error);
      return;
    }

    if (!recentPages || recentPages.length === 0) {
      console.log('❌ No pages found for this domain');
      return;
    }

    console.log(`\n✅ Found ${recentPages.length} recently scraped pages\n`);

    // Check each page for enriched metadata
    let hasEnrichedMetadata = false;
    
    for (const page of recentPages) {
      console.log(`📄 Page: ${page.url}`);
      console.log(`   Scraped: ${new Date(page.scraped_at).toLocaleString()}`);
      
      if (page.metadata) {
        const metadata = page.metadata;
        const enrichedFields = [];
        
        // Check for enhanced metadata fields
        if (metadata.productSku) enrichedFields.push(`SKU: ${metadata.productSku}`);
        if (metadata.productPrice) enrichedFields.push(`Price: ${metadata.productPrice}`);
        if (metadata.productInStock !== undefined) enrichedFields.push(`In Stock: ${metadata.productInStock}`);
        if (metadata.productBrand) enrichedFields.push(`Brand: ${metadata.productBrand}`);
        if (metadata.productCategory) enrichedFields.push(`Category: ${metadata.productCategory}`);
        
        if (enrichedFields.length > 0) {
          hasEnrichedMetadata = true;
          console.log('   ✨ Enhanced Metadata Found:');
          enrichedFields.forEach(field => console.log(`      - ${field}`));
        } else {
          console.log('   ⚠️ No enhanced metadata fields found');
        }
      } else {
        console.log('   ⚠️ No metadata object found');
      }
      console.log('');
    }

    // 5. Check embeddings for enrichment
    console.log('5️⃣ Checking if embeddings were created with enriched content...');
    
    const pageIds = recentPages.map(p => p.id).filter(Boolean);
    if (pageIds.length > 0) {
      const { data: embeddings, error: embError } = await supabase
        .from('page_embeddings')
        .select('page_id, chunk_text')
        .in('page_id', pageIds)
        .limit(3);

      if (embeddings && embeddings.length > 0) {
        console.log(`✅ Found ${embeddings.length} embeddings`);
        
        // Check if chunk text contains metadata keywords (sign of enrichment)
        const enrichmentKeywords = ['SKU:', 'Price:', 'Brand:', 'Category:', 'Stock:'];
        let hasEnrichedEmbeddings = false;
        
        for (const embedding of embeddings) {
          const hasKeywords = enrichmentKeywords.some(kw => 
            embedding.chunk_text && embedding.chunk_text.includes(kw)
          );
          if (hasKeywords) {
            hasEnrichedEmbeddings = true;
            console.log('   ✨ Found enriched embedding with metadata keywords');
            break;
          }
        }
        
        if (!hasEnrichedEmbeddings) {
          console.log('   ⚠️ Embeddings exist but may not be enriched');
        }
      } else {
        console.log('⚠️ No embeddings found for these pages');
      }
    }

    // Final summary
    console.log('\n📊 SUMMARY');
    console.log('=' .repeat(50));
    if (hasEnrichedMetadata) {
      console.log('✅ SUCCESS: Metadata enrichment is working in NORMAL mode!');
      console.log('   - Enhanced metadata fields are being extracted');
      console.log('   - Content enricher is functioning without force rescrape');
    } else {
      console.log('⚠️ WARNING: No enhanced metadata found in normal mode');
      console.log('   - Check if the site has product pages');
      console.log('   - Verify ContentEnricher is being called');
      console.log('   - Check console logs from scraper-worker.js');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testNormalModeEnrichment().catch(console.error);