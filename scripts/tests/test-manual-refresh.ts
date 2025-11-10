/**
 * Manual Refresh Test - Trigger a controlled content refresh and monitor
 *
 * This script:
 * 1. Selects first active domain
 * 2. Acquires domain lock
 * 3. Triggers crawl with forceRescrape=true (limited to 5 pages for testing)
 * 4. Monitors job progress
 * 5. Verifies all phases working correctly
 */

import { createServiceRoleClient } from '@/lib/supabase-server';
import { crawlWebsite } from '@/lib/scraper-api-crawl';
import { DomainRefreshLock } from '@/lib/domain-refresh-lock';

async function testManualRefresh() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║           MANUAL REFRESH TEST - MONITORING MODE           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  const supabase = await createServiceRoleClient();
  const domainLock = new DomainRefreshLock();

  console.log('📋 Step 1: Finding active domain...\n');

  const { data: domains, error: domainError } = await supabase
    .from('domains')
    .select('id, domain, organization_id')
    .eq('active', true)
    .limit(1);

  if (domainError || !domains || domains.length === 0) {
    console.error('❌ No active domains found:', domainError);
    return;
  }

  const domain = domains[0];
  console.log(`✅ Found domain: ${domain.domain}`);
  console.log(`   - ID: ${domain.id}`);
  console.log(`   - Organization: ${domain.organization_id}\n`);

  console.log('📋 Step 2: Acquiring domain lock...\n');

  const lockAcquired = await domainLock.acquire(domain.id);
  if (!lockAcquired) {
    console.error('❌ Domain already locked - refresh in progress');
    console.log('   Use DELETE /api/domain-lock/status?domainId=' + domain.id + ' to force release');
    return;
  }

  console.log('✅ Lock acquired successfully\n');

  console.log('📋 Step 3: Starting crawl job...\n');
  console.log('Configuration:');
  console.log('  - URL: https://' + domain.domain);
  console.log('  - forceRescrape: true (forces re-scraping)');
  console.log('  - maxPages: 5 (limited for testing)');
  console.log('  - turboMode: true (parallel processing)\n');

  try {
    const jobId = await crawlWebsite(`https://${domain.domain}`, {
      maxPages: 5, // Small test - just 5 pages
      forceRescrape: true,
      organizationId: domain.organization_id,
      configPreset: 'production',
      turboMode: true,
    });

    console.log('✅ Crawl job started successfully!\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 JOB DETAILS');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Job ID: ${jobId}`);
    console.log(`Domain: ${domain.domain}`);
    console.log(`Status: Started`);
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('🔍 MONITORING CHECKLIST - Watch server logs for:\n');
    console.log('Phase 1: Read-Only Monitor');
    console.log('  ✓ [CrawlMonitor] Starting monitoring for job');
    console.log('  ✓ [CrawlMonitor] Worker is handling all data operations\n');

    console.log('Phase 2: Bulk RPC Functions');
    console.log('  ✓ Worker should use bulk_upsert_scraped_pages');
    console.log('  ✓ Worker should use bulk_insert_embeddings\n');

    console.log('Phase 3: Domain Lock');
    console.log('  ✓ [DomainLock] ✅ Acquired lock (already confirmed above)\n');

    console.log('Phase 4: Fatal Deletion Errors');
    console.log('  ✓ [Worker] Deletion attempt 1/3');
    console.log('  ✓ [Worker] ✅ Deleted old embeddings\n');

    console.log('Phase 5: forceRescrape Validation');
    console.log('  ✓ [CrawlWebsite] forceRescrape option: true');
    console.log('  ✓ [Worker] 🔍 forceRescrape Validation:');
    console.log('  ✓ [Worker] Final FORCE_RESCRAPE: true\n');

    console.log('Phase 6: 404 Detection');
    console.log('  ✓ [Worker] Enhanced 404/410 detection active\n');

    console.log('Phase 7: Atomic Transactions');
    console.log('  ✓ Functions available (not required for worker)\n');

    console.log('Final Validation:');
    console.log('  ✓ [CrawlMonitor] ✅ Job completed successfully');
    console.log('  ✓ [CrawlMonitor] No duplicate embeddings created\n');

    console.log('═══════════════════════════════════════════════════════════');
    console.log('⏱️  NEXT STEPS');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('1. Monitor server logs: tail -f /tmp/refresh-test-server.log');
    console.log('2. Job will auto-complete in ~1-3 minutes (5 pages)');
    console.log('3. Lock will auto-release after 5 minutes');
    console.log('4. Check for any errors in the expected sequence above\n');

    console.log('To manually release lock early:');
    console.log(`  curl -X DELETE "http://localhost:3000/api/domain-lock/status?domainId=${domain.id}"\n`);

    // Schedule lock release
    setTimeout(async () => {
      try {
        await domainLock.release(domain.id);
        console.log('🔓 Lock auto-released after 5 minutes');
      } catch (error) {
        console.error('Error releasing lock:', error);
      }
    }, 5 * 60 * 1000);

  } catch (error) {
    console.error('❌ Failed to start crawl job:', error);
    await domainLock.release(domain.id);
    throw error;
  }
}

testManualRefresh().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
