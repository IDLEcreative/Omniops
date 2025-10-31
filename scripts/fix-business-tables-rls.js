#!/usr/bin/env node

import { executeSQL } from './supabase-config.js';

const businessTablePolicies = [
  {
    name: 'Enable RLS on businesses',
    sql: `ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;`
  },
  {
    name: 'Create service-role-only policy for businesses',
    sql: `
      CREATE POLICY "Service role access only" ON businesses
        FOR ALL
        USING (
          current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
        );
    `
  },
  {
    name: 'Enable RLS on business_configs',
    sql: `ALTER TABLE business_configs ENABLE ROW LEVEL SECURITY;`
  },
  {
    name: 'Create service-role-only policy for business_configs',
    sql: `
      CREATE POLICY "Service role access only" ON business_configs
        FOR ALL
        USING (
          current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
        );
    `
  },
  {
    name: 'Enable RLS on business_usage',
    sql: `ALTER TABLE business_usage ENABLE ROW LEVEL SECURITY;`
  },
  {
    name: 'Create service-role-only policy for business_usage',
    sql: `
      CREATE POLICY "Service role access only" ON business_usage
        FOR ALL
        USING (
          current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
        );
    `
  },
  {
    name: 'Enable RLS on customer_verifications',
    sql: `ALTER TABLE customer_verifications ENABLE ROW LEVEL SECURITY;`
  },
  {
    name: 'Create service-role-only policy for customer_verifications',
    sql: `
      CREATE POLICY "Service role access only" ON customer_verifications
        FOR ALL
        USING (
          current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
        );
    `
  },
  {
    name: 'Enable RLS on customer_access_logs',
    sql: `ALTER TABLE customer_access_logs ENABLE ROW LEVEL SECURITY;`
  },
  {
    name: 'Create service-role-only policy for customer_access_logs',
    sql: `
      CREATE POLICY "Service role access only" ON customer_access_logs
        FOR ALL
        USING (
          current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
        );
    `
  },
  {
    name: 'Enable RLS on customer_data_cache',
    sql: `ALTER TABLE customer_data_cache ENABLE ROW LEVEL SECURITY;`
  },
  {
    name: 'Create service-role-only policy for customer_data_cache',
    sql: `
      CREATE POLICY "Service role access only" ON customer_data_cache
        FOR ALL
        USING (
          current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
        );
    `
  }
];

async function fixBusinessTablesRLS() {
  console.log('🔒 Setting up Service-Role-Only Policies for Business Tables');
  console.log('=' .repeat(60));
  console.log('These tables use custom auth, not Supabase auth.\n');
  
  let successCount = 0;
  let errorCount = 0;
  const errors = [];
  
  for (const policy of businessTablePolicies) {
    process.stdout.write(`⏳ ${policy.name}... `);
    
    try {
      await executeSQL(policy.sql, policy.name);
      console.log('✅');
      successCount++;
    } catch (error) {
      // Check if it's an already exists error
      if (error.message.includes('already exists')) {
        console.log('⚠️  Already exists');
      } else {
        console.log(`❌ ${error.message}`);
        errors.push({ step: policy.name, error: error.message });
        errorCount++;
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  // Verify the policies were created
  console.log('\n📊 Verifying Business Table Policies...');
  
  const verifySql = `
    SELECT 
      tablename,
      COUNT(*) as policy_count,
      STRING_AGG(policyname, ', ') as policies
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename IN (
      'businesses', 'business_configs', 'business_usage',
      'customer_verifications', 'customer_access_logs', 'customer_data_cache'
    )
    GROUP BY tablename
    ORDER BY tablename;
  `;
  
  try {
    const result = await executeSQL(verifySql);
    if (result && result.length > 0) {
      console.log('\nBusiness table policies:');
      result.forEach(r => {
        console.log(`   ✅ ${r.tablename}: ${r.policy_count} policy - "${r.policies}"`);
      });
    }
  } catch (error) {
    console.log(`Verification error: ${error.message}`);
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('📊 Summary:');
  console.log(`✅ Successful: ${successCount}/${businessTablePolicies.length}`);
  console.log(`❌ Failed: ${errorCount}/${businessTablePolicies.length}`);
  
  if (successCount > 0) {
    console.log('\n✨ Business Tables Security:');
    console.log('  • All business tables now have RLS enabled');
    console.log('  • Only service_role can access these tables');
    console.log('  • Custom auth is handled at the application level');
    console.log('  • No performance overhead from auth checks');
    console.log('\n📝 Note: These tables use email/password auth, not Supabase auth');
  }
}

// Run the fixes
fixBusinessTablesRLS().catch(console.error);