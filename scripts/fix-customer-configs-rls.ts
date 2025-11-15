import { createServiceRoleClientSync } from '@/lib/supabase/server';

async function fixRLS() {
  const supabase = createServiceRoleClientSync();
  if (!supabase) {
    console.error('Failed to create Supabase client');
    process.exit(1);
  }

  console.log('Adding service role policies to customer_configs...\n');

  // Execute each policy statement individually
  const statements = [
    // Drop existing policies
    `DROP POLICY IF EXISTS "service_role_select_customer_configs" ON customer_configs`,
    `DROP POLICY IF EXISTS "service_role_insert_customer_configs" ON customer_configs`,
    `DROP POLICY IF EXISTS "service_role_update_customer_configs" ON customer_configs`,
    `DROP POLICY IF EXISTS "service_role_delete_customer_configs" ON customer_configs`,

    // Create new policies
    `CREATE POLICY "service_role_select_customer_configs" ON customer_configs
      FOR SELECT TO public
      USING (
        (SELECT (auth.jwt() ->> 'role'::text) = 'service_role'::text)
        OR is_organization_member(organization_id, auth.uid())
      )`,

    `CREATE POLICY "service_role_insert_customer_configs" ON customer_configs
      FOR INSERT TO public
      WITH CHECK (
        (SELECT (auth.jwt() ->> 'role'::text) = 'service_role'::text)
      )`,

    `CREATE POLICY "service_role_update_customer_configs" ON customer_configs
      FOR UPDATE TO public
      USING ((SELECT (auth.jwt() ->> 'role'::text) = 'service_role'::text))
      WITH CHECK ((SELECT (auth.jwt() ->> 'role'::text) = 'service_role'::text))`,

    `CREATE POLICY "service_role_delete_customer_configs" ON customer_configs
      FOR DELETE TO public
      USING ((SELECT (auth.jwt() ->> 'role'::text) = 'service_role'::text))`
  ];

  for (let i = 0; i < statements.length; i++) {
    const sql = statements[i];
    console.log(`[${i + 1}/${statements.length}] Executing: ${sql.substring(0, 60)}...`);

    const { error } = await supabase.rpc('exec_sql', { query: sql });

    if (error) {
      console.error('  ❌ Failed:', error.message);
    } else {
      console.log('  ✅ Success');
    }
  }

  console.log('\n✅ All policies updated!');
}

fixRLS().catch(console.error);
