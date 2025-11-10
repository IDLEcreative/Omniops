import { createServiceRoleClient } from '@/lib/supabase-server';

async function checkDeletedPages() {
  const supabase = await createServiceRoleClient();

  console.log('📊 Deleted Pages Report\n');

  // Count by status
  const { data: allPages } = await supabase
    .from('scraped_pages')
    .select('status');

  const statusCounts: Record<string, number> = {};
  allPages?.forEach(row => {
    const status = row.status || 'null';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  console.log('Status Distribution:');
  Object.entries(statusCounts).forEach(([status, count]) => {
    const icon = status === 'deleted' ? '🗑️' : status === 'completed' ? '✅' : '❌';
    console.log(`  ${icon} ${status}: ${count}`);
  });

  // Recent deleted pages
  const { data: recentDeleted } = await supabase
    .from('scraped_pages')
    .select('url, last_scraped_at, metadata')
    .eq('status', 'deleted')
    .order('last_scraped_at', { ascending: false })
    .limit(10);

  if (recentDeleted && recentDeleted.length > 0) {
    console.log('\n🗑️ Recently Deleted Pages (last 10):');
    recentDeleted.forEach(page => {
      console.log(`  - ${page.url}`);
      console.log(`    Last seen: ${page.last_scraped_at}`);
      const errorMessage = (page.metadata as any)?.error_message || 'Unknown';
      console.log(`    Reason: ${errorMessage}`);
    });
  }

  // Pages ready for cleanup (>30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { count } = await supabase
    .from('scraped_pages')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'deleted')
    .lt('last_scraped_at', thirtyDaysAgo.toISOString());

  console.log(`\n🧹 Pages ready for cleanup (>30 days): ${count || 0}`);
}

checkDeletedPages().catch(console.error);
