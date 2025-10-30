import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Load environment variables manually
function loadEnvFile(filePath: string) {
  if (fs.existsSync(filePath)) {
    const envContent = fs.readFileSync(filePath, 'utf8');
    envContent.split('\n').forEach(line => {
      if (line.startsWith('#') || !line.trim()) return;
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        process.env[key.trim()] = value.replace(/^["']|["']$/g, '');
      }
    });
  }
}

// Load both .env and .env.local
loadEnvFile(path.resolve(process.cwd(), '.env'));
loadEnvFile(path.resolve(process.cwd(), '.env.local'));

// Encryption function matching the one in lib/encryption.ts
function encryptCredential(text: string): string {
  const algorithm = 'aes-256-gcm';
  const key = Buffer.from(process.env.ENCRYPTION_KEY || 'default-key-for-development-only-change-in-prod', 'utf8').slice(0, 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

async function setupEPartsStaging() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('❌ Missing Supabase credentials in environment variables');
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  console.log('🔍 Looking up production Thompson\'s configuration...');

  // Find production Thompson's config to copy credentials
  const { data: productionConfig, error: prodError } = await supabase
    .from('customer_configs')
    .select('woocommerce_url, woocommerce_consumer_key, woocommerce_consumer_secret, business_name, welcome_message, primary_color, suggested_questions')
    .or('domain.ilike.%thompson%,woocommerce_url.ilike.%thompson%')
    .limit(1)
    .single();

  if (prodError || !productionConfig) {
    console.warn('⚠️  Could not find production Thompson\'s config');
    console.warn('   Will create staging config without WooCommerce credentials');
  } else {
    console.log('✅ Found production config:', productionConfig.woocommerce_url);
  }

  // E-Parts Staging configuration - clone from production
  const config = {
    domain: 'epartstaging.wpengine.com',
    business_name: productionConfig?.business_name || "Thompson's E-Parts (Staging)",
    business_description: "Staging environment for Thompson's E-Parts",
    welcome_message: productionConfig?.welcome_message || "Welcome to Thompson's E-Parts staging environment! How can I help you?",
    primary_color: productionConfig?.primary_color || '#1a73e8',
    suggested_questions: productionConfig?.suggested_questions || ['What products do you have?', 'How do I track my order?', 'What are your shipping options?'],
    woocommerce_url: 'https://epartstaging.wpengine.com',
    // Copy encrypted credentials from production (they're already encrypted in DB)
    woocommerce_consumer_key: productionConfig?.woocommerce_consumer_key || null,
    woocommerce_consumer_secret: productionConfig?.woocommerce_consumer_secret || null,
    // Staging-specific settings
    rate_limit: 50, // Higher rate limit for testing
    active: true
  };

  try {
    // Check if config already exists
    const { data: existing } = await supabase
      .from('customer_configs')
      .select('id')
      .eq('domain', config.domain)
      .single();

    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('customer_configs')
        .update(config)
        .eq('domain', config.domain)
        .select();

      if (error) throw error;
      console.log('✅ Updated E-Parts Staging configuration:', data);
    } else {
      // Insert new
      const { data, error } = await supabase
        .from('customer_configs')
        .insert([config])
        .select();

      if (error) throw error;
      console.log('✅ Created E-Parts Staging configuration:', data);
    }

    console.log('\n🚀 E-Parts Staging configuration completed!');
    console.log('─────────────────────────────────────────');
    console.log('Domain:', config.domain);
    console.log('WooCommerce URL:', config.woocommerce_url);
    console.log('WooCommerce Credentials:', config.woocommerce_consumer_key ? '✅ Cloned from production' : '⚠️  Not set');
    console.log('Rate Limit:', config.rate_limit, 'requests/min');
    console.log('Business Name:', config.business_name);
    console.log('');
    console.log('📋 Configuration:');
    console.log('   ✅ Same WooCommerce credentials as production');
    console.log('   ✅ Same branding and welcome message');
    console.log('   ✅ Same suggested questions');
    console.log('   ⚡ Higher rate limit for testing (50 vs 10)');
    console.log('   🔒 Independent knowledge base (needs scraping)');
    console.log('');
    console.log('Next Steps:');
    console.log('1. Scrape the staging site to build knowledge base:');
    console.log('   → Visit: http://localhost:3000/dashboard/training');
    console.log('   → Enter: https://epartstaging.wpengine.com');
    console.log('   → Click "Scrape Full Site"');
    console.log('');
    console.log('2. Test the chat widget:');
    console.log('   → Local test: http://localhost:3000/embed?domain=epartstaging.wpengine.com');
    console.log('   → On staging site: Add embed script with data-domain="epartstaging.wpengine.com"');
    console.log('');
    console.log('3. Test WooCommerce integration:');
    console.log('   → Ask: "Show me hydraulic pumps"');
    console.log('   → Ask: "Track order #12345"');
    console.log('   → Products and orders will come from staging WooCommerce');
    console.log('');

  } catch (error) {
    console.error('❌ Error setting up E-Parts Staging:', error);
    process.exit(1);
  }
}

// Run the setup
setupEPartsStaging();
