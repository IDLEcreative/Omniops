import { createClient } from '@supabase/supabase-js';

async function getCustomerConfigs() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from('customer_configs')
    .select('id, domain, display_name')
    .limit(5);

  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  console.log('Available configs:');
  data.forEach((config, i) => {
    console.log(`${i + 1}. ${config.display_name || config.domain} (ID: ${config.id})`);
  });

  console.log(`\n📋 Test URL:\nhttp://localhost:3000/dashboard/customize?customerConfigId=${data[0].id}`);
}

getCustomerConfigs();
