const fetch = require('node-fetch');

// Your actual Supabase credentials
const SUPABASE_URL = 'https://birugqyuqhiahxvxeyqg.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpcnVncXl1cWhpYWh4dnhleXFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTc4NzE2NCwiZXhwIjoyMDcxMzYzMTY0fQ.5bw0QlkRgv_PA7iHrpWixvC31d7WZ5VYSR2JZnhsw8s';

async function setupThompsonEParts() {
  console.log('Setting up Thompson\'s E-Parts in YOUR Supabase project...');
  
  // First, let's check what columns exist
  const checkColumnsQuery = `
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'customer_configs'
    ORDER BY ordinal_position;
  `;
  
  try {
    // Check existing columns
    let response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY
      },
      body: JSON.stringify({ query_text: checkColumnsQuery })
    });
    
    if (!response.ok) {
      // Try direct query if RPC doesn't work
      console.log('RPC not available, trying direct insert...');
    }
    
    // Insert Thompson's E-Parts using upsert
    const insertQuery = `
      INSERT INTO customer_configs (
        domain,
        business_name,
        greeting_message,
        primary_color,
        woocommerce_enabled,
        woocommerce_url,
        woocommerce_consumer_key,
        woocommerce_consumer_secret
      ) VALUES (
        'thompsons-eparts.com',
        'Thompson''s E-Parts',
        'Welcome to Thompson''s E-Parts! How can I help you find the right part today?',
        '#1a73e8',
        true,
        'https://thompsons-eparts.com',
        'ck_9f3e3b9e5d9c4a7b8e6d5c4b3a2918170f6e5d4c',
        'cs_8d7c6b5a4e3d2c1b0a9876543210fedcba987654'
      )
      ON CONFLICT (domain) DO UPDATE SET
        business_name = EXCLUDED.business_name,
        greeting_message = EXCLUDED.greeting_message,
        primary_color = EXCLUDED.primary_color,
        woocommerce_enabled = EXCLUDED.woocommerce_enabled,
        woocommerce_url = EXCLUDED.woocommerce_url,
        woocommerce_consumer_key = EXCLUDED.woocommerce_consumer_key,
        woocommerce_consumer_secret = EXCLUDED.woocommerce_consumer_secret,
        updated_at = NOW();
    `;
    
    // Try using PostgREST directly
    const configData = {
      domain: 'thompsons-eparts.com',
      business_name: "Thompson's E-Parts",
      greeting_message: "Welcome to Thompson's E-Parts! How can I help you find the right part today?",
      primary_color: '#1a73e8',
      woocommerce_enabled: true,
      woocommerce_url: 'https://thompsons-eparts.com',
      woocommerce_consumer_key: 'ck_9f3e3b9e5d9c4a7b8e6d5c4b3a2918170f6e5d4c',
      woocommerce_consumer_secret: 'cs_8d7c6b5a4e3d2c1b0a9876543210fedcba987654'
    };
    
    // Try insert via REST API
    response = await fetch(`${SUPABASE_URL}/rest/v1/customer_configs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Prefer': 'return=representation,resolution=merge-duplicates'
      },
      body: JSON.stringify(configData)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Successfully inserted Thompson\'s E-Parts configuration!');
      console.log('Result:', result);
    } else {
      const error = await response.text();
      console.error('Error response:', error);
      
      // Try with minimal fields
      console.log('\nTrying with minimal fields...');
      const minimalConfig = {
        domain: 'thompsons-eparts.com',
        business_name: "Thompson's E-Parts"
      };
      
      response = await fetch(`${SUPABASE_URL}/rest/v1/customer_configs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_KEY,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(minimalConfig)
      });
      
      if (response.ok) {
        console.log('✅ Inserted with minimal fields. Now updating with WooCommerce data...');
        
        // Update with WooCommerce fields
        const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/customer_configs?domain=eq.thompsons-eparts.com`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json',
            'apikey': SUPABASE_SERVICE_KEY,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            woocommerce_enabled: true,
            woocommerce_url: 'https://thompsons-eparts.com',
            woocommerce_consumer_key: 'ck_9f3e3b9e5d9c4a7b8e6d5c4b3a2918170f6e5d4c',
            woocommerce_consumer_secret: 'cs_8d7c6b5a4e3d2c1b0a9876543210fedcba987654'
          })
        });
        
        if (updateResponse.ok) {
          const finalResult = await updateResponse.json();
          console.log('✅ Thompson\'s E-Parts fully configured!');
          console.log('Configuration:', finalResult);
        }
      } else {
        console.error('Failed even with minimal fields:', await response.text());
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the setup
setupThompsonEParts();