const fetch = require('node-fetch');

const SUPABASE_URL = 'https://birugqyuqhiahxvxeyqg.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpcnVncXl1cWhpYWh4dnhleXFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTc4NzE2NCwiZXhwIjoyMDcxMzYzMTY0fQ.5bw0QlkRgv_PA7iHrpWixvC31d7WZ5VYSR2JZnhsw8s';

async function updateWooCommerce() {
  console.log('Updating WooCommerce fields for Thompson\'s E-Parts...');
  
  // Update one field at a time to avoid schema cache issues
  const updates = [
    { woocommerce_url: 'https://thompsons-eparts.com' },
    { woocommerce_consumer_key: 'ck_9f3e3b9e5d9c4a7b8e6d5c4b3a2918170f6e5d4c' },
    { woocommerce_consumer_secret: 'cs_8d7c6b5a4e3d2c1b0a9876543210fedcba987654' }
  ];
  
  for (const update of updates) {
    const fieldName = Object.keys(update)[0];
    console.log(`Updating ${fieldName}...`);
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/customer_configs?domain=eq.thompsons-eparts.com`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(update)
    });
    
    if (response.ok) {
      console.log(`✅ ${fieldName} updated successfully`);
    } else {
      console.error(`❌ Failed to update ${fieldName}:`, await response.text());
    }
  }
  
  // Verify the final configuration
  console.log('\nVerifying final configuration...');
  const verifyResponse = await fetch(`${SUPABASE_URL}/rest/v1/customer_configs?domain=eq.thompsons-eparts.com&select=domain,business_name,woocommerce_url`, {
    headers: {
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'apikey': SUPABASE_SERVICE_KEY
    }
  });
  
  if (verifyResponse.ok) {
    const result = await verifyResponse.json();
    console.log('Final configuration:', result);
  }
}

updateWooCommerce();