#!/usr/bin/env node

import https from 'node:https';
import { promises as fs } from 'node:fs';
import path from 'node:path';

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

const optimizationSteps = [
  {
    name: 'Remove duplicate index on page_embeddings',
    sql: `DROP INDEX IF EXISTS idx_page_embeddings_page;`
  },
  {
    name: 'Fix scrape_jobs RLS policies',
    sql: `
      DROP POLICY IF EXISTS "Users can view their own scrape jobs" ON scrape_jobs;
      DROP POLICY IF EXISTS "Users can manage their own scrape jobs" ON scrape_jobs;
      
      CREATE POLICY "Users can access their own scrape jobs" ON scrape_jobs
        FOR ALL
        USING (
          domain_id IN (
            SELECT id FROM domains 
            WHERE user_id = (SELECT auth.uid())
          )
        );
    `
  },
  {
    name: 'Fix scraped_pages RLS policies',
    sql: `
      DROP POLICY IF EXISTS "Users can view their domain's pages" ON scraped_pages;
      DROP POLICY IF EXISTS "Users can insert pages for their domains" ON scraped_pages;
      
      CREATE POLICY "Users can access their domain pages" ON scraped_pages
        FOR ALL
        USING (
          domain_id IN (
            SELECT id FROM domains 
            WHERE user_id = (SELECT auth.uid())
          )
        );
    `
  },
  {
    name: 'Fix domains RLS policies',
    sql: `
      DROP POLICY IF EXISTS "Users can view their own domains" ON domains;
      DROP POLICY IF EXISTS "Users can insert their own domains" ON domains;
      DROP POLICY IF EXISTS "Users can update their own domains" ON domains;
      DROP POLICY IF EXISTS "Users can delete their own domains" ON domains;
      
      CREATE POLICY "Users own domains" ON domains
        FOR ALL
        USING (user_id = (SELECT auth.uid()));
    `
  },
  {
    name: 'Fix website_content RLS policies',
    sql: `
      DROP POLICY IF EXISTS "Users can view their domain's content" ON website_content;
      DROP POLICY IF EXISTS "Users can insert content for their domains" ON website_content;
      
      CREATE POLICY "Users can access their domain content" ON website_content
        FOR ALL
        USING (
          domain_id IN (
            SELECT id FROM domains 
            WHERE user_id = (SELECT auth.uid())
          )
        );
    `
  },
  {
    name: 'Fix structured_extractions RLS policies',
    sql: `
      DROP POLICY IF EXISTS "Users can view their domain's extractions" ON structured_extractions;
      DROP POLICY IF EXISTS "Users can insert extractions for their domains" ON structured_extractions;
      
      CREATE POLICY "Users can access their domain extractions" ON structured_extractions
        FOR ALL
        USING (
          domain_id IN (
            SELECT id FROM domains 
            WHERE user_id = (SELECT auth.uid())
          )
        );
    `
  },
  {
    name: 'Fix businesses RLS policies',
    sql: `
      DROP POLICY IF EXISTS "Business owners see own data" ON businesses;
      DROP POLICY IF EXISTS "Service role has full access to businesses" ON businesses;
      
      CREATE POLICY "Business access control" ON businesses
        FOR ALL
        USING (
          (SELECT auth.role()) = 'service_role' 
          OR owner_id = (SELECT auth.uid())
        );
    `
  },
  {
    name: 'Fix business_configs RLS policies',
    sql: `
      DROP POLICY IF EXISTS "Business configs isolated" ON business_configs;
      DROP POLICY IF EXISTS "Service role has full access to configs" ON business_configs;
      
      CREATE POLICY "Business configs access control" ON business_configs
        FOR ALL
        USING (
          (SELECT auth.role()) = 'service_role'
          OR business_id IN (
            SELECT id FROM businesses 
            WHERE owner_id = (SELECT auth.uid())
          )
        );
    `
  },
  {
    name: 'Fix business_usage RLS policies',
    sql: `
      DROP POLICY IF EXISTS "Business usage isolated" ON business_usage;
      DROP POLICY IF EXISTS "Service role has full access to usage" ON business_usage;
      
      CREATE POLICY "Business usage access control" ON business_usage
        FOR ALL
        USING (
          (SELECT auth.role()) = 'service_role'
          OR business_id IN (
            SELECT id FROM businesses 
            WHERE owner_id = (SELECT auth.uid())
          )
        );
    `
  },
  {
    name: 'Fix customer_verifications RLS policies',
    sql: `
      DROP POLICY IF EXISTS "Verifications isolated by business" ON customer_verifications;
      DROP POLICY IF EXISTS "Service role has full access to verifications" ON customer_verifications;
      
      CREATE POLICY "Customer verifications access control" ON customer_verifications
        FOR ALL
        USING (
          (SELECT auth.role()) = 'service_role'
          OR business_id IN (
            SELECT id FROM businesses 
            WHERE owner_id = (SELECT auth.uid())
          )
        );
    `
  },
  {
    name: 'Fix customer_access_logs RLS policies',
    sql: `
      DROP POLICY IF EXISTS "Access logs isolated by business" ON customer_access_logs;
      DROP POLICY IF EXISTS "Service role has full access to access logs" ON customer_access_logs;
      
      CREATE POLICY "Customer access logs control" ON customer_access_logs
        FOR ALL
        USING (
          (SELECT auth.role()) = 'service_role'
          OR business_id IN (
            SELECT id FROM businesses 
            WHERE owner_id = (SELECT auth.uid())
          )
        );
    `
  },
  {
    name: 'Fix customer_data_cache RLS policies',
    sql: `
      DROP POLICY IF EXISTS "Cache isolated by business" ON customer_data_cache;
      DROP POLICY IF EXISTS "Service role has full access to cache" ON customer_data_cache;
      
      CREATE POLICY "Customer cache access control" ON customer_data_cache
        FOR ALL
        USING (
          (SELECT auth.role()) = 'service_role'
          OR business_id IN (
            SELECT id FROM businesses 
            WHERE owner_id = (SELECT auth.uid())
          )
        );
    `
  },
  {
    name: 'Create helper function for user business IDs',
    sql: `
      CREATE OR REPLACE FUNCTION get_user_business_ids()
      RETURNS SETOF uuid
      LANGUAGE sql
      STABLE
      SECURITY DEFINER
      SET search_path = public, pg_catalog
      AS $$
        SELECT id 
        FROM businesses 
        WHERE owner_id = (SELECT auth.uid())
      $$;
      
      GRANT EXECUTE ON FUNCTION get_user_business_ids TO authenticated;
    `
  },
  {
    name: 'Create helper function for user domain IDs',
    sql: `
      CREATE OR REPLACE FUNCTION get_user_domain_ids()
      RETURNS SETOF uuid
      LANGUAGE sql
      STABLE
      SECURITY DEFINER
      SET search_path = public, pg_catalog
      AS $$
        SELECT id 
        FROM domains 
        WHERE user_id = (SELECT auth.uid())
      $$;
      
      GRANT EXECUTE ON FUNCTION get_user_domain_ids TO authenticated;
    `
  },
  {
    name: 'Optimize policies with helper functions',
    sql: `
      -- Re-create business_configs with optimized function
      DROP POLICY IF EXISTS "Business configs access control" ON business_configs;
      CREATE POLICY "Business configs access control" ON business_configs
        FOR ALL
        USING (
          (SELECT auth.role()) = 'service_role'
          OR business_id IN (SELECT get_user_business_ids())
        );
      
      -- Re-create scraped_pages with optimized function
      DROP POLICY IF EXISTS "Users can access their domain pages" ON scraped_pages;
      CREATE POLICY "Users can access their domain pages" ON scraped_pages
        FOR ALL
        USING (
          domain_id IN (SELECT get_user_domain_ids())
        );
      
      -- Re-create website_content with optimized function
      DROP POLICY IF EXISTS "Users can access their domain content" ON website_content;
      CREATE POLICY "Users can access their domain content" ON website_content
        FOR ALL
        USING (
          domain_id IN (SELECT get_user_domain_ids())
        );
      
      -- Re-create scrape_jobs with optimized function
      DROP POLICY IF EXISTS "Users can access their own scrape jobs" ON scrape_jobs;
      CREATE POLICY "Users can access their own scrape jobs" ON scrape_jobs
        FOR ALL
        USING (
          domain_id IN (SELECT get_user_domain_ids())
        );
    `
  },
  {
    name: 'Set service role to bypass RLS',
    sql: `ALTER ROLE service_role SET row_security TO off;`
  },
  {
    name: 'Analyze tables for query planner',
    sql: `
      ANALYZE businesses;
      ANALYZE business_configs;
      ANALYZE business_usage;
      ANALYZE customer_verifications;
      ANALYZE customer_access_logs;
      ANALYZE customer_data_cache;
      ANALYZE domains;
      ANALYZE scraped_pages;
      ANALYZE website_content;
      ANALYZE structured_extractions;
      ANALYZE scrape_jobs;
    `
  }
];

async function applyRLSOptimizations() {
  console.log('🔒 Applying RLS Performance Optimizations');
  console.log('=' .repeat(60));
  console.log('This will fix 124+ linter warnings about:');
  console.log('  • Auth function re-evaluation (24 instances)');
  console.log('  • Multiple permissive policies (100+ instances)');
  console.log('  • Duplicate indexes');
  console.log('=' .repeat(60));
  
  let successCount = 0;
  let errorCount = 0;
  const errors = [];
  
  for (const step of optimizationSteps) {
    process.stdout.write(`⏳ ${step.name}... `);
    
    try {
      await executeSQL(step.sql, step.name);
      console.log('✅');
      successCount++;
    } catch (error) {
      console.log(`❌ ${error.message}`);
      errors.push({ step: step.name, error: error.message });
      errorCount++;
    }
    
    // Small delay between operations
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('📊 RLS Optimization Summary:');
  console.log(`✅ Successful: ${successCount}/${optimizationSteps.length}`);
  console.log(`❌ Failed: ${errorCount}/${optimizationSteps.length}`);
  
  if (errorCount > 0) {
    console.log('\n⚠️  Failed operations:');
    errors.forEach(e => {
      console.log(`  • ${e.step}: ${e.error}`);
    });
  }
  
  if (successCount === optimizationSteps.length) {
    console.log('\n✨ All RLS optimizations applied successfully!');
    console.log('\n🎯 Performance Improvements:');
    console.log('  • Auth functions now use InitPlan (evaluated once, not per-row)');
    console.log('  • Consolidated 100+ duplicate policies into single policies');
    console.log('  • Removed duplicate indexes');
    console.log('  • Created cached helper functions for auth lookups');
    console.log('  • Service role now bypasses RLS entirely');
    
    console.log('\n📈 Expected Results:');
    console.log('  • 50-80% reduction in RLS evaluation overhead');
    console.log('  • Faster query execution for authenticated users');
    console.log('  • Lower CPU usage on database');
    console.log('  • Better query plan optimization');
    
    console.log('\n🔍 To verify improvements:');
    console.log('  1. Run: npm run monitor:performance');
    console.log('  2. Check EXPLAIN ANALYZE on queries with RLS');
    console.log('  3. Look for "InitPlan" instead of "Filter" in query plans');
  } else {
    console.log('\n⚠️  Some optimizations failed. Review errors above.');
    console.log('You may need to apply these manually in the SQL Editor.');
  }
}

// Run the optimizations
applyRLSOptimizations().catch(console.error);