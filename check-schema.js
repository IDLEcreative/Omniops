const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://birugqyuqhiahxvxeyqg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpcnVncXl1cWhpYWh4dnhleXFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTc4NzE2NCwiZXhwIjoyMDcxMzYzMTY0fQ.5bw0QlkRgv_PA7iHrpWixvC31d7WZ5VYSR2JZnhsw8s'
);

async function checkSchema() {
  const { data, error } = await supabase
    .from('customer_configs')
    .select('*')
    .eq('domain', 'thompsonseparts.co.uk')
    .single();

  if (error) {
    console.log('Error:', error.message);
  }
  
  if (data) {
    console.log('Thompson config found!');
    console.log('Available columns:', Object.keys(data));
    console.log('Domain ID:', data.id);
  }
}

checkSchema();