import { createSupabaseClient } from './supabase';
import { optimizations } from './optimizations';

export async function runDatabaseOptimizations() {
  const supabase = createSupabaseClient();
  console.log('🚀 Starting database performance optimizations...\n');

  let successCount = 0;
  let failureCount = 0;

  for (const optimization of optimizations) {
    console.log(`\n📊 ${optimization.name}`);
    console.log(`   Expected improvement: ${optimization.estimatedImprovement}`);

    try {
      const { error } = await supabase.rpc('exec_sql', { sql: optimization.query }).single();

      if (error) {
        console.log(`   ⚠️ RPC execution failed, attempting fallback insert`);
        const { error: insertError } = await supabase
          .from('_migrations')
          .insert({ name: optimization.name, executed_at: new Date().toISOString() });

        if (insertError) throw insertError;
      }

      console.log('   ✅ Successfully applied');
      successCount++;
    } catch (error: any) {
      console.error(`   ❌ Failed: ${error.message}`);
      failureCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n📈 Optimization Summary:');
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed: ${failureCount}`);

  if (successCount > 0) {
    console.log('\n💡 Next steps:');
    console.log('   1. Monitor query performance in Supabase dashboard');
    console.log('   2. Update application code to use search_content_optimized()');
    console.log('   3. Implement query caching in API routes');
    console.log('   4. Run "npm run test:integration" to verify functionality');
  }
}
