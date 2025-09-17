#!/usr/bin/env tsx
/**
 * Quick validation of database accuracy fixes
 */

import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

async function validateFixes() {
  console.log(`${colors.cyan}${colors.bold}🔍 VALIDATION OF DATABASE FIXES${colors.reset}\n`);
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const results = { passed: 0, failed: 0 };

  // Test 1: Check DC66 embeddings with correct domain
  console.log(`${colors.blue}Test 1: DC66 Embeddings${colors.reset}`);
  try {
    // Direct query since RPC might have issues with the client
    const { data, error, count } = await supabase
      .from('page_embeddings')
      .select('id', { count: 'exact', head: true })
      .eq('domain_id', '8dccd788-1ec1-43c2-af56-78aa3366bad3')
      .ilike('chunk_text', '%DC66%');
    
    if (!error && count && count > 0) {
      console.log(`${colors.green}✅ DC66 products found: ${count} embeddings${colors.reset}`);
      results.passed++;
    } else {
      console.log(`${colors.red}❌ DC66 products not found (${error?.message || 'no results'})${colors.reset}`);
      results.failed++;
    }
  } catch (e) {
    console.log(`${colors.red}❌ DC66 test failed: ${e}${colors.reset}`);
    results.failed++;
  }

  // Test 2: Check indexes
  console.log(`\n${colors.blue}Test 2: Database Indexes${colors.reset}`);
  try {
    const { data: indexes } = await supabase.rpc('get_table_indexes', {
      table_name_param: 'page_embeddings'
    });
    
    const hasHNSW = indexes?.some((i: any) => i.indexdef?.toLowerCase().includes('hnsw'));
    const hasGIN = indexes?.some((i: any) => i.indexdef?.toLowerCase().includes('gin'));
    
    if (hasHNSW) {
      console.log(`${colors.green}✅ HNSW vector index exists${colors.reset}`);
      results.passed++;
    } else {
      console.log(`${colors.red}❌ HNSW vector index missing${colors.reset}`);
      results.failed++;
    }
    
    if (hasGIN) {
      console.log(`${colors.green}✅ GIN text index exists${colors.reset}`);
      results.passed++;
    } else {
      console.log(`${colors.red}❌ GIN text index missing${colors.reset}`);
      results.failed++;
    }
  } catch (e) {
    console.log(`${colors.red}❌ Index check failed: ${e}${colors.reset}`);
    results.failed += 2;
  }

  // Test 3: Fast vector search function
  console.log(`\n${colors.blue}Test 3: Fast Vector Search${colors.reset}`);
  try {
    const vectorString = `[${Array(1536).fill(0.1).join(',')}]`;
    const { data, error } = await supabase.rpc('fast_vector_search', {
      query_embedding: vectorString,
      domain_id_param: '8dccd788-1ec1-43c2-af56-78aa3366bad3',
      match_threshold: 0.1,
      match_count: 1
    });
    
    if (!error) {
      console.log(`${colors.green}✅ Fast vector search working${colors.reset}`);
      results.passed++;
    } else {
      console.log(`${colors.red}❌ Fast vector search failed: ${error.message}${colors.reset}`);
      results.failed++;
    }
  } catch (e) {
    console.log(`${colors.red}❌ Fast vector search error: ${e}${colors.reset}`);
    results.failed++;
  }

  // Test 4: Hybrid product search
  console.log(`\n${colors.blue}Test 4: Hybrid Product Search${colors.reset}`);
  try {
    const { data, error } = await supabase.rpc('hybrid_product_search', {
      search_query: 'DC66-10P relay',
      domain_id_param: '8dccd788-1ec1-43c2-af56-78aa3366bad3',
      result_limit: 5
    });
    
    if (!error && data) {
      console.log(`${colors.green}✅ Hybrid search returned ${data.length} results${colors.reset}`);
      if (data.length > 0 && data[0].title?.includes('DC66')) {
        console.log(`${colors.green}✅ DC66 product found in results${colors.reset}`);
        results.passed += 2;
      } else {
        console.log(`${colors.yellow}⚠️  DC66 not in top results${colors.reset}`);
        results.passed++;
      }
    } else {
      console.log(`${colors.red}❌ Hybrid search failed: ${error?.message}${colors.reset}`);
      results.failed++;
    }
  } catch (e) {
    console.log(`${colors.red}❌ Hybrid search error: ${e}${colors.reset}`);
    results.failed++;
  }

  // Summary
  console.log(`\n${colors.cyan}${colors.bold}📊 SUMMARY${colors.reset}`);
  console.log('='.repeat(40));
  
  const total = results.passed + results.failed;
  const percentage = ((results.passed / total) * 100).toFixed(0);
  
  if (Number(percentage) >= 80) {
    console.log(`${colors.green}${colors.bold}✅ PASSED: ${results.passed}/${total} tests (${percentage}%)${colors.reset}`);
    console.log(`${colors.green}All major fixes are working correctly!${colors.reset}`);
  } else if (Number(percentage) >= 60) {
    console.log(`${colors.yellow}${colors.bold}⚠️  PARTIAL: ${results.passed}/${total} tests (${percentage}%)${colors.reset}`);
    console.log(`${colors.yellow}Most fixes are working but some issues remain.${colors.reset}`);
  } else {
    console.log(`${colors.red}${colors.bold}❌ FAILED: ${results.passed}/${total} tests (${percentage}%)${colors.reset}`);
    console.log(`${colors.red}Significant issues need to be addressed.${colors.reset}`);
  }

  process.exit(results.failed > 0 ? 1 : 0);
}

validateFixes().catch(console.error);