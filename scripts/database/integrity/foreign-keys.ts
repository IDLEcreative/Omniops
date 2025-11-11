import type { SupabaseClient } from '@supabase/supabase-js';
import { IntegrityIssue } from './types';

const RELATIONSHIPS = [
  { table: 'organization_members', fk: 'organization_id', references: 'organizations' },
  { table: 'organization_invitations', fk: 'organization_id', references: 'organizations' },
  { table: 'customer_configs', fk: 'organization_id', references: 'organizations' },
  { table: 'domains', fk: 'organization_id', references: 'organizations' },
  { table: 'scraped_pages', fk: 'domain_id', references: 'domains' },
  { table: 'page_embeddings', fk: 'domain_id', references: 'domains' }
];

export async function checkForeignKeyRelationships(supabase: SupabaseClient): Promise<IntegrityIssue[]> {
  console.log('\n=== 5. CHECKING FOREIGN KEY RELATIONSHIPS ===\n');
  const issues: IntegrityIssue[] = [];

  for (const relation of RELATIONSHIPS) {
    console.log(`\nChecking ${relation.table}.${relation.fk} -> ${relation.references}`);
    const { data: records } = await supabase.from(relation.table).select(`id, ${relation.fk}`).limit(5);

    if (!records?.length) {
      console.log('  ⚠️  No records to sample');
      continue;
    }

    const sample = records[0];
    const fkValue = sample[relation.fk as keyof typeof sample];

    if (!fkValue) {
      issues.push({
        severity: 'MEDIUM',
        category: 'FOREIGN_KEY_WARNING',
        table: relation.table,
        issue: `${relation.fk} is NULL in sample`,
        recommendation: 'Backfill FK values and add constraint'
      });
      continue;
    }

    const { data: referenced } = await supabase.from(relation.references).select('id').eq('id', fkValue).single();
    if (!referenced) {
      issues.push({
        severity: 'HIGH',
        category: 'FOREIGN_KEY_VIOLATION',
        table: relation.table,
        issue: `Foreign key ${relation.fk} references missing ${relation.references}`,
        recommendation: 'Add FK constraints with cascade rules'
      });
      console.log('  ❌ Missing referenced record');
    } else {
      console.log('  ✅ Reference verified');
    }
  }

  return issues;
}
