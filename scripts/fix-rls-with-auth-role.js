#!/usr/bin/env node

// MIGRATED: Now uses environment variables via supabase-config.js
import { getSupabaseConfig, executeSQL } from './supabase-config.js';

const config = getSupabaseConfig();

const fixWithAuthRole = [
  {
    name: 'Fix businesses policy with auth.role()',
    sql: `
      DROP POLICY IF EXISTS "Service role access only" ON businesses;
      
      CREATE POLICY "Service role access only" ON businesses
        FOR ALL
        USING (
          (SELECT auth.role()) = 'service_role'
        );
    `
  },
  {
    name: 'Fix business_configs policy with auth.role()',
    sql: `
      DROP POLICY IF EXISTS "Service role access only" ON business_configs;
      
      CREATE POLICY "Service role access only" ON business_configs
        FOR ALL
        USING (
          (SELECT auth.role()) = 'service_role'
        );
    `
  },
  {
    name: 'Fix business_usage policy with auth.role()',
    sql: `
      DROP POLICY IF EXISTS "Service role access only" ON business_usage;
      
      CREATE POLICY "Service role access only" ON business_usage
        FOR ALL
        USING (
          (SELECT auth.role()) = 'service_role'
        );
    `
  },
  {
    name: 'Fix customer_verifications policy with auth.role()',
    sql: `
      DROP POLICY IF EXISTS "Service role access only" ON customer_verifications;
      
      CREATE POLICY "Service role access only" ON customer_verifications
        FOR ALL
        USING (
          (SELECT auth.role()) = 'service_role'
        );
    `
  },
  {
    name: 'Fix customer_access_logs policy with auth.role()',
    sql: `
      DROP POLICY IF EXISTS "Service role access only" ON customer_access_logs;
      
      CREATE POLICY "Service role access only" ON customer_access_logs
        FOR ALL
        USING (
          (SELECT auth.role()) = 'service_role'
        );
    `
  },
  {
    name: 'Fix customer_data_cache policy with auth.role()',
    sql: `
      DROP POLICY IF EXISTS "Service role access only" ON customer_data_cache;
      
      CREATE POLICY "Service role access only" ON customer_data_cache
        FOR ALL
        USING (
          (SELECT auth.role()) = 'service_role'
        );
    `
  }
];

async function fixRLSWithAuthRole() {
  console.log('🔧 Final RLS Fix: Using auth.role() Function');
  console.log('=' .repeat(60));
  console.log('Replacing current_setting() with auth.role() for optimal performance...\n');
  
  let successCount = 0;
  let errorCount = 0;
  const errors = [];
  
  for (const policy of fixWithAuthRole) {
    process.stdout.write(`⏳ ${policy.name}... `);

    try {
      await executeSQL(config, policy.sql);
      console.log('✅');
      successCount++;
    } catch (error) {
      console.log(`❌ ${error.message}`);
      errors.push({ step: policy.name, error: error.message });
      errorCount++;
    }

    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  // Verify the optimization
  console.log('\n📊 Final Verification...');
  
  const verifySql = `
    SELECT 
      tablename,
      policyname,
      qual,
      CASE 
        WHEN qual LIKE '%(( SELECT auth.role()%' THEN 'OPTIMIZED with auth.role()'
        WHEN qual LIKE '%current_setting%' THEN 'Uses current_setting'
        ELSE 'Other pattern'
      END as optimization_status
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename IN (
      'businesses', 'business_configs', 'business_usage',
      'customer_verifications', 'customer_access_logs', 'customer_data_cache'
    )
    ORDER BY tablename;
  `;
  
  try {
    const result = await executeSQL(config, verifySql);
    if (result && result.length > 0) {
      console.log('\n📋 Final Policy Status:');
      let allOptimized = true;
      result.forEach(r => {
        const isOptimized = r.optimization_status.includes('OPTIMIZED');
        const icon = isOptimized ? '✅' : '⚠️';
        console.log(`   ${icon} ${r.tablename}: ${r.optimization_status}`);
        if (!isOptimized) {
          allOptimized = false;
        }
      });
      
      if (allOptimized) {
        console.log('\n✅ All policies are now fully optimized with auth.role()!');
      }
    }
  } catch (error) {
    console.log(`Verification error: ${error.message}`);
  }
  
  // Test query performance
  console.log('\n🚀 Testing Query Performance...');
  
  const testSql = `
    EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
    SELECT COUNT(*) FROM businesses;
  `;
  
  try {
    const explainResult = await executeSQL(config, testSql);
    if (explainResult && explainResult.length > 0) {
      const plan = explainResult[0]['QUERY PLAN'];
      if (plan && plan[0]) {
        const hasInitPlan = JSON.stringify(plan).includes('InitPlan');
        const executionTime = plan[0]['Execution Time'];
        
        console.log(`   Execution Time: ${executionTime || 'N/A'}ms`);
        console.log(`   Uses InitPlan: ${hasInitPlan ? 'Yes ✅' : 'No ❌'}`);
      }
    }
  } catch (error) {
    // Query plan might fail due to permissions, that's ok
    console.log('   Query plan not available (expected for RLS-protected tables)');
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('📊 Summary:');
  console.log(`✅ Successful: ${successCount}/${fixWithAuthRole.length}`);
  console.log(`❌ Failed: ${errorCount}/${fixWithAuthRole.length}`);
  
  if (successCount === fixWithAuthRole.length) {
    console.log('\n✨ RLS Performance Fully Optimized!');
    console.log('\n🎯 What was fixed:');
    console.log('  • Replaced current_setting() with auth.role()');
    console.log('  • Wrapped auth.role() in SELECT for InitPlan');
    console.log('  • Eliminated per-row JWT parsing overhead');
    console.log('  • Reduced function call overhead');
    
    console.log('\n📈 Performance Benefits:');
    console.log('  • auth.role() is faster than current_setting()');
    console.log('  • InitPlan evaluates once per query, not per row');
    console.log('  • Better query plan optimization');
    console.log('  • Lower CPU usage at scale');
    
    console.log('\n✅ All 6 linter warnings should now be resolved!');
  } else if (errorCount > 0) {
    console.log('\n⚠️  Some policies failed to update. Review errors above.');
  }
}

// Run the fixes
fixRLSWithAuthRole().catch(console.error);