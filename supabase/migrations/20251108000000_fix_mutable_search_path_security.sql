-- Migration: Fix mutable search_path SQL injection vulnerability
-- Date: 2025-11-08
-- Purpose: Adds immutable search_path to 25 functions that currently lack it
-- Security: Prevents search_path manipulation attacks (SQL injection vector)
--
-- Background:
-- PostgreSQL functions without SET search_path are vulnerable to search_path
-- manipulation attacks where an attacker can create malicious objects in a
-- user-controlled schema and trick the function into using them.
--
-- Fix: Set search_path = public, pg_catalog for all functions
-- This ensures functions only look in trusted schemas.

-- ============================================================================
-- TRIGGER FUNCTIONS (15 functions)
-- These are used as triggers on various tables to update timestamps
-- ============================================================================

ALTER FUNCTION public.update_ai_quotes_updated_at()
SET search_path = public, pg_catalog;

ALTER FUNCTION public.update_alert_thresholds_updated_at()
SET search_path = public, pg_catalog;

ALTER FUNCTION public.update_custom_funnels_updated_at()
SET search_path = public, pg_catalog;

ALTER FUNCTION public.update_domain_discounts()
SET search_path = public, pg_catalog;

ALTER FUNCTION public.update_domain_subscriptions_updated_at()
SET search_path = public, pg_catalog;

ALTER FUNCTION public.update_monthly_usage_updated_at()
SET search_path = public, pg_catalog;

ALTER FUNCTION public.update_pricing_tiers_updated_at()
SET search_path = public, pg_catalog;

ALTER FUNCTION public.update_query_cache_updated_at()
SET search_path = public, pg_catalog;

ALTER FUNCTION public.update_quote_rate_limits_updated_at()
SET search_path = public, pg_catalog;

ALTER FUNCTION public.update_scrape_jobs_updated_at()
SET search_path = public, pg_catalog;

ALTER FUNCTION public.increment_config_version()
SET search_path = public, pg_catalog;

ALTER FUNCTION public.backfill_organization_ids()
SET search_path = public, pg_catalog;

ALTER FUNCTION public.refresh_analytics_views()
SET search_path = public, pg_catalog;

ALTER FUNCTION public.cleanup_expired_query_cache()
SET search_path = public, pg_catalog;

ALTER FUNCTION public.get_view_last_refresh(text)
SET search_path = public, pg_catalog;

-- ============================================================================
-- SECURITY DEFINER FUNCTIONS (3 functions) - HIGHEST PRIORITY
-- These run with elevated privileges, making search_path even more critical
-- ============================================================================

ALTER FUNCTION public.cleanup_old_telemetry(integer)
SET search_path = public, pg_catalog;

ALTER FUNCTION public.get_query_cache_stats(uuid)
SET search_path = public, pg_catalog;

ALTER FUNCTION public.get_user_domain_ids(uuid)
SET search_path = public, pg_catalog;

ALTER FUNCTION public.get_user_organization_ids(uuid)
SET search_path = public, pg_catalog;

-- ============================================================================
-- BUSINESS LOGIC FUNCTIONS (7 functions)
-- Critical for billing, search, and configuration management
-- ============================================================================

ALTER FUNCTION public.calculate_multi_domain_discount(uuid)
SET search_path = public, pg_catalog;

ALTER FUNCTION public.get_recommended_pricing_tier(integer)
SET search_path = public, pg_catalog;

ALTER FUNCTION public.increment_monthly_completions(uuid, integer)
SET search_path = public, pg_catalog;

ALTER FUNCTION public.preview_multi_domain_discount(integer, numeric)
SET search_path = public, pg_catalog;

ALTER FUNCTION public.save_config_snapshot(uuid, jsonb, character varying, text)
SET search_path = public, pg_catalog;

ALTER FUNCTION public.search_pages_by_keyword(uuid, text, integer)
SET search_path = public, pg_catalog;

-- ============================================================================
-- VERIFICATION QUERIES
-- Run these after migration to confirm all functions are secured
-- ============================================================================

-- Check: All 25 functions should now have search_path configured
-- Expected result: 0 rows (all functions fixed)
-- SELECT
--   p.proname AS function_name,
--   pg_catalog.pg_get_function_arguments(p.oid) AS args
-- FROM pg_proc p
-- JOIN pg_namespace n ON p.pronamespace = n.oid
-- WHERE n.nspname = 'public'
--   AND p.prokind = 'f'
--   AND p.proname IN (
--     'backfill_organization_ids',
--     'calculate_multi_domain_discount',
--     'cleanup_expired_query_cache',
--     'cleanup_old_telemetry',
--     'get_query_cache_stats',
--     'get_recommended_pricing_tier',
--     'get_user_domain_ids',
--     'get_user_organization_ids',
--     'get_view_last_refresh',
--     'increment_config_version',
--     'increment_monthly_completions',
--     'preview_multi_domain_discount',
--     'refresh_analytics_views',
--     'save_config_snapshot',
--     'search_pages_by_keyword',
--     'update_ai_quotes_updated_at',
--     'update_alert_thresholds_updated_at',
--     'update_custom_funnels_updated_at',
--     'update_domain_discounts',
--     'update_domain_subscriptions_updated_at',
--     'update_monthly_usage_updated_at',
--     'update_pricing_tiers_updated_at',
--     'update_query_cache_updated_at',
--     'update_quote_rate_limits_updated_at',
--     'update_scrape_jobs_updated_at'
--   )
--   AND (p.proconfig IS NULL OR NOT array_to_string(p.proconfig, ' ') LIKE '%search_path%');

-- Check: Verify all 25 functions have the correct search_path
-- Expected result: 25 rows, all with 'search_path=public, pg_catalog'
-- SELECT
--   p.proname AS function_name,
--   array_to_string(p.proconfig, ', ') AS config
-- FROM pg_proc p
-- JOIN pg_namespace n ON p.pronamespace = n.oid
-- WHERE n.nspname = 'public'
--   AND p.prokind = 'f'
--   AND p.proname IN (
--     'backfill_organization_ids',
--     'calculate_multi_domain_discount',
--     'cleanup_expired_query_cache',
--     'cleanup_old_telemetry',
--     'get_query_cache_stats',
--     'get_recommended_pricing_tier',
--     'get_user_domain_ids',
--     'get_user_organization_ids',
--     'get_view_last_refresh',
--     'increment_config_version',
--     'increment_monthly_completions',
--     'preview_multi_domain_discount',
--     'refresh_analytics_views',
--     'save_config_snapshot',
--     'search_pages_by_keyword',
--     'update_ai_quotes_updated_at',
--     'update_alert_thresholds_updated_at',
--     'update_custom_funnels_updated_at',
--     'update_domain_discounts',
--     'update_domain_subscriptions_updated_at',
--     'update_monthly_usage_updated_at',
--     'update_pricing_tiers_updated_at',
--     'update_query_cache_updated_at',
--     'update_quote_rate_limits_updated_at',
--     'update_scrape_jobs_updated_at'
--   )
-- ORDER BY p.proname;
