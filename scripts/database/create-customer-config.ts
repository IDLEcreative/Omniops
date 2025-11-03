import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createCustomerConfig() {
  console.log('\n📝 Creating Customer Config for Thompson\'s E-Parts\n');
  console.log('─'.repeat(60));

  const domain = 'www.thompsonseparts.co.uk';
  const woocommerceUrl = process.env.WOOCOMMERCE_URL;
  const wooConsumerKey = process.env.WOOCOMMERCE_CONSUMER_KEY;
  const wooConsumerSecret = process.env.WOOCOMMERCE_CONSUMER_SECRET;

  if (!woocommerceUrl || !wooConsumerKey || !wooConsumerSecret) {
    console.error('❌ Missing environment variables!');
    console.error('   Required: WOOCOMMERCE_URL, WOOCOMMERCE_CONSUMER_KEY, WOOCOMMERCE_CONSUMER_SECRET');
    process.exit(1);
  }

  // Check if config already exists
  const { data: existing } = await supabase
    .from('customer_configs')
    .select('id, domain')
    .eq('domain', domain)
    .single();

  if (existing) {
    console.log(`✅ Config already exists for ${domain}`);
    console.log(`   ID: ${existing.id}`);
    console.log('\n🔄 Updating with WooCommerce settings...');

    const { data: updated, error } = await supabase
      .from('customer_configs')
      .update({
        woocommerce_url: woocommerceUrl,
        woocommerce_consumer_key: wooConsumerKey,
        woocommerce_consumer_secret: wooConsumerSecret,
        business_name: 'Thompson\'s E-Parts',
        welcome_message: 'Hi! How can I help you today?',
        active: true,
      })
      .eq('domain', domain)
      .select()
      .single();

    if (error) {
      console.error('❌ Update failed:', error);
      process.exit(1);
    }

    console.log('✅ Updated successfully!');
    console.log(`   woocommerce_url: ${updated.woocommerce_url}`);
  } else {
    console.log(`Creating new config for ${domain}...`);

    const { data: created, error } = await supabase
      .from('customer_configs')
      .insert({
        domain: domain,
        business_name: 'Thompson\'s E-Parts',
        welcome_message: 'Hi! How can I help you today?',
        woocommerce_url: woocommerceUrl,
        woocommerce_consumer_key: wooConsumerKey,
        woocommerce_consumer_secret: wooConsumerSecret,
        active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Creation failed:', error);
      process.exit(1);
    }

    console.log('✅ Created successfully!');
    console.log(`   ID: ${created.id}`);
    console.log(`   Domain: ${created.domain}`);
    console.log(`   WooCommerce URL: ${created.woocommerce_url}`);
  }

  console.log('\n─'.repeat(60));
  console.log('\n✅ WooCommerce is now enabled for the widget!');
  console.log('\n   Test it: http://localhost:3000/embed');
  console.log('\n');
}

createCustomerConfig().catch(console.error);
