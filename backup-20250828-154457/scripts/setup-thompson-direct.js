const { createClient } = require('@supabase/supabase-js');

// Your actual Supabase credentials
const SUPABASE_URL = 'https://birugqyuqhiahxvxeyqg.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpcnVncXl1cWhpYWh4dnhleXFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTc4NzE2NCwiZXhwIjoyMDcxMzYzMTY0fQ.5bw0QlkRgv_PA7iHrpWixvC31d7WZ5VYSR2JZnhsw8s';

async function setupThompsonEParts() {
  console.log('Connecting to YOUR Supabase project: birugqyuqhiahxvxeyqg');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  // Thompson's E-Parts configuration - minimal fields first
  const config = {
    domain: 'thompsons-eparts.com',
    business_name: "Thompson's E-Parts",
    woocommerce_enabled: true,
    woocommerce_url: 'https://thompsons-eparts.com',
    woocommerce_consumer_key: 'ck_9f3e3b9e5d9c4a7b8e6d5c4b3a2918170f6e5d4c',
    woocommerce_consumer_secret: 'cs_8d7c6b5a4e3d2c1b0a9876543210fedcba987654'
  };
  
  try {
    // First, check if the table exists and what columns it has
    const { data: tableCheck, error: tableError } = await supabase
      .from('customer_configs')
      .select('*')
      .limit(1);
    
    if (tableError && tableError.code === '42P01') {
      console.log('Table customer_configs does not exist. Creating it...');
      
      // Create the table
      const { error: createError } = await supabase.rpc('query', {
        query_text: `
          CREATE TABLE IF NOT EXISTS customer_configs (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            domain TEXT UNIQUE NOT NULL,
            business_name TEXT,
            greeting_message TEXT,
            primary_color TEXT,
            chat_enabled BOOLEAN DEFAULT true,
            woocommerce_enabled BOOLEAN DEFAULT false,
            woocommerce_url TEXT,
            woocommerce_consumer_key TEXT,
            woocommerce_consumer_secret TEXT,
            shopify_enabled BOOLEAN DEFAULT false,
            shopify_domain TEXT,
            shopify_access_token TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
        `
      });
      
      if (createError) {
        console.error('Failed to create table:', createError);
        return;
      }
    }
    
    // Check if config already exists
    const { data: existing, error: checkError } = await supabase
      .from('customer_configs')
      .select('id')
      .eq('domain', config.domain)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      // Error other than "no rows"
      console.error('Error checking existing config:', checkError);
      return;
    }
    
    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('customer_configs')
        .update(config)
        .eq('domain', config.domain)
        .select();
      
      if (error) {
        console.error('Update error:', error);
        return;
      }
      console.log('✅ Updated Thompson\'s E-Parts configuration');
    } else {
      // Insert new
      const { data, error } = await supabase
        .from('customer_configs')
        .insert([config])
        .select();
      
      if (error) {
        console.error('Insert error:', error);
        return;
      }
      console.log('✅ Created Thompson\'s E-Parts configuration');
    }
    
    // Verify the data was inserted
    const { data: verify, error: verifyError } = await supabase
      .from('customer_configs')
      .select('domain, business_name, woocommerce_enabled, woocommerce_url')
      .eq('domain', 'thompsons-eparts.com')
      .single();
    
    if (verify) {
      console.log('\n✅ Configuration verified in YOUR database:');
      console.log('  Domain:', verify.domain);
      console.log('  Business:', verify.business_name);
      console.log('  WooCommerce Enabled:', verify.woocommerce_enabled);
      console.log('  WooCommerce URL:', verify.woocommerce_url);
      console.log('\n🎉 Thompson\'s E-Parts is now configured in your Supabase project!');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the setup
setupThompsonEParts();