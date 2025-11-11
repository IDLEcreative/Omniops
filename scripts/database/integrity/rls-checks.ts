import type { SupabaseClient } from '@supabase/supabase-js';
import { IntegrityIssue } from './types';

export async function checkRLSPolicies(supabase: SupabaseClient): Promise<IntegrityIssue[]> {
  console.log('\n=== 2. CHECKING RLS POLICIES ===\n');
  const issues: IntegrityIssue[] = [];

  try {
    const { data } = await supabase.from('pg_policies' as any).select('*');
    if (data) {
      console.log(`  Found ${data.length} policies in public schema`);
    }
  } catch {
    console.log('  ⚠️  Unable to access pg_policies via service role');
  }

  issues.push({
    severity: 'HIGH',
    category: 'RLS_VERIFICATION',
    issue: 'Manual verification required for organization-based RLS policies',
    recommendation: 'Check Supabase dashboard policies for org-secured tables'
  });

  return issues;
}
