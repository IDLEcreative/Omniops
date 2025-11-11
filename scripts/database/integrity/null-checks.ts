import type { SupabaseClient } from '@supabase/supabase-js';
import { IntegrityIssue } from './types';

const TABLES = [
  'customer_configs',
  'domains',
  'scraped_pages',
  'page_embeddings',
  'conversations',
  'messages',
  'structured_extractions'
];

export async function checkNullOrganizationIds(supabase: SupabaseClient): Promise<IntegrityIssue[]> {
  console.log('\n=== 1. CHECKING FOR NULL organization_ids ===\n');

  const issues: IntegrityIssue[] = [];

  for (const table of TABLES) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('id', { count: 'exact', head: false })
        .is('organization_id', null);

      if (error) {
        console.log(`❌ Error checking ${table}: ${error.message}`);
        issues.push({
          severity: 'HIGH',
          category: 'NULL_CHECK_ERROR',
          table,
          issue: error.message,
          recommendation: 'Verify org columns and rerun migration'
        });
        continue;
      }

      const count = data?.length || 0;
      console.log(count > 0 ? `❌ ${table}: ${count} records with NULL organization_id` : `✅ ${table}: No NULL organization_ids`);

      if (count > 0) {
        issues.push({
          severity: 'CRITICAL',
          category: 'NULL_ORGANIZATION_ID',
          table,
          issue: `${count} records missing organization_id`,
          count,
          recommendation: 'Run backfill migration for organization_id'
        });
      }
    } catch (error: any) {
      console.log(`⚠️  Error accessing ${table}: ${error.message}`);
    }
  }

  return issues;
}
