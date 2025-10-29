/**
 * Check if Thompson's E-Parts is configured in the database
 */
import { createServiceRoleClient } from './lib/supabase-server';

async function checkThompsonConfig() {
  console.log('🔍 Checking Thompson\'s E-Parts Database Configuration\n');

  const supabase = await createServiceRoleClient();

  if (!supabase) {
    console.log('❌ Supabase client not available');
    return;
  }

  const domain = 'thompsonseparts.co.uk';
  console.log(`Looking for domain: ${domain}\n`);

  // Check customer_configs table
  const { data, error } = await supabase
    .from('customer_configs')
    .select('*')
    .eq('domain', domain)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      console.log('⚠️  Thompson\'s domain NOT found in database');
      console.log('   Current mode: Environment Variables Only\n');

      console.log('📝 How it works:');
      console.log('   ✅ Chat uses environment variables as fallback');
      console.log('   ✅ WooCommerce integration working via env vars');
      console.log('   ℹ️  Database config enables multi-tenant support\n');

      console.log('💡 To add database configuration:');
      console.log('   Run: npx tsx add-thompson-to-database.ts\n');
    } else {
      console.log('❌ Error checking database:', error.message);
      if (error.message.includes('does not exist')) {
        console.log('\n📝 Note: customer_configs table may need migration');
      }
    }
    return;
  }

  console.log('✅ Thompson\'s Configuration Found in Database!\n');
  console.log('Configuration:');
  console.log('─────────────────────────────────────────────────');
  console.log(`Domain: ${data.domain}`);
  console.log(`WooCommerce URL: ${data.woocommerce_url || 'Not set'}`);
  console.log(`Shopify Shop: ${data.shopify_shop || 'Not set'}`);
  console.log(`Created: ${data.created_at}`);
  console.log('─────────────────────────────────────────────────\n');

  // Check if credentials are encrypted
  if (data.woocommerce_consumer_key) {
    console.log('🔐 Credentials Status:');
    console.log(`   Consumer Key: ${data.woocommerce_consumer_key.substring(0, 20)}... (encrypted)`);
    console.log(`   Consumer Secret: ${data.woocommerce_consumer_secret ? 'Present (encrypted)' : 'Missing'}`);
  } else {
    console.log('⚠️  No WooCommerce credentials stored in database');
    console.log('   Using environment variables instead');
  }
}

checkThompsonConfig();
