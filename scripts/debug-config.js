const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://birugqyuqhiahxvxeyqg.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpcnVncXl1cWhpYWh4dnhleXFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTc4NzE2NCwiZXhwIjoyMDcxMzYzMTY0fQ.5bw0QlkRgv_PA7iHrpWixvC31d7WZ5VYSR2JZnhsw8s';

async function debugConfig() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  console.log('Debugging customer_configs table...\n');
  
  // Check all configs
  const { data: allConfigs, error: allError } = await supabase
    .from('customer_configs')
    .select('domain, business_name, woocommerce_enabled, woocommerce_url');
  
  console.log('All configs:', allConfigs || allError);
  
  // Check specific domain
  const domain = 'thompsonseparts.co.uk';
  console.log(`\nChecking for domain: ${domain}`);
  
  const { data: config, error } = await supabase
    .from('customer_configs')
    .select('woocommerce_enabled')
    .eq('domain', domain)
    .single();
  
  if (error) {
    console.log('Error:', error);
  } else {
    console.log('Found config:', config);
  }
  
  // Try with service role
  console.log('\nUsing exact same query as chat route:');
  const { data: chatQuery } = await supabase
    .from('customer_configs')
    .select('woocommerce_enabled')
    .eq('domain', 'thompsonseparts.co.uk')
    .single();
    
  console.log('Result:', chatQuery);
}

debugConfig();