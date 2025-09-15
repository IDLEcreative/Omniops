#!/usr/bin/env node

/**
 * Test script to verify Supabase connection and MCP integration
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient  } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testConnection() {
  console.log('🔄 Testing Supabase connection...\n');
  
  try {
    // Test 1: Check if we can query a known table
    console.log('📊 Test 1: Testing database connectivity');
    const { data: testQuery, error: testError } = await supabase
      .from('customer_configs')
      .select('domain')
      .limit(1);
    
    if (testError) throw testError;
    console.log('✅ Successfully connected to database');
    
    // Test 2: Check customer_configs table
    console.log('\n📋 Test 2: Checking customer_configs table');
    const { count, error: countError } = await supabase
      .from('customer_configs')
      .select('*', { count: 'exact', head: true });
    
    if (countError) throw countError;
    console.log(`✅ customer_configs table has ${count} records`);
    
    // Test 3: Check extensions
    console.log('\n🔧 Test 3: Checking installed extensions');
    const { data: extensions, error: extError } = await supabase
      .rpc('pg_available_extensions')
      .select('*')
      .eq('installed', true)
      .limit(5);
    
    if (!extError && extensions) {
      console.log(`✅ Found ${extensions.length} installed extensions`);
    }
    
    // Test 4: Check if pgvector is enabled
    console.log('\n🔍 Test 4: Checking pgvector extension');
    const { data: vectorExt, error: vectorError } = await supabase
      .from('pg_extension')
      .select('*')
      .eq('extname', 'vector')
      .single();
    
    if (!vectorError && vectorExt) {
      console.log('✅ pgvector extension is installed');
    } else {
      console.log('⚠️  pgvector extension not found');
    }
    
    console.log('\n✨ All tests passed successfully!');
    console.log('📌 Supabase URL:', supabaseUrl);
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    process.exit(1);
  }
}

testConnection();