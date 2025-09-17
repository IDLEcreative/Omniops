#!/usr/bin/env npx tsx

/**
 * Database Performance Diagnosis for Search Coverage Issues
 * 
 * This script directly tests database queries to identify bottlenecks
 * affecting the intelligent chat search coverage.
 */

import { createServiceRoleClient } from '@/lib/supabase-server';

async function testBasicDatabaseConnection() {
  console.log('🔍 Testing Database Connection and Basic Queries');
  console.log('===============================================');
  
  try {
    const supabase = await createServiceRoleClient();
    if (!supabase) {
      console.log('❌ Failed to create Supabase client');
      return false;
    }
    
    console.log('✅ Supabase client created successfully');
    
    // Test 1: Basic table access
    console.log('\n1. Testing basic table access...');
    const { data: domains, error: domainError } = await supabase
      .from('customer_configs')
      .select('id, domain')
      .limit(5);
    
    if (domainError) {
      console.log(`❌ Domain query failed: ${domainError.message}`);
      return false;
    }
    
    console.log(`✅ Found ${domains?.length || 0} customer domains`);
    
    // Test 2: Find thompsonseparts domain
    console.log('\n2. Finding thompsonseparts.co.uk domain...');
    const { data: targetDomain, error: targetError } = await supabase
      .from('customer_configs')
      .select('id, domain')
      .eq('domain', 'thompsonseparts.co.uk')
      .single();
    
    if (targetError) {
      console.log(`❌ Target domain query failed: ${targetError.message}`);
      return false;
    }
    
    if (!targetDomain) {
      console.log('❌ thompsonseparts.co.uk domain not found');
      return false;
    }
    
    console.log(`✅ Found domain: ${targetDomain.domain} (ID: ${targetDomain.id})`);
    
    return { domainId: targetDomain.id, client: supabase };
    
  } catch (error) {
    console.log(`❌ Database connection failed: ${error instanceof Error ? error.message : error}`);
    return false;
  }
}

async function testProductCounts(supabase: any, domainId: string) {
  console.log('\n📊 Testing Product Count Queries');
  console.log('=================================');
  
  try {
    // Test scraped pages count
    console.log('\n1. Checking scraped pages...');
    const { data: pages, error: pagesError, count: pagesCount } = await supabase
      .from('scraped_pages')
      .select('id', { count: 'exact' })
      .eq('domain_id', domainId);
    
    if (pagesError) {
      console.log(`❌ Pages count failed: ${pagesError.message}`);
    } else {
      console.log(`✅ Total scraped pages: ${pagesCount || 0}`);
    }
    
    // Test embeddings count
    console.log('\n2. Checking page embeddings...');
    const { data: embeddings, error: embeddingsError, count: embeddingsCount } = await supabase
      .from('page_embeddings')
      .select('id', { count: 'exact' })
      .eq('domain_id', domainId);
    
    if (embeddingsError) {
      console.log(`❌ Embeddings count failed: ${embeddingsError.message}`);
    } else {
      console.log(`✅ Total embeddings: ${embeddingsCount || 0}`);
    }
    
    // Test product URL count
    console.log('\n3. Checking product URLs...');
    const { data: products, error: productsError, count: productsCount } = await supabase
      .from('scraped_pages')
      .select('id', { count: 'exact' })
      .eq('domain_id', domainId)
      .like('url', '%/product/%');
    
    if (productsError) {
      console.log(`❌ Product URLs count failed: ${productsError.message}`);
    } else {
      console.log(`✅ Product page URLs: ${productsCount || 0}`);
    }
    
    // Test Cifa-specific content
    console.log('\n4. Searching for Cifa content...');
    const { data: cifaPages, error: cifaError, count: cifaCount } = await supabase
      .from('scraped_pages')
      .select('id', { count: 'exact' })
      .eq('domain_id', domainId)
      .or('title.ilike.%cifa%,content.ilike.%cifa%');
    
    if (cifaError) {
      console.log(`❌ Cifa search failed: ${cifaError.message}`);
    } else {
      console.log(`✅ Pages mentioning Cifa: ${cifaCount || 0}`);
    }
    
    return {
      totalPages: pagesCount || 0,
      totalEmbeddings: embeddingsCount || 0,
      productPages: productsCount || 0,
      cifaPages: cifaCount || 0
    };
    
  } catch (error) {
    console.log(`❌ Product count queries failed: ${error instanceof Error ? error.message : error}`);
    return null;
  }
}

async function testSearchPerformance(supabase: any, domainId: string) {
  console.log('\n⚡ Testing Search Query Performance');
  console.log('===================================');
  
  const searchTests = [
    {
      name: 'Simple text search',
      query: () => supabase
        .from('scraped_pages')
        .select('id, title, url')
        .eq('domain_id', domainId)
        .ilike('content', '%pump%')
        .limit(10),
      timeoutMs: 5000
    },
    {
      name: 'Product URL pattern search',
      query: () => supabase
        .from('scraped_pages')
        .select('id, title, url')
        .eq('domain_id', domainId)
        .like('url', '%/product/%')
        .limit(20),
      timeoutMs: 3000
    },
    {
      name: 'Cifa brand search',
      query: () => supabase
        .from('scraped_pages')
        .select('id, title, url')
        .eq('domain_id', domainId)
        .or('title.ilike.%cifa%,content.ilike.%cifa%')
        .limit(50),
      timeoutMs: 8000
    }
  ];
  
  const results = [];
  
  for (const test of searchTests) {
    console.log(`\n🔍 ${test.name}...`);
    
    try {
      const startTime = Date.now();
      
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), test.timeoutMs)
      );
      
      // Race the query against timeout
      const result = await Promise.race([
        test.query(),
        timeoutPromise
      ]);
      
      const duration = Date.now() - startTime;
      
      if (result && typeof result === 'object' && 'data' in result) {
        const { data, error } = result as any;
        
        if (error) {
          console.log(`   ❌ Query error: ${error.message}`);
          results.push({ name: test.name, success: false, error: error.message, duration });
        } else {
          console.log(`   ✅ Found ${data?.length || 0} results in ${duration}ms`);
          results.push({ name: test.name, success: true, count: data?.length || 0, duration });
        }
      }
      
    } catch (error) {
      const duration = Date.now() - Date.now();
      console.log(`   ❌ Failed: ${error instanceof Error ? error.message : error}`);
      results.push({ name: test.name, success: false, error: String(error), duration });
    }
  }
  
  return results;
}

async function testEmbeddingsPerformance(supabase: any, domainId: string) {
  console.log('\n🧮 Testing Embeddings Query Performance');
  console.log('=======================================');
  
  try {
    // Test 1: Simple embeddings count with timeout
    console.log('\n1. Testing embeddings table access...');
    const startTime = Date.now();
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Embeddings query timeout')), 5000)
    );
    
    const countQuery = supabase
      .from('page_embeddings')
      .select('id', { count: 'exact' })
      .eq('domain_id', domainId)
      .limit(1);
    
    const result = await Promise.race([countQuery, timeoutPromise]);
    const duration = Date.now() - startTime;
    
    if (result && typeof result === 'object' && 'count' in result) {
      console.log(`   ✅ Embeddings table accessible: ${result.count} rows in ${duration}ms`);
      return true;
    }
    
  } catch (error) {
    console.log(`   ❌ Embeddings query failed: ${error instanceof Error ? error.message : error}`);
    
    if (error instanceof Error && error.message.includes('timeout')) {
      console.log('   🐌 Embeddings table has performance issues');
    }
    
    return false;
  }
}

async function generatePerformanceReport(
  counts: any,
  searchResults: any[],
  embeddingsWork: boolean
) {
  console.log('\n' + '='.repeat(70));
  console.log('📊 DATABASE PERFORMANCE DIAGNOSIS REPORT');
  console.log('='.repeat(70));
  
  console.log('\n📈 Data Inventory:');
  if (counts) {
    console.log(`   Total Pages: ${counts.totalPages}`);
    console.log(`   Total Embeddings: ${counts.totalEmbeddings}`);
    console.log(`   Product Pages: ${counts.productPages}`);
    console.log(`   Cifa-related Pages: ${counts.cifaPages}`);
    
    const embeddingCoverage = counts.totalPages > 0 
      ? ((counts.totalEmbeddings / counts.totalPages) * 100).toFixed(1)
      : '0';
    console.log(`   Embedding Coverage: ${embeddingCoverage}%`);
  }
  
  console.log('\n⚡ Query Performance Analysis:');
  const successfulQueries = searchResults.filter(r => r.success).length;
  const avgDuration = searchResults.reduce((sum, r) => sum + r.duration, 0) / searchResults.length;
  
  console.log(`   Successful Queries: ${successfulQueries}/${searchResults.length}`);
  console.log(`   Average Query Time: ${avgDuration.toFixed(0)}ms`);
  console.log(`   Embeddings Table: ${embeddingsWork ? 'Accessible' : 'Performance Issues'}`);
  
  searchResults.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`   ${status} ${result.name}: ${result.duration}ms`);
    if (result.success && result.count !== undefined) {
      console.log(`      → Found ${result.count} results`);
    }
    if (!result.success && result.error) {
      console.log(`      → Error: ${result.error}`);
    }
  });
  
  console.log('\n🔍 Search Coverage Implications:');
  
  if (counts && counts.cifaPages > 0) {
    console.log(`   ✅ Cifa products are indexed (${counts.cifaPages} pages)`);
  } else {
    console.log('   ❌ No Cifa content found in database');
  }
  
  if (counts && counts.productPages > 100) {
    console.log(`   ✅ Good product page coverage (${counts.productPages} pages)`);
  } else {
    console.log(`   ⚠️  Limited product pages indexed (${counts?.productPages || 0})`);
  }
  
  if (!embeddingsWork) {
    console.log('   🚨 Embeddings table performance prevents semantic search');
  }
  
  const slowQueries = searchResults.filter(r => r.duration > 3000).length;
  if (slowQueries > 0) {
    console.log(`   ⚠️  ${slowQueries} queries took >3 seconds`);
  }
  
  console.log('\n💡 Recommendations:');
  
  if (!embeddingsWork) {
    console.log('   🔧 CRITICAL: Fix embeddings table performance');
    console.log('      - Add proper indexes on domain_id and embedding columns');
    console.log('      - Consider embeddings table partitioning');
  }
  
  if (slowQueries > 0) {
    console.log('   🔧 Optimize slow text search queries');
    console.log('      - Add indexes on frequently searched text columns');
    console.log('      - Consider full-text search indexes');
  }
  
  if (counts && counts.embeddingCoverage < 90) {
    console.log('   📊 Improve embedding coverage');
    console.log('      - Ensure all scraped pages have embeddings');
    console.log('      - Fix embedding generation pipeline');
  }
  
  console.log('\n🎯 Search Coverage Status:');
  if (counts && counts.cifaPages > 200 && embeddingsWork) {
    console.log('   ✅ Database should support comprehensive Cifa product searches');
  } else if (counts && counts.cifaPages > 0 && !embeddingsWork) {
    console.log('   ⚠️  Cifa products exist but semantic search is broken');
  } else {
    console.log('   ❌ Insufficient data for comprehensive product searches');
  }
  
  console.log('\n' + '='.repeat(70));
}

async function runDatabaseDiagnosis() {
  console.log('🔍 Database Performance Diagnosis for Search Coverage');
  console.log('====================================================');
  
  const connection = await testBasicDatabaseConnection();
  if (!connection) {
    console.log('❌ Cannot proceed without database connection');
    process.exit(1);
  }
  
  const { domainId, client } = connection as any;
  
  const counts = await testProductCounts(client, domainId);
  const searchResults = await testSearchPerformance(client, domainId);
  const embeddingsWork = await testEmbeddingsPerformance(client, domainId);
  
  await generatePerformanceReport(counts, searchResults, embeddingsWork);
  
  const hasIssues = !embeddingsWork || searchResults.some(r => !r.success);
  process.exit(hasIssues ? 1 : 0);
}

if (require.main === module) {
  runDatabaseDiagnosis().catch(error => {
    console.error('Database diagnosis failed:', error);
    process.exit(1);
  });
}

export { runDatabaseDiagnosis };