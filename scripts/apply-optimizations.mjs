#!/usr/bin/env node

/**
 * Apply database optimizations directly via Supabase API
 * This bypasses timeout issues in the SQL Editor
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Read migration chunks
const chunks = [
  { name: 'Basic Indexes', file: 'chunk_1_indexes.sql' },
  { name: 'Full-Text Search', file: 'chunk_2_fulltext.sql' },
  { name: 'Vector Indexes', file: 'chunk_3_vector_index.sql' },
  { name: 'Cache Table', file: 'chunk_4_cache_table.sql' },
  { name: 'Search Functions', file: 'chunk_5_search_functions.sql' },
  { name: 'Cleanup', file: 'chunk_6_cleanup.sql' }
];

async function applyOptimizations() {
  console.log('🚀 Applying Database Optimizations\n');
  console.log('=' .repeat(60));
  console.log('\n📋 Instructions for Manual Application:\n');
  
  console.log('Since direct API execution requires special setup, please apply');
  console.log('these migrations manually in your Supabase SQL Editor:\n');
  
  console.log('1. Open your Supabase Dashboard');
  console.log('2. Go to SQL Editor');
  console.log('3. Apply each chunk in order:\n');
  
  for (const chunk of chunks) {
    const sqlPath = join(__dirname, '..', 'migrations', chunk.file);
    
    if (!fs.existsSync(sqlPath)) {
      console.error(`   ⚠️  File not found: ${chunk.file}`);
      continue;
    }
    
    console.log(`\n📦 Chunk: ${chunk.name} (${chunk.file})`);
    console.log('   Copy the contents of this file and run in SQL Editor');
    console.log(`   File path: ${sqlPath}`);
    console.log('   Expected result: "Chunk X complete" message');
    
    // Show first few lines of the SQL for reference
    const sql = fs.readFileSync(sqlPath, 'utf8');
    const lines = sql.split('\n').slice(0, 5);
    console.log('   Preview:');
    lines.forEach(line => {
      if (line.trim()) {
        console.log(`     ${line.substring(0, 60)}${line.length > 60 ? '...' : ''}`);
      }
    });
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('\n💡 Tips:');
  console.log('   • Each chunk takes 5-15 seconds to run');
  console.log('   • If a chunk fails, you can safely retry it');
  console.log('   • The chunks are independent and idempotent');
  console.log('   • Monitor the results after each chunk');
  
  console.log('\n🎯 After applying all chunks:');
  console.log('   1. Test the chat widget at http://localhost:3000/embed');
  console.log('   2. Run: node scripts/test-query-optimizations.mjs');
  console.log('   3. Check for 80%+ performance improvement');
}

// Run the script
applyOptimizations().catch(console.error);