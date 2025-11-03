import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addLocalhostConfig() {
  console.log('\n📝 Adding localhost config for development\n');
  console.log('─'.repeat(60));

  const domain = 'localhost';
  const woocommerceUrl = process.env.WOOCOMMERCE_URL;
  const wooConsumerKey = process.env.WOOCOMMERCE_CONSUMER_KEY;
  const wooConsumerSecret = process.env.WOOCOMMERCE_CONSUMER_SECRET;

  if (!woocommerceUrl || !wooConsumerKey || !wooConsumerSecret) {
    console.error('❌ Missing environment variables!');
    process.exit(1);
  }

  // Check if localhost config exists
  const { data: existing } = await supabase
    .from('customer_configs')
    .select('id, domain')
    .eq('domain', domain)
    .single();

  if (existing) {
    console.log(`✅ Config already exists for ${domain}`);
    console.log(`   ID: ${existing.id}`);
    console.log('\n🔄 Updating with WooCommerce settings...');

    const { error } = await supabase
      .from('customer_configs')
      .update({
        woocommerce_url: woocommerceUrl,
        woocommerce_consumer_key: wooConsumerKey,
        woocommerce_consumer_secret: wooConsumerSecret,
        business_name: 'Thompson\'s E-Parts (Dev)',
        welcome_message: 'Hi! How can I help you today?',
        active: true,
      })
      .eq('domain', domain);

    if (error) {
      console.error('❌ Update failed:', error);
      process.exit(1);
    }

    console.log('✅ Updated successfully!');
  } else {
    console.log(`Creating new config for ${domain}...`);

    // Generate app_id (simple format: app_xxxxxxxxxx)
    const appId = 'app_' + Math.random().toString(36).substring(2, 12);

    const { data: created, error } = await supabase
      .from('customer_configs')
      .insert({
        domain: domain,
        app_id: appId,
        business_name: 'Thompson\'s E-Parts (Dev)',
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
  }

  console.log('\n─'.repeat(60));
  console.log('\n✅ Localhost config created! Now the dashboard will work.');
  console.log('\n   Visit: http://localhost:3000/dashboard/integrations/woocommerce/configure');
  console.log('\n');
}

addLocalhostConfig().catch(console.error);
