#!/usr/bin/env node

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkLatestScrape() {
  try {
    console.log('Checking most recently scraped page...');
    
    const { data, error } = await client
      .from('scraped_pages')
      .select('*')
      .order('last_scraped_at', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error('Error:', error);
      return;
    }
    
    if (!data || data.length === 0) {
      console.log('No pages found');
      return;
    }
    
    const page = data[0];
    console.log('\n=== Most Recent Scrape ===');
    console.log('URL:', page.url);
    console.log('Title:', page.title);
    console.log('Last scraped:', page.last_scraped_at);
    console.log('Content length:', page.content ? page.content.length : 0, 'characters');
    
    if (page.metadata) {
      console.log('\n=== Metadata Analysis ===');
      console.log('Metadata keys:', Object.keys(page.metadata).sort());
      
      // Check consolidated metadata fields
      const consolidatedFields = [
        'productSku', 'productName', 'productPrice', 'productInStock',
        'platform', 'pageType', 'products'
      ];
      
      console.log('\n=== Consolidated Metadata Fields ===');
      consolidatedFields.forEach(field => {
        if (page.metadata[field] !== undefined) {
          console.log(`✅ ${field}:`, 
            typeof page.metadata[field] === 'object' 
              ? JSON.stringify(page.metadata[field]).substring(0, 100) + '...'
              : page.metadata[field]
          );
        } else {
          console.log(`❌ ${field}: not found`);
        }
      });
      
      // Check for e-commerce data structure
      if (page.metadata.ecommerceData) {
        console.log('\n=== E-commerce Data Structure ===');
        console.log('Platform:', page.metadata.ecommerceData.platform);
        console.log('Page type:', page.metadata.ecommerceData.pageType);
        console.log('Products count:', page.metadata.ecommerceData.products?.length || 0);
        
        if (page.metadata.ecommerceData.products?.[0]) {
          const product = page.metadata.ecommerceData.products[0];
          console.log('\n=== First Product Details ===');
          console.log('SKU:', product.sku);
          console.log('Name:', product.name);
          console.log('Price:', JSON.stringify(product.price));
          console.log('Availability:', JSON.stringify(product.availability));
          console.log('Categories:', product.categories);
          console.log('Attributes keys:', product.attributes ? Object.keys(product.attributes) : 'none');
        }
      }
      
      // Check for duplicate fields
      console.log('\n=== Duplicate Field Check ===');
      const duplicateChecks = [
        ['productSku', 'ecommerceData.products[0].sku'],
        ['productName', 'ecommerceData.products[0].name'],
        ['productPrice', 'ecommerceData.products[0].price'],
        ['platform', 'ecommerceData.platform']
      ];
      
      duplicateChecks.forEach(([field1, field2]) => {
        const val1 = page.metadata[field1];
        const val2 = eval(`page.metadata.${field2}`);
        
        if (val1 !== undefined && val2 !== undefined) {
          console.log(`⚠️  DUPLICATE: ${field1} and ${field2} both present`);
          console.log(`   ${field1}:`, val1);
          console.log(`   ${field2}:`, val2);
        } else if (val1 !== undefined || val2 !== undefined) {
          console.log(`✅ No duplication between ${field1} and ${field2}`);
        }
      });
      
    } else {
      console.log('No metadata found');
    }
    
    // Check embeddings and ContentEnricher
    console.log('\n=== Embeddings and ContentEnricher Check ===');
    const { data: embeddings, error: embError } = await client
      .from('page_embeddings')
      .select('chunk_text, metadata')
      .eq('page_id', page.id)
      .limit(5);
    
    if (embError) {
      console.error('Error fetching embeddings:', embError);
    } else {
      console.log(`Found ${embeddings.length} embeddings for this page`);
      
      let enrichedCount = 0;
      embeddings.forEach((emb, index) => {
        console.log(`\n--- Embedding ${index + 1} ---`);
        console.log('Chunk preview:', emb.chunk_text.substring(0, 200) + '...');
        
        // Check for enrichment markers
        const enrichmentMarkers = ['SKU:', 'Product:', 'Price:', 'Availability:', 'Part Number:', 'Brand:'];
        const hasEnrichment = enrichmentMarkers.some(marker => emb.chunk_text.includes(marker));
        
        if (hasEnrichment) {
          console.log('✅ Content appears enriched');
          enrichedCount++;
          
          // Show what enrichment was found
          const foundMarkers = enrichmentMarkers.filter(marker => emb.chunk_text.includes(marker));
          console.log('   Enrichment markers found:', foundMarkers.join(', '));
        } else {
          console.log('❌ Content may not be enriched');
        }
      });
      
      console.log(`\n=== Enrichment Summary ===`);
      console.log(`Enriched chunks: ${enrichedCount}/${embeddings.length}`);
      console.log(`Enrichment rate: ${embeddings.length > 0 ? Math.round((enrichedCount / embeddings.length) * 100) : 0}%`);
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkLatestScrape().then(() => {
  console.log('\n=== Analysis Complete ===');
  process.exit(0);
}).catch(err => {
  console.error('Analysis failed:', err);
  process.exit(1);
});