#!/usr/bin/env node

// MIGRATED: Now uses environment variables via supabase-config.js
import { getSupabaseConfig, executeSQL } from './supabase-config.js';

const config = getSupabaseConfig();

async function checkRLSQual() {
  console.log('📊 Checking Actual RLS Policy Definitions\n');
  console.log('=' .repeat(60));
  
  const checkSql = `
    SELECT 
      tablename,
      policyname,
      qual,
      LENGTH(qual) as qual_length
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename IN ('businesses', 'business_configs')
    ORDER BY tablename;
  `;
  
  try {
    const result = await executeSQL(config, checkSql);
    
    result.forEach(r => {
      console.log(`\n📋 ${r.tablename}.${r.policyname}:`);
      console.log('Policy Definition:');
      console.log(r.qual);
      console.log(`Length: ${r.qual_length} characters`);
      
      // Check for optimization patterns
      if (r.qual.includes('(SELECT current_setting')) {
        console.log('✅ Contains (SELECT current_setting - OPTIMIZED');
      } else if (r.qual.includes('current_setting')) {
        console.log('❌ Contains current_setting without SELECT wrapper - NOT OPTIMIZED');
      }
      
      if (r.qual.includes('(SELECT auth.')) {
        console.log('✅ Contains (SELECT auth. - OPTIMIZED');
      } else if (r.qual.includes('auth.')) {
        console.log('❌ Contains auth. without SELECT wrapper - NOT OPTIMIZED');
      }
    });
    
    // Now let's try a different approach - using auth.role() instead
    console.log('\n' + '=' .repeat(60));
    console.log('\n🔧 Alternative Approach: Using auth.role() function\n');
    
    const testPolicySql = `
      -- Test creating a policy with auth.role()
      DROP POLICY IF EXISTS "test_policy" ON businesses;
      
      CREATE POLICY "test_policy" ON businesses
        FOR ALL
        USING (
          (SELECT auth.role()) = 'service_role'
        );
    `;
    
    console.log('Creating test policy with (SELECT auth.role()) pattern...');
    await executeSQL(config, testPolicySql);
    
    // Check the test policy
    const checkTestSql = `
      SELECT 
        policyname,
        qual
      FROM pg_policies
      WHERE schemaname = 'public'
      AND tablename = 'businesses'
      AND policyname = 'test_policy';
    `;
    
    const testResult = await executeSQL(config, checkTestSql);
    if (testResult.length > 0) {
      console.log('\nTest Policy Created:');
      console.log(testResult[0].qual);

      // Clean up test
      await executeSQL(config, `DROP POLICY IF EXISTS "test_policy" ON businesses;`);
      console.log('\n✅ Test policy cleaned up');
    }
    
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
}

checkRLSQual().catch(console.error);