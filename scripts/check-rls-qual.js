#!/usr/bin/env node

import https from 'node:https';

const PROJECT_REF = 'birugqyuqhiahxvxeyqg';
const ACCESS_TOKEN = 'sbp_3d1fa3086b18fbca507ee9b65042aa264395e1b8';

async function executeSQL(sql) {
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
            reject(new Error(result.error || `HTTP ${res.statusCode}`));
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
    const result = await executeSQL(checkSql);
    
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
    await executeSQL(testPolicySql);
    
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
    
    const testResult = await executeSQL(checkTestSql);
    if (testResult.length > 0) {
      console.log('\nTest Policy Created:');
      console.log(testResult[0].qual);
      
      // Clean up test
      await executeSQL(`DROP POLICY IF EXISTS "test_policy" ON businesses;`);
      console.log('\n✅ Test policy cleaned up');
    }
    
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
}

checkRLSQual().catch(console.error);