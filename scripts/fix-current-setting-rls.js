#!/usr/bin/env node

import https from 'node:https';

const PROJECT_REF = 'birugqyuqhiahxvxeyqg';
const ACCESS_TOKEN = 'sbp_3d1fa3086b18fbca507ee9b65042aa264395e1b8';

async function executeSQL(sql, description) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ query: sql });
    
    const options = {
      hostname: 'api.supabase.com',
      port: 443,
      path: `/v1/projects/${PROJECT_REF}/database/query`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(result);
          } else {
            reject(new Error(result.error || result.message || `HTTP ${res.statusCode}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    });
    
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

const fixCurrentSettingPolicies = [
  {
    name: 'Drop and recreate businesses policy with optimized current_setting',
    sql: `
      DROP POLICY IF EXISTS "Service role access only" ON businesses;
      
      CREATE POLICY "Service role access only" ON businesses
        FOR ALL
        USING (
          (SELECT current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
        );
    `
  },
  {
    name: 'Drop and recreate business_configs policy with optimized current_setting',
    sql: `
      DROP POLICY IF EXISTS "Service role access only" ON business_configs;
      
      CREATE POLICY "Service role access only" ON business_configs
        FOR ALL
        USING (
          (SELECT current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
        );
    `
  },
  {
    name: 'Drop and recreate business_usage policy with optimized current_setting',
    sql: `
      DROP POLICY IF EXISTS "Service role access only" ON business_usage;
      
      CREATE POLICY "Service role access only" ON business_usage
        FOR ALL
        USING (
          (SELECT current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
        );
    `
  },
  {
    name: 'Drop and recreate customer_verifications policy with optimized current_setting',
    sql: `
      DROP POLICY IF EXISTS "Service role access only" ON customer_verifications;
      
      CREATE POLICY "Service role access only" ON customer_verifications
        FOR ALL
        USING (
          (SELECT current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
        );
    `
  },
  {
    name: 'Drop and recreate customer_access_logs policy with optimized current_setting',
    sql: `
      DROP POLICY IF EXISTS "Service role access only" ON customer_access_logs;
      
      CREATE POLICY "Service role access only" ON customer_access_logs
        FOR ALL
        USING (
          (SELECT current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
        );
    `
  },
  {
    name: 'Drop and recreate customer_data_cache policy with optimized current_setting',
    sql: `
      DROP POLICY IF EXISTS "Service role access only" ON customer_data_cache;
      
      CREATE POLICY "Service role access only" ON customer_data_cache
        FOR ALL
        USING (
          (SELECT current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
        );
    `
  }
];

async function fixCurrentSettingRLS() {
  console.log('🔧 Fixing current_setting() RLS Performance Issues');
  console.log('=' .repeat(60));
  console.log('Wrapping current_setting() calls in SELECT subqueries...\n');
  
  let successCount = 0;
  let errorCount = 0;
  const errors = [];
  
  for (const policy of fixCurrentSettingPolicies) {
    process.stdout.write(`⏳ ${policy.name}... `);
    
    try {
      await executeSQL(policy.sql, policy.name);
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
  console.log('\n📊 Verifying RLS Optimization...');
  
  const verifySql = `
    SELECT 
      tablename,
      policyname,
      CASE 
        WHEN qual LIKE '%(SELECT current_setting%' THEN 'OPTIMIZED'
        WHEN qual LIKE '%current_setting%' THEN 'NOT OPTIMIZED'
        ELSE 'N/A'
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
    const result = await executeSQL(verifySql);
    if (result && result.length > 0) {
      console.log('\nPolicy Optimization Status:');
      let allOptimized = true;
      result.forEach(r => {
        const icon = r.optimization_status === 'OPTIMIZED' ? '✅' : '❌';
        console.log(`   ${icon} ${r.tablename}.${r.policyname}: ${r.optimization_status}`);
        if (r.optimization_status !== 'OPTIMIZED') {
          allOptimized = false;
        }
      });
      
      if (allOptimized) {
        console.log('\n✅ All policies are now optimized!');
      }
    }
  } catch (error) {
    console.log(`Verification error: ${error.message}`);
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('📊 Summary:');
  console.log(`✅ Successful: ${successCount}/${fixCurrentSettingPolicies.length}`);
  console.log(`❌ Failed: ${errorCount}/${fixCurrentSettingPolicies.length}`);
  
  if (successCount === fixCurrentSettingPolicies.length) {
    console.log('\n✨ All current_setting() calls are now optimized!');
    console.log('\n🎯 Performance Impact:');
    console.log('  • current_setting() now uses InitPlan (evaluated once)');
    console.log('  • Eliminates per-row JWT claims parsing');
    console.log('  • Reduces CPU overhead for service_role checks');
    console.log('  • Improves query performance at scale');
    
    console.log('\n📝 Technical Details:');
    console.log('  • Changed: current_setting(...) ');
    console.log('  • To: (SELECT current_setting(...))');
    console.log('  • Result: PostgreSQL creates an InitPlan subquery');
    console.log('  • Benefit: One evaluation instead of N evaluations');
  } else if (errorCount > 0) {
    console.log('\n⚠️  Some policies failed to update. Review errors above.');
  }
}

// Run the fixes
fixCurrentSettingRLS().catch(console.error);