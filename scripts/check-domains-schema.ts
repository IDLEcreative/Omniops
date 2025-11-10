import { createServiceRoleClient } from '../lib/supabase-server';

async function checkSchema() {
  const supabase = await createServiceRoleClient();

  // Check what columns exist in domains table
  const { data: domains } = await supabase!
    .from('domains')
    .select('*')
    .limit(1);

  console.log('Domains table columns:');
  if (domains && domains[0]) {
    console.log(Object.keys(domains[0]));
  }

  // Try the query that's failing
  const testId = '8dccd788-1ec1-43c2-af56-78aa3366bad3';
  const { data: domain1, error: error1 } = await supabase!
    .from('domains')
    .select('domain, settings')
    .eq('id', testId)
    .single();

  console.log('\nQuery with settings column:');
  console.log('Error:', error1);
  console.log('Data:', domain1);

  // Try without settings
  const { data: domain2, error: error2 } = await supabase!
    .from('domains')
    .select('domain')
    .eq('id', testId)
    .single();

  console.log('\nQuery without settings:');
  console.log('Error:', error2);
  console.log('Data:', domain2);
}

checkSchema().then(() => process.exit(0));
