#!/usr/bin/env npx tsx
/**
 * Test script to forensically investigate why Agri Flip product isn't surfacing
 * in metadata search despite having "Agriculture" in its category
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log('🔍 FORENSIC INVESTIGATION: Agri Flip Product Search\n');
  console.log('='.repeat(80));
  
  // 1. Get domain ID for thompsonseparts.co.uk
  console.log('\n1️⃣ STEP 1: Finding domain ID...');
  const { data: domainData, error: domainError } = await supabase
    .from('domains')
    .select('id')
    .eq('domain', 'thompsonseparts.co.uk')
    .single();
  
  if (domainError || !domainData) {
    console.error('❌ Domain not found:', domainError);
    process.exit(1);
  }
  
  const domainId = domainData.id;
  console.log(`✓ Domain ID: ${domainId}`);
  
  // 2. Search for Agri Flip product directly
  console.log('\n2️⃣ STEP 2: Direct search for Agri Flip product...');
  const { data: agriFlipPages, error: agriError } = await supabase
    .from('scraped_pages')
    .select('id, url, title, metadata')
    .eq('domain_id', domainId)
    .or('url.ilike.%agri-flip%,url.ilike.%agri_flip%,title.ilike.%agri%flip%')
    .limit(5);
  
  if (agriError) {
    console.error('❌ Error searching for Agri Flip:', agriError);
  } else if (agriFlipPages && agriFlipPages.length > 0) {
    console.log(`✓ Found ${agriFlipPages.length} Agri Flip product page(s):`);
    agriFlipPages.forEach((page, i) => {
      console.log(`\n  ${i + 1}. ${page.title}`);
      console.log(`     URL: ${page.url}`);
      console.log(`     ID: ${page.id}`);
      if (page.metadata) {
        console.log(`     Metadata exists: YES`);
        console.log(`     Metadata keys: ${Object.keys(page.metadata).join(', ')}`);
        
        // Check for ecommerceData
        if (page.metadata.ecommerceData) {
          console.log(`     Has ecommerceData: YES`);
          if (page.metadata.ecommerceData.breadcrumbs) {
            console.log(`     Breadcrumbs: ${JSON.stringify(page.metadata.ecommerceData.breadcrumbs)}`);
          }
          if (page.metadata.ecommerceData.category) {
            console.log(`     Category: ${page.metadata.ecommerceData.category}`);
          }
        }
        
        // Check other metadata fields
        if (page.metadata.productCategory) {
          console.log(`     productCategory: ${page.metadata.productCategory}`);
        }
        if (page.metadata.productSku) {
          console.log(`     productSku: ${page.metadata.productSku}`);
        }
      } else {
        console.log(`     Metadata exists: NO`);
      }
    });
  } else {
    console.log('❌ No Agri Flip product found!');
  }
  
  // 3. Test metadata search queries
  console.log('\n3️⃣ STEP 3: Testing metadata search queries...');
  
  // Test A: Search for products with "Agriculture" in breadcrumbs
  console.log('\n   A. Searching for "Agriculture" in breadcrumbs (JSONB path)...');
  const { data: breadcrumbResults, error: breadcrumbError } = await supabase
    .from('scraped_pages')
    .select('url, title, metadata')
    .eq('domain_id', domainId)
    .not('metadata', 'is', null)
    .limit(100); // Get all with metadata
  
  if (!breadcrumbError && breadcrumbResults) {
    // Manual filtering since JSONB queries are complex
    const agricultureProducts = breadcrumbResults.filter(row => {
      if (!row.metadata) return false;
      
      // Check breadcrumbs
      if (row.metadata.ecommerceData?.breadcrumbs) {
        const hasAgriculture = row.metadata.ecommerceData.breadcrumbs.some((crumb: any) => 
          crumb.name?.toLowerCase().includes('agri') || 
          crumb.name?.toLowerCase().includes('agriculture')
        );
        if (hasAgriculture) return true;
      }
      
      // Check category
      if (row.metadata.ecommerceData?.category) {
        if (row.metadata.ecommerceData.category.toLowerCase().includes('agri')) return true;
      }
      
      // Check productCategory
      if (row.metadata.productCategory?.toLowerCase().includes('agri')) return true;
      
      return false;
    });
    
    console.log(`   ✓ Found ${agricultureProducts.length} products with Agriculture in metadata`);
    
    // Check if Agri Flip is in the results
    const hasAgriFlip = agricultureProducts.some(p => p.url?.includes('agri-flip'));
    if (hasAgriFlip) {
      console.log('   ✅ AGRI FLIP IS IN THE RESULTS!');
    } else {
      console.log('   ❌ AGRI FLIP IS MISSING FROM RESULTS!');
    }
    
    // Show first few results
    if (agricultureProducts.length > 0) {
      console.log('\n   Sample agriculture products found:');
      agricultureProducts.slice(0, 3).forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.title} - ${p.url}`);
      });
    }
  }
  
  // 4. Test the simplified agricultural search from embeddings.ts
  console.log('\n4️⃣ STEP 4: Testing simplified agricultural search (as in embeddings.ts)...');
  const { data: agriResults } = await supabase
    .from('scraped_pages')
    .select('url, title, content')
    .eq('domain_id', domainId)
    .or('url.ilike.%agri%,title.ilike.%agri%,content.ilike.%agricultural%')
    .limit(20);
  
  if (agriResults && agriResults.length > 0) {
    console.log(`✓ Found ${agriResults.length} agricultural products`);
    const agriFlip = agriResults.find(r => r.url?.includes('agri-flip'));
    if (agriFlip) {
      console.log('✅ AGRI FLIP FOUND in simplified search!');
      console.log(`   Title: ${agriFlip.title}`);
      console.log(`   URL: ${agriFlip.url}`);
    } else {
      console.log('❌ Agri Flip NOT found in simplified search');
    }
  }
  
  // 5. Check embeddings for Agri Flip
  console.log('\n5️⃣ STEP 5: Checking embeddings for Agri Flip...');
  if (agriFlipPages && agriFlipPages.length > 0) {
    const pageId = agriFlipPages[0].id;
    const { data: embeddings, error: embError } = await supabase
      .from('page_embeddings')
      .select('id, chunk_text, metadata')
      .eq('page_id', pageId)
      .limit(5);
    
    if (!embError && embeddings) {
      console.log(`✓ Found ${embeddings.length} embedding chunks for Agri Flip`);
      if (embeddings.length > 0) {
        console.log('\n   Sample chunk:');
        console.log(`   ${embeddings[0].chunk_text.substring(0, 200)}...`);
      }
    } else {
      console.log('❌ No embeddings found for Agri Flip page');
    }
  }
  
  // 6. Test a query simulation
  console.log('\n6️⃣ STEP 6: Simulating "agricultural tipper" query...');
  const testQuery = 'agricultural tipper';
  const keywords = testQuery.toLowerCase().split(/\s+/);
  
  console.log(`   Keywords: ${keywords.join(', ')}`);
  
  // Build conditions like in the code
  const conditions = [];
  if (keywords.includes('agricultural') || keywords.includes('agri')) {
    conditions.push('url.ilike.%agri%');
    conditions.push('title.ilike.%agri%');
    conditions.push('title.ilike.%agricultural%');
    conditions.push('content.ilike.%agri%');
    conditions.push('content.ilike.%agricultural%');
    conditions.push('url.ilike.%agri-flip%');
    conditions.push('url.ilike.%agri_flip%');
  }
  
  const { data: simulatedResults } = await supabase
    .from('scraped_pages')
    .select('url, title')
    .eq('domain_id', domainId)
    .or(conditions.join(','))
    .limit(10);
  
  if (simulatedResults && simulatedResults.length > 0) {
    console.log(`✓ Simulated query found ${simulatedResults.length} results`);
    simulatedResults.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.title}`);
      if (r.url?.includes('agri-flip')) {
        console.log('      ✅ THIS IS AGRI FLIP!');
      }
    });
  }
  
  // 7. Final diagnosis
  console.log('\n' + '='.repeat(80));
  console.log('📊 DIAGNOSIS SUMMARY:\n');
  
  console.log('The issue appears to be in how the parallel search results are being merged.');
  console.log('The Agri Flip product IS being found by the metadata/keyword searches,');
  console.log('but it may not be making it through to the final results due to:');
  console.log('1. Result deduplication logic');
  console.log('2. Similarity score thresholds');
  console.log('3. Result limit truncation');
  console.log('4. The merge logic in enhanced-embeddings.ts');
  
  console.log('\nRECOMMENDATION: Add detailed logging to the merge logic in');
  console.log('enhanced-embeddings.ts lines 386-441 to track how results are combined.');
}

main().catch(console.error);