import type { SupabaseClient } from '@supabase/supabase-js';
import type { DomainInfo } from './types';

const TARGET_DOMAIN = 'thompsonseparts.co.uk';

export async function resolveDomain(client: SupabaseClient): Promise<DomainInfo | null> {
  console.log('\n📋 Step 1: Finding domain ID for thompsonseparts.co.uk...');

  const { data: domains, error } = await client
    .from('domains')
    .select('id, domain, name, last_scraped_at, active')
    .ilike('domain', `%${TARGET_DOMAIN}%`);

  if (error) {
    console.error('❌ Error fetching domains:', error);
    return null;
  }

  if (!domains || domains.length === 0) {
    console.log('❌ No domains found for thompsonseparts.co.uk');
    await printAvailableDomains(client);
    return null;
  }

  const domain = domains[0] as DomainInfo;
  console.log(`✅ Found domain: ${domain.domain}`);
  console.log(`   ID: ${domain.id}`);
  console.log(`   Name: ${domain.name || 'Not set'}`);
  console.log(`   Last scraped: ${domain.last_scraped_at || 'Never'}`);
  console.log(`   Active: ${domain.active}`);

  return domain;
}

async function printAvailableDomains(client: SupabaseClient): Promise<void> {
  const { data: allDomains } = await client
    .from('domains')
    .select('id, domain, name')
    .limit(10);

  console.log('\n📋 Available domains in database:');
  allDomains?.forEach(domain => {
    console.log(`  - ${domain.domain} (${domain.name || 'No name'})`);
  });
}
