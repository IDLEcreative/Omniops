const fetch = require('node-fetch');

const SUPABASE_URL = 'https://birugqyuqhiahxvxeyqg.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpcnVncXl1cWhpYWh4dnhleXFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTc4NzE2NCwiZXhwIjoyMDcxMzYzMTY0fQ.5bw0QlkRgv_PA7iHrpWixvC31d7WZ5VYSR2JZnhsw8s';

async function fixDomain() {
  console.log('Fixing domain to match actual website...');
  
  // Update domain to match the actual website
  const response = await fetch(`${SUPABASE_URL}/rest/v1/customer_configs?domain=eq.thompsons-eparts.com`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_KEY,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      domain: 'thompsonseparts.co.uk'  // Match the actual domain
    })
  });
  
  if (response.ok) {
    const result = await response.json();
    console.log('✅ Domain updated successfully!');
    console.log('New domain:', result[0].domain);
    console.log('\n🎉 Configuration is now aligned with the actual website!');
  } else {
    console.error('Failed to update domain:', await response.text());
  }
}

fixDomain();