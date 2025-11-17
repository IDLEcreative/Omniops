#!/usr/bin/env npx tsx

/**
 * Update WooCommerce Credentials in Database
 * Encrypts and stores new API credentials
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import { encrypt } from '../../lib/encryption';
import { clearCommerceProviderCache } from '../../lib/agents/commerce-provider';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

interface Args {
  domain?: string;
  key?: string;
  secret?: string;
  url?: string;
}

function parseArgs(): Args {
  const args: Args = {};

  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];

    if (arg === '--domain' && process.argv[i + 1]) {
      args.domain = process.argv[i + 1];
      i++;
    } else if (arg === '--key' && process.argv[i + 1]) {
      args.key = process.argv[i + 1];
      i++;
    } else if (arg === '--secret' && process.argv[i + 1]) {
      args.secret = process.argv[i + 1];
      i++;
    } else if (arg === '--url' && process.argv[i + 1]) {
      args.url = process.argv[i + 1];
      i++;
    }
  }

  return args;
}

async function updateCredentials() {
  console.log('🔐 Update WooCommerce Credentials\n');
  console.log('═'.repeat(60));

  const args = parseArgs();

  // Validate arguments
  if (!args.domain) {
    console.error('❌ Missing --domain argument');
    console.log('\nUsage:');
    console.log('  npx tsx update-woocommerce-credentials.ts \\');
    console.log('    --domain thompsonseparts.co.uk \\');
    console.log('    --key ck_NEW_KEY \\');
    console.log('    --secret cs_NEW_SECRET \\');
    console.log('    [--url https://thompsonseparts.co.uk]');
    process.exit(1);
  }

  if (!args.key || !args.secret) {
    console.error('❌ Missing --key or --secret argument');
    console.log('\nBoth consumer key and secret are required');
    process.exit(1);
  }

  // Validate key formats
  if (!args.key.startsWith('ck_')) {
    console.error('❌ Invalid consumer key format (should start with ck_)');
    process.exit(1);
  }

  if (!args.secret.startsWith('cs_')) {
    console.error('❌ Invalid consumer secret format (should start with cs_)');
    process.exit(1);
  }

  console.log('\n📋 Step 1: Validating input');
  console.log(`   Domain: ${args.domain}`);
  console.log(`   Consumer Key: ${args.key.substring(0, 15)}...`);
  console.log(`   Consumer Secret: ${args.secret.substring(0, 15)}...`);
  console.log(`   URL: ${args.url || '(keep existing)'}`);

  try {
    // Encrypt credentials
    console.log('\n🔒 Step 2: Encrypting credentials...');

    const encryptedKey = encrypt(args.key);
    const encryptedSecret = encrypt(args.secret);

    console.log('   ✅ Credentials encrypted');
    console.log(`   Encrypted Key length: ${encryptedKey.length} chars`);
    console.log(`   Encrypted Secret length: ${encryptedSecret.length} chars`);

    // Connect to database
    console.log('\n📦 Step 3: Connecting to database...');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    console.log('   ✅ Connected');

    // Update database
    console.log('\n💾 Step 4: Updating database...');

    const updateData: any = {
      woocommerce_consumer_key: encryptedKey,
      woocommerce_consumer_secret: encryptedSecret,
    };

    if (args.url) {
      updateData.woocommerce_url = args.url;
    }

    const { data, error } = await supabase
      .from('customer_configs')
      .update(updateData)
      .eq('domain', args.domain)
      .select();

    if (error) {
      console.error('   ❌ Database update failed:', error);
      process.exit(1);
    }

    if (!data || data.length === 0) {
      console.error(`   ❌ No customer config found for domain: ${args.domain}`);
      console.log('\n   Available domains:');
      const { data: allConfigs } = await supabase
        .from('customer_configs')
        .select('domain')
        .limit(10);

      allConfigs?.forEach(config => console.log(`     - ${config.domain}`));
      process.exit(1);
    }

    console.log('   ✅ Database updated');
    console.log(`   Rows updated: ${data.length}`);

    // Clear provider cache
    console.log('\n🗑️  Step 5: Clearing provider cache...');
    clearCommerceProviderCache();
    console.log('   ✅ Cache cleared');

    // Verify update
    console.log('\n🔍 Step 6: Verifying update...');

    const { data: verifyData } = await supabase
      .from('customer_configs')
      .select('domain, woocommerce_url, woocommerce_consumer_key, woocommerce_consumer_secret')
      .eq('domain', args.domain)
      .single();

    if (verifyData) {
      console.log('   ✅ Verification successful');
      console.log('   Domain:', verifyData.domain);
      console.log('   WooCommerce URL:', verifyData.woocommerce_url);
      console.log('   Has encrypted key:', !!verifyData.woocommerce_consumer_key);
      console.log('   Has encrypted secret:', !!verifyData.woocommerce_consumer_secret);
    }

    // Summary
    console.log('\n' + '═'.repeat(60));
    console.log('✅ CREDENTIALS UPDATED SUCCESSFULLY\n');
    console.log('Next Steps:');
    console.log('  1. Test API connection:');
    console.log('     npx tsx diagnose-woocommerce-api.ts');
    console.log('  2. Test product search:');
    console.log('     npx tsx test-provider-database-config.ts');
    console.log('  3. If using .env.local, update those credentials too');

  } catch (error) {
    console.error('\n❌ UPDATE FAILED');
    console.error('Error:', error);
    if (error instanceof Error) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

updateCredentials().catch(console.error);
