#!/usr/bin/env -S npx tsx

// Enhanced crawl script with integrated cleanup
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { crawlWebsiteWithCleanup } from '../lib/scraper-with-cleanup';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

async function main() {
  const target = process.argv[2] || 'https://www.thompsonseparts.co.uk';
  console.log('🎯 Target:', target);
  
  // Make sure required env vars are present
  const required = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'OPENAI_API_KEY'];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    console.error('❌ Missing required env vars:', missing.join(', '));
    process.exit(1);
  }

  process.env.SCRAPER_FORCE_RESCRAPE_ALL = 'true';

  try {
    // This will:
    // 1. Clean up stuck jobs before starting
    // 2. Start the crawl
    // 3. For large crawls, run periodic cleanup
    // 4. Clean up after completion
    const jobId = await crawlWebsiteWithCleanup(target, {
      maxPages: -1,            // Entire site
      turboMode: true,         // Faster crawling
      forceRescrape: true,     // Bypass recency checks
      useNewConfig: true,      // Use enhanced config
      newConfigPreset: 'production',
      excludePaths: ['/wp-admin', '/admin', '/login', '/cart', '/checkout'],
    });

    console.log('✅ Crawl started with automatic cleanup. Job ID:', jobId);
    console.log('📊 The cleanup will run:');
    console.log('   • Before starting (to clear old stuck jobs)');
    console.log('   • Every 30 minutes during large crawls');
    console.log('   • After completion (or on error)');
    console.log('\nNo need for a separate cleanup service!');
  } catch (err: any) {
    console.error('❌ Failed to start crawl:', err?.message || err);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('💥 Unexpected error:', e);
  process.exit(1);
});