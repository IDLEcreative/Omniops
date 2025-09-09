import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { searchSimilarContent } from './lib/embeddings';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testSkuSearch() {
  console.log('🔍 Testing SKU search for: 3492AG-E1\n');
  
  const domain = 'thompsonseparts.co.uk';
  
  // Test 1: Check if this SKU pattern is detected
  const regex = /\b(?=[A-Za-z0-9\-\/]*[A-Za-z])(?=[A-Za-z0-9\-\/]*\d)[A-Za-z0-9]+(?:[\-\/][A-Za-z0-9]+)+\b/g;
  const matches = '3492AG-E1'.match(regex);
  console.log('1️⃣ Part code detection:', matches ? '✅ DETECTED' : '❌ NOT DETECTED');
  if (matches) {
    console.log('   Extracted codes:', matches);
  }
  
  // Test 2: Search using the embeddings function (which has WooCommerce fallback)
  console.log('\n2️⃣ Testing searchSimilarContent (with WooCommerce fallback):');
  try {
    const results = await searchSimilarContent(
      '3492AG-E1',
      domain,
      10,
      0.2
    );
    
    console.log(`Found ${results.length} results:\n`);
    results.forEach((r, i) => {
      const isTeng = r.title?.toLowerCase().includes('teng') || 
                     r.content?.toLowerCase().includes('teng');
      console.log(`${i + 1}. ${r.title} ${isTeng ? '⚡ TENG PRODUCT' : ''}`);
      console.log(`   URL: ${r.url}`);
      console.log(`   Similarity: ${r.similarity}`);
      if (r.content?.includes('3492AG-E1')) {
        console.log(`   ✅ Contains SKU 3492AG-E1`);
      }
      console.log();
    });
  } catch (error) {
    console.error('Search error:', error);
  }
  
  // Test 3: Also test "Teng torque" to compare
  console.log('\n3️⃣ Comparing with "Teng torque" search:');
  const tengQuery = 'Teng torque';
  const tengMatches = tengQuery.match(regex);
  console.log('Part code detection for "Teng torque":', tengMatches ? '✅ DETECTED' : '❌ NOT DETECTED (explains why no WooCommerce)');
  
  try {
    const tengResults = await searchSimilarContent(
      'Teng torque',
      domain,
      10,
      0.2
    );
    
    console.log(`Found ${tengResults.length} results for "Teng torque":\n`);
    tengResults.slice(0, 3).forEach((r, i) => {
      const isTeng = r.title?.toLowerCase().includes('teng') || 
                     r.content?.toLowerCase().includes('teng');
      console.log(`${i + 1}. ${r.title} ${isTeng ? '⚡ TENG' : ''}`);
      console.log(`   Similarity: ${r.similarity}`);
    });
  } catch (error) {
    console.error('Search error:', error);
  }
  
  // Test 4: Check what the optimized search returns for this SKU
  console.log('\n4️⃣ Testing search_content_optimized RPC with SKU:');
  const { data: domainData } = await supabase
    .from('domains')
    .select('id')
    .eq('domain', domain)
    .single();
    
  if (domainData) {
    const { data: rpcResults, error } = await supabase.rpc('search_content_optimized', {
      query_text: '3492AG-E1',
      query_embedding: null,
      p_domain_id: domainData.id,
      match_count: 10,
      use_hybrid: true
    });
    
    if (!error && rpcResults) {
      console.log(`RPC returned ${rpcResults.length} results:\n`);
      rpcResults.slice(0, 3).forEach((r: any, i: number) => {
        const isTeng = r.title?.toLowerCase().includes('teng') || 
                       r.content?.toLowerCase().includes('teng');
        console.log(`${i + 1}. ${r.title || 'Untitled'} ${isTeng ? '⚡ TENG' : ''}`);
        console.log(`   URL: ${r.url}`);
        console.log(`   Similarity: ${r.similarity}`);
        if (r.content?.includes('3492AG-E1')) {
          console.log(`   ✅ Contains SKU 3492AG-E1`);
        }
      });
    }
  }
}

testSkuSearch().catch(console.error);