#!/usr/bin/env node

/**
 * Migration script to encrypt existing unencrypted credentials in the database
 * 
 * Usage:
 *   npm run migrate:encrypt-credentials
 * 
 * This script will:
 * 1. Connect to your Supabase database
 * 2. Find all customer configs with unencrypted credentials
 * 3. Encrypt the credentials using AES-256-GCM
 * 4. Update the database with encrypted values
 * 5. Provide a summary of the migration
 */

import { createClient } from '@supabase/supabase-js';
import { 
  encrypt, 
  isEncrypted, 
  encryptWooCommerceConfig, 
  encryptShopifyConfig 
} from '../lib/encryption';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Verify required environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'ENCRYPTION_KEY'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

interface CustomerConfig {
  customer_id: string;
  domain: string;
  woocommerce_enabled: boolean;
  woocommerce_url?: string;
  woocommerce_consumer_key?: string;
  woocommerce_consumer_secret?: string;
  shopify_enabled: boolean;
  shopify_domain?: string;
  shopify_access_token?: string;
}

async function migrateCredentials() {
  console.log('🔐 Starting credential encryption migration...\n');

  try {
    // Fetch all customer configurations
    console.log('📊 Fetching customer configurations...');
    const { data: configs, error: fetchError } = await supabase
      .from('customer_configs')
      .select('*');

    if (fetchError) {
      throw new Error(`Failed to fetch configs: ${fetchError.message}`);
    }

    if (!configs || configs.length === 0) {
      console.log('ℹ️  No customer configurations found.');
      return;
    }

    console.log(`Found ${configs.length} customer configuration(s)\n`);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    // Process each configuration
    for (const config of configs as CustomerConfig[]) {
      console.log(`Processing customer: ${config.customer_id} (${config.domain})`);

      try {
        let needsUpdate = false;
        const updates: Partial<CustomerConfig> = {};

        // Check WooCommerce credentials
        if (config.woocommerce_enabled && config.woocommerce_consumer_key) {
          if (!isEncrypted(config.woocommerce_consumer_key)) {
            console.log('  - Encrypting WooCommerce credentials...');
            
            const encrypted = encryptWooCommerceConfig({
              enabled: config.woocommerce_enabled,
              url: config.woocommerce_url,
              consumer_key: config.woocommerce_consumer_key,
              consumer_secret: config.woocommerce_consumer_secret,
            });

            updates.woocommerce_consumer_key = encrypted.consumer_key;
            updates.woocommerce_consumer_secret = encrypted.consumer_secret;
            needsUpdate = true;
          } else {
            console.log('  - WooCommerce credentials already encrypted');
          }
        }

        // Check Shopify credentials
        if (config.shopify_enabled && config.shopify_access_token) {
          if (!isEncrypted(config.shopify_access_token)) {
            console.log('  - Encrypting Shopify credentials...');
            
            const encrypted = encryptShopifyConfig({
              enabled: config.shopify_enabled,
              domain: config.shopify_domain,
              access_token: config.shopify_access_token,
            });

            updates.shopify_access_token = encrypted.access_token;
            needsUpdate = true;
          } else {
            console.log('  - Shopify credentials already encrypted');
          }
        }

        // Update if needed
        if (needsUpdate) {
          const { error: updateError } = await supabase
            .from('customer_configs')
            .update({
              ...updates,
              updated_at: new Date().toISOString()
            })
            .eq('customer_id', config.customer_id);

          if (updateError) {
            throw new Error(`Update failed: ${updateError.message}`);
          }

          console.log('  ✅ Successfully encrypted credentials\n');
          migrated++;
        } else {
          console.log('  ⏭️  No encryption needed\n');
          skipped++;
        }

      } catch (error) {
        console.error(`  ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
        errors++;
      }
    }

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Migration Summary:');
    console.log(`   Total configs: ${configs.length}`);
    console.log(`   ✅ Migrated: ${migrated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (migrated > 0) {
      console.log('\n✨ Migration completed successfully!');
      console.log('   Your credentials are now encrypted with AES-256-GCM.');
    }

    if (errors > 0) {
      console.log('\n⚠️  Some configurations failed to migrate.');
      console.log('   Please check the errors above and retry if needed.');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

// Verify encryption is working before migration
async function verifyEncryption() {
  console.log('🔍 Verifying encryption setup...');
  
  try {
    const testString = 'test_encryption_key';
    const encrypted = encrypt(testString);
    
    if (!isEncrypted(encrypted)) {
      throw new Error('Encryption verification failed');
    }

    console.log('✅ Encryption is working correctly\n');
    return true;
  } catch (error) {
    console.error('❌ Encryption verification failed:', error instanceof Error ? error.message : 'Unknown error');
    console.error('   Please check your ENCRYPTION_KEY environment variable');
    return false;
  }
}

// Main execution
async function main() {
  console.log('🔐 WooCommerce Credentials Encryption Migration');
  console.log('================================================\n');

  // Verify encryption is working
  const encryptionOk = await verifyEncryption();
  if (!encryptionOk) {
    process.exit(1);
  }

  // Confirm before proceeding
  console.log('⚠️  This script will encrypt all unencrypted credentials in your database.');
  console.log('   Make sure you have a backup before proceeding.\n');
  
  // In a production environment, you might want to add a confirmation prompt here
  // For now, we'll proceed automatically after a short delay
  console.log('Starting migration in 3 seconds...\n');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Run migration
  await migrateCredentials();
}

// Run the migration
main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});