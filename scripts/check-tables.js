#!/usr/bin/env node

import { executeSQL } from './supabase-config.js';

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