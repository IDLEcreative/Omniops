/**
 * Test Metadata Search Functionality
 * This script tests if the metadata search correctly finds agricultural products
 */

import { createServiceRoleClient } from './lib/supabase-server';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testMetadataSearch() {
  console.log('=== Testing Metadata Search for Agricultural Products ===\n');
  
  const supabase = await createServiceRoleClient();
  if (!supabase) {
    console.error('Failed to create Supabase client');
    process.exit(1);
  }
  
  // Get domain ID for Thompson's
  const domain = 'thompsonseparts.co.uk';
  const { data: domainData, error: domainError } = await supabase
    .from('domains')
    .select('id')
    .eq('domain', domain)
    .single();
  
  if (!domainData) {
    console.error('Domain not found:', domainError);
    process.exit(1);
  }
  
  const domainId = domainData.id;
  console.log(`Domain ID: ${domainId}\n`);
  
  // Test 1: Search for pages with Agriculture in metadata
  console.log('Test 1: Finding pages with "Agriculture" in metadata...');
  const { data: agriculturePages, error: agricultureError } = await supabase
    .from('scraped_pages')
    .select('url, title, metadata')
    .eq('domain_id', domainId)
    .not('metadata', 'is', null)
    .limit(100);
  
  if (agricultureError) {
    console.error('Error fetching pages:', agricultureError);
  } else {
    // Filter for agriculture-related metadata
    const agricultureProducts = agriculturePages?.filter((page: any) => {
      if (!page.metadata) return false;
      
      // Check various metadata fields for "agriculture" or "agricultural"
      const metadataStr = JSON.stringify(page.metadata).toLowerCase();
      const hasAgriculture = metadataStr.includes('agriculture') || 
                             metadataStr.includes('agricultural') ||
                             metadataStr.includes('agri');
      
      if (hasAgriculture && page.url.includes('agri-flip')) {
        console.log('\n✓ Found Agri Flip product!');
        console.log('  URL:', page.url);
        console.log('  Title:', page.title);
        console.log('  Metadata sample:', JSON.stringify(page.metadata).substring(0, 200));
      }
      
      return hasAgriculture;
    }) || [];
    
    console.log(`\nFound ${agricultureProducts.length} pages with agriculture-related metadata`);
    
    if (agricultureProducts.length > 0) {
      console.log('\nSample agricultural products:');
      agricultureProducts.slice(0, 3).forEach((product: any, i: number) => {
        console.log(`\n${i + 1}. ${product.title}`);
        console.log(`   URL: ${product.url}`);
        
        // Check breadcrumbs
        if (product.metadata?.ecommerceData?.breadcrumbs) {
          const breadcrumbs = product.metadata.ecommerceData.breadcrumbs
            .map((b: any) => b.name)
            .join(' > ');
          console.log(`   Breadcrumbs: ${breadcrumbs}`);
        }
        
        // Check category
        if (product.metadata?.productCategory) {
          console.log(`   Category: ${product.metadata.productCategory}`);
        }
      });
    }
  }
  
  // Test 2: Specifically search for the Agri Flip product
  console.log('\n\nTest 2: Specifically searching for Agri Flip product...');
  const { data: agriFlipData, error: agriFlipError } = await supabase
    .from('scraped_pages')
    .select('url, title, content, metadata')
    .eq('domain_id', domainId)
    .ilike('url', '%agri-flip%')
    .single();
  
  if (agriFlipError) {
    console.error('Error finding Agri Flip:', agriFlipError);
  } else if (agriFlipData) {
    console.log('\n✓ Agri Flip Product Found!');
    console.log('URL:', agriFlipData.url);
    console.log('Title:', agriFlipData.title);
    console.log('\nContent preview (first 500 chars):');
    console.log(agriFlipData.content?.substring(0, 500));
    
    if (agriFlipData.metadata) {
      console.log('\nMetadata:');
      console.log(JSON.stringify(agriFlipData.metadata, null, 2));
    }
  }
  
  // Test 3: Check if embeddings exist for Agri Flip
  if (agriFlipData) {
    console.log('\n\nTest 3: Checking embeddings for Agri Flip...');
    const { data: pageData } = await supabase
      .from('scraped_pages')
      .select('id')
      .eq('url', agriFlipData.url)
      .single();
    
    if (pageData) {
      const { data: embeddings, error: embeddingsError } = await supabase
        .from('page_embeddings')
        .select('id, chunk_text, metadata')
        .eq('page_id', pageData.id)
        .limit(5);
      
      if (embeddingsError) {
        console.error('Error fetching embeddings:', embeddingsError);
      } else if (embeddings && embeddings.length > 0) {
        console.log(`\n✓ Found ${embeddings.length} embedding chunks`);
        embeddings.forEach((chunk: any, i: number) => {
          console.log(`\nChunk ${i + 1}:`);
          console.log(chunk.chunk_text.substring(0, 200) + '...');
        });
      } else {
        console.log('❌ No embeddings found for Agri Flip');
      }
    }
  }
  
  // Test 4: Test keyword search for "agricultural tipper"
  console.log('\n\nTest 4: Testing keyword search for "agricultural tipper"...');
  const keywords = ['agricultural', 'tipper', 'agri', 'agriculture'];
  
  const orConditions = [];
  for (const kw of keywords) {
    orConditions.push(`content.ilike.%${kw}%`);
    orConditions.push(`title.ilike.%${kw}%`);
  }
  
  const { data: keywordResults, error: keywordError } = await supabase
    .from('scraped_pages')
    .select('url, title')
    .eq('domain_id', domainId)
    .or(orConditions.join(','))
    .limit(10);
  
  if (keywordError) {
    console.error('Keyword search error:', keywordError);
  } else if (keywordResults) {
    console.log(`\nFound ${keywordResults.length} pages matching keywords`);
    keywordResults.forEach((page: any, i: number) => {
      console.log(`${i + 1}. ${page.title}`);
      console.log(`   ${page.url}`);
      
      if (page.url.includes('agri-flip')) {
        console.log('   ✓ This is the Agri Flip product!');
      }
    });
  }
  
  console.log('\n=== Test Complete ===');
}

// Run the test
testMetadataSearch().catch(console.error);