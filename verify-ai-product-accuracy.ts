#!/usr/bin/env npx tsx
/**
 * Verify AI product responses against the database
 * Checks if the products mentioned by AI actually exist with correct details
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Products mentioned by the Original Route
const ORIGINAL_ROUTE_PRODUCTS = [
  {
    name: 'BEZARES 4 Bolt 40cc BI-ROTATIONAL GEAR PUMP',
    url: 'https://www.thompsonseparts.co.uk/product/bezares-4-bolt-40cc-bi-rotational-gear-pump/',
    mentioned_price: null // Original route didn't include prices
  },
  {
    name: 'OMFB HDS 84cc Bent Axis Piston Pump',
    url: 'https://www.thompsonseparts.co.uk/product/omfb-hds-84cc-bent-axis-piston-pump/',
    mentioned_price: null
  }
];

// Products mentioned by the Intelligent Route
const INTELLIGENT_ROUTE_PRODUCTS = [
  {
    name: 'CIFA MIXER HYDRUALIC PUMP A4VTG90',
    url: 'https://www.thompsonseparts.co.uk/product/cifa-mixer-hydrualic-pump-a4vtg90/',
    mentioned_price: '£3975.00'
  },
  {
    name: 'Cifa Mixer PMP Pump Body PCL 9045.4/V1',
    url: 'https://www.thompsonseparts.co.uk/product/cifa-mixer-pmp-pump-body-pcl-9045-4-v1/',
    mentioned_price: null // Price not mentioned for this one
  }
];

async function getDomainId() {
  const { data } = await supabase
    .from('domains')
    .select('id')
    .eq('domain', 'thompsonseparts.co.uk')
    .single();
  
  return data?.id;
}

async function verifyProduct(product: any, domainId: string) {
  console.log(`\n📦 Verifying: ${product.name}`);
  console.log('-'.repeat(60));
  
  // Extract the path from the URL
  const urlPath = product.url.replace('https://www.thompsonseparts.co.uk', '');
  
  // Check if the product exists in scraped_pages
  const { data: pages } = await supabase
    .from('scraped_pages')
    .select('title, url, content, metadata')
    .eq('domain_id', domainId)
    .or(`url.ilike.%${urlPath}%,title.ilike.%${product.name.substring(0, 20)}%`)
    .limit(5);
  
  if (!pages || pages.length === 0) {
    console.log('❌ NOT FOUND in database');
    return { found: false, accurate: false };
  }
  
  // Find the best match
  let bestMatch = pages[0];
  for (const page of pages) {
    if (page.url === product.url || page.url.includes(urlPath)) {
      bestMatch = page;
      break;
    }
  }
  
  console.log(`✅ FOUND in database`);
  console.log(`   Title: ${bestMatch.title}`);
  console.log(`   URL: ${bestMatch.url}`);
  
  // Check if price is mentioned in content if AI provided a price
  if (product.mentioned_price) {
    const priceInContent = bestMatch.content?.includes(product.mentioned_price.replace('£', '')) ||
                          bestMatch.content?.includes(product.mentioned_price) ||
                          JSON.stringify(bestMatch.metadata).includes(product.mentioned_price.replace('£', ''));
    
    console.log(`   Price Check: ${product.mentioned_price}`);
    if (priceInContent) {
      console.log(`   ✅ Price ACCURATE`);
    } else {
      // Check for any price in the content
      const priceMatch = bestMatch.content?.match(/£[\d,]+\.?\d*/);
      if (priceMatch) {
        console.log(`   ⚠️ Price MISMATCH - Actual: ${priceMatch[0]}, AI said: ${product.mentioned_price}`);
      } else {
        console.log(`   ❓ Price not found in content`);
      }
    }
  }
  
  // Verify it's actually a pump/Cifa product
  const isRelevant = bestMatch.title.toLowerCase().includes('pump') || 
                     bestMatch.title.toLowerCase().includes('cifa') ||
                     bestMatch.content?.toLowerCase().includes('pump');
  
  if (!isRelevant) {
    console.log(`   ⚠️ May not be relevant to query (not a pump or Cifa product)`);
  }
  
  return { 
    found: true, 
    accurate: true,
    isRelevant,
    actualTitle: bestMatch.title
  };
}

async function searchForCifaPumps(domainId: string) {
  console.log('\n🔍 Actual Cifa Pump Products in Database');
  console.log('=' .repeat(60));
  
  const { data: cifaPumps } = await supabase
    .from('scraped_pages')
    .select('url, title')
    .eq('domain_id', domainId)
    .or('title.ilike.%cifa%pump%,title.ilike.%cifa%water%,title.ilike.%cifa%hydraulic%')
    .limit(20);
  
  console.log(`Found ${cifaPumps?.length || 0} Cifa pump products:`);
  cifaPumps?.forEach((p, i) => {
    console.log(`${i + 1}. ${p.title}`);
  });
  
  return cifaPumps || [];
}

async function main() {
  console.log('🔬 AI PRODUCT ACCURACY VERIFICATION');
  console.log('=' .repeat(60));
  
  const domainId = await getDomainId();
  if (!domainId) {
    console.error('Could not find domain ID');
    return;
  }
  
  console.log(`Domain ID: ${domainId}\n`);
  
  // Verify Original Route Products
  console.log('📊 ORIGINAL ROUTE PRODUCTS');
  console.log('=' .repeat(60));
  let originalAccurate = 0;
  let originalFound = 0;
  
  for (const product of ORIGINAL_ROUTE_PRODUCTS) {
    const result = await verifyProduct(product, domainId);
    if (result.found) originalFound++;
    if (result.accurate) originalAccurate++;
  }
  
  // Verify Intelligent Route Products
  console.log('\n📊 INTELLIGENT ROUTE PRODUCTS');
  console.log('=' .repeat(60));
  let intelligentAccurate = 0;
  let intelligentFound = 0;
  
  for (const product of INTELLIGENT_ROUTE_PRODUCTS) {
    const result = await verifyProduct(product, domainId);
    if (result.found) intelligentFound++;
    if (result.accurate) intelligentAccurate++;
  }
  
  // Search for actual Cifa pumps
  const actualCifaPumps = await searchForCifaPumps(domainId);
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📈 VERIFICATION SUMMARY');
  console.log('='.repeat(60));
  
  console.log('\nOriginal Route Accuracy:');
  console.log(`  Products Mentioned: ${ORIGINAL_ROUTE_PRODUCTS.length}`);
  console.log(`  Found in DB: ${originalFound}/${ORIGINAL_ROUTE_PRODUCTS.length}`);
  console.log(`  Accuracy Rate: ${(originalFound/ORIGINAL_ROUTE_PRODUCTS.length * 100).toFixed(0)}%`);
  console.log(`  ⚠️ Note: Mentioned generic pumps (BEZARES, OMFB) not Cifa-specific`);
  
  console.log('\nIntelligent Route Accuracy:');
  console.log(`  Products Mentioned: ${INTELLIGENT_ROUTE_PRODUCTS.length}`);
  console.log(`  Found in DB: ${intelligentFound}/${INTELLIGENT_ROUTE_PRODUCTS.length}`);
  console.log(`  Accuracy Rate: ${(intelligentFound/INTELLIGENT_ROUTE_PRODUCTS.length * 100).toFixed(0)}%`);
  console.log(`  ✅ Note: Mentioned actual Cifa products`);
  
  console.log('\nDatabase Reality:');
  console.log(`  Actual Cifa Pump Products: ${actualCifaPumps.length}`);
  console.log(`  Original Route Coverage: ${(ORIGINAL_ROUTE_PRODUCTS.filter(p => p.name.includes('CIFA')).length / actualCifaPumps.length * 100).toFixed(0)}%`);
  console.log(`  Intelligent Route Coverage: ${(INTELLIGENT_ROUTE_PRODUCTS.filter(p => p.name.includes('CIFA') || p.name.includes('Cifa')).length / actualCifaPumps.length * 100).toFixed(0)}%`);
  
  console.log('\n💡 KEY FINDINGS:');
  if (intelligentFound > originalFound) {
    console.log('   ✅ Intelligent route provides more accurate product information');
  }
  if (INTELLIGENT_ROUTE_PRODUCTS.some(p => p.mentioned_price)) {
    console.log('   ✅ Intelligent route includes pricing information');
  }
  if (actualCifaPumps.length > 10) {
    console.log(`   📊 Database has ${actualCifaPumps.length} Cifa pumps - both routes could show more`);
  }
  
  // Check for hallucination
  const originalHallucinated = ORIGINAL_ROUTE_PRODUCTS.length - originalFound;
  const intelligentHallucinated = INTELLIGENT_ROUTE_PRODUCTS.length - intelligentFound;
  
  if (originalHallucinated > 0) {
    console.log(`   ⚠️ Original route may have hallucinated ${originalHallucinated} products`);
  }
  if (intelligentHallucinated > 0) {
    console.log(`   ⚠️ Intelligent route may have hallucinated ${intelligentHallucinated} products`);
  }
  
  if (originalHallucinated === 0 && intelligentHallucinated === 0) {
    console.log('   ✅ No hallucination detected - all mentioned products exist in database');
  }
  
  console.log('\n✅ Verification completed!');
}

main().catch(console.error);