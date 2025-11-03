import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkCreds() {
  const { data, error } = await supabase
    .from('customer_configs')
    .select('domain, woocommerce_url, woocommerce_consumer_key, woocommerce_consumer_secret')
    .eq('domain', 'localhost')
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\n🔍 Localhost WooCommerce Configuration:\n');
  console.log(`Domain: ${data.domain}`);
  console.log(`URL: ${data.woocommerce_url || '❌ NOT SET'}`);
  console.log(`Consumer Key: ${data.woocommerce_consumer_key ? '✅ SET (encrypted)' : '❌ NOT SET'}`);
  console.log(`Consumer Secret: ${data.woocommerce_consumer_secret ? '✅ SET (encrypted)' : '❌ NOT SET'}`);
  console.log('');
}

checkCreds().catch(console.error);
