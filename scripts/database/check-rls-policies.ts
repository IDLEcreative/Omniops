#!/usr/bin/env tsx
/**
 * Check RLS Policies via Supabase SQL
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkRLSStatus() {
  console.log('=== CHECKING RLS STATUS ON TABLES ===\n');

  const tables = [
    'organizations',
    'organization_members',
    'organization_invitations',
    'customer_configs',
    'domains',
    'scraped_pages',
    'page_embeddings',
    'conversations',
    'messages'
  ];

  for (const table of tables) {
    // Check if table exists and RLS status
    let data = null;
    let error: any = null;
    try {
      const result = await supabase.rpc('check_table_rls', { table_name: table } as any);
      data = result.data;
      error = result.error;
    } catch (e) {
      error = 'RPC not available';
    }

    // Attempt to query - if service role can query, RLS exists but we bypass it
    const { data: testData, error: testError } = await supabase
      .from(table)
      .select('id')
      .limit(1);

    console.log(`${table}:`);
    console.log(`  - Queryable: ${testError ? 'No' : 'Yes'}`);
    console.log(`  - Error: ${testError?.message || 'None'}`);
  }
}

async function checkPolicies() {
  console.log('\n=== QUERYING pg_policies ===\n');

  // Try to query the information schema
  let data = null;
  let error: any = null;
  try {
    const result = await supabase.rpc('get_table_policies' as any);
    data = result.data;
    error = result.error;
  } catch (e) {
    error = 'RPC not available';
  }

  if (error) {
    console.log('Could not query via RPC, trying direct table access...\n');
  } else {
    console.log('Policies:', JSON.stringify(data, null, 2));
  }
}

async function checkTableColumns() {
  console.log('\n=== CHECKING TABLE COLUMNS ===\n');

  const tables = [
    'scraped_pages',
    'page_embeddings',
    'conversations',
    'messages',
    'structured_extractions'
  ];

  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1);

    if (data && data.length > 0) {
      const columns = Object.keys(data[0]);
      console.log(`${table}: ${columns.join(', ')}`);
      console.log(`  - Has organization_id: ${columns.includes('organization_id')}`);
      console.log(`  - Has domain_id: ${columns.includes('domain_id')}`);
    } else {
      console.log(`${table}: No data or error - ${error?.message}`);
    }
  }
}

async function main() {
  await checkRLSStatus();
  await checkPolicies();
  await checkTableColumns();
}

main();
