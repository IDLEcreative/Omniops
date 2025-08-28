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

async function setupThompsonEParts() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  
  // Thompson's E-Parts test credentials
  const config = {
    domain: 'thompsons-eparts.com',
    business_name: "Thompson's E-Parts",
    greeting_message: "Welcome to Thompson's E-Parts! How can I help you find the right part today?",
    primary_color: '#1a73e8',
    woocommerce_enabled: true,
    woocommerce_url: 'https://thompsons-eparts.com',
    woocommerce_consumer_key: encryptCredential('ck_9f3e3b9e5d9c4a7b8e6d5c4b3a2918170f6e5d4c'),
    woocommerce_consumer_secret: encryptCredential('cs_8d7c6b5a4e3d2c1b0a9876543210fedcba987654')
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
      console.log('Updated Thompson\'s E-Parts configuration:', data);
    } else {
      // Insert new
      const { data, error } = await supabase
        .from('customer_configs')
        .insert([config])
        .select();
      
      if (error) throw error;
      console.log('Created Thompson\'s E-Parts configuration:', data);
    }
    
    console.log('\n✅ Thompson\'s E-Parts WooCommerce integration configured successfully!');
    console.log('Domain:', config.domain);
    console.log('WooCommerce URL:', config.woocommerce_url);
    console.log('Credentials: Encrypted and stored securely');
    
  } catch (error) {
    console.error('Error setting up Thompson\'s E-Parts:', error);
    process.exit(1);
  }
}

// Run the setup
setupThompsonEParts();