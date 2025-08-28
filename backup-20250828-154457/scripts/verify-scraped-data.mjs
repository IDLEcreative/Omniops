#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  'https://birugqyuqhiahxvxeyqg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpcnVncXl1cWhpYWh4dnhleXFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTc4NzE2NCwiZXhwIjoyMDcxMzYzMTY0fQ.5bw0QlkRgv_PA7iHrpWixvC31d7WZ5VYSR2JZnhsw8s'
);

async function verifyData() {
  console.log('🔍 Verifying scraped data in Supabase...\n');
  
  try {
    // Check scraped_pages table
    const { data: pages, error: pagesError } = await supabase
      .from('scraped_pages')
      .select('url, title, scraped_at')
      .order('scraped_at', { ascending: false })
      .limit(20);
    
    if (pagesError) {
      console.error('Error fetching pages:', pagesError);
    } else {
      console.log('📄 Recent scraped pages:');
      console.log('─'.repeat(60));
      pages.forEach(page => {
        console.log(`  • ${page.title || 'Untitled'}`);
        console.log(`    URL: ${page.url}`);
        console.log(`    Scraped: ${new Date(page.scraped_at).toLocaleString()}`);
      });
      console.log(`\n  Total pages shown: ${pages.length}`);
    }
    
    // Check page_embeddings table
    const { data: embeddings, count } = await supabase
      .from('page_embeddings')
      .select('*', { count: 'exact', head: true });
    
    console.log(`\n📊 Embeddings statistics:`);
    console.log('─'.repeat(60));
    console.log(`  Total text chunks with embeddings: ${count || 0}`);
    
    // Check structured_extractions for products
    const { data: products, count: productCount } = await supabase
      .from('structured_extractions')
      .select('*', { count: 'exact' })
      .eq('extract_type', 'product');
    
    console.log(`\n🛍️ Product data:`);
    console.log('─'.repeat(60));
    console.log(`  Total products stored: ${productCount || 0}`);
    
    if (products && products.length > 0) {
      console.log('\n  Sample products:');
      products.slice(0, 5).forEach(product => {
        const data = product.extracted_data;
        console.log(`  • ${data.name}`);
        if (data.sku) console.log(`    SKU: ${data.sku}`);
        if (data.price) console.log(`    Price: ${data.price.formatted || data.price}`);
      });
    }
    
    // Summary
    console.log('\n' + '═'.repeat(60));
    console.log('✨ Data Summary:');
    console.log(`  • Pages scraped: ${pages?.length || 0}`);
    console.log(`  • Text chunks indexed: ${count || 0}`);
    console.log(`  • Products cataloged: ${productCount || 0}`);
    console.log('═'.repeat(60));
    
    console.log('\n🎯 Your AI agent now has access to:');
    console.log('  • Full website content for context');
    console.log('  • Vector embeddings for semantic search');
    console.log('  • Product catalog with prices and details');
    console.log('  • Page structure and navigation');
    
  } catch (error) {
    console.error('Error verifying data:', error);
  }
}

verifyData();