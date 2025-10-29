/**
 * Update Thompson's E-Parts WooCommerce Credentials in Database
 * Encrypts and stores the new API credentials using AES-256-GCM
 */

import { createServiceRoleClient } from './lib/supabase-server';
import { encryptWooCommerceConfig } from './lib/encryption';

async function updateThompsonCredentials() {
  console.log('🔐 Updating Thompson\'s E-Parts WooCommerce Credentials\n');

  const supabase = await createServiceRoleClient();

  if (!supabase) {
    console.error('❌ Supabase client not available');
    process.exit(1);
  }

  const domain = 'thompsonseparts.co.uk';

  // New credentials (working as of 2025-10-29)
  const newCredentials = {
    enabled: true,
    url: 'https://www.thompsonseparts.co.uk',
    consumer_key: 'ck_2cc926d1df85a367ef1393fb4b5a1281c37e7f72',
    consumer_secret: 'cs_a99f3ae0f55d74982e3f2071caf65e7abbe1df79'
  };

  console.log('📋 Configuration to encrypt:');
  console.log(`   Domain: ${domain}`);
  console.log(`   URL: ${newCredentials.url}`);
  console.log(`   Consumer Key: ${newCredentials.consumer_key.substring(0, 15)}...`);
  console.log(`   Consumer Secret: ${newCredentials.consumer_secret.substring(0, 15)}...\n`);

  // Encrypt the credentials
  console.log('🔒 Encrypting credentials with AES-256-GCM...');
  const encryptedConfig = encryptWooCommerceConfig(newCredentials);
  console.log('✅ Credentials encrypted successfully\n');

  // Update database
  console.log('💾 Updating database...');
  const { data, error } = await supabase
    .from('customer_configs')
    .update({
      woocommerce_url: encryptedConfig.url,
      woocommerce_consumer_key: encryptedConfig.consumer_key,
      woocommerce_consumer_secret: encryptedConfig.consumer_secret,
      updated_at: new Date().toISOString()
    })
    .eq('domain', domain)
    .select();

  if (error) {
    console.error('❌ Database update failed:', error.message);

    if (error.message.includes('does not exist')) {
      console.log('\n💡 Tip: The customer_configs table may need migration');
      console.log('   Check: docs/SUPABASE_SCHEMA.md for schema information');
    }

    process.exit(1);
  }

  console.log('✅ Database updated successfully!\n');

  // Verify the update
  console.log('🔍 Verifying update...');
  const { data: verifyData, error: verifyError } = await supabase
    .from('customer_configs')
    .select('domain, woocommerce_url, woocommerce_consumer_key, woocommerce_consumer_secret, updated_at')
    .eq('domain', domain)
    .single();

  if (verifyError) {
    console.error('❌ Verification failed:', verifyError.message);
    process.exit(1);
  }

  console.log('✅ Verification successful!');
  console.log('─────────────────────────────────────────────────');
  console.log(`Domain: ${verifyData.domain}`);
  console.log(`URL: ${verifyData.woocommerce_url}`);
  console.log(`Consumer Key: ${verifyData.woocommerce_consumer_key?.substring(0, 20)}... (encrypted)`);
  console.log(`Consumer Secret: ${verifyData.woocommerce_consumer_secret?.substring(0, 20)}... (encrypted)`);
  console.log(`Updated: ${verifyData.updated_at}`);
  console.log('─────────────────────────────────────────────────\n');

  // Test decryption
  console.log('🧪 Testing decryption...');
  const { decryptWooCommerceConfig } = await import('./lib/encryption');

  try {
    const decrypted = decryptWooCommerceConfig({
      enabled: true,
      url: verifyData.woocommerce_url || undefined,
      consumer_key: verifyData.woocommerce_consumer_key || undefined,
      consumer_secret: verifyData.woocommerce_consumer_secret || undefined
    });

    const keyMatch = decrypted.consumer_key === newCredentials.consumer_key;
    const secretMatch = decrypted.consumer_secret === newCredentials.consumer_secret;

    if (keyMatch && secretMatch) {
      console.log('✅ Decryption test passed - credentials match!\n');

      console.log('🎉 Update Complete!');
      console.log('\n📝 Next Steps:');
      console.log('   1. The system will now use database credentials first');
      console.log('   2. Environment variables serve as fallback');
      console.log('   3. Provider cache refreshes every 60 seconds');
      console.log('   4. Test with: curl http://localhost:3000/api/woocommerce/test\n');
    } else {
      console.log('❌ Decryption test failed - credentials do not match');
      console.log(`   Key match: ${keyMatch}`);
      console.log(`   Secret match: ${secretMatch}`);
      process.exit(1);
    }
  } catch (decryptError) {
    console.error('❌ Decryption test failed:', decryptError);
    process.exit(1);
  }
}

updateThompsonCredentials().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
