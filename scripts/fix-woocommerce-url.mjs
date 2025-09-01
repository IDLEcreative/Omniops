#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const ENCRYPTION_KEY = crypto.createHash('sha256')
  .update('default-encryption-key-change-in-production').digest();

function decrypt(text) {
  if (!text) return null;
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

function encrypt(text) {
  if (!text) return null;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

async function fixWooCommerceUrl() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  // Get current config
  const { data, error } = await supabase
    .from('customer_configs')
    .select('woocommerce_url, woocommerce_consumer_key, woocommerce_consumer_secret')
    .eq('domain', 'thompsonselectrical.co.uk')
    .single();

  if (error) {
    console.error('Error fetching config:', error);
    process.exit(1);
  }

  // Decrypt current values
  const currentUrl = decrypt(data.woocommerce_url);
  const currentKey = decrypt(data.woocommerce_consumer_key);
  const currentSecret = decrypt(data.woocommerce_consumer_secret);

  console.log('Current URL:', currentUrl);
  console.log('Current Key:', currentKey?.substring(0, 10) + '...');

  // The issue: the URL is encrypted credentials, not an actual URL
  // Fix by using proper WooCommerce URL from environment
  const properUrl = 'https://thompsonselectrical.co.uk';
  
  console.log('\nFixing URL to:', properUrl);

  // Re-encrypt with proper URL
  const encryptedUrl = encrypt(properUrl);
  
  // Update database
  const { error: updateError } = await supabase
    .from('customer_configs')
    .update({
      woocommerce_url: encryptedUrl,
      updated_at: new Date().toISOString()
    })
    .eq('domain', 'thompsonselectrical.co.uk');

  if (updateError) {
    console.error('Error updating config:', updateError);
    process.exit(1);
  }

  console.log('✅ WooCommerce URL fixed successfully!');
  
  // Verify the fix
  const { data: verifyData } = await supabase
    .from('customer_configs')
    .select('woocommerce_url')
    .eq('domain', 'thompsonselectrical.co.uk')
    .single();
    
  const verifiedUrl = decrypt(verifyData.woocommerce_url);
  console.log('Verified URL:', verifiedUrl);
}

fixWooCommerceUrl().catch(console.error);