import fs from 'fs';
import path from 'path';

async function applyMigration() {
  const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
  const PROJECT_REF = 'birugqyuqhiahxvxeyqg';

  if (!SUPABASE_ACCESS_TOKEN) {
    console.error('SUPABASE_ACCESS_TOKEN environment variable is required');
    process.exit(1);
  }

  // Read the migration file
  const migrationPath = path.join(
    process.cwd(),
    'supabase/migrations/20251115_add_service_role_customer_configs_policies.sql'
  );

  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

  console.log('Applying migration to database...');
  console.log('Migration file:', migrationPath);
  console.log('SQL length:', migrationSQL.length, 'characters');

  const response = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: migrationSQL })
    }
  );

  const result = await response.json();

  if (!response.ok) {
    console.error('Migration failed:', result);
    process.exit(1);
  }

  console.log('Migration applied successfully!');
  console.log('Result:', result);
}

applyMigration().catch(console.error);
