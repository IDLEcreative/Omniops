#!/usr/bin/env npx tsx
/**
 * Direct test of Supabase secret key (bypasses env loading)
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://birugqyuqhiahxvxeyqg.supabase.co';
const SECRET_KEY = 'sb_secret_cvw2bGj0SUTHbyWRyUL9ag_bzLZO6-3';

async function testDirectKey() {
  console.log('🔍 Testing secret key directly...\n');

  const client = createClient(SUPABASE_URL, SECRET_KEY);

  try {
    const { data, error } = await client.from('customer_configs').select('count').limit(1);

    if (error) {
      console.error('❌ Secret key FAILED');
      console.error('   Error:', error.message);
      console.error('   Hint:', error.hint);
      return false;
    } else {
      console.log('✅ Secret key WORKS!');
      console.log('   Data:', data);
      return true;
    }
  } catch (err: any) {
    console.error('❌ Exception:', err.message);
    return false;
  }
}

testDirectKey();
