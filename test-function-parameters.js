#!/usr/bin/env node
/**
 * Test Function Parameters
 * 
 * Figure out the correct parameter order for the Supabase RPC functions
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

async function testParameterOrders() {
  console.log('🧪 Testing Different Parameter Orders\n');

  const dummyEmbedding = Array(1536).fill(0);
  
  // Test different parameter orders for the enhanced function
  const testCases = [
    {
      name: 'Order 1: query_embedding, match_threshold, match_count, domain_filter',
      params: {
        query_embedding: dummyEmbedding,
        match_threshold: 0.1,
        match_count: 1,
        domain_filter: null
      }
    },
    {
      name: 'Order 2: match_threshold, match_count, query_embedding, domain_filter',
      params: {
        match_threshold: 0.1,
        match_count: 1,
        query_embedding: dummyEmbedding,
        domain_filter: null
      }
    },
    {
      name: 'Order 3: match_count, match_threshold, query_embedding, domain_filter',
      params: {
        match_count: 1,
        match_threshold: 0.1,
        query_embedding: dummyEmbedding,
        domain_filter: null
      }
    },
    {
      name: 'Order 4: domain_filter, match_count, match_threshold, query_embedding',
      params: {
        domain_filter: null,
        match_count: 1,
        match_threshold: 0.1,
        query_embedding: dummyEmbedding
      }
    }
  ];

  console.log('Testing match_page_embeddings_extended:\n');
  
  for (const testCase of testCases) {
    try {
      const { data, error } = await supabase.rpc('match_page_embeddings_extended', testCase.params);
      
      if (error) {
        if (error.message.includes('does not exist')) {
          console.log(`❌ ${testCase.name}: Function does not exist`);
        } else if (error.message.includes('schema cache')) {
          console.log(`⚠️  ${testCase.name}: Parameter order issue`);
        } else {
          console.log(`✅ ${testCase.name}: Function exists (error: ${error.message})`);
        }
      } else {
        console.log(`✅ ${testCase.name}: SUCCESS! Returned ${data ? data.length : 0} results`);
        if (data && data.length > 0) {
          console.log(`   Sample fields: ${Object.keys(data[0]).join(', ')}`);
        }
        break; // Found working order
      }
    } catch (e) {
      console.log(`❌ ${testCase.name}: Exception - ${e.message}`);
    }
  }

  console.log('\nTesting match_page_embeddings (standard function):\n');
  
  const standardTestCases = [
    {
      name: 'Order A: query_embedding, match_threshold, match_count',
      params: {
        query_embedding: dummyEmbedding,
        match_threshold: 0.1,
        match_count: 1
      }
    },
    {
      name: 'Order B: match_threshold, match_count, query_embedding',
      params: {
        match_threshold: 0.1,
        match_count: 1,
        query_embedding: dummyEmbedding
      }
    },
    {
      name: 'Order C: match_count, match_threshold, query_embedding',
      params: {
        match_count: 1,
        match_threshold: 0.1,
        query_embedding: dummyEmbedding
      }
    }
  ];

  for (const testCase of standardTestCases) {
    try {
      const { data, error } = await supabase.rpc('match_page_embeddings', testCase.params);
      
      if (error) {
        if (error.message.includes('does not exist')) {
          console.log(`❌ ${testCase.name}: Function does not exist`);
        } else if (error.message.includes('schema cache')) {
          console.log(`⚠️  ${testCase.name}: Parameter order issue`);
        } else {
          console.log(`✅ ${testCase.name}: Function exists (error: ${error.message})`);
        }
      } else {
        console.log(`✅ ${testCase.name}: SUCCESS! Returned ${data ? data.length : 0} results`);
        if (data && data.length > 0) {
          console.log(`   Sample fields: ${Object.keys(data[0]).join(', ')}`);
        }
        break; // Found working order
      }
    } catch (e) {
      console.log(`❌ ${testCase.name}: Exception - ${e.message}`);
    }
  }
}

// Run test
if (require.main === module) {
  testParameterOrders().catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
}

module.exports = { testParameterOrders };