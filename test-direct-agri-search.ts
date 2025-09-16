/**
 * Direct test to find Agri Flip product
 */

import { createServiceRoleClient } from './lib/supabase-server';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testDirectSearch() {
  const supabase = await createServiceRoleClient();
  if (!supabase) {
    console.error('Failed to create Supabase client');
    process.exit(1);
  }
  
  const domain = 'thompsonseparts.co.uk';
  const { data: domainData } = await supabase
    .from('domains')
    .select('id')
    .eq('domain', domain)
    .single();
  
  if (!domainData) {
    console.error('Domain not found');
    process.exit(1);
  }
  
  const domainId = domainData.id;
  console.log('Testing direct search for Agri Flip...\n');
  
  // Test 1: Direct URL search
  console.log('Test 1: Direct URL search for "agri"');
  const { data: urlSearch } = await supabase
    .from('scraped_pages')
    .select('url, title')
    .eq('domain_id', domainId)
    .ilike('url', '%agri%')
    .limit(10);
  
  console.log(`Found ${urlSearch?.length || 0} results:`);
  urlSearch?.forEach((r: any, i: number) => {
    console.log(`${i + 1}. ${r.title}`);
    console.log(`   ${r.url}`);
    if (r.url.includes('agri-flip')) {
      console.log('   ✓ THIS IS AGRI FLIP!');
    }
  });
  
  // Test 2: Title search for "agricultural"
  console.log('\n\nTest 2: Title search for "agricultural"');
  const { data: titleSearch } = await supabase
    .from('scraped_pages')
    .select('url, title')
    .eq('domain_id', domainId)
    .ilike('title', '%agricultural%')
    .limit(10);
  
  console.log(`Found ${titleSearch?.length || 0} results:`);
  titleSearch?.forEach((r: any, i: number) => {
    console.log(`${i + 1}. ${r.title}`);
    console.log(`   ${r.url}`);
    if (r.url.includes('agri-flip')) {
      console.log('   ✓ THIS IS AGRI FLIP!');
    }
  });
  
  // Test 3: Combined search
  console.log('\n\nTest 3: Combined OR search');
  const { data: combined } = await supabase
    .from('scraped_pages')
    .select('url, title')
    .eq('domain_id', domainId)
    .or('url.ilike.%agri%,title.ilike.%agri%,title.ilike.%agricultural%,content.ilike.%agricultural%')
    .limit(20);
  
  console.log(`Found ${combined?.length || 0} results:`);
  const agriFlipFound = combined?.find((r: any) => r.url.includes('agri-flip'));
  
  if (agriFlipFound) {
    console.log('\n✓ AGRI FLIP FOUND!');
    console.log('Title:', agriFlipFound.title);
    console.log('URL:', agriFlipFound.url);
  } else {
    console.log('\n❌ Agri Flip NOT found in combined search');
    
    // Show all results
    combined?.forEach((r: any, i: number) => {
      console.log(`${i + 1}. ${r.title.substring(0, 60)}...`);
    });
  }
}

testDirectSearch().catch(console.error);