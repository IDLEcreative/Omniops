#!/usr/bin/env node
/**
 * Simple script to list all database tables using Supabase client
 * No external dependencies needed beyond what's already in the project
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Already documented tables
const DOCUMENTED_TABLES = new Set([
  'customer_configs',
  'domains',
  'organizations',
  'organization_members',
  'organization_invitations',
  'scraped_pages',
  'scrape_jobs',
  'embedding_queue',
  'entity_extraction_queue',
  'structured_extractions',
  'website_content',
  'page_embeddings',
  'entity_catalog',
  'product_catalog',
  'training_data',
  'conversations',
  'messages',
  'chat_telemetry',
  'chat_telemetry_rollups',
  'chat_telemetry_domain_rollups',
  'chat_telemetry_model_rollups',
  'chat_cost_alerts',
  'gdpr_audit_log',
  'demo_attempts',
  'widget_configs',
  'widget_config_variants',
  'widget_config_history',
  'global_synonym_mappings',
  'domain_synonym_mappings',
  'business_classifications',
  'query_cache',
  'search_cache'
]);

async function main() {
  console.log('🔍 Querying database schema...\n');

  try {
    // Query all tables using Supabase RPC or REST API
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_type = 'BASE TABLE'
        ORDER BY table_name;
      `
    });

    if (error) {
      // If RPC doesn't work, try alternative
      console.error('Error querying via RPC:', error.message);
      console.log('\n📋 Using known table list from schema analysis:\n');

      // From ANALYSIS_SUPABASE_PERFORMANCE.md, we know there are 85 total tables
      // List the undocumented ones manually based on naming patterns
      const knownUndocumented = [
        // Cart Analytics
        'cart_abandonments',
        'cart_analytics_daily',
        'cart_operations',
        'cart_session_metrics',
        // Funnel Tracking
        'conversation_funnel',
        'custom_funnels',
        'funnel_alert_history',
        'funnel_alert_rules',
        // Autonomous Operations
        'autonomous_consent',
        'autonomous_credentials',
        'autonomous_operations',
        'autonomous_operations_audit',
        // Feature Management
        'customer_feature_flags',
        'organization_feature_flags',
        'feature_flag_changes',
        'feature_rollouts',
        // Alerts & Monitoring
        'alert_history',
        'alert_thresholds',
        'circuit_breaker_telemetry',
        'error_logs',
        // User Management
        'customer_sessions',
        'notifications',
        'feedback',
        // Advanced Features
        'ai_quotes',
        'quote_rate_limits',
        'recommendation_events',
        'follow_up_messages',
        // Translation
        'language_preferences',
        'translation_cache',
        'translation_statistics',
        'supported_languages',
        // Integration
        'whatsapp_templates',
        'whatsapp_sessions',
        'whatsapp_webhooks',
        'whatsapp_oauth_tokens',
        'instagram_credentials',
        'product_embeddings',
        'chart_annotations',
        'metric_goals'
      ];

      console.log(`Found ${knownUndocumented.length} known undocumented tables:\n`);
      knownUndocumented.forEach((t, i) => {
        console.log(`${(i + 1).toString().padStart(2)}. ${t}`);
      });

      console.log(`\n📊 Summary:`);
      console.log(`   - Total known undocumented: ${knownUndocumented.length}`);
      console.log(`   - Expected total tables: 85`);
      console.log(`   - Documented tables: ${DOCUMENTED_TABLES.size}`);
      console.log(`   - Calculated undocumented: ${85 - DOCUMENTED_TABLES.size}`);
      console.log(`\n⚠️  Note: Some tables may be missing from this list.`);
      console.log(`   Run this script with proper RPC access to get complete list.`);

      return;
    }

    const allTables = data.map((row: any) => row.table_name);
    const undocumentedTables = allTables.filter((t: string) => !DOCUMENTED_TABLES.has(t));

    console.log(`📊 Statistics:`);
    console.log(`   Total tables: ${allTables.length}`);
    console.log(`   Documented: ${DOCUMENTED_TABLES.size}`);
    console.log(`   Undocumented: ${undocumentedTables.length}\n`);

    console.log(`❓ Undocumented tables:\n`);
    undocumentedTables.forEach((t: string, i: number) => {
      console.log(`${(i + 1).toString().padStart(2)}. ${t}`);
    });

  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
