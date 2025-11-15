import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

async function applyMigration() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Required environment variables missing');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  // Read the migration file
  const migrationPath = path.join(
    process.cwd(),
    'supabase/migrations/20251115_add_service_role_customer_configs_policies.sql'
  );

  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

  console.log('Applying migration via service role...');
  console.log('SQL length:', migrationSQL.length, 'characters');

  // Execute the SQL using RPC to raw SQL execution
  const { data, error } = await supabase.rpc('exec_sql', {
    query: migrationSQL
  });

  if (error) {
    console.error('Migration failed:', error);
    // Try direct query execution instead
    console.log('\nTrying direct execution...');

    // Split by semicolon and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));

    for (const statement of statements) {
      if (!statement) continue;

      console.log('Executing:', statement.substring(0, 100) + '...');
      const { error: execError } = await supabase.rpc('exec_sql', {
        query: statement
      });

      if (execError) {
        console.error('Statement failed:', execError);
        console.error('Statement was:', statement);
      }
    }
  } else {
    console.log('Migration applied successfully!');
    console.log('Result:', data);
  }
}

applyMigration().catch(console.error);
