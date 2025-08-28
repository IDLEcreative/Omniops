const fetch = require('node-fetch');

const SUPABASE_URL = 'https://birugqyuqhiahxvxeyqg.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpcnVncXl1cWhpYWh4dnhleXFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTc4NzE2NCwiZXhwIjoyMDcxMzYzMTY0fQ.5bw0QlkRgv_PA7iHrpWixvC31d7WZ5VYSR2JZnhsw8s';

async function updateRealWooCommerce() {
  console.log('Updating with REAL Thompson\'s E-Parts WooCommerce credentials...');
  
  // Real credentials from your .env file
  const updates = [
    { woocommerce_url: 'https://www.thompsonseparts.co.uk' },
    { woocommerce_consumer_key: 'ck_4dd9a1a797b1a24cde23e55bb26a0aa0dc10e151' },
    { woocommerce_consumer_secret: 'cs_a3a6a520ccd79f14e9a93740d652bd191bc8a231' },
    { woocommerce_enabled: true }
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
  const verifyResponse = await fetch(`${SUPABASE_URL}/rest/v1/customer_configs?domain=eq.thompsons-eparts.com`, {
    headers: {
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'apikey': SUPABASE_SERVICE_KEY
    }
  });
  
  if (verifyResponse.ok) {
    const result = await verifyResponse.json();
    console.log('Final configuration:', result[0]);
    console.log('\n🎉 Thompson\'s E-Parts is now configured with REAL WooCommerce credentials!');
    console.log('URL:', result[0].woocommerce_url);
    console.log('Ready to fetch real products!');
  }
}

updateRealWooCommerce();