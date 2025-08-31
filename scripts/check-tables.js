#!/usr/bin/env node

const https = require('https');

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

async function checkTables() {
  console.log('📊 Checking existing tables and RLS policies...\n');
  
  // Check which tables exist
  const tableCheckSql = `
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN (
      'businesses', 'business_configs', 'business_usage',
      'customer_verifications', 'customer_access_logs', 
      'customer_data_cache', 'domains', 'scraped_pages',
      'website_content', 'structured_extractions', 'scrape_jobs'
    )
    ORDER BY tablename;
  `;
  
  const tables = await executeSQL(tableCheckSql);
  console.log('✅ Existing tables:');
  tables.forEach(t => console.log(`   • ${t.tablename}`));
  
  // Check current RLS policies
  const policyCheckSql = `
    SELECT 
      schemaname,
      tablename,
      policyname,
      permissive,
      roles,
      cmd
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename IN (
      'domains', 'scraped_pages', 'website_content',
      'structured_extractions', 'scrape_jobs'
    )
    ORDER BY tablename, policyname;
  `;
  
  const policies = await executeSQL(policyCheckSql);
  console.log('\n📋 Current RLS policies:');
  
  let currentTable = '';
  policies.forEach(p => {
    if (p.tablename !== currentTable) {
      currentTable = p.tablename;
      console.log(`\n   ${p.tablename}:`);
    }
    console.log(`     • ${p.policyname} (${p.cmd})`);
  });
  
  // Check if helper functions exist
  const functionCheckSql = `
    SELECT 
      proname AS function_name,
      prosrc AS source
    FROM pg_proc
    WHERE pronamespace = 'public'::regnamespace
    AND proname IN ('get_user_domain_ids', 'get_user_business_ids')
    ORDER BY proname;
  `;
  
  const functions = await executeSQL(functionCheckSql);
  console.log('\n🔧 Helper functions:');
  if (functions.length > 0) {
    functions.forEach(f => console.log(`   ✅ ${f.function_name}`));
  } else {
    console.log('   ❌ No helper functions found');
  }
  
  // Check for performance issues in query plans
  console.log('\n🔍 Checking RLS performance patterns...');
  
  const perfCheckSql = `
    SELECT 
      tablename,
      policyname,
      CASE 
        WHEN qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid())%' 
        THEN 'NEEDS FIX: auth.uid() not wrapped in subquery'
        WHEN qual LIKE '%(SELECT auth.uid())%'
        THEN 'OPTIMIZED: Uses InitPlan pattern'
        ELSE 'OK: No auth.uid() calls'
      END AS performance_status
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename IN (
      'domains', 'scraped_pages', 'website_content',
      'structured_extractions', 'scrape_jobs'
    );
  `;
  
  const perfResults = await executeSQL(perfCheckSql);
  console.log('\nRLS Performance Analysis:');
  perfResults.forEach(r => {
    const icon = r.performance_status.startsWith('OPTIMIZED') ? '✅' : 
                 r.performance_status.startsWith('NEEDS FIX') ? '❌' : '✓';
    console.log(`   ${icon} ${r.tablename}.${r.policyname}: ${r.performance_status}`);
  });
}

checkTables().catch(console.error);