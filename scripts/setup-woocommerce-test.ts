import { createServiceRoleClient } from './lib/supabase/server';
import { encrypt } from './lib/encryption';

// Set up encryption key if not already set
if (!process.env.ENCRYPTION_KEY) {
  process.env.ENCRYPTION_KEY = 'test_encryption_key_32_chars_00'; // 32 chars for testing
}

async function setupWooCommerceConfig() {
  console.log('🔧 Setting up WooCommerce configuration for testing...');
  
  const supabase = await createServiceRoleClient();
  
  // Configuration for the test store
  const testDomain = 'thompsonseparts.co.uk';
  const config = {
    domain: testDomain,
    business_name: "Thompson's E-Parts",
    greeting_message: "Hello! Welcome to Thompson's E-Parts. How can I help you today?",
    primary_color: '#2C3E50',
    chat_enabled: true,
    woocommerce_enabled: true,
    woocommerce_url: process.env.WOOCOMMERCE_URL!,
    woocommerce_consumer_key: encrypt(process.env.WOOCOMMERCE_CONSUMER_KEY!),
    woocommerce_consumer_secret: encrypt(process.env.WOOCOMMERCE_CONSUMER_SECRET!),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    // Check if configuration already exists
    const { data: existing } = await supabase
      .from('customer_configs')
      .select('id')
      .eq('domain', testDomain)
      .single();

    if (existing) {
      // Update existing configuration
      const { data, error } = await supabase
        .from('customer_configs')
        .update({
          woocommerce_enabled: config.woocommerce_enabled,
          woocommerce_url: config.woocommerce_url,
          woocommerce_consumer_key: config.woocommerce_consumer_key,
          woocommerce_consumer_secret: config.woocommerce_consumer_secret,
          updated_at: config.updated_at,
        })
        .eq('domain', testDomain)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating configuration:', error);
        return;
      }

      console.log('✅ Updated WooCommerce configuration for:', testDomain);
    } else {
      // Insert new configuration
      const { data, error } = await supabase
        .from('customer_configs')
        .insert(config)
        .select()
        .single();

      if (error) {
        console.error('❌ Error inserting configuration:', error);
        return;
      }

      console.log('✅ Created WooCommerce configuration for:', testDomain);
    }

    console.log('📦 Configuration ready for domain:', testDomain);
    console.log('🔐 Credentials are encrypted and stored securely');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

// Run the setup
setupWooCommerceConfig();