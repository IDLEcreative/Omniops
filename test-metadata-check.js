#!/usr/bin/env node

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Supabase URL:', supabaseUrl ? 'present' : 'missing');
console.log('Service Role Key:', serviceRoleKey ? 'present' : 'missing');

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const client = createClient(supabaseUrl, serviceRoleKey);

async function checkData() {
  try {
    console.log('Checking Thompson pages...');
    
    const { data, error } = await client
      .from('scraped_pages')
      .select('*')
      .like('url', '%thompson%')
      .order('last_scraped_at', { ascending: false })
      .limit(3);
    
    if (error) {
      console.error('Error:', error);
      return;
    }
    
    console.log(`Found ${data.length} Thompson pages:`);
    
    data.forEach((page, index) => {
      console.log(`\n=== Page ${index + 1} ===`);
      console.log('URL:', page.url);
      console.log('Title:', page.title);
      console.log('Last scraped:', page.last_scraped_at);
      
      if (page.metadata) {
        console.log('Metadata keys:', Object.keys(page.metadata));
        
        // Check for consolidated metadata fields
        const consolidatedFields = [
          'productSku', 'productName', 'productPrice', 'productInStock',
          'platform', 'pageType', 'products', 'businessInfo'
        ];
        
        consolidatedFields.forEach(field => {
          if (page.metadata[field]) {
            console.log(`${field}:`, typeof page.metadata[field] === 'object' 
              ? JSON.stringify(page.metadata[field]).substring(0, 200) 
              : page.metadata[field]);
          }
        });
        
        // Check for e-commerce data structure
        if (page.metadata.ecommerceData) {
          console.log('E-commerce data structure:');
          console.log('- Platform:', page.metadata.ecommerceData.platform);
          console.log('- Page type:', page.metadata.ecommerceData.pageType);
          console.log('- Products count:', page.metadata.ecommerceData.products?.length || 0);
          
          if (page.metadata.ecommerceData.products?.[0]) {
            const product = page.metadata.ecommerceData.products[0];
            console.log('- First product SKU:', product.sku);
            console.log('- First product name:', product.name);
            console.log('- First product price:', product.price);
          }
        }
      } else {
        console.log('No metadata found');
      }
    });

    // Check page embeddings for ContentEnricher
    console.log('\n=== Checking Page Embeddings ===');
    const { data: embeddings, error: embError } = await client
      .from('page_embeddings')
      .select('chunk_text, metadata')
      .in('page_id', data.map(p => p.id))
      .limit(5);
    
    if (embError) {
      console.error('Error fetching embeddings:', embError);
    } else {
      console.log(`Found ${embeddings.length} embeddings for these pages`);
      embeddings.forEach((emb, index) => {
        console.log(`\nEmbedding ${index + 1}:`);
        console.log('Chunk preview:', emb.chunk_text.substring(0, 200));
        if (emb.chunk_text.includes('SKU:') || emb.chunk_text.includes('Product:')) {
          console.log('✅ Content appears enriched (contains product metadata)');
        } else {
          console.log('⚠️  Content may not be enriched');
        }
      });
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkData().then(() => {
  console.log('\nCheck complete.');
  process.exit(0);
}).catch(err => {
  console.error('Check failed:', err);
  process.exit(1);
});