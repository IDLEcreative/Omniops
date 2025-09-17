#!/usr/bin/env npx tsx
/**
 * Query database directly to get exact count and list of Cifa pump products
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log('🔍 VERIFYING EXACT CIFA PUMP COUNT IN DATABASE');
  console.log('='.repeat(60));
  
  // Get domain ID for thompsonseparts.co.uk
  const { data: domain } = await supabase
    .from('domains')
    .select('id')
    .eq('domain', 'thompsonseparts.co.uk')
    .single();
  
  if (!domain) {
    console.error('Domain not found');
    return;
  }
  
  const domainId = domain.id;
  console.log(`Domain ID: ${domainId}\n`);
  
  // Query 1: All pages with 'cifa' and 'pump' in title
  console.log('📊 Query 1: Cifa + pump in title');
  console.log('-'.repeat(50));
  
  const { data: cifaPumpPages, count: count1 } = await supabase
    .from('scraped_pages')
    .select('url, title', { count: 'exact' })
    .eq('domain_id', domainId)
    .or('title.ilike.%cifa%pump%,title.ilike.%cifa%water%,title.ilike.%cifa%hydraulic%')
    .order('title');
  
  console.log(`Found ${count1} pages with 'cifa' and pump-related terms in title:\n`);
  cifaPumpPages?.forEach((p, i) => {
    console.log(`${i + 1}. ${p.title}`);
  });
  
  // Query 2: More specific - only product pages
  console.log('\n📊 Query 2: Cifa product pages (URL pattern)');
  console.log('-'.repeat(50));
  
  const { data: cifaProducts, count: count2 } = await supabase
    .from('scraped_pages')
    .select('url, title', { count: 'exact' })
    .eq('domain_id', domainId)
    .like('url', '%/product/%')
    .ilike('title', '%cifa%')
    .order('title');
  
  console.log(`Found ${count2} Cifa product pages:\n`);
  
  // Filter to only pump-related products
  const pumpRelated = cifaProducts?.filter(p => 
    p.title.toLowerCase().includes('pump') ||
    p.title.toLowerCase().includes('hydraulic') ||
    p.title.toLowerCase().includes('water') ||
    p.title.toLowerCase().includes('motor')
  );
  
  console.log(`Filtered to ${pumpRelated?.length} pump-related Cifa products:\n`);
  pumpRelated?.forEach((p, i) => {
    const cleanTitle = p.title.replace(' - Thompsons E Parts', '');
    console.log(`${i + 1}. ${cleanTitle}`);
  });
  
  // Query 3: Check for any Cifa products the AI might have missed
  console.log('\n📊 Query 3: All Cifa products (for reference)');
  console.log('-'.repeat(50));
  
  const { data: allCifa, count: count3 } = await supabase
    .from('scraped_pages')
    .select('title', { count: 'exact' })
    .eq('domain_id', domainId)
    .like('url', '%/product/%')
    .ilike('title', '%cifa%')
    .limit(30)
    .order('title');
  
  console.log(`Total Cifa products in database: ${count3}\n`);
  
  // Summary
  console.log('='.repeat(60));
  console.log('📈 SUMMARY');
  console.log('='.repeat(60));
  
  console.log(`\n✅ Cifa pump-related products: ${pumpRelated?.length || 0}`);
  console.log(`📦 Total Cifa products: ${count3 || 0}`);
  
  // Analyze what AI found vs reality
  const aiFoundCount = 19;
  const actualCount = pumpRelated?.length || 0;
  
  console.log(`\n🤖 AI Performance:`);
  console.log(`   AI found: ${aiFoundCount} products`);
  console.log(`   Actually exist: ${actualCount} pump-related products`);
  
  if (aiFoundCount === actualCount) {
    console.log(`   ✅ Perfect match!`);
  } else if (aiFoundCount > actualCount) {
    console.log(`   ⚠️ AI may be including non-pump Cifa products`);
  } else {
    console.log(`   ℹ️ AI found ${aiFoundCount}/${actualCount} (${(aiFoundCount/actualCount*100).toFixed(1)}%)`);
  }
  
  // Check if there are other Cifa items being counted
  const nonPumpCifa = allCifa?.filter(p => 
    !p.title.toLowerCase().includes('pump') &&
    !p.title.toLowerCase().includes('hydraulic') &&
    !p.title.toLowerCase().includes('water') &&
    !p.title.toLowerCase().includes('motor')
  );
  
  if (nonPumpCifa && nonPumpCifa.length > 0) {
    console.log(`\n📋 Non-pump Cifa products (${nonPumpCifa.length}):`);
    nonPumpCifa.slice(0, 10).forEach((p, i) => {
      const cleanTitle = p.title.replace(' - Thompsons E Parts', '');
      console.log(`   ${i + 1}. ${cleanTitle}`);
    });
  }
}

main().catch(console.error);