/**
 * Setup Test Domain for E2E Testing
 *
 * Creates a minimal test domain in the database so E2E tests can run
 * without requiring full production configuration.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const TEST_DOMAIN = 'test-sku-lookup.local';
const TEST_EMAIL = 'test@sku-lookup.local';

async function setupTestDomain() {
  console.log('🔧 Setting up test domain for E2E testing...\n');

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables');
    console.error('   Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Check if test domain already exists
  const { data: existing } = await supabase
    .from('customer_configs')
    .select('id, domain')
    .eq('domain', TEST_DOMAIN)
    .single();

  if (existing) {
    console.log(`✅ Test domain already exists: ${TEST_DOMAIN}`);
    console.log(`   Domain ID: ${existing.id}\n`);
    return existing.id;
  }

  // Create test domain
  console.log(`📝 Creating test domain: ${TEST_DOMAIN}...`);

  const { data: domain, error } = await supabase
    .from('customer_configs')
    .insert({
      domain: TEST_DOMAIN,
      contact_email: TEST_EMAIL,
      subscription_status: 'trial',
      features: {
        websiteScraping: { enabled: false },
        woocommerce: { enabled: false }
      }
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Failed to create test domain:', error.message);
    process.exit(1);
  }

  console.log(`✅ Test domain created successfully`);
  console.log(`   Domain ID: ${domain.id}`);
  console.log(`   Domain: ${domain.domain}\n`);

  console.log('🎉 Setup complete! You can now run E2E tests.');
  console.log(`   Test domain: ${TEST_DOMAIN}\n`);

  return domain.id;
}

setupTestDomain().catch(console.error);
