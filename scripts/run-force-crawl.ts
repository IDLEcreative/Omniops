#!/usr/bin/env -S npx tsx

// Force a full re-crawl of Thompsons E Parts with nav/header/footer stripping applied
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { crawlWebsite } from '../lib/scraper-api';

// Load environment from .env.local to ensure worker inherits Supabase/OpenAI keys
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

async function main() {
  const target = 'https://www.thompsonseparts.co.uk';
  console.log('Starting forced full crawl of:', target);

  // Make sure required env vars are present before spawning worker
  const required = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'OPENAI_API_KEY'];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    console.error('Missing required env vars:', missing.join(', '));
    process.exit(1);
  }

  // Optional: allow forcing via env too
  process.env.SCRAPER_FORCE_RESCRAPE_ALL = 'true';

  try {
    const jobId = await crawlWebsite(target, {
      maxPages: -1,            // Entire site
      turboMode: true,         // Faster crawling
      forceRescrape: true,     // Bypass recency checks
      useNewConfig: true,      // Use enhanced config mapping
      newConfigPreset: 'production',
      // excludePaths where scraping is not useful for RAG
      excludePaths: ['/wp-admin', '/admin', '/login', '/cart', '/checkout'],
    });

    console.log('Crawl started. Job ID:', jobId);
    console.log('Worker output will stream below (stdio inherited). Watch for errors...');
  } catch (err: any) {
    console.error('Failed to start crawl:', err?.message || err);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('Unexpected error running crawl:', e);
  process.exit(1);
});

