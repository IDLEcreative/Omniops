/**
 * One-time bulk refresh of all stale pages
 * Run this to refresh all 4,491+ stale pages at once
 */

import { createServiceRoleClient } from '../lib/supabase-server';
import { refreshDomainContent } from '../lib/content-refresh';

async function bulkRefreshStalePages() {
  const supabase = await createServiceRoleClient();

  if (!supabase) {
    console.error('❌ Database connection unavailable');
    process.exit(1);
  }

  console.log('🔄 Starting bulk refresh of stale pages...\n');

  // Get all domains
  const { data: domains, error } = await supabase
    .from('domains')
    .select('id, domain')
    .eq('active', true);

  if (error) {
    console.error('❌ Error fetching domains:', error);
    process.exit(1);
  }

  if (!domains || domains.length === 0) {
    console.log('ℹ️  No active domains found');
    process.exit(0);
  }

  console.log(`Found ${domains.length} active domains\n`);

  let totalRefreshed = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  // Process each domain with NO LIMIT
  for (const domain of domains) {
    console.log(`\n📍 Processing: ${domain.domain}`);
    console.log('─'.repeat(60));

    try {
      const stats = await refreshDomainContent(domain.id, {
        forceRefresh: false,
        maxPages: 10000, // Very high limit - refresh everything
      });

      console.log(`  ✅ Refreshed: ${stats.refreshed}`);
      console.log(`  ⏭️  Skipped: ${stats.skipped}`);
      console.log(`  ❌ Failed: ${stats.failed}`);

      totalRefreshed += stats.refreshed;
      totalSkipped += stats.skipped;
      totalFailed += stats.failed;
    } catch (error) {
      console.error(`  ❌ Error processing ${domain.domain}:`, error);
      totalFailed++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 BULK REFRESH COMPLETE');
  console.log('='.repeat(60));
  console.log(`Total Refreshed: ${totalRefreshed}`);
  console.log(`Total Skipped: ${totalSkipped}`);
  console.log(`Total Failed: ${totalFailed}`);
  console.log('='.repeat(60));
}

bulkRefreshStalePages()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
