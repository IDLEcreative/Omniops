
const SUPABASE_URL = 'https://birugqyuqhiahxvxeyqg.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpcnVncXl1cWhpYWh4dnhleXFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTc4NzE2NCwiZXhwIjoyMDcxMzYzMTY0fQ.5bw0QlkRgv_PA7iHrpWixvC31d7WZ5VYSR2JZnhsw8s';

async function checkColumns() {
  // Get all data to see the actual structure
  const response = await fetch(`${SUPABASE_URL}/rest/v1/customer_configs`, {
    headers: {
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'apikey': SUPABASE_SERVICE_KEY
    }
  });
  
  const data = await response.json();
  console.log('Customer configs data:');
  console.log(JSON.stringify(data, null, 2));
  
  if (data && data.length > 0) {
    console.log('\nAvailable columns:');
    console.log(Object.keys(data[0]));
    
    console.log('\nWooCommerce fields:');
    const wooFields = Object.keys(data[0]).filter(k => k.includes('woo') || k.includes('commerce'));
    console.log(wooFields);
  }
}

checkColumns();