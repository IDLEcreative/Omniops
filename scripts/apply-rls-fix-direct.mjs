#!/usr/bin/env node

import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { promises as fs } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const { Client } = pg;

// Parse Supabase URL to get connection details
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const projectRef = supabaseUrl?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!projectRef) {
  console.error('❌ Could not parse project reference from Supabase URL');
  process.exit(1);
}

// Construct database URL
// Using pooler connection with service role for admin access
const dbUrl = `postgresql://postgres.${projectRef}:${process.env.SUPABASE_SERVICE_ROLE_KEY}@aws-0-us-west-1.pooler.supabase.com:5432/postgres`;

async function applyOptimizations() {
  console.log('🚀 Applying RLS Performance Optimizations\n');
  console.log('📍 Project:', projectRef);
  console.log('━'.repeat(50), '\n');

  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Read migration file
    const migrationPath = join(__dirname, '..', 'migrations', '20250830_fix_rls_performance.sql');
    const sqlContent = await fs.readFile(migrationPath, 'utf8');
    
    // Parse SQL statements
    const statements = sqlContent
      .split(/;\s*\n/)
      .filter(stmt => {
        const trimmed = stmt.trim();
        return trimmed && !trimmed.startsWith('--');
      })
      .map(stmt => stmt.trim());

    console.log(`📊 Executing ${statements.length} optimization statements\n`);

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Get description
      const firstLine = statement.split('\n')[0];
      const description = firstLine.length > 50 
        ? firstLine.substring(0, 50) + '...' 
        : firstLine;
      
      process.stdout.write(`[${i + 1}/${statements.length}] ${description}`);
      
      try {
        await client.query(statement);
        console.log(' ✅');
        successCount++;
      } catch (error) {
        console.log(' ❌');
        errorCount++;
        errors.push({ 
          statement: description, 
          error: error.message 
        });
      }
    }

    console.log('\n' + '━'.repeat(50));
    console.log('\n📊 Summary:');
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
      console.log('\n🎉 All optimizations applied successfully!');
      console.log('✨ Your database queries should now be significantly faster.');
    }

  } catch (error) {
    console.error('❌ Connection error:', error.message);
    console.log('\n💡 Please apply the migration manually via Supabase Dashboard:');
    console.log('   1. Go to your Supabase project SQL Editor');
    console.log('   2. Copy the contents of migrations/20250830_fix_rls_performance.sql');
    console.log('   3. Run the SQL statements');
  } finally {
    await client.end();
  }
}

// Run the script
applyOptimizations().catch(console.error);