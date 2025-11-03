/**
 * Link Customer Configs to Organizations
 *
 * This script ensures all customer_configs have an organization_id set.
 * For configs without organization_id, it will:
 * 1. Find or create an organization for that config
 * 2. Link the config to the organization
 *
 * This is necessary after migrating from domain-based to organization-based lookup.
 */

import { createClient } from '@supabase/supabase-js';
import * as readline from 'readline';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function linkConfigsToOrganizations() {
  console.log('\n🔗 Link Customer Configs to Organizations\n');
  console.log('=' .repeat(70));

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // 1. Get all customer_configs
  const { data: configs, error: configsError } = await supabase
    .from('customer_configs')
    .select('id, domain, organization_id, business_name, woocommerce_url')
    .order('created_at', { ascending: false });

  if (configsError) {
    console.error('❌ Error fetching configs:', configsError);
    return;
  }

  if (!configs || configs.length === 0) {
    console.log('❌ No customer configurations found.\n');
    return;
  }

  console.log(`\n📋 Found ${configs.length} customer configuration(s):\n`);

  const configsWithoutOrg = configs.filter(c => !c.organization_id);
  const configsWithOrg = configs.filter(c => c.organization_id);

  console.log(`✅ ${configsWithOrg.length} configs already linked to organizations`);
  console.log(`⚠️  ${configsWithoutOrg.length} configs without organization_id\n`);

  if (configsWithoutOrg.length === 0) {
    console.log('🎉 All configs are already linked to organizations!\n');
    rl.close();
    return;
  }

  console.log('Configs needing organization link:\n');
  configsWithoutOrg.forEach((config, i) => {
    console.log(`${i + 1}. Domain: "${config.domain}"`);
    console.log(`   Business: ${config.business_name || '(not set)'}`);
    console.log(`   WooCommerce: ${config.woocommerce_url || '(not set)'}\n`);
  });

  console.log('=' .repeat(70));
  console.log('\n🤔 How to handle configs without organization_id?\n');
  console.log('Option 1: Create new organization for each config (recommended)');
  console.log('Option 2: Link all to a single existing organization');
  console.log('Option 3: Exit and manually assign organizations\n');

  const choice = await question('Choose option (1/2/3): ');

  if (choice === '3') {
    console.log('\n❌ Cancelled. No changes made.\n');
    rl.close();
    return;
  }

  if (choice === '1') {
    // Create new organization for each config
    console.log('\n📦 Creating organizations for each config...\n');

    for (const config of configsWithoutOrg) {
      const orgName = config.business_name || config.domain || 'Unnamed Organization';
      const orgSlug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substr(2, 6);

      // Create organization
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
        console.error(`❌ Error creating organization for ${config.domain}:`, orgError);
        continue;
      }

      console.log(`✅ Created organization: ${orgName} (${newOrg.id})`);

      // Link config to organization
      const { error: updateError } = await supabase
        .from('customer_configs')
        .update({ organization_id: newOrg.id })
        .eq('id', config.id);

      if (updateError) {
        console.error(`❌ Error linking config to organization:`, updateError);
        continue;
      }

      console.log(`   ✅ Linked config "${config.domain}" to organization\n`);
    }

    console.log('=' .repeat(70));
    console.log('\n🎉 All configs have been linked to organizations!\n');

  } else if (choice === '2') {
    // Link all to single organization
    console.log('\n📋 Available organizations:\n');

    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('id, name, slug')
      .order('created_at', { ascending: false });

    if (orgsError || !orgs || orgs.length === 0) {
      console.log('❌ No organizations found. Please create one first.\n');
      rl.close();
      return;
    }

    orgs.forEach((org, i) => {
      console.log(`${i + 1}. ${org.name} (${org.slug})`);
      console.log(`   ID: ${org.id}\n`);
    });

    const orgIndex = await question('Select organization number: ');
    const selectedOrg = orgs[parseInt(orgIndex) - 1];

    if (!selectedOrg) {
      console.log('\n❌ Invalid selection.\n');
      rl.close();
      return;
    }

    console.log(`\n🔗 Linking all configs to "${selectedOrg.name}"...\n`);

    for (const config of configsWithoutOrg) {
      const { error: updateError } = await supabase
        .from('customer_configs')
        .update({ organization_id: selectedOrg.id })
        .eq('id', config.id);

      if (updateError) {
        console.error(`❌ Error linking ${config.domain}:`, updateError);
        continue;
      }

      console.log(`✅ Linked "${config.domain}" to organization`);
    }

    console.log('\n=' .repeat(70));
    console.log('\n🎉 All configs have been linked!\n');
  }

  console.log('💡 Next Steps:\n');
  console.log('1. Visit https://omniops.co.uk/dashboard/shop');
  console.log('2. If you still see "No platforms connected", check:');
  console.log('   - You are logged in');
  console.log('   - Your user is a member of an organization');
  console.log('   - That organization has WooCommerce configured\n');

  console.log('=' .repeat(70) + '\n');

  rl.close();
}

linkConfigsToOrganizations().catch((error) => {
  console.error('Error:', error);
  rl.close();
});
