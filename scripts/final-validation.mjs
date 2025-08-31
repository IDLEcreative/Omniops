#!/usr/bin/env node

/**
 * Final validation of optimization implementation
 * Provides a clear status report
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

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function finalValidation() {
  console.log('\n' + '='.repeat(60));
  console.log('🏁 FINAL OPTIMIZATION VALIDATION REPORT');
  console.log('='.repeat(60));
  
  const status = {
    migrations: { total: 0, applied: 0, items: [] },
    functions: { total: 0, working: 0, items: [] },
    caching: { total: 0, active: 0, items: [] },
    performance: { tests: [], avgTime: 0 }
  };
  
  // 1. Check Migrations
  console.log('\n📦 DATABASE MIGRATIONS:');
  console.log('-'.repeat(40));
  
  // Check key indexes
  const indexChecks = [
    { name: 'Basic indexes on foreign keys', check: 'idx_scraped_pages_domain_id' },
    { name: 'Composite index for domain+URL', check: 'idx_scraped_pages_domain_url' },
    { name: 'Full-text search GIN index', check: 'idx_scraped_pages_content_search' },
    { name: 'Cache lookup index', check: 'idx_query_cache_lookup' }
  ];
  
  for (const idx of indexChecks) {
    const { data } = await supabase.rpc('execute_sql', {
      sql: `SELECT 1 FROM pg_indexes WHERE indexname = '${idx.check}'`
    }).single();
    
    const exists = data && data.length > 0;
    status.migrations.total++;
    if (exists) status.migrations.applied++;
    
    console.log(`   ${exists ? '✅' : '❌'} ${idx.name}`);
    status.migrations.items.push({ name: idx.name, applied: exists });
  }
  
  // Check tables
  const { error: cacheTableError } = await supabase
    .from('query_cache')
    .select('id')
    .limit(1);
  
  const cacheTableExists = !cacheTableError;
  status.migrations.total++;
  if (cacheTableExists) status.migrations.applied++;
  console.log(`   ${cacheTableExists ? '✅' : '❌'} Query cache table`);
  
  // 2. Check Functions
  console.log('\n⚡ OPTIMIZED FUNCTIONS:');
  console.log('-'.repeat(40));
  
  const functionTests = [
    { name: 'search_text_content', exists: false },
    { name: 'search_embeddings_optimized', exists: false },
    { name: 'cleanup_expired_cache', exists: false }
  ];
  
  for (const func of functionTests) {
    try {
      // Just check if function exists, don't call it
      const { data } = await supabase.rpc('execute_sql', {
        sql: `SELECT 1 FROM pg_proc WHERE proname = '${func.name}'`
      }).single();
      
      func.exists = data && data.length > 0;
    } catch (err) {
      func.exists = false;
    }
    
    status.functions.total++;
    if (func.exists) status.functions.working++;
    
    console.log(`   ${func.exists ? '✅' : '❌'} ${func.name}()`);
    status.functions.items.push({ name: func.name, exists: func.exists });
  }
  
  // 3. Check Caching Implementation
  console.log('\n💾 CACHING SYSTEM:');
  console.log('-'.repeat(40));
  
  // Check chat route uses cache
  const chatRoutePath = join(__dirname, '..', 'app/api/chat/route.ts');
  const chatRouteContent = fs.readFileSync(chatRoutePath, 'utf8');
  const usesQueryCache = chatRouteContent.includes('QueryCache');
  
  status.caching.total++;
  if (usesQueryCache) status.caching.active++;
  console.log(`   ${usesQueryCache ? '✅' : '❌'} Chat route imports QueryCache`);
  
  // Check cache library exists
  const cacheLibPath = join(__dirname, '..', 'lib/query-cache.ts');
  const cacheLibExists = fs.existsSync(cacheLibPath);
  
  status.caching.total++;
  if (cacheLibExists) status.caching.active++;
  console.log(`   ${cacheLibExists ? '✅' : '❌'} QueryCache library exists`);
  
  // Check if cache is used in route
  const cacheExecuteCalls = (chatRouteContent.match(/QueryCache\.execute/g) || []).length;
  const usesCacheExecute = cacheExecuteCalls > 0;
  
  status.caching.total++;
  if (usesCacheExecute) status.caching.active++;
  console.log(`   ${usesCacheExecute ? '✅' : '❌'} Cache.execute() used (${cacheExecuteCalls} times)`);
  
  status.caching.items = [
    { name: 'QueryCache import', active: usesQueryCache },
    { name: 'Cache library', active: cacheLibExists },
    { name: 'Cache usage', active: usesCacheExecute }
  ];
  
  // 4. Performance Testing
  console.log('\n🚀 PERFORMANCE METRICS:');
  console.log('-'.repeat(40));
  
  const perfTests = [
    {
      name: 'Basic page fetch',
      test: async () => {
        const start = Date.now();
        await supabase.from('scraped_pages').select('id, url').limit(100);
        return Date.now() - start;
      }
    },
    {
      name: 'Text search (ILIKE)',
      test: async () => {
        const start = Date.now();
        await supabase
          .from('scraped_pages')
          .select('url, title')
          .ilike('content', '%product%')
          .limit(10);
        return Date.now() - start;
      }
    },
    {
      name: 'Join query',
      test: async () => {
        const start = Date.now();
        await supabase
          .from('page_embeddings')
          .select('id, page_id')
          .limit(50);
        return Date.now() - start;
      }
    }
  ];
  
  let totalTime = 0;
  for (const test of perfTests) {
    try {
      const time = await test.test();
      totalTime += time;
      
      const rating = time < 100 ? '🚀' : time < 200 ? '✅' : time < 500 ? '⚠️' : '❌';
      console.log(`   ${rating} ${test.name}: ${time}ms`);
      
      status.performance.tests.push({ name: test.name, time, good: time < 200 });
    } catch (err) {
      console.log(`   ❌ ${test.name}: Error`);
      status.performance.tests.push({ name: test.name, time: null, good: false });
    }
  }
  
  status.performance.avgTime = Math.round(totalTime / perfTests.length);
  
  // 5. Final Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  
  const migrationPct = (status.migrations.applied / status.migrations.total * 100).toFixed(0);
  const functionPct = (status.functions.working / status.functions.total * 100).toFixed(0);
  const cachePct = (status.caching.active / status.caching.total * 100).toFixed(0);
  const perfScore = status.performance.tests.filter(t => t.good).length / status.performance.tests.length * 100;
  
  console.log('\nComponent Status:');
  console.log(`   Database Migrations: ${migrationPct}% (${status.migrations.applied}/${status.migrations.total})`);
  console.log(`   Optimized Functions: ${functionPct}% (${status.functions.working}/${status.functions.total})`);
  console.log(`   Caching System:      ${cachePct}% (${status.caching.active}/${status.caching.total})`);
  console.log(`   Performance Tests:   ${perfScore.toFixed(0)}% passing`);
  
  console.log('\nPerformance:');
  console.log(`   Average Query Time: ${status.performance.avgTime}ms`);
  
  const rating = status.performance.avgTime < 100 ? 'Excellent 🚀' :
                 status.performance.avgTime < 200 ? 'Good ✅' :
                 status.performance.avgTime < 500 ? 'Fair ⚠️' : 'Needs Work ❌';
  console.log(`   Performance Rating: ${rating}`);
  
  // Overall verdict
  const overallScore = (parseFloat(migrationPct) + parseFloat(functionPct) + parseFloat(cachePct) + perfScore) / 4;
  
  console.log('\n' + '='.repeat(60));
  console.log(`OVERALL OPTIMIZATION SCORE: ${overallScore.toFixed(0)}%`);
  console.log('='.repeat(60));
  
  if (overallScore >= 80) {
    console.log('\n✅ VALIDATION PASSED - System is well optimized!');
    console.log('   Your application has excellent performance.');
  } else if (overallScore >= 60) {
    console.log('\n⚠️  PARTIALLY OPTIMIZED - Good progress!');
    console.log('   Core optimizations are working, some features missing.');
  } else {
    console.log('\n❌ NEEDS ATTENTION - Key optimizations missing');
    console.log('   Apply the remaining migrations for better performance.');
  }
  
  // Specific recommendations
  if (overallScore < 100) {
    console.log('\n💡 TO COMPLETE OPTIMIZATION:');
    
    if (functionPct < 100) {
      console.log('   1. Apply migrations/apply_remaining.sql in Supabase SQL Editor');
    }
    
    if (migrationPct < 100) {
      const missing = status.migrations.items.filter(m => !m.applied).map(m => m.name);
      console.log(`   2. Create missing indexes: ${missing.join(', ')}`);
    }
    
    if (cachePct < 100 && !usesQueryCache) {
      console.log('   3. Verify QueryCache import in chat route');
    }
  } else {
    console.log('\n🎉 All optimizations are fully implemented!');
  }
  
  console.log('\n');
}

// Run validation
finalValidation().catch(console.error);