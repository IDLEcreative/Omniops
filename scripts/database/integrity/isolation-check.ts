import type { SupabaseClient } from '@supabase/supabase-js';
import { IntegrityIssue } from './types';

export async function checkCrossOrganizationIsolation(supabase: SupabaseClient): Promise<IntegrityIssue[]> {
  console.log('\n=== 4. CHECKING CROSS-ORGANIZATION DATA ISOLATION ===\n');
  const issues: IntegrityIssue[] = [];
  const { data: orgs } = await supabase.from('organizations').select('id, name').limit(10);

  if (!orgs?.length) {
    issues.push({
      severity: 'MEDIUM',
      category: 'ISOLATION_TEST',
      issue: 'No organizations available to verify isolation',
      recommendation: 'Add sample organizations for testing'
    });
    return issues;
  }

  for (const org of orgs) {
    const { data: configs } = await supabase
      .from('customer_configs')
      .select('id, organization_id')
      .eq('organization_id', org.id);

    const mismatched = configs?.filter(cfg => cfg.organization_id !== org.id) || [];
    if (mismatched.length > 0) {
      issues.push({
        severity: 'CRITICAL',
        category: 'DATA_ISOLATION_BREACH',
        issue: `Org ${org.id} received configs from other orgs`,
        count: mismatched.length,
        recommendation: 'Review and fix org-based RLS policies immediately'
      });
    }
  }

  issues.push({
    severity: 'HIGH',
    category: 'ISOLATION_TEST',
    issue: 'Service role bypasses RLS; need user-token tests',
    recommendation: 'Verify with authenticated user tokens per org'
  });

  return issues;
}
