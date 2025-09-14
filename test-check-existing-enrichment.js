/**
 * Test to verify that existing pages have metadata enrichment
 * This checks if the normal scraper has been enriching metadata
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkExistingEnrichment() {
  console.log('🔍 Checking for metadata enrichment in existing scraped pages');
  console.log('=' .repeat(60) + '\n');

  try {
    // 1. Get recently scraped pages (not force rescrape)
    console.log('1️⃣ Fetching recently scraped pages from Thompson\'s eParts...\n');
    
    const { data: recentPages, error } = await supabase
      .from('scraped_pages')
      .select('id, url, metadata, scraped_at, content')
      .like('url', '%thompsonseparts.co.uk%')
      .order('scraped_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching pages:', error);
      return;
    }

    if (!recentPages || recentPages.length === 0) {
      console.log('❌ No pages found for www.thompsonseparts.co.uk');
      console.log('💡 Try running a scrape first');
      return;
    }

    console.log(`✅ Found ${recentPages.length} pages\n`);

    // 2. Analyze metadata enrichment
    console.log('2️⃣ Analyzing metadata enrichment...\n');
    
    let totalPages = 0;
    let pagesWithMetadata = 0;
    let pagesWithEnhancedMetadata = 0;
    const enhancedPages = [];

    for (const page of recentPages) {
      totalPages++;
      
      if (page.metadata && Object.keys(page.metadata).length > 0) {
        pagesWithMetadata++;
        
        // Check for enhanced e-commerce metadata fields
        const hasEnhancedFields = 
          page.metadata.productSku ||
          page.metadata.productPrice ||
          page.metadata.productInStock !== undefined ||
          page.metadata.productBrand ||
          page.metadata.productCategory;
        
        if (hasEnhancedFields) {
          pagesWithEnhancedMetadata++;
          enhancedPages.push({
            url: page.url,
            metadata: page.metadata
          });
        }
      }
    }

    // 3. Display results
    console.log('📊 Metadata Analysis Results:');
    console.log('=' .repeat(40));
    console.log(`Total pages analyzed: ${totalPages}`);
    console.log(`Pages with metadata: ${pagesWithMetadata} (${(pagesWithMetadata/totalPages*100).toFixed(1)}%)`);
    console.log(`Pages with ENHANCED metadata: ${pagesWithEnhancedMetadata} (${(pagesWithEnhancedMetadata/totalPages*100).toFixed(1)}%)`);
    console.log('');

    // 4. Show examples of enhanced metadata
    if (enhancedPages.length > 0) {
      console.log('✨ Examples of Enhanced Metadata:\n');
      
      enhancedPages.slice(0, 3).forEach((page, idx) => {
        console.log(`Example ${idx + 1}: ${page.url}`);
        
        if (page.metadata.productSku) 
          console.log(`  • SKU: ${page.metadata.productSku}`);
        if (page.metadata.productPrice) 
          console.log(`  • Price: ${page.metadata.productPrice}`);
        if (page.metadata.productInStock !== undefined) 
          console.log(`  • In Stock: ${page.metadata.productInStock}`);
        if (page.metadata.productBrand) 
          console.log(`  • Brand: ${page.metadata.productBrand}`);
        if (page.metadata.productCategory) 
          console.log(`  • Category: ${page.metadata.productCategory}`);
        
        console.log('');
      });
    }

    // 5. Check embeddings for enrichment
    console.log('3️⃣ Checking embeddings for content enrichment...\n');
    
    const pageIds = recentPages.map(p => p.id);
    const { data: embeddings, error: embError } = await supabase
      .from('page_embeddings')
      .select('page_id, chunk_text')
      .in('page_id', pageIds)
      .limit(5);

    if (embeddings && embeddings.length > 0) {
      console.log(`Found ${embeddings.length} sample embeddings\n`);
      
      // Check for enrichment indicators in chunk text
      const enrichmentIndicators = ['SKU:', 'Price:', 'Brand:', 'Category:', 'Stock:', 'Product Information'];
      let enrichedEmbeddingCount = 0;
      
      for (const embedding of embeddings) {
        if (embedding.chunk_text) {
          const hasIndicators = enrichmentIndicators.some(indicator => 
            embedding.chunk_text.includes(indicator)
          );
          if (hasIndicators) {
            enrichedEmbeddingCount++;
          }
        }
      }
      
      console.log(`Embeddings with enrichment indicators: ${enrichedEmbeddingCount}/${embeddings.length}`);
      
      if (enrichedEmbeddingCount > 0) {
        console.log('\n✅ Sample of enriched embedding:');
        const enrichedSample = embeddings.find(e => 
          e.chunk_text && enrichmentIndicators.some(i => e.chunk_text.includes(i))
        );
        if (enrichedSample) {
          console.log(enrichedSample.chunk_text.substring(0, 300) + '...');
        }
      }
    } else {
      console.log('⚠️ No embeddings found for these pages');
    }

    // 6. Final verdict
    console.log('\n' + '=' .repeat(60));
    console.log('📋 FINAL ASSESSMENT:\n');
    
    if (pagesWithEnhancedMetadata > 0) {
      console.log('✅ SUCCESS: Metadata enrichment is ACTIVE!');
      console.log(`   • ${pagesWithEnhancedMetadata} pages have enhanced e-commerce metadata`);
      console.log('   • ContentEnricher is working correctly');
      console.log('   • Enhanced logging should be visible in scraper logs');
    } else if (pagesWithMetadata > 0) {
      console.log('⚠️ PARTIAL: Basic metadata exists but no enhanced fields');
      console.log('   • Pages have metadata but missing product-specific fields');
      console.log('   • ContentEnricher may not be extracting e-commerce data');
      console.log('   • Check if the pages are actually product pages');
    } else {
      console.log('❌ ISSUE: No metadata enrichment detected');
      console.log('   • Pages lack metadata completely');
      console.log('   • Check scraper-worker.js logs for errors');
      console.log('   • Verify ContentEnricher is being called');
    }

    // 7. Check latest scrape job logs
    console.log('\n4️⃣ Checking recent scrape job for enrichment logs...\n');
    
    const { data: scrapeJobs } = await supabase
      .from('scrape_jobs')
      .select('id, status, started_at, error')
      .like('url', '%thompsonseparts.co.uk%')
      .order('started_at', { ascending: false })
      .limit(1);

    if (scrapeJobs && scrapeJobs.length > 0) {
      const job = scrapeJobs[0];
      console.log(`Latest scrape job: ${job.id}`);
      console.log(`Status: ${job.status}`);
      console.log(`Started: ${new Date(job.started_at).toLocaleString()}`);
      if (job.error) {
        console.log(`Error: ${job.error}`);
      }
      console.log('\nℹ️ Check scraper logs for "[Worker] Enhanced metadata for" messages');
    }

  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

// Run the check
checkExistingEnrichment().catch(console.error);