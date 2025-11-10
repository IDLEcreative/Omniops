/**
 * Apply Funnel System Migrations
 * 
 * Applies both funnel tracking and alert migrations to Supabase
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function applyMigration(filePath: string, name: string): Promise<boolean> {
  console.log(`\n📝 Applying migration: ${name}`);
  
  try {
    const sql = fs.readFileSync(filePath, 'utf-8');
    
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error(`❌ Error applying ${name}:`, error);
      return false;
    }
    
    console.log(`✅ Successfully applied ${name}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to apply ${name}:`, error);
    return false;
  }
}

async function main() {
  console.log('🚀 Applying Funnel System Migrations\n');
  
  const migrations = [
    {
      file: 'supabase/migrations/20250109000001_conversation_funnel_tracking.sql',
      name: 'Conversation Funnel Tracking',
    },
    {
      file: 'supabase/migrations/20250109000002_funnel_alerts.sql',
      name: 'Funnel Alerts',
    },
  ];
  
  let allSuccess = true;
  
  for (const migration of migrations) {
    const success = await applyMigration(migration.file, migration.name);
    if (!success) allSuccess = false;
  }
  
  if (allSuccess) {
    console.log('\n✅ All migrations applied successfully!');
    process.exit(0);
  } else {
    console.log('\n❌ Some migrations failed. Check errors above.');
    process.exit(1);
  }
}

main();
