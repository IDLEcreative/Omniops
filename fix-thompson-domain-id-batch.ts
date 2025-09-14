#!/usr/bin/env npx tsx
/**
 * FIX CRITICAL ISSUE: Thompson's data saved with wrong domain_id
 * Using BATCH updates to avoid timeout
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
const BATCH_SIZE = 100; // Update 100 records at a time

async function fixDomainIdInBatches() {
  console.log('🔧 FIXING THOMPSON\'S DOMAIN_ID MISMATCH (BATCH MODE)\n');
  console.log('=' .repeat(70));
  
  // Get total count
  const { count: totalCount } = await supabase
    .from('scraped_pages')
    .select('*', { count: 'exact', head: true })
    .eq('domain_id', WRONG_DOMAIN_ID);
  
  console.log(`\n📊 Total pages to migrate: ${totalCount}`);
  console.log(`📦 Batch size: ${BATCH_SIZE} records per update`);
  console.log(`🔄 Estimated batches: ${Math.ceil((totalCount || 0) / BATCH_SIZE)}\n`);
  
  let totalUpdated = 0;
  let batchNumber = 0;
  
  while (true) {
    batchNumber++;
    
    // Get next batch of IDs to update
    const { data: batch, error: fetchError } = await supabase
      .from('scraped_pages')
      .select('id')
      .eq('domain_id', WRONG_DOMAIN_ID)
      .limit(BATCH_SIZE);
    
    if (fetchError) {
      console.log(`❌ Error fetching batch ${batchNumber}:`, fetchError);
      break;
    }
    
    if (!batch || batch.length === 0) {
      console.log('\n✅ No more records to update');
      break;
    }
    
    const ids = batch.map(row => row.id);
    
    // Update this batch
    process.stdout.write(`Batch ${batchNumber}: Updating ${ids.length} records... `);
    
    const { error: updateError, count: updatedCount } = await supabase
      .from('scraped_pages')
      .update({ domain_id: CORRECT_DOMAIN_ID })
      .in('id', ids)
      .select('*', { count: 'exact', head: true });
    
    if (updateError) {
      console.log(`❌ Error: ${updateError.message}`);
      break;
    }
    
    totalUpdated += updatedCount || 0;
    console.log(`✅ Done (Total: ${totalUpdated}/${totalCount})`);
    
    // Small delay to avoid overwhelming the database
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n' + '=' .repeat(70));
  console.log('\n📊 MIGRATION RESULTS:');
  
  // Verify the fix
  const { count: remainingWrong } = await supabase
    .from('scraped_pages')
    .select('*', { count: 'exact', head: true })
    .eq('domain_id', WRONG_DOMAIN_ID);
  
  const { count: correctCount } = await supabase
    .from('scraped_pages')
    .select('*', { count: 'exact', head: true })
    .eq('domain_id', CORRECT_DOMAIN_ID);
  
  const { count: productCount } = await supabase
    .from('scraped_pages')
    .select('*', { count: 'exact', head: true })
    .eq('domain_id', CORRECT_DOMAIN_ID)
    .like('url', '%/product/%');
  
  console.log(`  Pages migrated: ${totalUpdated}`);
  console.log(`  Pages remaining with wrong ID: ${remainingWrong}`);
  console.log(`  Total Thompson's pages now: ${correctCount}`);
  console.log(`  Product pages available: ${productCount}`);
  
  if (remainingWrong === 0) {
    console.log('\n✅ MIGRATION COMPLETE!');
    console.log('\n🎯 IMPACT:');
    console.log('  • All Thompson\'s data is now searchable');
    console.log('  • Synonym expansion will work properly');
    console.log('  • Chat should find products immediately');
    console.log('\n💡 Test the chat now - try "Do you have hydraulic pumps?"');
  } else {
    console.log('\n⚠️ PARTIAL MIGRATION - Run again to complete remaining records');
  }
}

// Run immediately
fixDomainIdInBatches().catch(console.error);