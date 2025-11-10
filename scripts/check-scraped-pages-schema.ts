import { createServiceRoleClient } from '../lib/supabase-server';

async function checkSchema() {
  const supabase = await createServiceRoleClient();
  
  const { data } = await supabase!
    .from('scraped_pages')
    .select('*')
    .limit(1);

  console.log('scraped_pages columns:');
  if (data && data[0]) {
    Object.keys(data[0]).forEach(col => console.log(`  - ${col}`));
  }
}

checkSchema().then(() => process.exit(0));
