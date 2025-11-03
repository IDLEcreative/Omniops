/**
 * Auto-Link Customer Configs to Organizations
 *
 * Automatically creates organizations for customer_configs without organization_id.
 * Non-interactive - just runs and fixes.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function autoLinkConfigs() {
  console.log('\n🔗 Auto-Link Customer Configs to Organizations\n');
  console.log('=' .repeat(70));

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Get all customer_configs without organization_id
  const { data: configs, error: configsError } = await supabase
    .from('customer_configs')
    .select('id, domain, business_name, woocommerce_url, organization_id')
    .is('organization_id', null)
    .order('created_at', { ascending: false });

  if (configsError) {
    console.error('❌ Error fetching configs:', configsError);
    return;
  }

  if (!configs || configs.length === 0) {
    console.log('\n✅ All customer configs are already linked to organizations!\n');
    return;
  }

  console.log(`\n⚠️  Found ${configs.length} config(s) without organization_id\n`);

  for (const config of configs) {
    console.log(`\n📦 Processing: "${config.domain}"`);
    console.log(`   Business: ${config.business_name || '(not set)'}`);
    console.log(`   WooCommerce: ${config.woocommerce_url || '(not set)'}`);

    // Generate organization name and slug
    const orgName = config.business_name || config.domain || 'Unnamed Organization';
    const baseSlug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const randomSuffix = Math.random().toString(36).substr(2, 6);
    const orgSlug = `${baseSlug}-${randomSuffix}`;

    // Create organization
    console.log(`   Creating organization: "${orgName}"...`);

    const { data: newOrg, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: orgName,
        slug: orgSlug,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (orgError) {
      console.error(`   ❌ Error creating organization:`, orgError);
      continue;
    }

    console.log(`   ✅ Created organization (ID: ${newOrg.id})`);

    // Link config to organization
    console.log(`   Linking config to organization...`);

    const { error: updateError } = await supabase
      .from('customer_configs')
      .update({ organization_id: newOrg.id })
      .eq('id', config.id);

    if (updateError) {
      console.error(`   ❌ Error linking config:`, updateError);
      continue;
    }

    console.log(`   ✅ Successfully linked!`);
  }

  console.log('\n' + '='.repeat(70));
  console.log('\n🎉 All customer configs now have organizations!\n');

  // Show summary
  const { data: allConfigs } = await supabase
    .from('customer_configs')
    .select('domain, organization_id')
    .order('created_at', { ascending: false });

  if (allConfigs) {
    console.log('📊 Final Status:\n');
    allConfigs.forEach(c => {
      console.log(`   ${c.domain}: ${c.organization_id ? '✅ Linked' : '❌ Not Linked'}`);
    });
  }

  console.log('\n💡 Next Steps:\n');
  console.log('1. The shop page now uses organization-based lookup');
  console.log('2. Users must be members of an organization to see shop data');
  console.log('3. Visit https://omniops.co.uk/dashboard/shop to test\n');

  console.log('=' .repeat(70) + '\n');
}

autoLinkConfigs().catch(console.error);
