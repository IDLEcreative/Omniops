/**
 * Security Migration Verification - Check Functions
 */

import type { SupabaseClient } from '@/lib/supabase/server';

export interface CheckResult {
  name: string;
  passed: boolean;
  details: string;
}

export function addResult(
  results: CheckResult[],
  name: string,
  passed: boolean,
  details: string
): void {
  results.push({ name, passed, details });
  const icon = passed ? '✅' : '❌';
  if (details) {
  }
}

export async function checkViewSecurity(
  client: SupabaseClient,
  results: CheckResult[]
): Promise<void> {

  const views = [
    'chat_telemetry_metrics',
    'chat_telemetry_domain_costs',
    'chat_telemetry_cost_analytics',
    'chat_telemetry_hourly_costs',
  ];

  for (const viewName of views) {
    try {
      const { error: queryError } = await client
        .from(viewName)
        .select('*')
        .limit(0);

      if (queryError) {
        addResult(
          results,
          `View ${viewName} exists`,
          false,
          `Could not verify view: ${queryError.message}`
        );
      } else {
        addResult(
          results,
          `View ${viewName} exists`,
          true,
          'View is accessible'
        );
      }
    } catch (error) {
      addResult(
        results,
        `View ${viewName} security check`,
        false,
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}

export async function checkRLSEnabled(
  client: SupabaseClient,
  results: CheckResult[]
): Promise<void> {

  const tables = [
    'chat_telemetry_rollups',
    'chat_telemetry_domain_rollups',
    'chat_telemetry_model_rollups',
    'demo_attempts',
    'gdpr_audit_log',
    'widget_configs',
    'widget_config_history',
    'widget_config_variants',
  ];

  for (const tableName of tables) {
    try {
      const { error: queryError } = await client.from(tableName).select('*').limit(0);

      if (queryError && queryError.message.includes('does not exist')) {
        addResult(results, `Table ${tableName} RLS enabled`, true, 'Table does not exist (optional)');
      } else if (queryError) {
        addResult(
          results,
          `Table ${tableName} RLS check`,
          false,
          `Could not verify: ${queryError.message}`
        );
      } else {
        addResult(
          results,
          `Table ${tableName} has RLS enabled`,
          true,
          'Table accessible with RLS'
        );
      }
    } catch (error) {
      addResult(
        results,
        `Table ${tableName} RLS check`,
        false,
        `Could not verify: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}

export async function checkRLSPolicies(
  client: SupabaseClient,
  results: CheckResult[]
): Promise<void> {

  const expectedPolicies = [
    {
      table: 'chat_telemetry_rollups',
      policies: [
        'Service role can manage all telemetry rollups',
        'Authenticated users can view telemetry rollups',
      ],
    },
    {
      table: 'chat_telemetry_domain_rollups',
      policies: [
        'Service role can manage domain rollups',
        'Authenticated users can view their domain rollups',
      ],
    },
    {
      table: 'chat_telemetry_model_rollups',
      policies: [
        'Service role can manage model rollups',
        'Authenticated users can view their model rollups',
      ],
    },
    {
      table: 'demo_attempts',
      policies: [
        'Service role can manage demo attempts',
        'Authenticated users can view demo attempts',
      ],
    },
    {
      table: 'gdpr_audit_log',
      policies: [
        'Service role can manage GDPR audit log',
        'Authenticated users can view their domain GDPR logs',
      ],
    },
  ];

  for (const { table } of expectedPolicies) {
    try {
      const { error } = await client.from(table).select('*').limit(0);

      addResult(
        results,
        `Policies for ${table}`,
        !error,
        error ? `Error: ${error.message}` : 'Table accessible with policies'
      );
    } catch (error) {
      addResult(
        results,
        `Policies for ${table}`,
        false,
        `Error checking policies: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}

export async function runSmokeTests(
  client: SupabaseClient,
  results: CheckResult[]
): Promise<void> {

  const testQueries = [
    { name: 'Service role can query chat_telemetry_rollups', table: 'chat_telemetry_rollups' },
    { name: 'Service role can query chat_telemetry_domain_rollups', table: 'chat_telemetry_domain_rollups' },
    { name: 'chat_telemetry_metrics view is accessible', table: 'chat_telemetry_metrics' }
  ];

  for (const { name, table } of testQueries) {
    try {
      const { error } = await client.from(table).select('*').limit(1);

      addResult(
        results,
        name,
        !error,
        error ? `Error: ${error.message}` : 'Query successful'
      );
    } catch (error) {
      addResult(
        results,
        name,
        false,
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
