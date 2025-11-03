/**
 * Switch staging config to use production domain
 *
 * This updates the currently selected staging config to use the production domain,
 * and merges any production-specific data.
 *
 * Usage: npx tsx scripts/database/switch-to-production-domain.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function switchToProduction() {
  const STAGING_CONFIG_ID = 'baf40dcb-65e6-4c33-b912-0022225ff4b1';
  const STAGING_DOMAIN = 'www.epartstaging.wpengine.com';
  const PRODUCTION_DOMAIN = 'www.thompsonseparts.co.uk';

  console.log('🔄 Switching config to production domain...\n');

  // First, check if production domain exists
  const { data: prodConfig } = await supabase
    .from('customer_configs')
    .select('*')
    .eq('domain', PRODUCTION_DOMAIN)
    .maybeSingle();

  if (prodConfig) {
    console.log('✅ Production config already exists:');
    console.log(`   ID: ${prodConfig.id}`);
    console.log(`   Domain: ${prodConfig.domain}`);
    console.log('\n📋 To use this config, select it from the dropdown or delete the staging config.');
    console.log(`\n💡 Tip: The customize page should show this domain: ${PRODUCTION_DOMAIN}`);

    // Check domain in domains table
    const { data: domainRecord } = await supabase
      .from('domains')
      .select('*')
      .eq('domain', 'thompsonseparts.co.uk')
      .maybeSingle();

    if (!domainRecord) {
      console.log('\n⚠️  Creating domain record in domains table...');
      const { error: createError } = await supabase
        .from('domains')
        .insert({
          domain: 'thompsonseparts.co.uk',
          organization_id: prodConfig.organization_id
        });

      if (createError) {
        console.error('❌ Failed to create domain record:', createError.message);
      } else {
        console.log('✅ Domain record created');
      }
    }
    return;
  }

  // Update staging config to production domain
  console.log(`📝 Updating config ${STAGING_CONFIG_ID}...`);
  console.log(`   From: ${STAGING_DOMAIN}`);
  console.log(`   To: ${PRODUCTION_DOMAIN}\n`);

  const { error: updateError } = await supabase
    .from('customer_configs')
    .update({ domain: PRODUCTION_DOMAIN })
    .eq('id', STAGING_CONFIG_ID);

  if (updateError) {
    console.error('❌ Failed to update config:', updateError);
    process.exit(1);
  }

  console.log('✅ Config updated successfully!');

  // Also update domains table
  const { data: oldDomainRecord } = await supabase
    .from('domains')
    .select('*')
    .eq('domain', 'epartstaging.wpengine.com')
    .maybeSingle();

  if (oldDomainRecord) {
    const { error: domainUpdateError } = await supabase
      .from('domains')
      .update({ domain: 'thompsonseparts.co.uk' })
      .eq('id', oldDomainRecord.id);

    if (domainUpdateError) {
      console.log('⚠️  Could not update domains table:', domainUpdateError.message);
    } else {
      console.log('✅ Domains table updated');
    }
  } else {
    // Create new domain record
    const { data: configData } = await supabase
      .from('customer_configs')
      .select('organization_id')
      .eq('id', STAGING_CONFIG_ID)
      .single();

    if (configData) {
      const { error: createError } = await supabase
        .from('domains')
        .insert({
          domain: 'thompsonseparts.co.uk',
          organization_id: configData.organization_id
        });

      if (!createError) {
        console.log('✅ Domain record created');
      }
    }
  }

  console.log('\n✨ Done! Your chat widget will now use www.thompsonseparts.co.uk');
  console.log('🔄 Refresh the customize page to see the changes.');
}

switchToProduction().catch(console.error);
