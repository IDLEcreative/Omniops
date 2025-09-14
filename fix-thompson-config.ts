#!/usr/bin/env npx tsx
/**
 * FIX: Create customer_config for the orphaned Thompson's data
 * This allows the existing scraped data to be searchable
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ORPHAN_DOMAIN_ID = '8dccd788-1ec1-43c2-af56-78aa3366bad3';
const EXISTING_DOMAIN_ID = '90666cc1-8652-4d0a-aa7d-55a9229f8e2c';

async function fixConfig() {
  console.log('🔧 FIXING THOMPSON\'S CONFIG\n');
  console.log('=' .repeat(70));
  
  // Check current state
  const { data: existingConfig } = await supabase
    .from('customer_configs')
    .select('*')
    .eq('domain', 'thompsonseparts.co.uk')
    .single();
  
  console.log('\n📊 Current Thompson\'s config:');
  console.log(`  ID: ${existingConfig?.id}`);
  console.log(`  Domain: ${existingConfig?.domain}`);
  
  // Check scraped data
  const { count: orphanCount } = await supabase
    .from('scraped_pages')
    .select('*', { count: 'exact', head: true })
    .eq('domain_id', ORPHAN_DOMAIN_ID);
  
  console.log(`\n📦 Orphaned pages (ID ${ORPHAN_DOMAIN_ID}): ${orphanCount}`);
  
  console.log('\n🚀 SOLUTION: Update existing config to use the ID that has data\n');
  
  // Update the existing Thompson's config to use the ID that has all the data
  const { error: updateError } = await supabase
    .from('customer_configs')
    .update({ id: ORPHAN_DOMAIN_ID })
    .eq('id', EXISTING_DOMAIN_ID);
  
  if (updateError) {
    console.log('❌ Error updating config:', updateError);
    
    // Alternative: Delete old and insert new
    console.log('\nTrying alternative approach...');
    
    // First delete the existing config
    const { error: deleteError } = await supabase
      .from('customer_configs')
      .delete()
      .eq('id', EXISTING_DOMAIN_ID);
    
    if (deleteError) {
      console.log('❌ Error deleting old config:', deleteError);
      return;
    }
    
    // Copy the config data but with new ID
    const newConfig = {
      ...existingConfig,
      id: ORPHAN_DOMAIN_ID
    };
    
    // Insert with the orphan ID
    const { error: insertError } = await supabase
      .from('customer_configs')
      .insert(newConfig);
    
    if (insertError) {
      console.log('❌ Error creating new config:', insertError);
      return;
    }
    
    console.log('✅ Successfully created new config with correct ID');
  } else {
    console.log('✅ Successfully updated config ID');
  }
  
  // Verify the fix
  const { data: fixedConfig } = await supabase
    .from('customer_configs')
    .select('id, domain')
    .eq('domain', 'thompsonseparts.co.uk')
    .single();
  
  console.log('\n📊 AFTER FIX:');
  console.log(`  Config ID: ${fixedConfig?.id}`);
  console.log(`  Domain: ${fixedConfig?.domain}`);
  
  // Check if data is now accessible
  const { count: productCount } = await supabase
    .from('scraped_pages')
    .select('*', { count: 'exact', head: true })
    .eq('domain_id', fixedConfig?.id)
    .like('url', '%/product/%');
  
  if (fixedConfig?.id === ORPHAN_DOMAIN_ID) {
    console.log('\n✅ SUCCESS!');
    console.log(`  • ${orphanCount} Thompson's pages now linked to config`);
    console.log(`  • ${productCount} product pages available`);
    console.log('\n🎯 The chat should now find Thompson\'s products!');
    console.log('💡 Test it: "Do you have hydraulic pumps?"');
  } else {
    console.log('\n⚠️ Config update may have failed');
  }
}

fixConfig().catch(console.error);