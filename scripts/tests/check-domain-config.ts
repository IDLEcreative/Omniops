/**
 * Check database structure and Thompson's domain configuration
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

async function main() {
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('🔍 Checking database configuration...\n');

  // 1. Check customer_configs for Thompson
  console.log('1️⃣ Checking customer_configs for Thompson:');
  const { data: configs, error: configError } = await supabase
    .from('customer_configs')
    .select('id, domain, subscription_status')
    .ilike('domain', '%thompson%');

  if (configError) {
    console.error('❌ Error:', configError.message);
  } else {
    console.log(JSON.stringify(configs, null, 2));
  }

  // 2. Check if domains table exists
  console.log('\n2️⃣ Checking if domains table exists:');
  const { data: domains, error: domainError } = await supabase
    .from('domains')
    .select('*')
    .limit(3);

  if (domainError) {
    console.log('❌ Error:', domainError.message);
    console.log('   (This table might not exist)');
  } else {
    console.log('✅ Sample domains:');
    console.log(JSON.stringify(domains, null, 2));
  }

  // 3. Check exact match
  console.log('\n3️⃣ Checking exact domain match:');
  const testDomain = 'thompsonspumpsandparts.co.uk';
  const { data: exactMatch, error: exactError } = await supabase
    .from('customer_configs')
    .select('id, domain')
    .eq('domain', testDomain)
    .single();

  if (exactError) {
    console.log(`❌ No exact match for "${testDomain}"`);
    console.log('   Error:', exactError.message);
  } else {
    console.log(`✅ Exact match found for "${testDomain}":`, exactMatch);
  }
}

main().catch(console.error);
