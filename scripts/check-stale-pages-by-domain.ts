import { createServiceRoleClient } from '../lib/supabase-server';

async function checkStalePages() {
  const supabase = await createServiceRoleClient();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get stale pages per domain
  const { data: domains } = await supabase!
    .from('domains')
    .select('id, domain');

  console.log('Stale pages (30+ days old) by domain:\n');

  for (const domain of domains || []) {
    const { count } = await supabase!
      .from('scraped_pages')
      .select('*', { count: 'exact', head: true })
      .eq('domain_id', domain.id)
      .lt('last_scraped_at', thirtyDaysAgo.toISOString());

    console.log(`${domain.domain}: ${count || 0} stale pages`);
  }

  // Check if system handles 404s
  console.log('\nChecking for 404/error handling...');
  const { data: errorPages } = await supabase!
    .from('scraped_pages')
    .select('url, status, error_message')
    .eq('status', 'failed')
    .limit(5);

  console.log(`\nPages with errors: ${errorPages?.length || 0}`);
  if (errorPages && errorPages.length > 0) {
    errorPages.forEach(p => {
      console.log(`  - ${p.url}: ${p.error_message || 'Unknown error'}`);
    });
  }

  // Check what "updated_at" vs "last_scraped_at" shows
  console.log('\nComparing updated_at vs last_scraped_at:');
  const { count: updatedAtStale } = await supabase!
    .from('scraped_pages')
    .select('*', { count: 'exact', head: true })
    .lt('updated_at', thirtyDaysAgo.toISOString());

  const { count: scrapedAtStale } = await supabase!
    .from('scraped_pages')
    .select('*', { count: 'exact', head: true })
    .lt('last_scraped_at', thirtyDaysAgo.toISOString());

  console.log(`  Stale by updated_at: ${updatedAtStale || 0}`);
  console.log(`  Stale by last_scraped_at: ${scrapedAtStale || 0}`);
}

checkStalePages().then(() => process.exit(0));
