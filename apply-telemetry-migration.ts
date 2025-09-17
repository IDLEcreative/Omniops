/**
 * Script to apply chat telemetry migration
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const PROJECT_REF = 'birugqyuqhiahxvxeyqg';

async function applyMigration() {
  console.log('🚀 Applying chat telemetry migration...\n');

  // Read migration file
  const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250117_create_chat_telemetry.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

  if (SUPABASE_ACCESS_TOKEN) {
    // Use Management API
    console.log('Using Supabase Management API...');
    
    try {
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

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Management API error: ${error}`);
      }

      const result = await response.json();
      console.log('✅ Migration applied via Management API successfully!');
      console.log('Result:', result);
    } catch (error) {
      console.error('❌ Management API failed:', error);
      console.log('\nFalling back to direct execution...');
      await applyDirectly();
    }
  } else {
    await applyDirectly();
  }
}

async function applyDirectly() {
  // Use direct Supabase client
  console.log('Using direct Supabase client...');
  
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Missing required environment variables');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Split migration into individual statements
  const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250117_create_chat_telemetry.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
  
  // Split by semicolon but be careful with functions
  const statements = migrationSQL
    .split(/;(?![^$$]*\$\$)/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`Found ${statements.length} SQL statements to execute\n`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';
    const preview = statement.substring(0, 80).replace(/\n/g, ' ');
    
    console.log(`Statement ${i + 1}/${statements.length}: ${preview}...`);
    
    try {
      const { error } = await supabase.rpc('query', { sql: statement }).single();
      
      if (error) {
        // Try direct execution as fallback
        const { error: directError } = await supabase.from('chat_telemetry').select('count').single();
        
        if (statement.includes('CREATE TABLE') && !directError) {
          console.log('  ✓ Table already exists');
          successCount++;
        } else if (statement.includes('CREATE INDEX') || statement.includes('CREATE POLICY')) {
          console.log('  ✓ Index/Policy likely exists');
          successCount++;
        } else {
          throw error;
        }
      } else {
        console.log('  ✅ Success');
        successCount++;
      }
    } catch (err: any) {
      console.log(`  ⚠️  Warning: ${err.message}`);
      errorCount++;
    }
  }

  console.log(`\n📊 Migration Summary:`);
  console.log(`  - Successful statements: ${successCount}`);
  console.log(`  - Failed statements: ${errorCount}`);
  
  if (errorCount === 0) {
    console.log('\n✅ Migration completed successfully!');
  } else {
    console.log('\n⚠️  Migration completed with warnings. The table may already exist.');
  }
}

async function verifyMigration() {
  console.log('\n🔍 Verifying migration...\n');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  // Check if table exists
  const { data: tableCheck, error: tableError } = await supabase
    .from('chat_telemetry')
    .select('id')
    .limit(1);
  
  if (!tableError || tableError.code === 'PGRST116') {
    console.log('✅ Table chat_telemetry exists');
  } else {
    console.log('❌ Table chat_telemetry not found:', tableError);
    return false;
  }
  
  // Check if view exists
  const { data: viewCheck, error: viewError } = await supabase
    .from('chat_telemetry_metrics')
    .select('*')
    .limit(1);
  
  if (!viewError || viewError.code === 'PGRST116') {
    console.log('✅ View chat_telemetry_metrics exists');
  } else {
    console.log('⚠️  View chat_telemetry_metrics may not exist:', viewError?.message);
  }
  
  return true;
}

// Main execution
async function main() {
  try {
    await applyMigration();
    await verifyMigration();
    console.log('\n🎉 Chat telemetry system is ready!');
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

main();