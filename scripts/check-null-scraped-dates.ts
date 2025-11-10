import { createServiceRoleClient } from '../lib/supabase-server';

async function check() {
  const supabase = await createServiceRoleClient();

  const thompsonsDomainId = '8dccd788-1ec1-43c2-af56-78aa3366bad3';

  // Check NULL last_scraped_at
  const { count: nullCount } = await supabase!
    .from('scraped_pages')
    .select('*', { count: 'exact', head: true })
    .eq('domain_id', thompsonsDomainId)
    .is('last_scraped_at', null);

  console.log(`Pages with NULL last_scraped_at: ${nullCount || 0}`);

  // Get oldest 5 pages
  const { data: oldest } = await supabase!
    .from('scraped_pages')
    .select('url, last_scraped_at, updated_at')
    .eq('domain_id', thompsonsDomainId)
    .order('last_scraped_at', { ascending: true, nullsFirst: false })
    .limit(5);

  console.log('\nOldest 5 pages:');
  oldest?.forEach(p => {
    const date = p.last_scraped_at || 'NULL';
    console.log(`  ${date}: ${p.url.substring(0, 60)}`);
  });
}

check().then(() => process.exit(0));
