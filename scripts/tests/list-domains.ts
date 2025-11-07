#!/usr/bin/env tsx
/**
 * List all domains registered in the database
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  console.log('\n📋 Checking domains table...\n');

  const { data: domains, error: domainsError } = await supabase
    .from('domains')
    .select('id, domain, name, active')
    .limit(20);

  if (domainsError) {
    console.log('❌ Error querying domains table:', domainsError.message);
  } else {
    console.log(`✅ Found ${domains?.length || 0} domains in 'domains' table:\n`);
    domains?.forEach((d, i) => {
      console.log(`${i + 1}. ${d.domain} (${d.name || 'No name'})`);
      console.log(`   ID: ${d.id}`);
      console.log(`   Active: ${d.active ? 'Yes' : 'No'}\n`);
    });
  }

  console.log('\n📋 Checking customer_configs table...\n');

  const { data: configs, error: configsError } = await supabase
    .from('customer_configs')
    .select('id, domain, business_name, active')
    .limit(20);

  if (configsError) {
    console.log('❌ Error querying customer_configs:', configsError.message);
  } else {
    console.log(`✅ Found ${configs?.length || 0} domains in 'customer_configs' table:\n`);
    configs?.forEach((c, i) => {
      console.log(`${i + 1}. ${c.domain} (${c.business_name || 'No business name'})`);
      console.log(`   ID: ${c.id}`);
      console.log(`   Active: ${c.active ? 'Yes' : 'No'}\n`);
    });
  }
}

main().catch(console.error);
