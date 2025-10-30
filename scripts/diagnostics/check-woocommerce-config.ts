import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConfig() {
  console.log('Checking all customer configurations...\n');

  const { data, error } = await supabase
    .from('customer_configs')
    .select('id, domain, woocommerce_url, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log('❌ No customer configurations found in database');
    return;
  }

  console.log(`✅ Found ${data.length} customer configuration(s):\n`);
  data.forEach((config: any, idx: number) => {
    console.log(`${idx + 1}. Domain: ${config.domain}`);
    console.log(`   ID: ${config.id}`);
    console.log(`   WooCommerce URL: ${config.woocommerce_url || '(not set)'}`);
    console.log(`   Created: ${config.created_at}`);
    console.log('');
  });

  // Now check specifically for Thompson's
  console.log('─'.repeat(80));
  console.log('Checking specifically for www.thompsonseparts.co.uk...\n');

  const thompsons = data.find((c: any) => c.domain === 'www.thompsonseparts.co.uk');
  if (thompsons) {
    console.log('✅ Thompson\'s configuration exists!');

    // Get full details
    const { data: fullData, error: fullError } = await supabase
      .from('customer_configs')
      .select('*')
      .eq('id', thompsons.id)
      .single();

    if (fullData && !fullError) {
      console.log('  WooCommerce URL:', fullData.woocommerce_url || '(not set)');
      console.log('  Consumer Key:', fullData.woocommerce_consumer_key ? `${fullData.woocommerce_consumer_key.substring(0, 10)}...` : '(not set)');
      console.log('  Consumer Secret:', fullData.woocommerce_consumer_secret ? `${fullData.woocommerce_consumer_secret.substring(0, 10)}...` : '(not set)');
    }
  } else {
    console.log('❌ No configuration found for Thompson\'s domain');
    console.log('   The domain needs to be added to customer_configs table');
  }
}

checkConfig().catch(console.error);
