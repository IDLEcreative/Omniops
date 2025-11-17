/**
 * Update Thompson's E Parts WooCommerce Credentials
 * One-time script to update with valid API keys
 */

import { encryptWooCommerceConfig } from '../lib/encryption/index.js';
import { createServiceRoleClient } from '../lib/supabase-server.js';

async function updateCredentials() {
  console.log('🔐 Encrypting WooCommerce credentials...');

  const newCredentials = {
    enabled: true,
    url: 'https://www.thompsonseparts.co.uk',
    consumer_key: 'ck_2cc926d1df85a367ef1393fb4b5a1281c37e7f72',
    consumer_secret: 'cs_a99f3ae0f55d74982e3f2071caf65e7abbe1df79'
  };

  const encrypted = encryptWooCommerceConfig(newCredentials);

  console.log('✅ Credentials encrypted');
  console.log('📦 Updating database...');

  const supabase = await createServiceRoleClient();

  if (!supabase) {
    throw new Error('Failed to create Supabase client');
  }

  // Update both domain entries (with and without www)
  const domains = ['www.thompsonseparts.co.uk', 'thompsonseparts.co.uk'];

  for (const domain of domains) {
    const { error } = await supabase
      .from('customer_configs')
      .update({
        woocommerce_url: 'https://www.thompsonseparts.co.uk',
        woocommerce_consumer_key: encrypted.consumer_key,
        woocommerce_consumer_secret: encrypted.consumer_secret
      })
      .eq('domain', domain);

    if (error) {
      console.error(`❌ Failed to update ${domain}:`, error);
    } else {
      console.log(`✅ Updated credentials for ${domain}`);
    }
  }

  console.log('\n✨ Credentials updated successfully!');
  console.log('🧪 You can now test the WooCommerce integration');
}

updateCredentials().catch(console.error);
