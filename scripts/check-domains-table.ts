import { createServiceRoleClient } from '../lib/supabase-server';

async function checkDomains() {
  const supabase = await createServiceRoleClient();

  // Check domains table
  const { data: domains, error: domainsError } = await supabase!
    .from('domains')
    .select('id, domain')
    .limit(5);

  console.log('=== DOMAINS TABLE ===');
  if (domainsError) {
    console.log('Error:', domainsError.message);
  } else {
    console.log(`Found ${domains?.length || 0} domains`);
    console.log(JSON.stringify(domains, null, 2));
  }

  // Check customer_configs
  const { data: configs, error: configsError } = await supabase!
    .from('customer_configs')
    .select('id, domain')
    .limit(5);

  console.log('\n=== CUSTOMER_CONFIGS TABLE ===');
  if (configsError) {
    console.log('Error:', configsError.message);
  } else {
    console.log(`Found ${configs?.length || 0} configs`);
    console.log(JSON.stringify(configs, null, 2));
  }

  // Check scraped_pages domain_id linkage
  const { data: pages, error: pagesError } = await supabase!
    .from('scraped_pages')
    .select('id, domain_id, url')
    .limit(3);

  console.log('\n=== SCRAPED_PAGES TABLE ===');
  if (pagesError) {
    console.log('Error:', pagesError.message);
  } else {
    console.log(`Sample pages: ${pages?.length || 0}`);
    console.log(JSON.stringify(pages, null, 2));
  }
}

checkDomains().then(() => process.exit(0)).catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
