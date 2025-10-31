#!/usr/bin/env tsx
/**
 * Credential Migration Script
 *
 * Migrates WooCommerce and Shopify credentials from individual encrypted
 * TEXT columns to the consolidated encrypted_credentials JSONB column.
 *
 * This script:
 * 1. Reads existing credentials from individual columns
 * 2. Decrypts them using the current encryption system
 * 3. Consolidates them into a single EncryptedCredentials object
 * 4. Re-encrypts using the new consolidated format
 * 5. Stores in the encrypted_credentials column
 *
 * Safety:
 * - Keeps legacy columns intact (backward compatible)
 * - Validates decryption before writing
 * - Idempotent (safe to run multiple times)
 * - Dry-run mode for testing
 *
 * Usage:
 *   npx tsx scripts/database/migrate-credentials-to-encrypted.ts [--dry-run]
 */

import { createClient } from '@supabase/supabase-js';
import {
  decryptWooCommerceConfig,
  decryptShopifyConfig,
  encryptCredentials,
} from '../../lib/encryption';
import type { EncryptedCredentials } from '../../types/encrypted-credentials';

// Parse command line args
const isDryRun = process.argv.includes('--dry-run');

interface CustomerConfig {
  id: string;
  domain: string;
  woocommerce_url?: string;
  woocommerce_consumer_key?: string;
  woocommerce_consumer_secret?: string;
  shopify_shop?: string;
  shopify_access_token?: string;
  encrypted_credentials?: string;
}

async function migrateCredentials() {
  console.log('🔐 Credential Migration Script');
  console.log('================================\n');

  if (isDryRun) {
    console.log('⚠️  DRY RUN MODE - No changes will be made\n');
  }

  // Validate environment
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL not set');
    process.exit(1);
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY not set');
    process.exit(1);
  }

  if (!process.env.ENCRYPTION_KEY) {
    console.error('❌ Error: ENCRYPTION_KEY not set');
    process.exit(1);
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Fetch all configs with credentials in legacy format
  console.log('📊 Fetching customer configurations...\n');
  const { data: configs, error } = await supabase
    .from('customer_configs')
    .select('id, domain, woocommerce_url, woocommerce_consumer_key, woocommerce_consumer_secret, shopify_shop, shopify_access_token, encrypted_credentials')
    .or('woocommerce_consumer_key.not.is.null,shopify_access_token.not.is.null');

  if (error) {
    console.error('❌ Error fetching configs:', error);
    process.exit(1);
  }

  if (!configs || configs.length === 0) {
    console.log('✅ No configurations with legacy credentials found');
    return;
  }

  console.log(`📦 Found ${configs.length} configuration(s) to process\n`);

  let migrated = 0;
  let skipped = 0;
  let failed = 0;
  const failures: Array<{ domain: string; error: string }> = [];

  for (const config of configs as CustomerConfig[]) {
    console.log(`\n🔄 Processing: ${config.domain}`);

    // Skip if already has new format
    if (config.encrypted_credentials) {
      console.log(`   ⏭️  Already migrated (encrypted_credentials exists)`);
      skipped++;
      continue;
    }

    // Build credential object from legacy columns
    const credentials: EncryptedCredentials = {};
    let hasCredentials = false;

    try {
      // Migrate WooCommerce credentials
      if (config.woocommerce_consumer_key) {
        console.log('   📦 Found WooCommerce credentials');
        const decrypted = decryptWooCommerceConfig({
          enabled: true,
          url: config.woocommerce_url,
          consumer_key: config.woocommerce_consumer_key,
          consumer_secret: config.woocommerce_consumer_secret,
        });

        if (decrypted.consumer_key && decrypted.consumer_secret) {
          credentials.woocommerce = {
            consumer_key: decrypted.consumer_key,
            consumer_secret: decrypted.consumer_secret,
            store_url: decrypted.url || '',
          };
          hasCredentials = true;
          console.log('   ✅ WooCommerce credentials decrypted successfully');
        }
      }

      // Migrate Shopify credentials
      if (config.shopify_access_token) {
        console.log('   📦 Found Shopify credentials');
        const decrypted = decryptShopifyConfig({
          enabled: true,
          domain: config.shopify_shop,
          access_token: config.shopify_access_token,
        });

        if (decrypted.access_token) {
          credentials.shopify = {
            access_token: decrypted.access_token,
            store_url: decrypted.domain || '',
          };
          hasCredentials = true;
          console.log('   ✅ Shopify credentials decrypted successfully');
        }
      }

      if (!hasCredentials) {
        console.log('   ⚠️  No valid credentials found');
        skipped++;
        continue;
      }

      // Encrypt consolidated credentials
      const encryptedCredentialsJson = encryptCredentials(credentials);

      // Validate encryption worked
      if (!encryptedCredentialsJson) {
        throw new Error('Encryption returned empty string');
      }

      console.log('   🔐 Credentials consolidated and encrypted');

      // Write to database (unless dry run)
      if (!isDryRun) {
        const { error: updateError } = await supabase
          .from('customer_configs')
          .update({ encrypted_credentials: encryptedCredentialsJson })
          .eq('id', config.id);

        if (updateError) {
          throw updateError;
        }

        console.log('   💾 Saved to database');
      } else {
        console.log('   💾 Would save to database (dry run)');
      }

      migrated++;
      console.log(`   ✅ Migration successful`);

    } catch (error: any) {
      failed++;
      const errorMsg = error.message || String(error);
      failures.push({ domain: config.domain, error: errorMsg });
      console.error(`   ❌ Migration failed: ${errorMsg}`);
    }
  }

  // Summary
  console.log('\n\n📊 Migration Summary');
  console.log('====================');
  console.log(`✅ Migrated: ${migrated}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📦 Total: ${configs.length}`);

  if (failures.length > 0) {
    console.log('\n❌ Failed Migrations:');
    failures.forEach(({ domain, error }) => {
      console.log(`   • ${domain}: ${error}`);
    });
  }

  if (isDryRun) {
    console.log('\n⚠️  This was a dry run. Re-run without --dry-run to apply changes.');
  } else if (migrated > 0) {
    console.log('\n✅ Migration complete! Legacy columns have been preserved for backward compatibility.');
    console.log('   You can verify the migration by checking the encrypted_credentials column.');
  }

  // Exit with error if any failed
  if (failed > 0) {
    process.exit(1);
  }
}

// Run migration
migrateCredentials().catch((error) => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
