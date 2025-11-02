#!/usr/bin/env npx tsx
/**
 * Fix Customer Domain Configuration
 * Updates staging domain to production domain in customer_configs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const STAGING_DOMAIN = 'epartstaging.wpengine.com';
const PRODUCTION_DOMAIN = 'www.thompsonseparts.co.uk';

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  console.log('🔍 Checking customer_configs...\n');

  // Get all customer configs
  const { data: configs, error } = await supabase
    .from('customer_configs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching configs:', error);
    return;
  }

  console.log(`Found ${configs.length} customer config(s):\n`);

  configs.forEach((config, i) => {
    console.log(`${i + 1}. Domain: ${config.domain}`);
    console.log(`   ID: ${config.id}`);
    console.log(`   Business: ${config.business_name || 'N/A'}`);
    console.log(`   Created: ${config.created_at}`);
    console.log('');
  });

  // Check if production domain exists
  const prodConfig = configs.find(c => c.domain === PRODUCTION_DOMAIN);
  const stagingConfig = configs.find(c => c.domain === STAGING_DOMAIN);

  if (prodConfig) {
    console.log(`✅ Production domain (${PRODUCTION_DOMAIN}) already exists!`);
    console.log(`   Config ID: ${prodConfig.id}\n`);
  } else if (stagingConfig) {
    console.log(`⚠️  Staging domain found: ${STAGING_DOMAIN}`);
    console.log(`   Updating to production domain: ${PRODUCTION_DOMAIN}\n`);

    const { error: updateError } = await supabase
      .from('customer_configs')
      .update({ domain: PRODUCTION_DOMAIN })
      .eq('id', stagingConfig.id);

    if (updateError) {
      console.error('❌ Error updating domain:', updateError);
    } else {
      console.log('✅ Successfully updated domain to production!\n');
    }
  } else {
    console.log(`❌ No config found for either domain.`);
    console.log(`   You need to create a customer_config for ${PRODUCTION_DOMAIN}\n`);
  }

  // Show final state
  console.log('📊 Final Configuration:');
  const { data: finalConfigs } = await supabase
    .from('customer_configs')
    .select('domain, id, business_name')
    .order('created_at', { ascending: false });

  finalConfigs?.forEach((config, i) => {
    console.log(`${i + 1}. ${config.domain} (${config.business_name || 'No name'})`);
  });
}

main().catch(console.error);
