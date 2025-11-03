/**
 * Update customer config domain from staging to production
 *
 * Usage: npx tsx scripts/database/update-domain.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateDomain() {
  console.log('🔍 Looking for customer configs with staging domain...\n');

  // Find configs with staging domain
  const { data: configs, error: searchError } = await supabase
    .from('customer_configs')
    .select('*')
    .eq('domain', 'www.epartstaging.wpengine.com');

  if (searchError) {
    console.error('❌ Error searching for configs:', searchError);
    process.exit(1);
  }

  if (!configs || configs.length === 0) {
    console.log('ℹ️  No configs found with staging domain');

    // Check if production domain already exists
    const { data: prodConfigs } = await supabase
      .from('customer_configs')
      .select('*')
      .eq('domain', 'www.thompsonseparts.co.uk');

    if (prodConfigs && prodConfigs.length > 0) {
      console.log('✅ Production domain already configured:');
      console.log(JSON.stringify(prodConfigs, null, 2));
    }
    return;
  }

  console.log(`📋 Found ${configs.length} config(s):`);
  configs.forEach(config => {
    console.log(`  - ID: ${config.id}`);
    console.log(`    Domain: ${config.domain}`);
    console.log(`    Business: ${config.business_name || 'N/A'}`);
  });

  console.log('\n🔄 Updating domain to www.thompsonseparts.co.uk...\n');

  // Update each config
  for (const config of configs) {
    const { error: updateError } = await supabase
      .from('customer_configs')
      .update({ domain: 'www.thompsonseparts.co.uk' })
      .eq('id', config.id);

    if (updateError) {
      console.error(`❌ Error updating config ${config.id}:`, updateError);
    } else {
      console.log(`✅ Updated config ${config.id}`);
    }
  }

  // Also update the domains table if it exists
  console.log('\n🔄 Checking domains table...\n');

  const { data: domainRecord, error: domainSearchError } = await supabase
    .from('domains')
    .select('*')
    .eq('domain', 'epartstaging.wpengine.com')
    .maybeSingle();

  if (domainSearchError) {
    console.log('ℹ️  Domains table search error (may not exist):', domainSearchError.message);
  } else if (domainRecord) {
    const { error: domainUpdateError } = await supabase
      .from('domains')
      .update({ domain: 'thompsonseparts.co.uk' })
      .eq('id', domainRecord.id);

    if (domainUpdateError) {
      console.error('❌ Error updating domains table:', domainUpdateError);
    } else {
      console.log('✅ Updated domains table');
    }
  } else {
    // Create new domain record
    console.log('📝 Creating new domain record...');
    const { error: createError } = await supabase
      .from('domains')
      .insert({ domain: 'thompsonseparts.co.uk' });

    if (createError) {
      console.log('ℹ️  Could not create domain record:', createError.message);
    } else {
      console.log('✅ Created domain record');
    }
  }

  console.log('\n✨ Done! Domain updated successfully.');
}

updateDomain().catch(console.error);
