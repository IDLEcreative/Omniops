/**
 * Check organization IDs for all customer configs
 *
 * Usage: npx tsx scripts/database/check-org-ids.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkOrgIds() {
  console.log('🔍 Checking organization IDs for customer configs...\n');

  const { data: configs, error } = await supabase
    .from('customer_configs')
    .select('id, domain, business_name, organization_id')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching configs:', error);
    process.exit(1);
  }

  if (!configs || configs.length === 0) {
    console.log('ℹ️  No configurations found');
    return;
  }

  console.log(`✅ Found ${configs.length} configuration(s):\n`);

  // Group by organization_id
  const grouped = configs.reduce((acc: any, config) => {
    const orgId = config.organization_id || 'NULL';
    if (!acc[orgId]) acc[orgId] = [];
    acc[orgId].push(config);
    return acc;
  }, {});

  for (const [orgId, orgConfigs] of Object.entries(grouped) as [string, any[]][]) {
    console.log(`Organization ID: ${orgId === 'NULL' ? '❌ NULL' : orgId}`);
    orgConfigs.forEach((config: any) => {
      console.log(`  - ${config.domain} (${config.business_name || 'Unnamed'})`);
      console.log(`    ID: ${config.id}`);
    });
    console.log('');
  }

  // Check staging config specifically
  const stagingConfig = configs.find(c => c.domain === 'www.epartstaging.wpengine.com');
  if (stagingConfig) {
    console.log(`\n🎯 Staging config organization_id: ${stagingConfig.organization_id || 'NULL'}`);

    // Find which other configs share this org_id
    const sameOrgConfigs = configs.filter(c =>
      c.organization_id && c.organization_id === stagingConfig.organization_id
    );
    console.log(`   Other configs with same org_id: ${sameOrgConfigs.length - 1}`);
    sameOrgConfigs.forEach(c => {
      if (c.id !== stagingConfig.id) {
        console.log(`     - ${c.domain}`);
      }
    });
  }
}

checkOrgIds().catch(console.error);
