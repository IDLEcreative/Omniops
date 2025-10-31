#!/usr/bin/env node

import { executeSQL } from './supabase-config.js';

const fixSteps = [
  {
    name: 'Check existing business policies',
    sql: `
      SELECT tablename, policyname 
      FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename = 'businesses';
    `,
    isCheck: true
  },
  {
    name: 'Drop all existing business policies',
    sql: `
      DO $$
      DECLARE
        pol RECORD;
      BEGIN
        FOR pol IN 
          SELECT policyname 
          FROM pg_policies 
          WHERE schemaname = 'public' 
          AND tablename = 'businesses'
        LOOP
          EXECUTE format('DROP POLICY IF EXISTS %I ON businesses', pol.policyname);
        END LOOP;
      END $$;
    `
  },
  {
    name: 'Create optimized businesses policy',
    sql: `
      CREATE POLICY "Business access control" ON businesses
        FOR ALL
        USING (
          CASE 
            WHEN current_setting('request.jwt.claims', true)::json->>'role' = 'service_role' 
            THEN true
            ELSE owner_id = (SELECT auth.uid())
          END
        );
    `
  },
  {
    name: 'Drop all business_configs policies',
    sql: `
      DO $$
      DECLARE
        pol RECORD;
      BEGIN
        FOR pol IN 
          SELECT policyname 
          FROM pg_policies 
          WHERE schemaname = 'public' 
          AND tablename = 'business_configs'
        LOOP
          EXECUTE format('DROP POLICY IF EXISTS %I ON business_configs', pol.policyname);
        END LOOP;
      END $$;
    `
  },
  {
    name: 'Create optimized business_configs policy',
    sql: `
      CREATE POLICY "Business configs access control" ON business_configs
        FOR ALL
        USING (
          CASE 
            WHEN current_setting('request.jwt.claims', true)::json->>'role' = 'service_role' 
            THEN true
            ELSE business_id IN (
              SELECT id FROM businesses 
              WHERE owner_id = (SELECT auth.uid())
            )
          END
        );
    `
  },
  {
    name: 'Drop all business_usage policies',
    sql: `
      DO $$
      DECLARE
        pol RECORD;
      BEGIN
        FOR pol IN 
          SELECT policyname 
          FROM pg_policies 
          WHERE schemaname = 'public' 
          AND tablename = 'business_usage'
        LOOP
          EXECUTE format('DROP POLICY IF EXISTS %I ON business_usage', pol.policyname);
        END LOOP;
      END $$;
    `
  },
  {
    name: 'Create optimized business_usage policy',
    sql: `
      CREATE POLICY "Business usage access control" ON business_usage
        FOR ALL
        USING (
          CASE 
            WHEN current_setting('request.jwt.claims', true)::json->>'role' = 'service_role' 
            THEN true
            ELSE business_id IN (
              SELECT id FROM businesses 
              WHERE owner_id = (SELECT auth.uid())
            )
          END
        );
    `
  },
  {
    name: 'Drop all customer_verifications policies',
    sql: `
      DO $$
      DECLARE
        pol RECORD;
      BEGIN
        FOR pol IN 
          SELECT policyname 
          FROM pg_policies 
          WHERE schemaname = 'public' 
          AND tablename = 'customer_verifications'
        LOOP
          EXECUTE format('DROP POLICY IF EXISTS %I ON customer_verifications', pol.policyname);
        END LOOP;
      END $$;
    `
  },
  {
    name: 'Create optimized customer_verifications policy',
    sql: `
      CREATE POLICY "Customer verifications access control" ON customer_verifications
        FOR ALL
        USING (
          CASE 
            WHEN current_setting('request.jwt.claims', true)::json->>'role' = 'service_role' 
            THEN true
            ELSE business_id IN (
              SELECT id FROM businesses 
              WHERE owner_id = (SELECT auth.uid())
            )
          END
        );
    `
  },
  {
    name: 'Drop all customer_access_logs policies',
    sql: `
      DO $$
      DECLARE
        pol RECORD;
      BEGIN
        FOR pol IN 
          SELECT policyname 
          FROM pg_policies 
          WHERE schemaname = 'public' 
          AND tablename = 'customer_access_logs'
        LOOP
          EXECUTE format('DROP POLICY IF EXISTS %I ON customer_access_logs', pol.policyname);
        END LOOP;
      END $$;
    `
  },
  {
    name: 'Create optimized customer_access_logs policy',
    sql: `
      CREATE POLICY "Customer access logs control" ON customer_access_logs
        FOR ALL
        USING (
          CASE 
            WHEN current_setting('request.jwt.claims', true)::json->>'role' = 'service_role' 
            THEN true
            ELSE business_id IN (
              SELECT id FROM businesses 
              WHERE owner_id = (SELECT auth.uid())
            )
          END
        );
    `
  },
  {
    name: 'Drop all customer_data_cache policies',
    sql: `
      DO $$
      DECLARE
        pol RECORD;
      BEGIN
        FOR pol IN 
          SELECT policyname 
          FROM pg_policies 
          WHERE schemaname = 'public' 
          AND tablename = 'customer_data_cache'
        LOOP
          EXECUTE format('DROP POLICY IF EXISTS %I ON customer_data_cache', pol.policyname);
        END LOOP;
      END $$;
    `
  },
  {
    name: 'Create optimized customer_data_cache policy',
    sql: `
      CREATE POLICY "Customer cache access control" ON customer_data_cache
        FOR ALL
        USING (
          CASE 
            WHEN current_setting('request.jwt.claims', true)::json->>'role' = 'service_role' 
            THEN true
            ELSE business_id IN (
              SELECT id FROM businesses 
              WHERE owner_id = (SELECT auth.uid())
            )
          END
        );
    `
  },
  {
    name: 'Create user_business_ids helper function',
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
    name: 'Final verification of RLS optimization',
    sql: `
      SELECT 
        tablename,
        COUNT(*) as policy_count,
        BOOL_OR(qual LIKE '%(SELECT auth.uid())%') as has_optimized_auth
      FROM pg_policies
      WHERE schemaname = 'public'
      AND tablename IN (
        'businesses', 'business_configs', 'business_usage',
        'customer_verifications', 'customer_access_logs', 'customer_data_cache'
      )
      GROUP BY tablename
      ORDER BY tablename;
    `,
    isCheck: true
  }
];

async function fixRemainingRLS() {
  console.log('🔧 Fixing Remaining RLS Issues');
  console.log('=' .repeat(60));
  console.log('Targeting business-related tables with improved approach...\n');
  
  let successCount = 0;
  let errorCount = 0;
  const errors = [];
  
  for (const step of fixSteps) {
    if (step.isCheck) {
      console.log(`\n📊 ${step.name}:`);
      try {
        const result = await executeSQL(step.sql, step.name);
        if (result && result.length > 0) {
          result.forEach(row => {
            console.log(`   ${JSON.stringify(row, null, 2)}`);
          });
        } else {
          console.log('   No results');
        }
      } catch (error) {
        console.log(`   Error: ${error.message}`);
      }
    } else {
      process.stdout.write(`⏳ ${step.name}... `);
      
      try {
        await executeSQL(step.sql, step.name);
        console.log('✅');
        successCount++;
      } catch (error) {
        console.log(`❌`);
        console.log(`   Error details: ${error.message}`);
        errors.push({ step: step.name, error: error.message });
        errorCount++;
      }
    }
    
    // Small delay between operations
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('📊 Fix Summary:');
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${errorCount}`);
  
  if (errorCount > 0) {
    console.log('\n⚠️  Failed operations:');
    errors.forEach(e => {
      console.log(`  • ${e.step}`);
      console.log(`    ${e.error}`);
    });
  }
  
  if (successCount > 0) {
    console.log('\n✨ Applied fixes:');
    console.log('  • Consolidated multiple policies per table into single policies');
    console.log('  • Used CASE statements for service_role checks');
    console.log('  • Wrapped auth.uid() in subqueries for InitPlan optimization');
    console.log('  • Created helper function for business ID lookups');
  }
}

// Run the fixes
fixRemainingRLS().catch(console.error);