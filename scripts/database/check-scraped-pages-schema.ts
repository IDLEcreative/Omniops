/**
 * Check Scraped Pages Schema
 * Examine the actual structure and data in scraped_pages table
 */

import { createServiceRoleClient } from '../../lib/supabase/server';

async function checkSchema() {
  const supabase = await createServiceRoleClient();

  // Get a few sample records to see the actual structure
  const { data: samples, error } = await supabase
    .from('scraped_pages')
    .select('*')
    .limit(3);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\n📋 Sample scraped_pages records:\n');
  console.log(JSON.stringify(samples, null, 2));

  // Also check unique domains
  const { data: allPages } = await supabase
    .from('scraped_pages')
    .select('domain')
    .limit(100);

  if (allPages) {
    const uniqueDomains = [...new Set(allPages.map((p: any) => p.domain))];
    console.log('\n\n📊 Unique domains found:');
    uniqueDomains.forEach((d: string) => {
      console.log(`   - ${d || '(null)'}`);
    });
  }
}

checkSchema()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
