/**
 * Check Domain ID Mapping
 * Show how domains and customer_configs relate to scraped data
 */

import { createServiceRoleClient } from '../../lib/supabase/server';

async function checkDomainMapping() {
  const supabase = await createServiceRoleClient();

  console.log('\n🗺️  Domain Mapping Analysis\n');

  // Get all domains
  const { data: domains } = await supabase
    .from('domains')
    .select('id, domain, name')
    .order('domain');

  console.log('📋 All Domains:');
  domains?.forEach((d) => {
    console.log(`   ${d.domain} (ID: ${d.id.substring(0, 8)}...)`);
  });

  // Get scraped pages grouped by domain_id
  const { data: pages } = await supabase
    .from('scraped_pages')
    .select('domain_id')
    .limit(1000);

  const domainIdCounts: Record<string, number> = {};
  pages?.forEach((p) => {
    domainIdCounts[p.domain_id] = (domainIdCounts[p.domain_id] || 0) + 1;
  });

  console.log('\n\n📊 Scraped Pages by Domain ID:');
  for (const [domainId, count] of Object.entries(domainIdCounts)) {
    const matchingDomain = domains?.find((d) => d.id === domainId);
    console.log(`   ${domainId.substring(0, 8)}...: ${count} pages`);
    if (matchingDomain) {
      console.log(`      → ${matchingDomain.domain}`);
    }
  }

  // Check specific domains
  console.log('\n\n🔍 Specific Domain Lookups:\n');

  const checkDomain = async (domainName: string) => {
    const { data: domain } = await supabase
      .from('domains')
      .select('id')
      .eq('domain', domainName)
      .single();

    if (!domain) {
      console.log(`   ❌ ${domainName}: NOT FOUND in domains table`);
      return;
    }

    const { count: pageCount } = await supabase
      .from('scraped_pages')
      .select('id', { count: 'exact' })
      .eq('domain_id', domain.id);

    console.log(`   ${domainName}:`);
    console.log(`      Domain ID: ${domain.id}`);
    console.log(`      Pages: ${pageCount || 0}`);
  };

  await checkDomain('thompsonseparts.co.uk');
  await checkDomain('www.thompsonseparts.co.uk');
  await checkDomain('epartstaging.wpengine.com');

  console.log('\n');
}

checkDomainMapping()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
