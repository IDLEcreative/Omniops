import { getSupabaseConfig, executeSQL } from '../../supabase-config.js';
import { optimizationSteps } from './steps';

export async function runRlsOptimizations() {
  const config = getSupabaseConfig();
  console.log('🔒 Applying RLS Performance Optimizations');
  console.log('='.repeat(60));
  console.log('Fixes 100+ policy warnings (auth re-evaluation, duplicates, missing helper functions).');

  let successCount = 0;
  let errorCount = 0;
  const errors: Array<{ step: string; error: string }> = [];

  for (const step of optimizationSteps) {
    process.stdout.write(`⏳ ${step.name}... `);
    try {
      await executeSQL(config, step.sql);
      console.log('✅');
      successCount++;
    } catch (error: any) {
      console.log(`❌ ${error.message}`);
      errorCount++;
      errors.push({ step: step.name, error: error.message });
    }
    await sleep(500);
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 RLS Optimization Summary:');
  console.log(`✅ Successful: ${successCount}/${optimizationSteps.length}`);
  console.log(`❌ Failed: ${errorCount}/${optimizationSteps.length}`);

  if (errorCount > 0) {
    console.log('\n⚠️  Failed operations:');
    errors.forEach(entry => console.log(`  • ${entry.step}: ${entry.error}`));
  } else {
    logSuccessSummary();
  }
}

function logSuccessSummary() {
  console.log('\n✨ All RLS optimizations applied successfully!');
  console.log('\n📈 Expected Improvements:');
  console.log('  • 50-80% reduction in RLS evaluation overhead');
  console.log('  • Consolidated policies and cached helper functions');
  console.log('  • Service role now bypasses RLS entirely');

  console.log('\n🔍 Verify by:');
  console.log('  1. Monitoring Supabase query performance dashboard');
  console.log('  2. Checking EXPLAIN ANALYZE output for InitPlan usage');
  console.log('  3. Running integration tests');
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
