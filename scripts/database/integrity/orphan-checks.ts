import type { SupabaseClient } from '@supabase/supabase-js';
import { IntegrityIssue } from './types';

export async function checkOrphanedRecords(supabase: SupabaseClient): Promise<IntegrityIssue[]> {
  console.log('\n=== 3. CHECKING FOR ORPHANED RECORDS ===\n');

  const issues: IntegrityIssue[] = [];

  const { data: orgs } = await supabase.from('organizations').select('id');
  const orgIds = new Set(orgs?.map(o => o.id) || []);

  await checkTable('customer_configs', 'organization_id', 'organizations');
  await checkTable('domains', 'organization_id', 'organizations');
  await checkTable('scraped_pages', 'domain_id', 'domains', 1000);

  async function checkTable(table: string, fk: string, reference: string, limit?: number) {
    console.log(`Checking ${table} for orphaned records...`);
    const query = supabase.from(table).select(`id, ${fk}`).limit(limit || 1000);
    const { data } = await query;

    const invalid = (data || []).filter(row => row[fk] && !orgIds.has(row[fk]));
    if (invalid.length > 0) {
      console.log(`❌ Found ${invalid.length} orphaned ${table}`);
      issues.push({
        severity: 'HIGH',
        category: 'ORPHANED_RECORDS',
        table,
        issue: `${invalid.length} records reference missing ${reference}`,
        count: invalid.length,
        recommendation: `Delete or backfill ${table} records`
      });
    } else {
      console.log(`✅ No orphaned ${table}`);
    }
  }

  return issues;
}
