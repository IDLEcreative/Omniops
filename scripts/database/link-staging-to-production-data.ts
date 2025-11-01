/**
 * Link Staging to Production Data
 * Configure staging domain to use production's scraped data
 */

import { createServiceRoleClient } from '../../lib/supabase/server';

async function linkStagingToProduction() {
  const supabase = await createServiceRoleClient();

  console.log('\n🔗 Linking staging to production data...\n');

  // Get production domain_id
  const { data: prodDomain } = await supabase
    .from('domains')
    .select('id')
    .eq('domain', 'thompsonseparts.co.uk')
    .single();

  if (!prodDomain) {
    console.error('❌ Production domain not found');
    return;
  }

  console.log(`✅ Production domain ID: ${prodDomain.id}`);

  // Update customer_configs to add a fallback_domain_id
  // This tells the system: "If epartstaging.wpengine.com has no data, use thompsonseparts.co.uk data"

  // Actually, a simpler approach: Just create an alias in the customer_configs
  // Or update the widget to pass domain=thompsonseparts.co.uk

  console.log('\n💡 Recommended Actions:\n');
  console.log('   1. Update staging WordPress widget embed code:');
  console.log('      Change: domain=epartstaging.wpengine.com');
  console.log('      To:     domain=thompsonseparts.co.uk');
  console.log('');
  console.log('   2. Or scrape staging site from production dashboard:');
  console.log('      https://www.omniops.co.uk/dashboard -> Scrape Website');
  console.log('      Enter: https://epartstaging.wpengine.com');
  console.log('');
  console.log('   3. Or wait for scheduled scraping to pick it up');
  console.log('');
}

linkStagingToProduction()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
