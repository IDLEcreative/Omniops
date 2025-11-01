/**
 * Find Domains With Scraped Data
 * Lists all domains that have pages in the database
 */

import { createServiceRoleClient } from '../../lib/supabase/server';

async function findDomainsWithData() {
  const supabase = await createServiceRoleClient();

  // Find all domains with scraped pages
  const { data: domains } = await supabase
    .from('scraped_pages')
    .select('domain')
    .limit(10000);

  if (!domains || domains.length === 0) {
    console.log('❌ NO domains have scraped pages in database');
    return;
  }

  // Count pages per domain
  const domainCounts = domains.reduce((acc: Record<string, number>, { domain }) => {
    acc[domain] = (acc[domain] || 0) + 1;
    return acc;
  }, {});

  console.log('\n📊 Domains with scraped data:\n');
  Object.entries(domainCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([domain, count]) => {
      console.log(`   ${domain}: ${count} pages`);
    });

  console.log('\n');
}

findDomainsWithData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
