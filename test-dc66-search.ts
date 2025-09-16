#!/usr/bin/env tsx
/**
 * Test DC66-10P Product Search
 * Verifies that the search pipeline can find DC66-10P products
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Test using the chat API directly
async function testDC66Search() {
  console.log('🚀 DC66-10P Product Search Test');
  console.log('================================\n');
  
  const domain = 'thompsonseparts.co.uk';
  const queries = [
    'DC66-10P',
    'DC66-10P relay',
    'DC66-10P specifications',
    'DC66-10P-24-V2',
    'relay control assembly DC66'
  ];
  
  for (const query of queries) {
    console.log(`\n📍 Testing query: "${query}"`);
    console.log('-'.repeat(50));
    
    try {
      // Call the chat API
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: query,
          domain: domain,
          sessionId: 'test-' + Date.now(),
        }),
      });
      
      if (!response.ok) {
        console.error(`❌ API Error: ${response.status} ${response.statusText}`);
        continue;
      }
      
      const data = await response.json();
      
      // Check if response contains DC66 information
      const responseText = data.response || '';
      const foundDC66 = responseText.includes('DC66') || responseText.includes('relay');
      const hasPrice = responseText.includes('£') || responseText.includes('price');
      const hasSpecs = responseText.includes('24V') || responseText.includes('12V') || responseText.includes('volt');
      const notFound = responseText.includes("don't have") || responseText.includes("unable to find") || responseText.includes("no information");
      
      if (notFound) {
        console.log('❌ Bot says it cannot find the product');
        console.log('Response preview:', responseText.substring(0, 200));
      } else if (foundDC66) {
        console.log('✅ Found DC66-10P product information!');
        if (hasPrice) console.log('  💰 Price information included');
        if (hasSpecs) console.log('  📋 Specifications included');
        console.log('\nResponse preview:', responseText.substring(0, 300));
      } else {
        console.log('⚠️ Response doesn\'t mention DC66 products');
        console.log('Response preview:', responseText.substring(0, 200));
      }
      
      // Check metadata
      if (data.metadata) {
        console.log('\n📊 Search Metadata:');
        if (data.metadata.chunksRetrieved) {
          console.log(`  Chunks retrieved: ${data.metadata.chunksRetrieved}`);
        }
        if (data.metadata.sourcesUsed) {
          console.log(`  Sources: ${data.metadata.sourcesUsed.join(', ')}`);
        }
      }
      
    } catch (error) {
      console.error('❌ Test error:', error);
    }
  }
  
  // Now test direct database search
  console.log('\n\n🔍 Direct Database Search Test');
  console.log('================================\n');
  
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  // Check if DC66-10P exists in scraped pages
  const { data: pages, error: pagesError } = await supabase
    .from('scraped_pages')
    .select('url, title')
    .or('content.ilike.%DC66-10P%,url.ilike.%DC66%,title.ilike.%DC66%')
    .limit(10);
  
  if (pagesError) {
    console.error('❌ Database error:', pagesError);
  } else if (pages && pages.length > 0) {
    console.log(`✅ Found ${pages.length} pages with DC66-10P content:`);
    pages.forEach(p => {
      console.log(`  - ${p.title || p.url}`);
    });
  } else {
    console.log('❌ No DC66-10P pages found in database');
  }
  
  // Check embeddings
  const { data: embeddings, error: embError } = await supabase
    .from('page_embeddings')
    .select('chunk_text, metadata')
    .ilike('chunk_text', '%DC66-10P%')
    .limit(5);
  
  if (embError) {
    console.error('❌ Embeddings error:', embError);
  } else if (embeddings && embeddings.length > 0) {
    console.log(`\n✅ Found ${embeddings.length} DC66-10P embeddings`);
    
    // Check metadata quality
    const withSkus = embeddings.filter(e => 
      e.metadata?.entities?.skus?.some((s: string) => s.includes('DC66'))
    );
    
    if (withSkus.length > 0) {
      console.log('✅ SKUs properly extracted in metadata');
    } else {
      console.log('⚠️ DC66 SKUs not found in metadata - extraction issue');
    }
  } else {
    console.log('❌ No DC66-10P embeddings found');
  }
  
  console.log('\n✨ Test Complete!');
}

// Run the test
testDC66Search().catch(console.error);