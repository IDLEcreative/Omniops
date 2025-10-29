import { createServiceRoleClient } from './lib/supabase-server';

async function checkConfig() {
  const supabase = await createServiceRoleClient();
  
  if (!supabase) {
    console.log('❌ Supabase client not available');
    return;
  }

  const domain = 'thompsonseparts.co.uk';
  
  const { data, error } = await supabase
    .from('customer_configs')
    .select('domain, woocommerce_url, woocommerce_enabled')
    .eq('domain', domain)
    .single();

  if (error) {
    console.log('❌ Error or no configuration found:', error.message);
    console.log('\n📝 Note: WooCommerce is configured via environment variables');
    console.log('   To enable chat integration, add domain to customer_configs table');
  } else {
    console.log('✅ Database Configuration Found:');
    console.log('   Domain:', data.domain);
    console.log('   WooCommerce URL:', data.woocommerce_url || 'Not set');
    console.log('   WooCommerce Enabled:', data.woocommerce_enabled);
  }

  console.log('\n🔧 Environment Variables:');
  console.log('   WOOCOMMERCE_URL:', process.env.WOOCOMMERCE_URL);
  console.log('   Has Consumer Key:', !!process.env.WOOCOMMERCE_CONSUMER_KEY);
  console.log('   Has Consumer Secret:', !!process.env.WOOCOMMERCE_CONSUMER_SECRET);
}

checkConfig();
