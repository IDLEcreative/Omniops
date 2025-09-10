#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLatestPrices() {
  console.log('🔍 CHECKING LATEST PRICE EXTRACTION');
  console.log('=' .repeat(60));
  
  try {
    // Get embeddings created in the last 5 minutes with price mentions
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const { data: recentPriceChunks, error } = await supabase
      .from('page_embeddings')
      .select('chunk_text, metadata, created_at')
      .gt('created_at', fiveMinutesAgo)
      .ilike('chunk_text', '%£%')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) {
      console.error('Error:', error);
      return;
    }
    
    console.log(`Found ${recentPriceChunks?.length || 0} recent chunks with £ symbol\n`);
    
    for (const chunk of recentPriceChunks || []) {
      console.log('─'.repeat(60));
      console.log(`Created: ${chunk.created_at}`);
      
      // Extract price mentions from text
      const priceMatches = chunk.chunk_text.match(/£[\d.,]+/g);
      if (priceMatches) {
        console.log(`Prices in text: ${priceMatches.join(', ')}`);
      }
      
      console.log(`\nMetadata price_range: ${JSON.stringify(chunk.metadata?.price_range)}`);
      
      if (chunk.metadata?.price_range) {
        console.log('✅ Price extraction WORKING!');
        console.log(`  Min: £${chunk.metadata.price_range.min}`);
        console.log(`  Max: £${chunk.metadata.price_range.max}`);
        console.log(`  Currency: ${chunk.metadata.price_range.currency}`);
      } else {
        console.log('❌ Price not extracted despite £ in text');
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    const workingCount = recentPriceChunks?.filter(c => c.metadata?.price_range)?.length || 0;
    console.log(`📊 SUMMARY: ${workingCount}/${recentPriceChunks?.length || 0} chunks have working price extraction`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkLatestPrices()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });