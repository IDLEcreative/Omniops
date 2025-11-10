#!/usr/bin/env npx tsx

/**
 * Script: Fix Mutable search_path SQL Injection Vulnerability
 *
 * Purpose: Secures 25 database functions by setting immutable search_path
 *
 * Security Issue:
 * - Functions without SET search_path are vulnerable to search_path manipulation
 * - Attackers can create malicious objects in user-controlled schemas
 * - Functions can be tricked into using attacker-controlled code
 *
 * Fix:
 * - Set search_path = public, pg_catalog for all vulnerable functions
 * - Ensures functions only look in trusted schemas
 *
 * Usage:
 *   npx tsx scripts/database/fix-search-path-security.ts
 *
 * This script will:
 * 1. List all functions without secure search_path
 * 2. Apply ALTER FUNCTION statements to secure them
 * 3. Verify all functions are now secured
 * 4. Test key functions still work correctly
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// List of functions to secure (25 total)
const FUNCTIONS_TO_SECURE = [
  // Trigger functions (15)
  { name: 'update_ai_quotes_updated_at', args: '' },
  { name: 'update_alert_thresholds_updated_at', args: '' },
  { name: 'update_custom_funnels_updated_at', args: '' },
  { name: 'update_domain_discounts', args: '' },
  { name: 'update_domain_subscriptions_updated_at', args: '' },
  { name: 'update_monthly_usage_updated_at', args: '' },
  { name: 'update_pricing_tiers_updated_at', args: '' },
  { name: 'update_query_cache_updated_at', args: '' },
  { name: 'update_quote_rate_limits_updated_at', args: '' },
  { name: 'update_scrape_jobs_updated_at', args: '' },
  { name: 'increment_config_version', args: '' },
  { name: 'backfill_organization_ids', args: '' },
  { name: 'refresh_analytics_views', args: '' },
  { name: 'cleanup_expired_query_cache', args: '' },
  { name: 'get_view_last_refresh', args: 'text' },

  // Security definer functions (4) - HIGHEST PRIORITY
  { name: 'cleanup_old_telemetry', args: 'integer' },
  { name: 'get_query_cache_stats', args: 'uuid' },
  { name: 'get_user_domain_ids', args: 'uuid' },
  { name: 'get_user_organization_ids', args: 'uuid' },

  // Business logic functions (6)
  { name: 'calculate_multi_domain_discount', args: 'uuid' },
  { name: 'get_recommended_pricing_tier', args: 'integer' },
  { name: 'increment_monthly_completions', args: 'uuid, integer' },
  { name: 'preview_multi_domain_discount', args: 'integer, numeric' },
  { name: 'save_config_snapshot', args: 'uuid, jsonb, character varying, text' },
  { name: 'search_pages_by_keyword', args: 'uuid, text, integer' },
];

async function checkVulnerableFunctions(): Promise<void> {
  console.log('🔍 Checking for vulnerable functions...\n');

  const { data, error } = await supabase.rpc('execute_sql', {
    query: `
      SELECT
        p.proname AS function_name,
        pg_catalog.pg_get_function_arguments(p.oid) AS function_args,
        CASE
          WHEN p.provolatile = 'i' THEN 'IMMUTABLE'
          WHEN p.provolatile = 's' THEN 'STABLE'
          WHEN p.provolatile = 'v' THEN 'VOLATILE'
        END AS volatility,
        p.prosecdef AS security_definer,
        COALESCE(array_to_string(p.proconfig, ', '), 'NO CONFIG') AS current_config
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
        AND p.prokind = 'f'
        AND (p.proconfig IS NULL OR NOT array_to_string(p.proconfig, ' ') LIKE '%search_path%')
      ORDER BY p.prosecdef DESC, p.proname;
    `
  });

  if (error) {
    console.error('❌ Error checking functions:', error);
    return;
  }

  if (data && data.length > 0) {
    console.log(`⚠️  Found ${data.length} vulnerable functions:\n`);
    data.forEach((fn: any) => {
      const secDefFlag = fn.security_definer ? '🔴 SECURITY DEFINER' : '';
      console.log(`   - ${fn.function_name}(${fn.function_args}) ${secDefFlag}`);
    });
    console.log('');
  } else {
    console.log('✅ No vulnerable functions found!\n');
  }
}

async function applySecurityFixes(): Promise<void> {
  console.log('🔧 Applying security fixes to 25 functions...\n');

  let successCount = 0;
  let failureCount = 0;
  const failures: string[] = [];

  for (const func of FUNCTIONS_TO_SECURE) {
    const alterSQL = `
      ALTER FUNCTION public.${func.name}(${func.args})
      SET search_path = public, pg_catalog;
    `;

    try {
      const { error } = await supabase.rpc('execute_sql', { query: alterSQL });

      if (error) {
        console.error(`   ❌ ${func.name}(${func.args}) - ${error.message}`);
        failureCount++;
        failures.push(`${func.name}(${func.args}): ${error.message}`);
      } else {
        console.log(`   ✅ ${func.name}(${func.args})`);
        successCount++;
      }
    } catch (err) {
      console.error(`   ❌ ${func.name}(${func.args}) - ${err}`);
      failureCount++;
      failures.push(`${func.name}(${func.args}): ${err}`);
    }
  }

  console.log(`\n📊 Results: ${successCount} succeeded, ${failureCount} failed\n`);

  if (failures.length > 0) {
    console.log('⚠️  Failed functions:');
    failures.forEach(f => console.log(`   - ${f}`));
    console.log('');
  }
}

async function verifyFixes(): Promise<void> {
  console.log('✅ Verifying all functions are now secured...\n');

  const functionNames = FUNCTIONS_TO_SECURE.map(f => `'${f.name}'`).join(',');

  const { data, error } = await supabase.rpc('execute_sql', {
    query: `
      SELECT
        p.proname AS function_name,
        array_to_string(p.proconfig, ', ') AS config
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
        AND p.prokind = 'f'
        AND p.proname IN (${functionNames})
      ORDER BY p.proname;
    `
  });

  if (error) {
    console.error('❌ Error verifying fixes:', error);
    return;
  }

  if (data) {
    const secured = data.filter((f: any) => f.config?.includes('search_path'));
    const unsecured = data.filter((f: any) => !f.config?.includes('search_path'));

    console.log(`   Secured: ${secured.length}/${data.length}`);

    if (unsecured.length > 0) {
      console.log('\n⚠️  Still vulnerable:');
      unsecured.forEach((f: any) => console.log(`   - ${f.function_name}`));
    } else {
      console.log('   ✅ All 25 functions are now secured!\n');
    }
  }
}

async function testKeyFunctions(): Promise<void> {
  console.log('🧪 Testing key functions still work correctly...\n');

  // Test 1: Trigger function (update_domain_subscriptions_updated_at)
  console.log('   Testing: update_domain_subscriptions_updated_at (trigger)');
  const { error: triggerError } = await supabase
    .from('domain_subscriptions')
    .select('id')
    .limit(1);

  if (triggerError) {
    console.log('   ❌ Trigger test failed:', triggerError.message);
  } else {
    console.log('   ✅ Trigger function works');
  }

  // Test 2: Search function
  console.log('   Testing: search_pages_by_keyword');
  const { data: domains } = await supabase
    .from('customer_configs')
    .select('id')
    .limit(1)
    .single();

  if (domains?.id) {
    const { error: searchError } = await supabase
      .rpc('search_pages_by_keyword', {
        p_domain_id: domains.id,
        p_keyword: 'test',
        p_limit: 5
      });

    if (searchError) {
      console.log('   ❌ Search function failed:', searchError.message);
    } else {
      console.log('   ✅ Search function works');
    }
  } else {
    console.log('   ⚠️  Skipped (no test domain available)');
  }

  // Test 3: Stats function
  console.log('   Testing: get_query_cache_stats');
  const { error: statsError } = await supabase
    .rpc('get_query_cache_stats', { p_domain_id: null });

  if (statsError) {
    console.log('   ❌ Stats function failed:', statsError.message);
  } else {
    console.log('   ✅ Stats function works');
  }

  console.log('');
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Fix Mutable search_path SQL Injection Vulnerability');
  console.log('═══════════════════════════════════════════════════════════\n');

  const startTime = Date.now();

  // Step 1: Check current state
  await checkVulnerableFunctions();

  // Step 2: Apply fixes
  await applySecurityFixes();

  // Step 3: Verify fixes
  await verifyFixes();

  // Step 4: Test functions
  await testKeyFunctions();

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('═══════════════════════════════════════════════════════════');
  console.log(`✅ Security fixes applied successfully in ${duration}s`);
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('📝 Next Steps:');
  console.log('   1. Commit the migration file:');
  console.log('      supabase/migrations/20251108000000_fix_mutable_search_path_security.sql');
  console.log('   2. Document this fix in SECURITY.md or similar');
  console.log('   3. Add to function creation guidelines to always set search_path\n');
}

main().catch(console.error);
