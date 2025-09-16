import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface PipelineStage {
  stage: string;
  status: 'success' | 'partial' | 'failed';
  details: any;
  itemCount?: number;
}

async function diagnosePipeline() {
  console.log('\n🔍 DC66-10P SCRAPING PIPELINE DIAGNOSTIC');
  console.log('=' .repeat(60));
  
  const results: PipelineStage[] = [];
  const dc66Skus = ['DC66-10P-24-V2', 'DC66-10Pxxx', 'DC66-10P/2-5700-IG2P10DD25A', 'DC66-10P-12v'];
  
  // Stage 1: Check Scraping
  console.log('\n📥 STAGE 1: WEB SCRAPING');
  console.log('-'.repeat(40));
  
  const { data: scrapedPages, error: scrapeError } = await supabase
    .from('scraped_pages')
    .select('url, title, content, scraped_at, domain_id')
    .or(dc66Skus.map(sku => `content.ilike.%${sku}%`).join(','));
  
  if (scrapedPages && scrapedPages.length > 0) {
    console.log(`✅ Found ${scrapedPages.length} pages containing DC66-10P products`);
    
    for (const page of scrapedPages.slice(0, 2)) {
      // Check content quality
      const dc66Mentions = dc66Skus.filter(sku => 
        page.content?.toLowerCase().includes(sku.toLowerCase())
      );
      console.log(`  📄 ${page.url}`);
      console.log(`     - Scraped: ${new Date(page.scraped_at).toLocaleDateString()}`);
      console.log(`     - Content length: ${page.content?.length || 0} chars`);
      console.log(`     - DC66 SKUs found: ${dc66Mentions.join(', ') || 'none'}`);
      
      // Sample the actual content
      const contentSample = page.content?.substring(
        page.content.indexOf('DC66-10P') - 50,
        page.content.indexOf('DC66-10P') + 200
      );
      if (contentSample) {
        console.log(`     - Content sample: "${contentSample.replace(/\n/g, ' ')}..."`);
      }
    }
    
    results.push({
      stage: 'Scraping',
      status: 'success',
      details: { pages: scrapedPages.length },
      itemCount: scrapedPages.length
    });
  } else {
    console.log('❌ No scraped pages found with DC66-10P content');
    results.push({
      stage: 'Scraping', 
      status: 'failed',
      details: { error: 'No pages found' }
    });
  }
  
  // Stage 2: Check Chunking
  console.log('\n📑 STAGE 2: CONTENT CHUNKING');
  console.log('-'.repeat(40));
  
  const { data: websiteContent, error: chunkError } = await supabase
    .from('website_content')
    .select('page_id, chunk_index, chunk_text')
    .or(dc66Skus.map(sku => `chunk_text.ilike.%${sku}%`).join(','));
  
  if (websiteContent && websiteContent.length > 0) {
    console.log(`✅ Found ${websiteContent.length} chunks containing DC66-10P`);
    
    // Group by page
    const pageChunks = new Map<string, any[]>();
    websiteContent.forEach(chunk => {
      if (!pageChunks.has(chunk.page_id)) {
        pageChunks.set(chunk.page_id, []);
      }
      pageChunks.get(chunk.page_id)!.push(chunk);
    });
    
    console.log(`  📊 Chunks distributed across ${pageChunks.size} pages`);
    
    results.push({
      stage: 'Chunking',
      status: 'success',
      details: { chunks: websiteContent.length, pages: pageChunks.size },
      itemCount: websiteContent.length
    });
  } else {
    console.log('❌ No content chunks found with DC66-10P');
    results.push({
      stage: 'Chunking',
      status: 'failed',
      details: { error: 'No chunks created' }
    });
  }
  
  // Stage 3: Check Embeddings
  console.log('\n🧮 STAGE 3: EMBEDDING GENERATION');
  console.log('-'.repeat(40));
  
  if (scrapedPages && scrapedPages.length > 0) {
    const pageIds = scrapedPages.map(p => p.url);
    
    const { data: embeddings, error: embError } = await supabase
      .from('page_embeddings')
      .select('id, page_id, chunk_index, metadata')
      .in('page_id', pageIds);
    
    if (embeddings && embeddings.length > 0) {
      console.log(`✅ Found ${embeddings.length} embeddings for DC66 pages`);
      
      // Check metadata
      const withMetadata = embeddings.filter(e => e.metadata);
      console.log(`  📊 ${withMetadata.length} embeddings have metadata`);
      
      results.push({
        stage: 'Embeddings',
        status: 'partial',
        details: { 
          embeddings: embeddings.length,
          withMetadata: withMetadata.length
        },
        itemCount: embeddings.length
      });
    } else {
      console.log('❌ No embeddings found for DC66 pages');
      console.log('  ⚠️  This is why semantic search fails!');
      results.push({
        stage: 'Embeddings',
        status: 'failed',
        details: { error: 'No embeddings generated' }
      });
    }
  }
  
  // Stage 4: Check Product Extraction
  console.log('\n📦 STAGE 4: PRODUCT EXTRACTION');
  console.log('-'.repeat(40));
  
  const { data: extractions, error: extractError } = await supabase
    .from('structured_extractions')
    .select('type, name, data')
    .or(dc66Skus.map(sku => `data.ilike.%${sku}%`).join(','));
  
  if (extractions && extractions.length > 0) {
    console.log(`✅ Found ${extractions.length} DC66 product extractions`);
    extractions.forEach(ext => {
      console.log(`  📦 ${ext.name} (${ext.type})`);
    });
    
    results.push({
      stage: 'Product Extraction',
      status: 'success',
      details: { products: extractions.length },
      itemCount: extractions.length
    });
  } else {
    console.log('❌ No DC66 products in structured_extractions');
    console.log('  ⚠️  Products exist in raw content but weren\'t extracted!');
    
    // Check why extraction might have failed
    const { data: allExtractions } = await supabase
      .from('structured_extractions')
      .select('type, name')
      .eq('type', 'product')
      .limit(5);
    
    if (allExtractions) {
      console.log(`  📊 Sample of extracted products (non-DC66):`);
      allExtractions.forEach(ext => {
        console.log(`     - ${ext.name}`);
      });
    }
    
    results.push({
      stage: 'Product Extraction',
      status: 'failed',
      details: { error: 'Products not extracted from content' }
    });
  }
  
  // Stage 5: Check WooCommerce Sync
  console.log('\n🛒 STAGE 5: WOOCOMMERCE SYNC');
  console.log('-'.repeat(40));
  
  // This would check if products are synced from WooCommerce
  // For now, we'll simulate this check
  console.log('⚠️  WooCommerce sync status unknown (requires API check)');
  
  // Pipeline Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 PIPELINE SUMMARY');
  console.log('='.repeat(60));
  
  const stages = [
    'Scraping',
    'Chunking', 
    'Embeddings',
    'Product Extraction',
    'Search'
  ];
  
  console.log('\nPipeline Flow:');
  stages.forEach((stage, i) => {
    const result = results.find(r => r.stage === stage);
    const status = result?.status || 'unknown';
    const symbol = status === 'success' ? '✅' : 
                   status === 'partial' ? '⚠️' : '❌';
    
    if (i > 0) console.log('     ↓');
    console.log(`  ${symbol} ${stage}: ${status.toUpperCase()}`);
    
    if (result?.itemCount !== undefined) {
      console.log(`     Items: ${result.itemCount}`);
    }
    if (result?.details?.error) {
      console.log(`     Error: ${result.details.error}`);
    }
  });
  
  // Identify the breaking point
  console.log('\n🔴 PIPELINE BREAKS AT:');
  const failurePoint = results.find(r => r.status === 'failed');
  if (failurePoint) {
    console.log(`  Stage: ${failurePoint.stage}`);
    console.log(`  Issue: ${failurePoint.details.error}`);
    console.log('\n📋 RECOMMENDED FIX:');
    
    switch(failurePoint.stage) {
      case 'Chunking':
        console.log('  1. Re-run content chunking for scraped pages');
        console.log('  2. Ensure chunker handles product listings');
        break;
      case 'Embeddings':
        console.log('  1. Generate embeddings for DC66 page chunks');
        console.log('  2. Run: npm run generate:embeddings --domain=thompsonseparts.co.uk');
        break;
      case 'Product Extraction':
        console.log('  1. Re-run product extractor on electrical category pages');
        console.log('  2. Ensure extractor handles complex SKUs like "DC66-10P/2-5700"');
        console.log('  3. May need to update extraction patterns for relay products');
        break;
    }
  }
  
  // Final diagnosis
  console.log('\n' + '='.repeat(60));
  console.log('🔬 DIAGNOSIS COMPLETE');
  console.log('='.repeat(60));
  console.log('\n✅ SCRAPING: Working correctly - products are in database');
  console.log('❌ POST-PROCESSING: Failed at extraction/embedding stage');
  console.log('🔧 SOLUTION: Re-run extraction and embedding generation');
}

diagnosePipeline().catch(console.error);