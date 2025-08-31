#!/usr/bin/env node

/**
 * Complete validation of all optimizations
 * Tests migrations, functions, cache, and end-to-end performance
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fetch from 'node-fetch';

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

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

async function validateOptimizations() {
  console.log(`${colors.cyan}🔍 VALIDATION REPORT - DATABASE OPTIMIZATIONS${colors.reset}\n`);
  console.log('=' .repeat(60));
  
  const results = {
    migrations: [],
    functions: [],
    cache: [],
    performance: []
  };
  
  // 1. Validate Migrations
  console.log(`\n${colors.blue}📦 VALIDATING MIGRATIONS${colors.reset}`);
  console.log('-'.repeat(40));
  
  // Check indexes
  const { data: indexes } = await supabase.rpc('execute_sql', {
    sql: `
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND indexname LIKE 'idx_%'
      ORDER BY tablename, indexname
    `
  }).single();
  
  const expectedIndexes = [
    'idx_scraped_pages_domain_id',
    'idx_scraped_pages_domain_url',
    'idx_page_embeddings_page_id',
    'idx_messages_conversation_id',
    'idx_scraped_pages_content_search',
    'idx_query_cache_lookup'
  ];
  
  if (indexes && Array.isArray(indexes)) {
    const indexNames = indexes.map(i => i.indexname);
    expectedIndexes.forEach(idx => {
      const exists = indexNames.includes(idx);
      console.log(`   ${exists ? colors.green + '✓' : colors.red + '✗'} ${idx}: ${exists ? 'Present' : 'Missing'}${colors.reset}`);
      results.migrations.push({ name: idx, status: exists });
    });
  }
  
  // Check full-text search column
  const { data: ftColumn } = await supabase
    .from('scraped_pages')
    .select('content_search_vector')
    .limit(1);
  
  const hasFTColumn = ftColumn !== null && !ftColumn.error;
  console.log(`   ${hasFTColumn ? colors.green + '✓' : colors.red + '✗'} Full-text search column: ${hasFTColumn ? 'Present' : 'Missing'}${colors.reset}`);
  results.migrations.push({ name: 'Full-text column', status: hasFTColumn });
  
  // Check cache table
  const { error: cacheError } = await supabase
    .from('query_cache')
    .select('id')
    .limit(1);
  
  const hasCacheTable = !cacheError;
  console.log(`   ${hasCacheTable ? colors.green + '✓' : colors.red + '✗'} Query cache table: ${hasCacheTable ? 'Present' : 'Missing'}${colors.reset}`);
  results.migrations.push({ name: 'Cache table', status: hasCacheTable });
  
  // 2. Validate Functions
  console.log(`\n${colors.blue}⚡ VALIDATING OPTIMIZED FUNCTIONS${colors.reset}`);
  console.log('-'.repeat(40));
  
  const functions = [
    { name: 'search_text_content', test: { query_text: 'test', p_domain_id: null, match_count: 1 } },
    { name: 'search_embeddings_optimized', test: null }, // Needs embedding
    { name: 'search_content_optimized', test: { query_text: 'test', query_embedding: null, p_domain_id: null, match_count: 1 } },
    { name: 'cleanup_expired_cache', test: {} }
  ];
  
  for (const func of functions) {
    try {
      if (func.test) {
        const { error } = await supabase.rpc(func.name, func.test);
        const exists = !error;
        console.log(`   ${exists ? colors.green + '✓' : colors.red + '✗'} ${func.name}: ${exists ? 'Working' : error?.message || 'Not found'}${colors.reset}`);
        results.functions.push({ name: func.name, status: exists });
      } else {
        console.log(`   ${colors.yellow + '⚠'} ${func.name}: Skipped (needs embedding)${colors.reset}`);
        results.functions.push({ name: func.name, status: 'skipped' });
      }
    } catch (err) {
      console.log(`   ${colors.red + '✗'} ${func.name}: Error - ${err.message}${colors.reset}`);
      results.functions.push({ name: func.name, status: false });
    }
  }
  
  // 3. Validate Cache Implementation
  console.log(`\n${colors.blue}💾 VALIDATING CACHE SYSTEM${colors.reset}`);
  console.log('-'.repeat(40));
  
  // Test cache write
  const testCacheData = {
    domain_id: '00000000-0000-0000-0000-000000000000',
    query_hash: 'test_' + Date.now(),
    query_text: 'validation test',
    results: { test: true },
    expires_at: new Date(Date.now() + 3600000).toISOString()
  };
  
  const { error: cacheWriteError } = await supabase
    .from('query_cache')
    .insert(testCacheData);
  
  const cacheWriteWorks = !cacheWriteError;
  console.log(`   ${cacheWriteWorks ? colors.green + '✓' : colors.red + '✗'} Cache write: ${cacheWriteWorks ? 'Working' : cacheWriteError?.message}${colors.reset}`);
  results.cache.push({ name: 'Write', status: cacheWriteWorks });
  
  // Test cache read
  if (cacheWriteWorks) {
    const { data: cacheReadData, error: cacheReadError } = await supabase
      .from('query_cache')
      .select('results')
      .eq('query_hash', testCacheData.query_hash)
      .single();
    
    const cacheReadWorks = !cacheReadError && cacheReadData?.results?.test === true;
    console.log(`   ${cacheReadWorks ? colors.green + '✓' : colors.red + '✗'} Cache read: ${cacheReadWorks ? 'Working' : 'Failed'}${colors.reset}`);
    results.cache.push({ name: 'Read', status: cacheReadWorks });
    
    // Cleanup test data
    await supabase
      .from('query_cache')
      .delete()
      .eq('query_hash', testCacheData.query_hash);
  }
  
  // Check if chat route uses cache
  const chatRouteContent = await fetch(`file://${join(__dirname, '..', 'app/api/chat/route.ts')}`)
    .then(r => r.text())
    .catch(() => '');
  
  const usesQueryCache = chatRouteContent.includes('QueryCache');
  console.log(`   ${usesQueryCache ? colors.green + '✓' : colors.red + '✗'} Chat route uses cache: ${usesQueryCache ? 'Yes' : 'No'}${colors.reset}`);
  results.cache.push({ name: 'Route integration', status: usesQueryCache });
  
  // 4. Performance Tests
  console.log(`\n${colors.blue}🚀 PERFORMANCE VALIDATION${colors.reset}`);
  console.log('-'.repeat(40));
  
  // Test basic query
  const perfTests = [
    {
      name: 'Basic SELECT',
      query: async () => {
        const start = Date.now();
        await supabase.from('scraped_pages').select('id, url').limit(100);
        return Date.now() - start;
      }
    },
    {
      name: 'Indexed JOIN',
      query: async () => {
        const start = Date.now();
        await supabase
          .from('page_embeddings')
          .select('id, page_id, scraped_pages(url)')
          .limit(50);
        return Date.now() - start;
      }
    },
    {
      name: 'Text search (ILIKE)',
      query: async () => {
        const start = Date.now();
        await supabase
          .from('scraped_pages')
          .select('url')
          .ilike('content', '%product%')
          .limit(10);
        return Date.now() - start;
      }
    }
  ];
  
  for (const test of perfTests) {
    try {
      const time = await test.query();
      const isGood = time < 200;
      const isExcellent = time < 100;
      const icon = isExcellent ? colors.green + '🚀' : isGood ? colors.yellow + '✓' : colors.red + '⚠';
      console.log(`   ${icon} ${test.name}: ${time}ms${colors.reset}`);
      results.performance.push({ name: test.name, time, status: isGood });
    } catch (err) {
      console.log(`   ${colors.red + '✗'} ${test.name}: Error${colors.reset}`);
      results.performance.push({ name: test.name, time: null, status: false });
    }
  }
  
  // 5. Summary
  console.log(`\n${colors.cyan}📊 VALIDATION SUMMARY${colors.reset}`);
  console.log('=' .repeat(60));
  
  const migrationScore = results.migrations.filter(m => m.status).length / results.migrations.length * 100;
  const functionScore = results.functions.filter(f => f.status === true).length / results.functions.length * 100;
  const cacheScore = results.cache.filter(c => c.status).length / results.cache.length * 100;
  const perfScore = results.performance.filter(p => p.status).length / results.performance.length * 100;
  const overallScore = (migrationScore + functionScore + cacheScore + perfScore) / 4;
  
  console.log(`\n${colors.blue}Component Scores:${colors.reset}`);
  console.log(`   Migrations:    ${getScoreColor(migrationScore)}${migrationScore.toFixed(0)}%${colors.reset}`);
  console.log(`   Functions:     ${getScoreColor(functionScore)}${functionScore.toFixed(0)}%${colors.reset}`);
  console.log(`   Cache System:  ${getScoreColor(cacheScore)}${cacheScore.toFixed(0)}%${colors.reset}`);
  console.log(`   Performance:   ${getScoreColor(perfScore)}${perfScore.toFixed(0)}%${colors.reset}`);
  
  console.log(`\n${colors.blue}Overall Score: ${getScoreColor(overallScore)}${overallScore.toFixed(0)}%${colors.reset}`);
  
  // Final verdict
  console.log(`\n${colors.cyan}🎯 VERDICT:${colors.reset}`);
  if (overallScore >= 90) {
    console.log(`   ${colors.green}✅ EXCELLENT - All optimizations are working perfectly!${colors.reset}`);
    console.log(`   Your system is fully optimized and ready for production.`);
  } else if (overallScore >= 70) {
    console.log(`   ${colors.yellow}⚠️  GOOD - Most optimizations are active${colors.reset}`);
    console.log(`   Some components need attention for full optimization.`);
  } else if (overallScore >= 50) {
    console.log(`   ${colors.yellow}⚠️  PARTIAL - Some optimizations are working${colors.reset}`);
    console.log(`   Apply remaining migrations for better performance.`);
  } else {
    console.log(`   ${colors.red}❌ NEEDS WORK - Most optimizations are missing${colors.reset}`);
    console.log(`   Please apply the migration files in Supabase SQL Editor.`);
  }
  
  // Recommendations
  if (overallScore < 100) {
    console.log(`\n${colors.blue}📋 RECOMMENDATIONS:${colors.reset}`);
    
    if (migrationScore < 100) {
      const missing = results.migrations.filter(m => !m.status).map(m => m.name);
      console.log(`   • Apply missing migrations: ${missing.join(', ')}`);
    }
    
    if (functionScore < 100) {
      const missing = results.functions.filter(f => !f.status).map(f => f.name);
      console.log(`   • Create missing functions: ${missing.join(', ')}`);
    }
    
    if (!usesQueryCache) {
      console.log(`   • Ensure chat route imports and uses QueryCache`);
    }
    
    if (perfScore < 100) {
      console.log(`   • Review slow queries and add appropriate indexes`);
    }
  }
  
  // Performance metrics
  const avgTime = results.performance
    .filter(p => p.time !== null)
    .reduce((sum, p) => sum + p.time, 0) / results.performance.length;
  
  console.log(`\n${colors.blue}⚡ Performance Metrics:${colors.reset}`);
  console.log(`   Average query time: ${avgTime.toFixed(0)}ms`);
  console.log(`   Performance rating: ${getPerformanceRating(avgTime)}`);
}

function getScoreColor(score) {
  if (score >= 90) return colors.green;
  if (score >= 70) return colors.yellow;
  return colors.red;
}

function getPerformanceRating(avgTime) {
  if (avgTime < 50) return `${colors.green}🚀 Outstanding${colors.reset}`;
  if (avgTime < 100) return `${colors.green}✅ Excellent${colors.reset}`;
  if (avgTime < 200) return `${colors.yellow}👍 Good${colors.reset}`;
  if (avgTime < 500) return `${colors.yellow}⚠️  Fair${colors.reset}`;
  return `${colors.red}❌ Needs Improvement${colors.reset}`;
}

// Run validation
validateOptimizations().catch(console.error);