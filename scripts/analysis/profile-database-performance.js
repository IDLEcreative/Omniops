#!/usr/bin/env node

import { getSupabaseClient } from './profile-database-performance/supabase-client.js';
import { profileInsertOperations } from './profile-database-performance/insert-profiler.js';
import { profileQueryPatterns } from './profile-database-performance/query-profiler.js';
import { profileBatchOperations } from './profile-database-performance/batch-profiler.js';
import { checkIndexes } from './profile-database-performance/index-checker.js';
import { generateFinalReport } from './profile-database-performance/reporting.js';

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🔬 OMNIOPS DATABASE PERFORMANCE PROFILER');
  console.log('='.repeat(60));
  console.log('\nInitializing performance analysis...\n');

  const startTime = Date.now();
  const supabase = getSupabaseClient();

  try {
    const { error } = await supabase.from('scraped_pages').select('id').limit(1);
    if (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }

    console.log('✅ Database connection established\n');

    await profileInsertOperations(supabase);
    await profileQueryPatterns(supabase);
    await profileBatchOperations(supabase);
    await checkIndexes(supabase);
    await generateFinalReport(supabase, startTime);
  } catch (error) {
    console.error('\n❌ Profiling error:', error.message);
    process.exit(1);
  }
}

main();
