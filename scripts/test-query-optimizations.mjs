#!/usr/bin/env node

/**
 * Test script to verify database optimizations
 * Runs sample queries and measures performance improvements
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test queries
const tests = [
  {
    name: 'Full-text search (replaces ILIKE)',
    before: async () => {
      const start = Date.now();
      const { data, error } = await supabase
        .from('scraped_pages')
        .select('url, title, content')
        .ilike('content', '%spare parts%')
        .limit(10);
      return { time: Date.now() - start, count: data?.length || 0, error };
    },
    after: async () => {
      const start = Date.now();
      const { data, error } = await supabase.rpc('search_text_content', {
        query_text: 'spare parts',
        p_domain_id: null,
        match_count: 10
      });
      return { time: Date.now() - start, count: data?.length || 0, error };
    }
  },
  
  {
    name: 'Vector similarity search',
    before: async () => {
      // Get a sample embedding
      const { data: sample } = await supabase
        .from('page_embeddings')
        .select('embedding')
        .limit(1)
        .single();
      
      if (!sample?.embedding) return { time: 0, count: 0, error: 'No sample embedding' };
      
      const start = Date.now();
      const { data, error } = await supabase.rpc('search_embeddings', {
        query_embedding: sample.embedding,
        p_domain_id: null,
        match_threshold: 0.7,
        match_count: 10
      });
      return { time: Date.now() - start, count: data?.length || 0, error };
    },
    after: async () => {
      // Get a sample embedding
      const { data: sample } = await supabase
        .from('page_embeddings')
        .select('embedding')
        .limit(1)
        .single();
      
      if (!sample?.embedding) return { time: 0, count: 0, error: 'No sample embedding' };
      
      const start = Date.now();
      const { data, error } = await supabase.rpc('search_embeddings_optimized', {
        query_embedding: sample.embedding,
        p_domain_id: null,
        match_threshold: 0.7,
        match_count: 10
      });
      return { time: Date.now() - start, count: data?.length || 0, error };
    }
  },
  
  {
    name: 'Domain-filtered page lookup',
    before: async () => {
      // Get a sample domain
      const { data: domain } = await supabase
        .from('customer_configs')
        .select('id')
        .limit(1)
        .single();
      
      if (!domain) return { time: 0, count: 0, error: 'No domains found' };
      
      const start = Date.now();
      const { data, error } = await supabase
        .from('scraped_pages')
        .select('*')
        .eq('domain_id', domain.id)
        .limit(100);
      return { time: Date.now() - start, count: data?.length || 0, error };
    },
    after: async () => {
      // Same query but should use new indexes
      const { data: domain } = await supabase
        .from('customer_configs')
        .select('id')
        .limit(1)
        .single();
      
      if (!domain) return { time: 0, count: 0, error: 'No domains found' };
      
      const start = Date.now();
      const { data, error } = await supabase
        .from('scraped_pages')
        .select('*')
        .eq('domain_id', domain.id)
        .limit(100);
      return { time: Date.now() - start, count: data?.length || 0, error };
    }
  }
];

async function runTests() {
  console.log('🧪 Testing Database Optimizations\n');
  console.log('=' .repeat(60));
  
  const results = [];
  
  for (const test of tests) {
    console.log(`\n📊 Testing: ${test.name}`);
    console.log('-'.repeat(40));
    
    // Run before optimization
    console.log('  Running baseline query...');
    const before = await test.before();
    
    // Run after optimization  
    console.log('  Running optimized query...');
    const after = await test.after();
    
    // Calculate improvement
    const improvement = before.time > 0 
      ? ((before.time - after.time) / before.time * 100).toFixed(1)
      : 0;
    
    // Display results
    console.log(`\n  Results:`);
    console.log(`    Before: ${before.time}ms (${before.count} rows)`);
    console.log(`    After:  ${after.time}ms (${after.count} rows)`);
    
    if (before.error || after.error) {
      console.log(`    ⚠️  Errors detected:`);
      if (before.error) console.log(`      Before: ${before.error}`);
      if (after.error) console.log(`      After: ${after.error}`);
    } else if (improvement > 0) {
      console.log(`    ✅ ${improvement}% faster!`);
    } else if (improvement < 0) {
      console.log(`    ⚠️  ${Math.abs(improvement)}% slower`);
    } else {
      console.log(`    ➖ No significant change`);
    }
    
    results.push({
      test: test.name,
      before: before.time,
      after: after.time,
      improvement: parseFloat(improvement)
    });
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📈 OPTIMIZATION SUMMARY\n');
  
  const avgImprovement = results.reduce((sum, r) => sum + r.improvement, 0) / results.length;
  
  console.log('Test Results:');
  results.forEach(r => {
    const icon = r.improvement > 20 ? '🚀' : r.improvement > 0 ? '✅' : '⚠️';
    console.log(`  ${icon} ${r.test}: ${r.improvement}% improvement`);
  });
  
  console.log(`\nOverall Average Improvement: ${avgImprovement.toFixed(1)}%`);
  
  // Performance recommendations
  console.log('\n' + '='.repeat(60));
  console.log('\n💡 RECOMMENDATIONS\n');
  
  if (avgImprovement > 50) {
    console.log('✅ Excellent! The optimizations are working very well.');
    console.log('   Consider implementing the query cache in production.');
  } else if (avgImprovement > 20) {
    console.log('✅ Good improvement detected.');
    console.log('   Monitor production performance after deployment.');
  } else if (avgImprovement > 0) {
    console.log('⚠️  Modest improvement detected.');
    console.log('   Consider additional optimizations like:');
    console.log('   - Implementing Redis caching');
    console.log('   - Using materialized views for complex queries');
    console.log('   - Partitioning large tables');
  } else {
    console.log('❌ No significant improvement detected.');
    console.log('   Please verify that the migration was applied correctly.');
    console.log('   Run the SQL migration in Supabase dashboard.');
  }
  
  console.log('\n✅ Testing complete!');
}

// Run tests
runTests().catch(console.error);