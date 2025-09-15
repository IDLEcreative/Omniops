#!/usr/bin/env node

import { createClient  } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';

import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in environment variables');
  process.exit(1);
}

// Create Supabase client with service role
const supabase = createClient(supabaseUrl, supabaseKey);

// Read the migration file
const migrationPath = path.join(__dirname, 'supabase/migrations/20250128_enhanced_metadata_search.sql');
const migrationSql = fs.readFileSync(migrationPath, 'utf8');

// Split the migration into individual statements
const statements = migrationSql
  .split(';')
  .map(stmt => stmt.trim())
  .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

async function applyMigration() {
  console.log('🚀 Applying enhanced metadata search migration...\n');

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    if (!statement || statement.trim() === '') continue;

    console.log(`📝 Executing statement ${i + 1}/${statements.length}:`);
    console.log(`   ${statement.substring(0, 80)}...`);

    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: statement + ';'
      });

      if (error) {
        console.error(`❌ Error in statement ${i + 1}:`, error);
        
        // Try direct SQL execution as fallback
        console.log('🔄 Trying direct SQL execution...');
        const { data: directData, error: directError } = await supabase
          .from('_dummy_table_that_does_not_exist')
          .select('*')
          .limit(0);
        
        // If that fails, try using the raw SQL
        const result = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey
          },
          body: JSON.stringify({ sql: statement + ';' })
        });

        if (!result.ok) {
          const errorText = await result.text();
          console.error(`❌ Direct execution also failed:`, errorText);
        } else {
          console.log('✅ Direct execution succeeded');
        }
      } else {
        console.log('✅ Statement executed successfully');
      }
    } catch (err) {
      console.error(`❌ Exception in statement ${i + 1}:`, err.message);
    }

    console.log(''); // Empty line for readability
  }

  console.log('🎉 Migration application completed!');
}

applyMigration().catch(console.error);