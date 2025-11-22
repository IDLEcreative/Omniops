-- =====================================================================
-- RLS JOIN Optimization Verification Script
-- =====================================================================
-- Purpose: Verify that JOIN-based RLS optimization is working correctly
-- Run this after applying migration: 20251118000002_optimize_rls_joins.sql
--
-- Usage:
--   psql -d omniops -f verify-rls-join-optimization.sql
--
-- Reference: docs/10-ANALYSIS/ANALYSIS_SUPABASE_PERFORMANCE.md (Issue #4, #8)
-- =====================================================================

\echo '=========================================='
\echo 'RLS JOIN Optimization Verification'
\echo '=========================================='
\echo ''

-- =====================================================================
-- PART 1: VERIFY FUNCTIONS EXIST
-- =====================================================================
\echo '1. Checking helper functions...'

SELECT
  proname as function_name,
  prosecdef as is_security_definer,
  provolatile as volatility,
  pg_get_function_identity_arguments(oid) as arguments
FROM pg_proc
WHERE proname IN ('check_domain_access', 'check_message_access')
ORDER BY proname;

\echo ''

-- =====================================================================
-- PART 2: VERIFY POLICIES EXIST
-- =====================================================================
\echo '2. Verifying RLS policies...'

SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE tablename IN ('conversations', 'messages', 'scrape_jobs', 'scraped_pages',
                    'website_content', 'structured_extractions')
ORDER BY tablename, policyname;

\echo ''

-- =====================================================================
-- PART 3: POLICY COUNT VERIFICATION
-- =====================================================================
\echo '3. Policy counts per table...'

SELECT
  tablename,
  COUNT(*) as policy_count,
  CASE
    WHEN tablename IN ('conversations', 'messages') THEN 4
    ELSE 1
  END as expected_count,
  CASE
    WHEN tablename IN ('conversations', 'messages') AND COUNT(*) = 4 THEN '✓'
    WHEN tablename NOT IN ('conversations', 'messages') AND COUNT(*) = 1 THEN '✓'
    ELSE '✗ MISMATCH'
  END as status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('conversations', 'messages', 'scrape_jobs', 'scraped_pages',
                    'website_content', 'structured_extractions')
GROUP BY tablename
ORDER BY tablename;

\echo ''

-- =====================================================================
-- PART 4: QUERY PLAN ANALYSIS (if user is authenticated)
-- =====================================================================
\echo '4. Testing query plans...'
\echo ''
\echo '   BEFORE optimization (if get_user_domain_ids still exists):'

-- This will show the old IN subquery plan if the function still exists
EXPLAIN (ANALYZE, BUFFERS)
SELECT COUNT(*) FROM conversations
WHERE domain_id IN (
  SELECT domain_id FROM get_user_domain_ids(
    (SELECT id FROM auth.users LIMIT 1)
  )
)
LIMIT 100;

\echo ''
\echo '   AFTER optimization (check_domain_access function):'

-- This shows the new JOIN-based plan
EXPLAIN (ANALYZE, BUFFERS)
SELECT COUNT(*) FROM conversations
WHERE check_domain_access(
  (SELECT id FROM auth.users LIMIT 1),
  domain_id
)
LIMIT 100;

\echo ''

-- =====================================================================
-- PART 5: PERFORMANCE COMPARISON
-- =====================================================================
\echo '5. Performance timing comparison...'

-- Time the old method (if function exists)
\echo ''
\echo '   Timing IN subquery method (3 runs)...'
\timing on

SELECT COUNT(*) FROM conversations
WHERE domain_id IN (
  SELECT domain_id FROM get_user_domain_ids(
    (SELECT id FROM auth.users LIMIT 1)
  )
);

SELECT COUNT(*) FROM conversations
WHERE domain_id IN (
  SELECT domain_id FROM get_user_domain_ids(
    (SELECT id FROM auth.users LIMIT 1)
  )
);

SELECT COUNT(*) FROM conversations
WHERE domain_id IN (
  SELECT domain_id FROM get_user_domain_ids(
    (SELECT id FROM auth.users LIMIT 1)
  )
);

\echo ''
\echo '   Timing JOIN-based method (3 runs)...'

SELECT COUNT(*) FROM conversations
WHERE check_domain_access(
  (SELECT id FROM auth.users LIMIT 1),
  domain_id
);

SELECT COUNT(*) FROM conversations
WHERE check_domain_access(
  (SELECT id FROM auth.users LIMIT 1),
  domain_id
);

SELECT COUNT(*) FROM conversations
WHERE check_domain_access(
  (SELECT id FROM auth.users LIMIT 1),
  domain_id
);

\timing off

\echo ''

-- =====================================================================
-- PART 6: FUNCTION PERFORMANCE ANALYSIS
-- =====================================================================
\echo '6. Analyzing function internals...'

-- Show the actual function definition
\sf check_domain_access

\echo ''

\sf check_message_access

\echo ''

-- =====================================================================
-- PART 7: INDEX USAGE VERIFICATION
-- =====================================================================
\echo '7. Verifying index usage in functions...'

-- Check that the functions use appropriate indexes
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('organization_members', 'organizations', 'domains', 'conversations')
  AND (
    indexname LIKE '%organization_id%' OR
    indexname LIKE '%user_id%' OR
    indexname LIKE '%domain_id%' OR
    indexname LIKE '%status%'
  )
ORDER BY tablename, indexname;

\echo ''

-- =====================================================================
-- PART 8: SECURITY VERIFICATION
-- =====================================================================
\echo '8. Security check: RLS is enabled...'

SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('conversations', 'messages', 'scrape_jobs', 'scraped_pages')
ORDER BY tablename;

\echo ''

-- =====================================================================
-- PART 9: EXPECTED RESULTS SUMMARY
-- =====================================================================
\echo '=========================================='
\echo 'Expected Results:'
\echo '=========================================='
\echo '✓ 2 helper functions exist (check_domain_access, check_message_access)'
\echo '✓ conversations table: 4 policies (SELECT, INSERT, UPDATE, DELETE)'
\echo '✓ messages table: 4 policies (SELECT, INSERT, UPDATE, DELETE)'
\echo '✓ Other domain tables: 1 policy each'
\echo '✓ All functions are SECURITY DEFINER'
\echo '✓ All functions are STABLE (cacheable)'
\echo '✓ JOIN-based queries 30-40% faster than IN subqueries'
\echo '✓ RLS is enabled on all tested tables'
\echo ''
\echo 'If all checks pass, optimization is successful!'
\echo '=========================================='
