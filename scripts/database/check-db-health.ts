#!/usr/bin/env tsx
/**
 * Database Health Check Script
 * Checks for common database issues and potential problems
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseHealth() {
  console.log('🔍 Database Health Check');
  console.log('='.repeat(60));

  try {
    // 1. Check table row counts
    console.log('\n📊 Table Row Counts:');

    const tables = [
      'conversations',
      'messages',
      'scraped_pages',
      'page_embeddings',
      'customer_configs',
      'structured_extractions',
      'scrape_jobs',
      'query_cache'
    ];

    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`  ⚠️  ${table}: Error - ${error.message}`);
      } else {
        console.log(`  ✓  ${table}: ${count?.toLocaleString() || 0} rows`);
      }
    }

    // 2. Check customer configurations
    console.log('\n👥 Customer Configurations:');
    const { data: configs, error: configError } = await supabase
      .from('customer_configs')
      .select('domain, created_at');

    if (configError) {
      console.log('  ⚠️  Error fetching configs:', configError.message);
    } else if (configs) {
      console.log(`  ✓  ${configs.length} customer(s) configured`);
      configs.forEach((c: any) => {
        console.log(`      - ${c.domain} (since ${new Date(c.created_at).toLocaleDateString()})`);
      });
    }

    // 3. Check for large tables that might need maintenance
    console.log('\n⚡ Performance Checks:');

    const { count: largeMessages } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true });

    if (largeMessages && largeMessages > 10000) {
      console.log(`  ⚠️  messages table has ${largeMessages.toLocaleString()} rows - consider archiving old data`);
    } else {
      console.log(`  ✓  messages table size is manageable (${largeMessages?.toLocaleString() || 0} rows)`);
    }

    const { count: largePages } = await supabase
      .from('scraped_pages')
      .select('*', { count: 'exact', head: true });

    if (largePages && largePages > 5000) {
      console.log(`  ⚠️  scraped_pages table has ${largePages.toLocaleString()} rows - consider cleanup`);
    } else {
      console.log(`  ✓  scraped_pages table size is manageable (${largePages?.toLocaleString() || 0} rows)`);
    }

    // 4. Check embeddings coverage
    console.log('\n🔍 Embeddings Coverage:');
    const { count: pagesCount } = await supabase
      .from('scraped_pages')
      .select('*', { count: 'exact', head: true });

    const { count: embeddingsCount } = await supabase
      .from('page_embeddings')
      .select('*', { count: 'exact', head: true });

    if (pagesCount && embeddingsCount) {
      const coverage = ((embeddingsCount / pagesCount) * 100).toFixed(1);
      if (parseFloat(coverage) < 90) {
        console.log(`  ⚠️  Only ${coverage}% of pages have embeddings (${embeddingsCount}/${pagesCount})`);
      } else {
        console.log(`  ✓  Good embeddings coverage: ${coverage}% (${embeddingsCount}/${pagesCount})`);
      }
    }

    // 5. Check for stale data
    console.log('\n🕒 Data Freshness:');
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: oldPages } = await supabase
      .from('scraped_pages')
      .select('*', { count: 'exact', head: true })
      .lt('updated_at', thirtyDaysAgo.toISOString());

    if (oldPages && oldPages > 0) {
      console.log(`  ⚠️  ${oldPages} pages haven't been updated in 30+ days`);
    } else {
      console.log('  ✓  All pages are relatively fresh');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Health check complete\n');

  } catch (error) {
    console.error('\n❌ Health check failed:', error);
    process.exit(1);
  }
}

checkDatabaseHealth();
