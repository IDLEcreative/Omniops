import { createClient } from '@supabase/supabase-js';
import { getCommerceProvider } from '../lib/agents/commerce-provider';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function testWooCommerce() {
  const domain = 'thompsonseparts.co.uk';

  console.log('=== TESTING WOOCOMMERCE PROVIDER ===');
  console.log('Domain:', domain);

  try {
    console.log('\n1. Loading commerce provider...');
    const provider = await getCommerceProvider(domain);

    if (!provider) {
      console.log('❌ NO PROVIDER FOUND for', domain);
      console.log('\nChecking database for WooCommerce config...');

      const { data: config } = await supabase
        .from('customer_configs')
        .select('id, domain, woocommerce_url, woocommerce_credentials_encrypted')
        .eq('domain', domain)
        .single();

      console.log('Config:', config);
      return;
    }

    console.log('✅ Provider loaded:', provider.platform);

    console.log('\n2. Testing product search for "pumps"...');
    const products = await provider.searchProducts('pumps', 10);

    console.log('Results:', products?.length || 0, 'products');
    if (products && products.length > 0) {
      console.log('\nFirst 3 products:');
      products.slice(0, 3).forEach((p: any, i: number) => {
        console.log(`${i + 1}. ${p.name} - ${p.sku || 'no-sku'} - ${p.price || 'no-price'}`);
      });
    } else {
      console.log('⚠️ No products returned from WooCommerce');
    }

  } catch (error) {
    console.error('❌ ERROR:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Stack:', error.stack);
    }
  }
}

testWooCommerce().catch(console.error);
