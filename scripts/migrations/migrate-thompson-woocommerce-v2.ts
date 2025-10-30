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

    // Step 4: Check current config
    console.log('\n🔍 Step 4: Checking current configuration...');

    const { data: currentConfig } = await supabase
      .from('customer_configs')
      .select('*')
      .eq('domain', domain)
      .single();

    if (currentConfig) {
      console.log('   Current state:');
      console.log('     - woocommerce_url:', currentConfig.woocommerce_url || 'null');
      console.log('     - woocommerce_consumer_key:', currentConfig.woocommerce_consumer_key ? 'set' : 'null');
      console.log('     - woocommerce_consumer_secret:', currentConfig.woocommerce_consumer_secret ? 'set' : 'null');
    }

    // Step 5: Update customer_configs
    console.log('\n💾 Step 5: Updating customer_configs table...');

    const { data, error } = await supabase
      .from('customer_configs')
      .update({
        woocommerce_url: envVars.WOOCOMMERCE_URL,
        woocommerce_consumer_key: encryptedKey,
        woocommerce_consumer_secret: encryptedSecret,
      })
      .eq('domain', domain)
      .select();

    if (error) {
      console.error('❌ Database update failed:', error);
      process.exit(1);
    }

    console.log('✅ Database updated successfully');
    console.log(`   Rows updated: ${data?.length || 0}`);

    // Step 6: Verify the update
    console.log('\n🔍 Step 6: Verifying migration...');

    const { data: verifyData, error: verifyError } = await supabase
      .from('customer_configs')
      .select('domain, woocommerce_url, woocommerce_consumer_key, woocommerce_consumer_secret')
      .eq('domain', domain)
      .single();

    if (verifyError) {
      console.error('❌ Verification failed:', verifyError);
      process.exit(1);
    }

    console.log('✅ Migration verified');
    console.log('   Domain:', verifyData.domain);
    console.log('   WooCommerce URL:', verifyData.woocommerce_url);
    console.log('   Has encrypted key:', !!verifyData.woocommerce_consumer_key);
    console.log('   Has encrypted secret:', !!verifyData.woocommerce_consumer_secret);
    console.log('   Key length:', verifyData.woocommerce_consumer_key?.length, 'chars');

    // Summary
    console.log('\n' + '═'.repeat(60));
    console.log('✅ MIGRATION SUCCESSFUL\n');
    console.log('Summary:');
    console.log('  • Domain: thompsonseparts.co.uk');
    console.log('  • WooCommerce URL configured');
    console.log('  • Credentials encrypted and stored in database');
    console.log('  • Ready for commerce provider to use database config');
    console.log('\n💡 Next: Clear provider cache and test with database config');
    console.log('   Note: Provider needs woocommerce_enabled flag to be set');

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
