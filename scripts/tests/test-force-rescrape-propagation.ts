import { crawlWebsite } from '@/lib/scraper-api-crawl';

async function testForceRescrapePropagation() {
  console.log('🧪 Testing forceRescrape Flag Propagation\n');

  // Test with forceRescrape=true
  console.log('Test 1: forceRescrape=true');
  const jobId = await crawlWebsite('https://example.com', {
    maxPages: 1,
    forceRescrape: true,
    turboMode: false,
  });

  console.log(`Job started: ${jobId}`);
  console.log('\n📋 Expected Log Sequence:');
  console.log('  1. [CrawlWebsite] forceRescrape option: true');
  console.log('  2. [CrawlWebsite] forceRescrape flag to worker: "true"');
  console.log('  3. [Worker] Arg received: "true"');
  console.log('  4. [Worker] Final FORCE_RESCRAPE: true');
  console.log('  5. [Worker] Will FORCE re-scraping');
  console.log('\n✅ Check worker logs for this sequence');

  console.log('\n' + '='.repeat(60));
  console.log('Test 2: forceRescrape=false (default)');

  const jobId2 = await crawlWebsite('https://example.com', {
    maxPages: 1,
    turboMode: false,
  });

  console.log(`Job started: ${jobId2}`);
  console.log('\n📋 Expected Log Sequence:');
  console.log('  1. [CrawlWebsite] forceRescrape option: undefined');
  console.log('  2. [CrawlWebsite] forceRescrape flag to worker: "false"');
  console.log('  3. [Worker] Arg received: "false"');
  console.log('  4. [Worker] Final FORCE_RESCRAPE: false');
  console.log('  5. [Worker] Will SKIP re-scraping');
  console.log('\n✅ Check worker logs for this sequence');
}

testForceRescrapePropagation().catch(console.error);
