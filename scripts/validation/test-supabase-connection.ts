#!/usr/bin/env npx tsx
/**
 * Test Supabase API Key Connection
 *
 * Validates that Supabase API keys can connect to the configured project
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function testConnection() {
  console.log('🔍 Testing Supabase Connection...\n');

  // Test 1: Check environment variables
  console.log('1️⃣ Environment Variables:');
  console.log(`   URL: ${SUPABASE_URL}`);
  console.log(`   Anon Key: ${ANON_KEY?.substring(0, 20)}...${ANON_KEY?.slice(-10)}`);
  console.log(`   Service Key: ${SERVICE_KEY?.substring(0, 20)}...${SERVICE_KEY?.slice(-10)}\n`);

  if (!SUPABASE_URL || !ANON_KEY || !SERVICE_KEY) {
    console.error('❌ Missing required environment variables!');
    process.exit(1);
  }

  // Test 2: Create clients
  console.log('2️⃣ Creating Supabase Clients...');
  const anonClient = createClient(SUPABASE_URL, ANON_KEY);
  const serviceClient = createClient(SUPABASE_URL, SERVICE_KEY);
  console.log('   ✅ Clients created\n');

  // Test 3: Test anon client
  console.log('3️⃣ Testing Anon Client Connection...');
  try {
    const { data, error } = await anonClient.from('customer_configs').select('count').limit(1);
    if (error) {
      console.error('   ❌ Anon client error:', error.message);
      console.error('   Hint:', error.hint);
    } else {
      console.log('   ✅ Anon client connected successfully');
      console.log('   Data:', data);
    }
  } catch (err: any) {
    console.error('   ❌ Anon client exception:', err.message);
  }

  console.log();

  // Test 4: Test service client
  console.log('4️⃣ Testing Service Client Connection...');
  try {
    const { data, error } = await serviceClient.from('customer_configs').select('count').limit(1);
    if (error) {
      console.error('   ❌ Service client error:', error.message);
      console.error('   Hint:', error.hint);
    } else {
      console.log('   ✅ Service client connected successfully');
      console.log('   Data:', data);
    }
  } catch (err: any) {
    console.error('   ❌ Service client exception:', err.message);
  }

  console.log();

  // Test 5: Check project info
  console.log('5️⃣ Extracting Project Info...');
  const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  console.log(`   Project Reference: ${projectRef}`);
  console.log(`   Expected: birugqyuqhiahxvxeyqg`);

  if (projectRef === 'birugqyuqhiahxvxeyqg') {
    console.log('   ✅ Project reference matches');
  } else {
    console.log('   ⚠️  Project reference mismatch!');
  }

  console.log('\n📊 Summary:');
  console.log('   If you see "Invalid API key" errors above, the keys in .env.local');
  console.log('   may be from a different Supabase project or need regeneration.');
  console.log('\n   To fix:');
  console.log('   1. Go to https://supabase.com/dashboard/project/birugqyuqhiahxvxeyqg/settings/api');
  console.log('   2. Verify the project URL matches: ' + SUPABASE_URL);
  console.log('   3. Copy the API keys from that specific project');
  console.log('   4. Update .env.local with those keys');
}

testConnection().catch(console.error);
