#!/usr/bin/env npx tsx
import { createSupabaseClient } from './integrity/supabase';
import { checkNullOrganizationIds } from './integrity/null-checks';
import { checkOrphanedRecords } from './integrity/orphan-checks';
import { checkCrossOrganizationIsolation } from './integrity/isolation-check';
import { checkForeignKeyRelationships } from './integrity/foreign-keys';
import { reportIssues } from './integrity/report';
import { IntegrityIssue } from './integrity/types';
import { checkRLSPolicies } from './integrity/rls-checks';

async function main() {
  console.log('🔍 Starting Comprehensive Database Integrity Check...\n');
  const supabase = createSupabaseClient();
  const issues: IntegrityIssue[] = [];

  issues.push(...await checkNullOrganizationIds(supabase));
  issues.push(...await checkRLSPolicies(supabase));
  issues.push(...await checkOrphanedRecords(supabase));
  issues.push(...await checkCrossOrganizationIsolation(supabase));
  issues.push(...await checkForeignKeyRelationships(supabase));

  reportIssues(issues);
}

main().catch(error => {
  console.error('Integrity check failed:', error);
  process.exit(1);
});
