#!/usr/bin/env npx tsx

/**
 * Migrate Thompson's WooCommerce Credentials to Database
 * Encrypts credentials and stores them in customer_configs table
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import { encrypt } from './lib/encryption';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

async function migrateThompsonCredentials() {
  console.log('🔐 Migrating Thompson\'s WooCommerce Credentials to Database\n');
  console.log('═'.repeat(60));

  const domain = 'thompsonseparts.co.uk';

  // Step 1: Verify environment variables
  console.log('\n📋 Step 1: Verifying environment variables...');

  const envVars = {
    WOOCOMMERCE_URL: process.env.WOOCOMMERCE_URL,
    WOOCOMMERCE_CONSUMER_KEY: process.env.WOOCOMMERCE_CONSUMER_KEY,
    WOOCOMMERCE_CONSUMER_SECRET: process.env.WOOCOMMERCE_CONSUMER_SECRET,
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
  };

  const missing = Object.entries(envVars).filter(([_, v]) => !v).map(([k]) => k);

  if (missing.length > 0) {
    console.error('❌ Missing environment variables:', missing.join(', '));
    process.exit(1);
  }

  console.log('✅ All required environment variables present');
  console.log(`   WooCommerce URL: ${envVars.WOOCOMMERCE_URL}`);
  console.log(`   Consumer Key: ${envVars.WOOCOMMERCE_CONSUMER_KEY?.substring(0, 10)}...`);
  console.log(`   Encryption Key: ${envVars.ENCRYPTION_KEY?.length} chars`);

  // Step 2: Encrypt credentials
  console.log('\n🔒 Step 2: Encrypting credentials...');

  try {
    const encryptedKey = encrypt(envVars.WOOCOMMERCE_CONSUMER_KEY!);
    const encryptedSecret = encrypt(envVars.WOOCOMMERCE_CONSUMER_SECRET!);

    console.log('✅ Credentials encrypted successfully');
    console.log(`   Encrypted Key length: ${encryptedKey.length} chars`);
    console.log(`   Encrypted Secret length: ${encryptedSecret.length} chars`);

    // Step 3: Connect to Supabase
    console.log('\n📦 Step 3: Connecting to Supabase...');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    console.log('✅ Connected to Supabase');

    // Step 4: Update customer_configs
    console.log('\n💾 Step 4: Updating customer_configs table...');

    const { data, error } = await supabase
      .from('customer_configs')
      .update({
        woocommerce_enabled: true,
        woocommerce_url: envVars.WOOCOMMERCE_URL,
        woocommerce_consumer_key_encrypted: encryptedKey,
        woocommerce_consumer_secret_encrypted: encryptedSecret,
      })
      .eq('domain', domain)
      .select();

    if (error) {
      console.error('❌ Database update failed:', error);
      process.exit(1);
    }

    console.log('✅ Database updated successfully');
    console.log(`   Rows updated: ${data?.length || 0}`);

    // Step 5: Verify the update
    console.log('\n🔍 Step 5: Verifying migration...');

    const { data: verifyData, error: verifyError } = await supabase
      .from('customer_configs')
      .select('domain, woocommerce_enabled, woocommerce_url, woocommerce_consumer_key_encrypted, woocommerce_consumer_secret_encrypted')
      .eq('domain', domain)
      .single();

    if (verifyError) {
      console.error('❌ Verification failed:', verifyError);
      process.exit(1);
    }

    console.log('✅ Migration verified');
    console.log('   Domain:', verifyData.domain);
    console.log('   WooCommerce Enabled:', verifyData.woocommerce_enabled);
    console.log('   WooCommerce URL:', verifyData.woocommerce_url);
    console.log('   Has encrypted key:', !!verifyData.woocommerce_consumer_key_encrypted);
    console.log('   Has encrypted secret:', !!verifyData.woocommerce_consumer_secret_encrypted);

    // Summary
    console.log('\n' + '═'.repeat(60));
    console.log('✅ MIGRATION SUCCESSFUL\n');
    console.log('Summary:');
    console.log('  • Domain: thompsonseparts.co.uk');
    console.log('  • WooCommerce enabled: true');
    console.log('  • Credentials encrypted and stored');
    console.log('  • Database config active');
    console.log('\n💡 Next: Test commerce provider with database config');

  } catch (error) {
    console.error('\n❌ MIGRATION FAILED');
    console.error('Error:', error);
    if (error instanceof Error) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

// Run migration
migrateThompsonCredentials().catch(console.error);
