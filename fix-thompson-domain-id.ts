#!/usr/bin/env npx tsx
/**
 * FIX CRITICAL ISSUE: Thompson's data saved with wrong domain_id
 * 
 * Problem: 4,465 Thompson's pages are saved with domain_id 8dccd788-1ec1-43c2-af56-78aa3366bad3
 * Solution: Update them to use correct domain_id 90666cc1-8652-4d0a-aa7d-55a9229f8e2c
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const WRONG_DOMAIN_ID = '8dccd788-1ec1-43c2-af56-78aa3366bad3';
const CORRECT_DOMAIN_ID = '90666cc1-8652-4d0a-aa7d-55a9229f8e2c';

async function fixDomainId() {
  console.log('🔧 FIXING THOMPSON\'S DOMAIN_ID MISMATCH\n');
  console.log('=' .repeat(70));
  
  // First, verify the problem
  console.log('\n📊 BEFORE FIX:');
  
  const { count: wrongCount } = await supabase
    .from('scraped_pages')
    .select('*', { count: 'exact', head: true })
    .eq('domain_id', WRONG_DOMAIN_ID);
  
  const { count: correctCount } = await supabase
    .from('scraped_pages')
    .select('*', { count: 'exact', head: true })
    .eq('domain_id', CORRECT_DOMAIN_ID);
  
  console.log(`  Wrong domain_id (${WRONG_DOMAIN_ID}): ${wrongCount} pages`);
  console.log(`  Correct domain_id (${CORRECT_DOMAIN_ID}): ${correctCount} pages`);
  
  // Verify these are Thompson's pages
  const { data: samplePages } = await supabase
    .from('scraped_pages')
    .select('url')
    .eq('domain_id', WRONG_DOMAIN_ID)
    .limit(3);
  
  console.log('\n  Sample URLs to be migrated:');
  samplePages?.forEach(p => console.log(`    • ${p.url}`));
  
  if (!samplePages?.every(p => p.url.includes('thompsonseparts.co.uk'))) {
    console.log('\n❌ ERROR: Not all pages are Thompson\'s! Aborting for safety.');
    return;
  }
  
  console.log('\n✅ Confirmed: All samples are Thompson\'s pages\n');
  console.log('🚀 STARTING MIGRATION...\n');
  
  // Update scraped_pages
  const { error: updateError, count: updatedCount } = await supabase
    .from('scraped_pages')
    .update({ domain_id: CORRECT_DOMAIN_ID })
    .eq('domain_id', WRONG_DOMAIN_ID)
    .select('*', { count: 'exact', head: true });
  
  if (updateError) {
    console.log('❌ ERROR updating scraped_pages:', updateError);
    return;
  }
  
  console.log(`✅ Updated ${updatedCount} pages in scraped_pages`);
  
  // Verify the fix
  console.log('\n📊 AFTER FIX:');
  
  const { count: wrongCountAfter } = await supabase
    .from('scraped_pages')
    .select('*', { count: 'exact', head: true })
    .eq('domain_id', WRONG_DOMAIN_ID);
  
  const { count: correctCountAfter } = await supabase
    .from('scraped_pages')
    .select('*', { count: 'exact', head: true })
    .eq('domain_id', CORRECT_DOMAIN_ID);
  
  console.log(`  Wrong domain_id: ${wrongCountAfter} pages (should be 0)`);
  console.log(`  Correct domain_id: ${correctCountAfter} pages (should be ${wrongCount})`);
  
  // Check product pages specifically
  const { count: productCount } = await supabase
    .from('scraped_pages')
    .select('*', { count: 'exact', head: true })
    .eq('domain_id', CORRECT_DOMAIN_ID)
    .like('url', '%/product/%');
  
  console.log(`\n📦 Thompson's product pages now available: ${productCount}`);
  
  if (correctCountAfter === wrongCount && wrongCountAfter === 0) {
    console.log('\n✅ MIGRATION SUCCESSFUL!');
    console.log('\n🎯 IMPACT:');
    console.log(`  • ${correctCountAfter} Thompson's pages now searchable`);
    console.log(`  • ${productCount} product pages available for chat`);
    console.log('  • Synonym expansion will now work properly');
    console.log('  • Enhanced context window can find more relevant results');
    console.log('\n💡 Next step: Test the chat - it should find products now!');
  } else {
    console.log('\n⚠️ PARTIAL MIGRATION - Some pages may not have been updated');
  }
}

// Add safety confirmation
console.log('⚠️  WARNING: This will update 4,465+ database records\n');
console.log('This migration will:');
console.log('1. Update all scraped_pages with wrong domain_id');
console.log('2. Make Thompson\'s data searchable in chat');
console.log('3. Fix the synonym expansion and context enhancement\n');

const args = process.argv.slice(2);
if (args[0] === '--confirm') {
  fixDomainId().catch(console.error);
} else {
  console.log('To proceed, run: npx tsx fix-thompson-domain-id.ts --confirm');
}