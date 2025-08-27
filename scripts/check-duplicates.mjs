#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://birugqyuqhiahxvxeyqg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpcnVncXl1cWhpYWh4dnhleXFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTc4NzE2NCwiZXhwIjoyMDcxMzYzMTY0fQ.5bw0QlkRgv_PA7iHrpWixvC31d7WZ5VYSR2JZnhsw8s'
);

async function checkDuplicates() {
  console.log('🔍 Checking for Duplicate Data\n');
  console.log('═'.repeat(70));
  
  try {
    // 1. Check duplicate URLs in scraped_pages
    const { data: allPages } = await supabase
      .from('scraped_pages')
      .select('url, id, scraped_at')
      .order('url');
    
    const urlCounts = {};
    allPages?.forEach(page => {
      urlCounts[page.url] = (urlCounts[page.url] || 0) + 1;
    });
    
    const duplicateUrls = Object.entries(urlCounts)
      .filter(([url, count]) => count > 1)
      .sort((a, b) => b[1] - a[1]);
    
    console.log('📄 DUPLICATE URLS IN scraped_pages:');
    console.log('-'.repeat(70));
    if (duplicateUrls.length > 0) {
      duplicateUrls.forEach(([url, count]) => {
        console.log(`  • ${url}`);
        console.log(`    Scraped ${count} times`);
      });
      console.log(`\n  ⚠️  Total duplicate URLs: ${duplicateUrls.length}`);
    } else {
      console.log('  ✅ No duplicate URLs found');
    }
    
    // 2. Check duplicate products in structured_extractions
    const { data: products } = await supabase
      .from('structured_extractions')
      .select('extracted_data, url')
      .eq('extract_type', 'product');
    
    const skuMap = {};
    const nameMap = {};
    
    products?.forEach(product => {
      const data = product.extracted_data;
      if (data.sku) {
        if (!skuMap[data.sku]) skuMap[data.sku] = [];
        skuMap[data.sku].push({ name: data.name, url: product.url });
      }
      if (data.name) {
        if (!nameMap[data.name]) nameMap[data.name] = [];
        nameMap[data.name].push({ sku: data.sku, url: product.url });
      }
    });
    
    const duplicateSkus = Object.entries(skuMap)
      .filter(([sku, items]) => items.length > 1);
    
    const duplicateNames = Object.entries(nameMap)
      .filter(([name, items]) => items.length > 1);
    
    console.log('\n🛍️  DUPLICATE PRODUCTS:');
    console.log('-'.repeat(70));
    
    if (duplicateSkus.length > 0) {
      console.log('  Duplicate SKUs:');
      duplicateSkus.slice(0, 5).forEach(([sku, items]) => {
        console.log(`  • SKU: ${sku} (appears ${items.length} times)`);
        items.slice(0, 2).forEach(item => {
          console.log(`    - ${item.name}`);
        });
      });
      console.log(`\n  ⚠️  Total duplicate SKUs: ${duplicateSkus.length}`);
    } else {
      console.log('  ✅ No duplicate SKUs found');
    }
    
    if (duplicateNames.length > 0) {
      console.log('\n  Duplicate Product Names:');
      duplicateNames.slice(0, 5).forEach(([name, items]) => {
        console.log(`  • "${name}" (appears ${items.length} times)`);
      });
      console.log(`\n  ⚠️  Total duplicate product names: ${duplicateNames.length}`);
    }
    
    // 3. Check content_hashes table (deduplication tracking)
    const { data: hashes, count: hashCount } = await supabase
      .from('content_hashes')
      .select('*', { count: 'exact' })
      .gt('occurrence_count', 1);
    
    console.log('\n🔗 CONTENT HASH DUPLICATES:');
    console.log('-'.repeat(70));
    if (hashCount > 0) {
      console.log(`  ⚠️  Found ${hashCount} duplicate content hashes`);
      hashes?.slice(0, 5).forEach(hash => {
        console.log(`  • ${hash.url}`);
        console.log(`    Seen ${hash.occurrence_count} times`);
      });
    } else {
      console.log('  ✅ No duplicate content hashes tracked');
    }
    
    // 4. Check embeddings duplicates
    const { data: embeddings } = await supabase
      .from('page_embeddings')
      .select('chunk_text, page_id');
    
    const chunkMap = {};
    embeddings?.forEach(emb => {
      const key = emb.chunk_text.substring(0, 100); // First 100 chars as key
      chunkMap[key] = (chunkMap[key] || 0) + 1;
    });
    
    const duplicateChunks = Object.entries(chunkMap)
      .filter(([chunk, count]) => count > 1);
    
    console.log('\n📊 EMBEDDING CHUNK DUPLICATES:');
    console.log('-'.repeat(70));
    if (duplicateChunks.length > 0) {
      console.log(`  ⚠️  Found ${duplicateChunks.length} duplicate text chunks`);
      duplicateChunks.slice(0, 3).forEach(([chunk, count]) => {
        console.log(`  • "${chunk}..."`);
        console.log(`    Embedded ${count} times`);
      });
    } else {
      console.log('  ✅ No duplicate embeddings found');
    }
    
    // Summary and recommendations
    console.log('\n' + '═'.repeat(70));
    console.log('📋 DUPLICATE ANALYSIS SUMMARY:\n');
    
    const issues = [];
    if (duplicateUrls.length > 0) {
      issues.push(`• ${duplicateUrls.length} URLs scraped multiple times`);
    }
    if (duplicateSkus.length > 0) {
      issues.push(`• ${duplicateSkus.length} duplicate product SKUs`);
    }
    if (duplicateNames.length > 0) {
      issues.push(`• ${duplicateNames.length} duplicate product names`);
    }
    if (duplicateChunks.length > 0) {
      issues.push(`• ${duplicateChunks.length} duplicate text chunks`);
    }
    
    if (issues.length > 0) {
      console.log('⚠️  Issues Found:');
      issues.forEach(issue => console.log(`  ${issue}`));
      
      console.log('\n💡 RECOMMENDATIONS:');
      console.log('  1. Add UPSERT logic instead of INSERT for scraped_pages');
      console.log('  2. Use ON CONFLICT clauses in database inserts');
      console.log('  3. Check for existing content before creating embeddings');
      console.log('  4. Implement content hashing before storage');
      console.log('  5. Add unique constraints on (domain_id, url) combinations');
    } else {
      console.log('✅ No significant duplication issues found!');
    }
    
    // Check if unique constraints exist
    console.log('\n🔒 DATABASE CONSTRAINTS:');
    console.log('-'.repeat(70));
    
    // These tables should have unique constraints
    const constraints = [
      { table: 'scraped_pages', constraint: 'unique_domain_url' },
      { table: 'website_content', constraint: 'unique_domain_content_url' },
      { table: 'ai_optimized_content', constraint: 'unique_ai_url_per_domain' },
      { table: 'content_hashes', constraint: 'unique_hash_per_domain' },
    ];
    
    console.log('  Expected unique constraints:');
    constraints.forEach(c => {
      console.log(`  • ${c.table}: ${c.constraint} (domain_id, url)`);
    });
    
    console.log('\n  Note: These constraints should prevent duplicates if properly enforced.');
    
  } catch (error) {
    console.error('Error checking duplicates:', error);
  }
}

checkDuplicates();