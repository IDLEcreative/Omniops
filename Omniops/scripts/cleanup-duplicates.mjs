#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://birugqyuqhiahxvxeyqg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpcnVncXl1cWhpYWh4dnhleXFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTc4NzE2NCwiZXhwIjoyMDcxMzYzMTY0fQ.5bw0QlkRgv_PA7iHrpWixvC31d7WZ5VYSR2JZnhsw8s'
);

async function cleanupDuplicates() {
  console.log('🧹 Cleaning Up Duplicate Data\n');
  console.log('═'.repeat(70));
  
  try {
    // 1. Clean duplicate pages - keep the most recent
    console.log('📄 Cleaning duplicate scraped_pages...');
    
    const { data: allPages } = await supabase
      .from('scraped_pages')
      .select('*')
      .order('url')
      .order('scraped_at', { ascending: false });
    
    const seenUrls = new Set();
    const toDelete = [];
    
    allPages?.forEach(page => {
      if (seenUrls.has(page.url)) {
        toDelete.push(page.id);
        console.log(`  • Marking for deletion: ${page.url} (scraped ${new Date(page.scraped_at).toLocaleString()})`);
      } else {
        seenUrls.add(page.url);
      }
    });
    
    if (toDelete.length > 0) {
      // Delete the duplicates
      const { error } = await supabase
        .from('scraped_pages')
        .delete()
        .in('id', toDelete);
      
      if (error) {
        console.error('Error deleting duplicate pages:', error);
      } else {
        console.log(`  ✅ Deleted ${toDelete.length} duplicate pages`);
      }
    } else {
      console.log('  ✅ No duplicate pages to clean');
    }
    
    // 2. Clean duplicate products
    console.log('\n🛍️  Cleaning duplicate products...');
    
    const { data: products } = await supabase
      .from('structured_extractions')
      .select('*')
      .eq('extract_type', 'product')
      .order('extracted_at', { ascending: false });
    
    const seenSkus = new Set();
    const productToDelete = [];
    
    products?.forEach(product => {
      const sku = product.extracted_data?.sku;
      if (sku) {
        if (seenSkus.has(sku)) {
          productToDelete.push(product.id);
          console.log(`  • Marking for deletion: SKU ${sku} - ${product.extracted_data.name}`);
        } else {
          seenSkus.add(sku);
        }
      }
    });
    
    if (productToDelete.length > 0) {
      const { error } = await supabase
        .from('structured_extractions')
        .delete()
        .in('id', productToDelete);
      
      if (error) {
        console.error('Error deleting duplicate products:', error);
      } else {
        console.log(`  ✅ Deleted ${productToDelete.length} duplicate products`);
      }
    } else {
      console.log('  ✅ No duplicate products to clean');
    }
    
    // 3. Clean duplicate embeddings
    console.log('\n📊 Cleaning duplicate embeddings...');
    
    const { data: embeddings } = await supabase
      .from('page_embeddings')
      .select('*')
      .order('created_at', { ascending: false });
    
    const seenChunks = new Map();
    const embeddingsToDelete = [];
    
    embeddings?.forEach(emb => {
      const chunkKey = `${emb.page_id}-${emb.chunk_text.substring(0, 100)}`;
      
      if (seenChunks.has(chunkKey)) {
        embeddingsToDelete.push(emb.id);
      } else {
        seenChunks.set(chunkKey, emb.id);
      }
    });
    
    if (embeddingsToDelete.length > 0) {
      // Delete in batches to avoid timeout
      const batchSize = 100;
      let deleted = 0;
      
      for (let i = 0; i < embeddingsToDelete.length; i += batchSize) {
        const batch = embeddingsToDelete.slice(i, i + batchSize);
        const { error } = await supabase
          .from('page_embeddings')
          .delete()
          .in('id', batch);
        
        if (!error) {
          deleted += batch.length;
          console.log(`  • Deleted batch: ${deleted}/${embeddingsToDelete.length}`);
        }
      }
      
      console.log(`  ✅ Deleted ${deleted} duplicate embeddings`);
    } else {
      console.log('  ✅ No duplicate embeddings to clean');
    }
    
    // 4. Verify cleanup
    console.log('\n' + '═'.repeat(70));
    console.log('🔍 Verifying Cleanup Results:\n');
    
    // Re-check for duplicates
    const { data: finalPages } = await supabase
      .from('scraped_pages')
      .select('url');
    
    const finalUrlCounts = {};
    finalPages?.forEach(page => {
      finalUrlCounts[page.url] = (finalUrlCounts[page.url] || 0) + 1;
    });
    
    const remainingDuplicates = Object.entries(finalUrlCounts)
      .filter(([url, count]) => count > 1);
    
    if (remainingDuplicates.length === 0) {
      console.log('✅ All duplicates successfully cleaned!');
    } else {
      console.log(`⚠️  ${remainingDuplicates.length} duplicate URLs still remain`);
    }
    
    // Final counts
    const { count: pageCount } = await supabase
      .from('scraped_pages')
      .select('*', { count: 'exact', head: true });
    
    const { count: productCount } = await supabase
      .from('structured_extractions')
      .select('*', { count: 'exact', head: true })
      .eq('extract_type', 'product');
    
    const { count: embeddingCount } = await supabase
      .from('page_embeddings')
      .select('*', { count: 'exact', head: true });
    
    console.log('\n📊 Final Database State:');
    console.log(`  • Scraped pages: ${pageCount}`);
    console.log(`  • Products: ${productCount}`);
    console.log(`  • Embeddings: ${embeddingCount}`);
    
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

// Add confirmation prompt
console.log('⚠️  WARNING: This will delete duplicate data from your database.');
console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');

setTimeout(() => {
  cleanupDuplicates();
}, 5000);