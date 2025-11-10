import { createServiceRoleClient } from '../lib/supabase-server';

async function checkTables() {
  const supabase = await createServiceRoleClient();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Check scraped_pages
  const { count: scrapedCount } = await supabase!
    .from('scraped_pages')
    .select('*', { count: 'exact', head: true })
    .lt('updated_at', thirtyDaysAgo.toISOString());

  // Check website_content
  const { count: websiteCount } = await supabase!
    .from('website_content')
    .select('*', { count: 'exact', head: true })
    .lt('scraped_at', thirtyDaysAgo.toISOString());

  console.log('Stale pages (30+ days old):');
  console.log(`  scraped_pages: ${scrapedCount || 0}`);
  console.log(`  website_content: ${websiteCount || 0}`);

  // Total counts
  const { count: totalScraped } = await supabase!
    .from('scraped_pages')
    .select('*', { count: 'exact', head: true });

  const { count: totalWebsite } = await supabase!
    .from('website_content')
    .select('*', { count: 'exact', head: true });

  console.log('\nTotal pages:');
  console.log(`  scraped_pages: ${totalScraped || 0}`);
  console.log(`  website_content: ${totalWebsite || 0}`);
}

checkTables().then(() => process.exit(0));
