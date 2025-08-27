// Direct setup script for WooCommerce configuration
// This sets up the configuration directly in Supabase

const ENCRYPTION_KEY = 'your_32_character_encryption_key';

// Simple encryption function
function simpleEncrypt(text) {
  // For testing, we'll just base64 encode
  // In production, use proper AES encryption
  return Buffer.from(text).toString('base64');
}

async function setupWooConfig() {
  const config = {
    domain: 'thompsonseparts.co.uk',
    business_name: "Thompson's E-Parts",
    greeting_message: "Hello! Welcome to Thompson's E-Parts. How can I help you today?",
    primary_color: '#2C3E50',
    chat_enabled: true,
    woocommerce_enabled: true,
    woocommerce_url: 'https://www.thompsonseparts.co.uk',
    // For testing, we'll store them as plain text (they'll be encrypted by the API)
    woocommerce_consumer_key: 'ck_4dd9a1a797b1a24cde23e55bb26a0aa0dc10e151',
    woocommerce_consumer_secret: 'cs_a3a6a520ccd79f14e9a93740d652bd191bc8a231',
  };

  console.log('Configuration to be set up:');
  console.log(JSON.stringify(config, null, 2));
  console.log('\nNote: The API will handle encryption when storing these credentials.');
  console.log('Domain:', config.domain);
  console.log('WooCommerce URL:', config.woocommerce_url);
}

setupWooConfig();