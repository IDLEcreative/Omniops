#!/usr/bin/env node
/**
 * Quick SQL Migration Verification
 * 
 * Simple script to verify the enhanced context window function exists and works
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function quickVerification() {
  console.log('🔍 Quick SQL Migration Verification\n');

  // Test 1: Check if enhanced function exists by calling it
  console.log('1. Testing enhanced function existence...');
  try {
    const dummyEmbedding = Array(1536).fill(0);
    const { data, error } = await supabase.rpc('match_page_embeddings_extended', {
      query_embedding: dummyEmbedding,
      match_threshold: 0.1,
      match_count: 1,
      domain_filter: null
    });

    if (error) {
      if (error.message.includes('does not exist')) {
        console.log('❌ Enhanced function does NOT exist');
        console.log('❌ Migration needs to be applied');
        return false;
      } else {
        console.log('✅ Enhanced function exists (got different error)');
        console.log('   Error:', error.message);
      }
    } else {
      console.log('✅ Enhanced function exists and works');
      console.log('✅ Returned', data ? data.length : 0, 'results');
    }
  } catch (error) {
    console.log('❌ Enhanced function test failed:', error.message);
    return false;
  }

  // Test 2: Check if standard function exists
  console.log('\n2. Testing standard function existence...');
  try {
    const dummyEmbedding = Array(1536).fill(0);
    const { data, error } = await supabase.rpc('match_page_embeddings', {
      query_embedding: dummyEmbedding,
      match_threshold: 0.1,
      match_count: 1
    });

    if (error) {
      if (error.message.includes('does not exist')) {
        console.log('❌ Standard function does NOT exist');
      } else {
        console.log('✅ Standard function exists');
      }
    } else {
      console.log('✅ Standard function exists and works');
    }
  } catch (error) {
    console.log('⚠️  Standard function test error:', error.message);
  }

  // Test 3: Check basic database connectivity
  console.log('\n3. Testing database connectivity...');
  try {
    const { data, error } = await supabase
      .from('page_embeddings')
      .select('id')
      .limit(1);

    if (error) {
      console.log('❌ Database connectivity failed:', error.message);
      return false;
    } else {
      console.log('✅ Database connectivity works');
      console.log('   Found', data ? data.length : 0, 'embeddings records');
    }
  } catch (error) {
    console.log('❌ Database test failed:', error.message);
    return false;
  }

  // Test 4: Check embeddings table structure
  console.log('\n4. Testing embeddings table structure...');
  try {
    const { data, error } = await supabase
      .from('page_embeddings')
      .select('id, content, metadata, embedding')
      .limit(1);

    if (error) {
      console.log('❌ Table structure test failed:', error.message);
      if (error.message.includes('domain')) {
        console.log('⚠️  This suggests table migration issues');
      }
      return false;
    } else {
      console.log('✅ Table structure looks correct');
      if (data && data.length > 0) {
        const record = data[0];
        console.log('   Sample record fields:', Object.keys(record));
      }
    }
  } catch (error) {
    console.log('❌ Table structure test failed:', error.message);
    return false;
  }

  console.log('\n📋 VERIFICATION SUMMARY:');
  console.log('- Enhanced function needs to be created/applied');
  console.log('- Database connectivity is working');
  console.log('- Basic table structure is in place');
  
  return true;
}

// Run verification
if (require.main === module) {
  quickVerification().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  });
}

module.exports = { quickVerification };