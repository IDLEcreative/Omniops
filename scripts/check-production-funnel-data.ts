/**
 * Check Production Funnel Data
 *
 * Verifies if real customer data is flowing into the funnel system
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkRealData() {
  console.log('🔍 Checking for real funnel data...\n');

  const domain = 'thompsonseparts.co.uk';

  // Get recent funnel entries
  const { data, error } = await supabase
    .from('conversation_funnel')
    .select('current_stage, cart_value, cart_priority, customer_email, created_at')
    .eq('domain', domain)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.log('❌ Error:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log(`📊 No funnel data yet for ${domain}`);
    console.log('   Data will start flowing when:');
    console.log('   ✓ Customers start new chat conversations');
    console.log('   ✓ WooCommerce sends cart/order webhooks\n');
    console.log('💡 The system is ready and waiting for traffic!');
    return;
  }

  console.log(`✅ Found ${data.length} recent funnel entries for ${domain}:\n`);

  data.forEach((row, i) => {
    const date = new Date(row.created_at).toLocaleString();
    const value = row.cart_value ? `£${row.cart_value.toFixed(2)}` : 'N/A';
    const priority = row.cart_priority || 'N/A';
    const email = row.customer_email.substring(0, 20) + '...';
    console.log(`   ${i+1}. ${row.current_stage.padEnd(15)} | ${email.padEnd(25)} | Cart: ${value.padEnd(10)} | ${priority.padEnd(6)} | ${date}`);
  });

  // Get summary stats
  const { data: stats } = await supabase
    .from('conversation_funnel')
    .select('current_stage, cart_value, purchase_value')
    .eq('domain', domain);

  if (stats && stats.length > 0) {
    const chatCount = stats.length;
    const cartCount = stats.filter(s => s.current_stage !== 'chat').length;
    const purchaseCount = stats.filter(s => s.current_stage === 'purchased').length;
    const totalRevenue = stats.reduce((sum, s) => sum + (s.purchase_value || 0), 0);
    const lostRevenue = stats
      .filter(s => s.current_stage === 'cart_abandoned')
      .reduce((sum, s) => sum + (s.cart_value || 0), 0);

    console.log(`\n📈 Overall Stats for ${domain}:`);
    console.log(`   Total Chats: ${chatCount}`);
    console.log(`   Carts Created: ${cartCount}`);
    console.log(`   Purchases: ${purchaseCount}`);
    console.log(`   Total Revenue: £${totalRevenue.toFixed(2)}`);
    console.log(`   Lost Revenue: £${lostRevenue.toFixed(2)}`);

    if (chatCount > 0) {
      const chatToCart = ((cartCount / chatCount) * 100).toFixed(1);
      const convRate = ((purchaseCount / chatCount) * 100).toFixed(1);
      console.log(`\n📊 Conversion Rates:`);
      console.log(`   Chat → Cart: ${chatToCart}%`);
      console.log(`   Overall: ${convRate}%`);
    }
  }

  console.log(`\n🔗 View Dashboard:`);
  console.log(`   http://localhost:3000/dashboard/analytics/funnel?domain=${domain}\n`);
}

checkRealData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
