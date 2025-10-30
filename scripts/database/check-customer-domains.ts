import { createServiceRoleClient } from '../../lib/supabase/server';

async function checkCustomerDomains() {
  const supabase = await createServiceRoleClient();

  if (!supabase) {
    console.error('❌ Failed to create Supabase client');
    process.exit(1);
  }

  console.log('🔍 Checking customer configurations...\n');

  // Query customer_configs table
  const { data: customers, error } = await supabase
    .from('customer_configs')
    .select('domain, woocommerce_url, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error querying database:', error);
    process.exit(1);
  }

  if (!customers || customers.length === 0) {
    console.log('ℹ️  No customer configurations found in database');
    process.exit(0);
  }

  console.log(`Found ${customers.length} customer configuration(s):\n`);

  customers.forEach((customer, index) => {
    console.log(`${index + 1}. Customer Domain: ${customer.domain}`);
    console.log(`   WooCommerce URL: ${customer.woocommerce_url || 'Not configured'}`);
    console.log(`   Created: ${new Date(customer.created_at).toLocaleDateString()}`);
    console.log('');
  });

  // Extract unique domains
  const uniqueDomains = [...new Set(customers.map(c => c.domain))];
  const uniqueWooDomains = [...new Set(customers.map(c => c.woocommerce_url).filter(Boolean))];

  console.log('📊 Summary:');
  console.log(`   Customer Domains: ${uniqueDomains.join(', ')}`);
  console.log(`   WooCommerce URLs: ${uniqueWooDomains.join(', ')}`);
}

checkCustomerDomains().catch(console.error);
