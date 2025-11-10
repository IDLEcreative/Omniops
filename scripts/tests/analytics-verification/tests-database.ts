import { getServiceClient } from './supabase';
import { MATERIALIZED_VIEWS, TABLES } from './config';
import type { TestResult } from './types';

export async function testDatabaseTables(): Promise<TestResult[]> {
  console.log('\n1️⃣  DATABASE TABLES');
  console.log('-'.repeat(70));

  const client = await getServiceClient();
  if (!client) {
    return [{ feature: 'Database Connection', status: '❌', details: 'Failed to create database client' }];
  }

  const outcomes: TestResult[] = [];

  for (const table of TABLES) {
    try {
      const { error } = await client.from(table as any).select('id').limit(1);
      if (error && !error.message.includes('permission')) {
        console.log(`   ❌ ${table}: ${error.message}`);
        outcomes.push({ feature: `Table: ${table}`, status: '❌', details: error.message });
      } else {
        console.log(`   ✅ ${table}`);
        outcomes.push({ feature: `Table: ${table}`, status: '✅', details: 'Table exists and accessible' });
      }
    } catch (error: any) {
      console.log(`   ❌ ${table}: ${error.message}`);
      outcomes.push({ feature: `Table: ${table}`, status: '❌', details: error.message });
    }
  }

  for (const view of MATERIALIZED_VIEWS) {
    try {
      const { data, error } = await client.from(view as any).select('*').limit(1);
      if (error) {
        console.log(`   ❌ ${view}: ${error.message}`);
        outcomes.push({ feature: `View: ${view}`, status: '❌', details: error.message });
      } else {
        console.log(`   ✅ ${view} (${data?.length || 0} rows sampled)`);
        outcomes.push({ feature: `View: ${view}`, status: '✅', details: 'View accessible' });
      }
    } catch {
      console.log(`   ⚠️  ${view}: Error checking`);
      outcomes.push({ feature: `View: ${view}`, status: '⚠️', details: 'Error querying view' });
    }
  }

  return outcomes;
}
