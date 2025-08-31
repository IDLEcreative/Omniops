#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { promises as fs } from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

async function applyOptimizations() {
  console.log('🚀 Applying RLS Performance Optimizations to Supabase\n');
  console.log('📍 URL:', supabaseUrl);
  console.log('━'.repeat(50), '\n');

  // Read the SQL migration file
  const migrationPath = join(__dirname, '..', 'migrations', '20250830_fix_rls_performance.sql');
  const sqlContent = await fs.readFile(migrationPath, 'utf8');
  
  // Split SQL into individual statements (by semicolon followed by newline)
  const statements = sqlContent
    .split(/;\s*\n/)
    .filter(stmt => stmt.trim() && !stmt.trim().startsWith('--'))
    .map(stmt => stmt.trim() + ';');

  console.log(`📊 Found ${statements.length} SQL statements to execute\n`);

  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  // Execute each statement via the Supabase REST API
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    
    // Skip comments and empty statements
    if (!statement || statement.startsWith('--')) continue;
    
    // Extract a description from the statement
    const firstLine = statement.split('\n')[0];
    const description = firstLine.length > 60 
      ? firstLine.substring(0, 60) + '...' 
      : firstLine;
    
    process.stdout.write(`[${i + 1}/${statements.length}] ${description}`);
    
    try {
      // Execute via Supabase REST API
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          query: statement
        })
      });

      // Try alternative approach using direct PostgreSQL connection
      if (!response.ok) {
        // Alternative: Execute via pg-api endpoint
        const pgResponse = await fetch(`${supabaseUrl}/pg`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({
            query: statement
          })
        });
        
        if (!pgResponse.ok) {
          throw new Error(`HTTP ${pgResponse.status}: ${pgResponse.statusText}`);
        }
      }
      
      console.log(' ✅');
      successCount++;
    } catch (error) {
      console.log(' ❌');
      console.error(`   Error: ${error.message}`);
      errorCount++;
      errors.push({ statement: description, error: error.message });
    }
  }

  console.log('\n' + '━'.repeat(50));
  console.log('\n📊 Final Report:');
  console.log(`✅ Successful: ${successCount} statements`);
  console.log(`❌ Failed: ${errorCount} statements`);
  
  if (errors.length > 0) {
    console.log('\n⚠️  Failed Statements:');
    errors.forEach((e, i) => {
      console.log(`${i + 1}. ${e.statement}`);
      console.log(`   Error: ${e.error}`);
    });
  }
  
  if (errorCount === 0) {
    console.log('\n🎉 All RLS performance optimizations applied successfully!');
    console.log('✨ Your database queries should now run significantly faster.');
  } else {
    console.log('\n⚠️  Some optimizations failed. The database may need manual intervention.');
    console.log('💡 Try running the failed statements directly in the Supabase SQL editor.');
  }
}

// Run the optimization
applyOptimizations().catch(console.error);