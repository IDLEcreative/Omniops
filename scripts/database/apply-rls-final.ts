#!/usr/bin/env node
/**
 * Apply RLS migration by executing policies one by one
 * Usage: npx tsx scripts/database/apply-rls-final.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function executePolicy(sql: string, description: string): Promise<boolean> {
  try {
    console.log(`\n🔧 ${description}`);

    // Execute using raw SQL via supabase-js from() trick
    const { error } = await supabase.rpc('exec_sql' as any, { query: sql } as any);

    if (error) {
      // Try alternative: execute as a stored procedure call
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({ sql }),
      });

      if (!response.ok) {
        const errorText = await response.text();

        // Check if it's an acceptable error
        if (
          (sql.includes('DROP POLICY') && errorText.includes('does not exist')) ||
          (sql.includes('CREATE POLICY') && errorText.includes('already exists'))
        ) {
          console.log('   ⚠️  Skipped (policy already exists/doesn\'t exist)');
          return true;
        }

        console.error('   ❌ Failed:', errorText);
        return false;
      }
    }

    console.log('   ✅ Success');
    return true;
  } catch (err: any) {
    console.error('   ❌ Error:', err.message);
    return false;
  }
}

async function applyMigration() {
  console.log('🚀 Applying RLS policies for service role access to customer_configs\n');

  const policies = [
    {
      sql: 'DROP POLICY IF EXISTS "service_role_all_customer_configs" ON customer_configs;',
      description: 'Drop old service_role_all policy'
    },
    {
      sql: 'DROP POLICY IF EXISTS "service_role_insert_customer_configs" ON customer_configs;',
      description: 'Drop old insert policy'
    },
    {
      sql: 'DROP POLICY IF EXISTS "service_role_select_customer_configs" ON customer_configs;',
      description: 'Drop old select policy'
    },
    {
      sql: 'DROP POLICY IF EXISTS "service_role_update_customer_configs" ON customer_configs;',
      description: 'Drop old update policy'
    },
    {
      sql: 'DROP POLICY IF EXISTS "service_role_delete_customer_configs" ON customer_configs;',
      description: 'Drop old delete policy'
    },
    {
      sql: `CREATE POLICY "service_role_select_customer_configs" ON customer_configs
  FOR SELECT
  TO public
  USING (
    (SELECT (auth.jwt() ->> 'role'::text) = 'service_role'::text)
    OR is_organization_member(organization_id, auth.uid())
  );`,
      description: 'Create SELECT policy for service role'
    },
    {
      sql: `CREATE POLICY "service_role_insert_customer_configs" ON customer_configs
  FOR INSERT
  TO public
  WITH CHECK (
    (SELECT (auth.jwt() ->> 'role'::text) = 'service_role'::text)
  );`,
      description: 'Create INSERT policy for service role'
    },
    {
      sql: `CREATE POLICY "service_role_update_customer_configs" ON customer_configs
  FOR UPDATE
  TO public
  USING (
    (SELECT (auth.jwt() ->> 'role'::text) = 'service_role'::text)
  )
  WITH CHECK (
    (SELECT (auth.jwt() ->> 'role'::text) = 'service_role'::text)
  );`,
      description: 'Create UPDATE policy for service role'
    },
    {
      sql: `CREATE POLICY "service_role_delete_customer_configs" ON customer_configs
  FOR DELETE
  TO public
  USING (
    (SELECT (auth.jwt() ->> 'role'::text) = 'service_role'::text)
  );`,
      description: 'Create DELETE policy for service role'
    }
  ];

  let successCount = 0;
  let failCount = 0;

  for (const policy of policies) {
    const success = await executePolicy(policy.sql, policy.description);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ Success: ${successCount} policies`);
  console.log(`❌ Failed: ${failCount} policies`);

  if (failCount > 0) {
    console.log(`\n⚠️  Some policies failed. You may need to apply them manually via Supabase SQL Editor.`);
    console.log(`\nSQL to run manually:`);
    console.log(`\nhttps://supabase.com/dashboard/project/birugqyuqhiahxvxeyqg/sql/new\n`);
    process.exit(1);
  } else {
    console.log(`\n📊 Service role now has full access to customer_configs table!`);
  }
}

applyMigration().catch((error) => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
