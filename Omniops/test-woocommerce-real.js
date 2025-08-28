// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

// Set up encryption key if not already set
if (!process.env.ENCRYPTION_KEY) {
  process.env.ENCRYPTION_KEY = 'your_32_character_encryption_key'; // 32 chars for testing
}

// Encryption functions
const crypto = require('crypto');

function encrypt(text) {
  if (!text) return '';
  
  const key = Buffer.from(process.env.ENCRYPTION_KEY, 'utf8');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  const encrypted = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final()
  ]);
  
  const tag = cipher.getAuthTag();
  const combined = Buffer.concat([iv, tag, encrypted]);
  
  return combined.toString('base64');
}

async function setupAndTestWooCommerce() {
  console.log('🔧 Setting up WooCommerce configuration for testing...');
  
  // Create Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  // Configuration for the test store
  const testDomain = 'thompsonseparts.co.uk';
  const config = {
    domain: testDomain,
    business_name: "Thompson's E-Parts",
    greeting_message: "Hello! Welcome to Thompson's E-Parts. How can I help you today?",
    primary_color: '#2C3E50',
    chat_enabled: true,
    woocommerce_enabled: true,
    woocommerce_url: process.env.WOOCOMMERCE_URL,
    woocommerce_consumer_key: encrypt(process.env.WOOCOMMERCE_CONSUMER_KEY),
    woocommerce_consumer_secret: encrypt(process.env.WOOCOMMERCE_CONSUMER_SECRET),
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
    
    // Now test the chat with WooCommerce
    console.log('\n🧪 Testing chat with real WooCommerce integration...\n');
    
    const testMessages = [
      "What products do you have available?",
      "Can you check if you have any products in the 'Parts' category?",
      "What's the price of your most popular product?",
    ];
    
    for (const message of testMessages) {
      console.log(`\n💬 Testing: "${message}"`);
      
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          session_id: 'woo_test_' + Date.now(),
          domain: testDomain,
          woocommerceEnabled: true,
          storeDomain: testDomain,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('❌ Error:', data);
      } else {
        console.log('✅ Response:', data.message);
      }
      
      // Wait a bit between requests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

// Run the setup and test
setupAndTestWooCommerce();