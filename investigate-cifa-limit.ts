#!/usr/bin/env npx tsx
/**
 * Investigation Script: Why are only 2 Cifa products being returned?
 * This script will trace through the entire search pipeline to identify the bottleneck.
 */

import 'dotenv/config';
import { createServiceRoleClient } from './lib/supabase-server';
import { searchSimilarContent } from './lib/embeddings';

async function investigateCifaProducts() {
  console.log('='.repeat(80));
  console.log('CIFA PRODUCTS INVESTIGATION - FINDING THE 2-PRODUCT LIMIT');
  console.log('='.repeat(80));

  const supabase = await createServiceRoleClient();
  if (!supabase) {
    console.error('❌ Failed to create Supabase client');
    return;
  }

  const domain = 'thompsonseparts.co.uk';
  
  // Step 1: Check how many Cifa products are actually in the database
  console.log('\n📊 STEP 1: Database Inventory Check');
  console.log('-'.repeat(40));
  
  const { data: domainData } = await supabase
    .from('domains')
    .select('id')
    .eq('domain', domain)
    .single();
  
  const domainId = domainData?.id;
  console.log(`Domain ID for ${domain}: ${domainId}`);
  
  // Check scraped_pages for Cifa content
  const { data: cifaPages, count: cifaPageCount } = await supabase
    .from('scraped_pages')
    .select('url, title', { count: 'exact' })
    .eq('domain_id', domainId!)
    .or('url.ilike.%cifa%,title.ilike.%cifa%,content.ilike.%cifa%');
  
  console.log(`\n✅ Found ${cifaPageCount} pages with 'Cifa' in scraped_pages`);
  if (cifaPages && cifaPages.length > 0) {
    console.log('Sample Cifa pages:');
    cifaPages.slice(0, 5).forEach(page => {
      console.log(`  - ${page.title || 'No title'}: ${page.url}`);
    });
  }
  
  // Step 2: Test searchSimilarContent with different limits
  console.log('\n🔍 STEP 2: Testing searchSimilarContent() with various limits');
  console.log('-'.repeat(40));
  
  const testLimits = [2, 5, 10, 20, 50];
  
  for (const limit of testLimits) {
    console.log(`\n📝 Testing with limit=${limit}:`);
    
    try {
      const results = await searchSimilarContent(
        'Cifa pumps products',
        domain,
        limit,
        0.15  // Low threshold for better recall
      );
      
      console.log(`  Results returned: ${results.length}`);
      
      // Count actual Cifa products in results
      const cifaResults = results.filter(r => 
        r.title?.toLowerCase().includes('cifa') || 
        r.content?.toLowerCase().includes('cifa')
      );
      
      console.log(`  Cifa products found: ${cifaResults.length}`);
      
      if (cifaResults.length > 0) {
        console.log('  Cifa products:');
        cifaResults.forEach((r, i) => {
          console.log(`    ${i + 1}. ${r.title} (similarity: ${r.similarity.toFixed(3)})`);
        });
      }
    } catch (error) {
      console.error(`  Error with limit=${limit}:`, error);
    }
  }
  
  // Step 3: Direct RPC call to search_embeddings
  console.log('\n🔧 STEP 3: Direct RPC call to search_embeddings');
  console.log('-'.repeat(40));
  
  // Generate embedding for the query
  const { generateQueryEmbedding } = await import('./lib/embeddings');
  const queryEmbedding = await generateQueryEmbedding('Cifa pumps products', true, domain);
  
  const rpcLimits = [2, 10, 20, 50];
  
  for (const limit of rpcLimits) {
    console.log(`\n📝 RPC with match_count=${limit}:`);
    
    const { data: rpcResults, error } = await supabase.rpc('search_embeddings', {
      query_embedding: queryEmbedding,
      p_domain_id: domainId,
      match_threshold: 0.1,  // Very low threshold
      match_count: limit
    });
    
    if (error) {
      console.error(`  RPC Error:`, error);
      continue;
    }
    
    console.log(`  Total results: ${rpcResults?.length || 0}`);
    
    if (rpcResults && rpcResults.length > 0) {
      const cifaRpcResults = rpcResults.filter((r: any) => 
        r.title?.toLowerCase().includes('cifa') || 
        r.chunk_text?.toLowerCase().includes('cifa') ||
        r.content?.toLowerCase().includes('cifa')
      );
      
      console.log(`  Cifa results: ${cifaRpcResults.length}`);
      
      if (cifaRpcResults.length > 0) {
        console.log('  First few Cifa results:');
        cifaRpcResults.slice(0, 5).forEach((r: any, i: number) => {
          console.log(`    ${i + 1}. ${r.title || r.metadata?.title || 'No title'} (similarity: ${r.similarity?.toFixed(3)})`);
        });
      }
    }
  }
  
  // Step 4: Check if it's a WooCommerce search issue
  console.log('\n🛒 STEP 4: WooCommerce Search Check');
  console.log('-'.repeat(40));
  
  try {
    const { searchProductsDynamic } = await import('./lib/woocommerce-dynamic');
    
    const wcLimits = [2, 10, 20];
    
    for (const limit of wcLimits) {
      console.log(`\n📝 WooCommerce search with limit=${limit}:`);
      
      const wcProducts = await searchProductsDynamic(domain, 'Cifa', limit);
      
      console.log(`  Products returned: ${wcProducts?.length || 0}`);
      
      if (wcProducts && wcProducts.length > 0) {
        console.log('  Products:');
        wcProducts.slice(0, 5).forEach((p: any, i: number) => {
          console.log(`    ${i + 1}. ${p.name} (SKU: ${p.sku || 'N/A'})`);
        });
      }
    }
  } catch (error) {
    console.error('WooCommerce search error:', error);
  }
  
  // Step 5: Analyze the intelligent chat route's function calls
  console.log('\n🤖 STEP 5: Simulating Intelligent Chat Route Function Calls');
  console.log('-'.repeat(40));
  
  // Check the search_products function behavior
  console.log('\nThe search_products function in route-intelligent.ts:');
  console.log('- Default limit: 8 (line 77)');
  console.log('- Maximum limit: 20 (line 80)');
  console.log('- WooCommerce limit: Math.min(limit, 10) (line 149)');
  
  console.log('\n⚠️ POTENTIAL BOTTLENECK FOUND:');
  console.log('Line 149: wcProducts limit is capped at 10 even if limit is 20');
  console.log('This means WooCommerce will never return more than 10 products');
  
  // Step 6: Check the actual database function
  console.log('\n📋 STEP 6: Checking search_embeddings RPC function');
  console.log('-'.repeat(40));
  
  // Try to get the function definition
  const { data: funcDef } = await supabase.rpc('search_embeddings' as any, {
    query_embedding: [],
    p_domain_id: '',
    match_threshold: 0,
    match_count: 0
  }).explain();
  
  console.log('Note: The RPC function likely has its own internal limits');
  
  // Final summary
  console.log('\n' + '='.repeat(80));
  console.log('INVESTIGATION SUMMARY');
  console.log('='.repeat(80));
  
  console.log('\n🔍 FINDINGS:');
  console.log('1. The intelligent chat route has these limits:');
  console.log('   - search_products default: 8, max: 20');
  console.log('   - WooCommerce is capped at 10 (line 149)');
  console.log('   - searchSimilarContent gets the full limit');
  
  console.log('\n2. The AI is likely only requesting the default limit of 8');
  console.log('   - The AI doesn\'t know there are 20 products');
  console.log('   - It uses the default unless explicitly told to get more');
  
  console.log('\n3. Even if AI requests 20, WooCommerce caps at 10');
  
  console.log('\n💡 RECOMMENDATIONS:');
  console.log('1. Remove the Math.min(limit, 10) cap on WooCommerce');
  console.log('2. Increase the default limit for product searches');
  console.log('3. Add a hint to the AI system prompt about available products');
  console.log('4. Consider pre-fetching all products for known brands');
}

// Run the investigation
investigateCifaProducts().catch(console.error);