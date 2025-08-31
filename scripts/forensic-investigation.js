#!/usr/bin/env node

const https = require('https');

const PROJECT_REF = 'birugqyuqhiahxvxeyqg';
const ACCESS_TOKEN = 'sbp_3d1fa3086b18fbca507ee9b65042aa264395e1b8';

async function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ query: sql });
    
    const options = {
      hostname: 'api.supabase.com',
      port: 443,
      path: `/v1/projects/${PROJECT_REF}/database/query`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(result);
          } else {
            reject(new Error(result.error || `HTTP ${res.statusCode}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    });
    
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function forensicInvestigation() {
  console.log('🔍 FORENSIC INVESTIGATION: Database Optimization Status');
  console.log('=' .repeat(70));
  console.log(`📅 Timestamp: ${new Date().toISOString()}\n`);
  
  const issues = [];
  const successes = [];
  
  // ========================================
  // 1. DETAILED INDEX INVESTIGATION
  // ========================================
  console.log('1️⃣ COMPREHENSIVE INDEX ANALYSIS:');
  console.log('-'.repeat(40));
  
  try {
    // Check ALL indexes
    const allIndexes = await executeSQL(`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef,
        pg_size_pretty(pg_relation_size(indexname::regclass)) as size
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname;
    `);
    
    console.log(`\n📊 Total indexes found: ${allIndexes.length}\n`);
    
    // Group by table
    const indexByTable = {};
    allIndexes.forEach(idx => {
      if (!indexByTable[idx.tablename]) {
        indexByTable[idx.tablename] = [];
      }
      indexByTable[idx.tablename].push(idx);
    });
    
    // Critical tables to check
    const criticalTables = ['scraped_pages', 'page_embeddings', 'domains', 'website_content'];
    
    for (const table of criticalTables) {
      console.log(`\n🔎 Table: ${table}`);
      const indexes = indexByTable[table] || [];
      
      if (indexes.length === 0) {
        console.log('   ❌ NO INDEXES FOUND!');
        issues.push(`No indexes on ${table}`);
      } else {
        indexes.forEach(idx => {
          const isOptimized = idx.indexname.includes('hnsw') || 
                            idx.indexname.includes('gin') ||
                            idx.indexname.includes('domain') ||
                            idx.indexname.includes('created');
          
          const icon = isOptimized ? '✅' : '⚠️';
          console.log(`   ${icon} ${idx.indexname} (${idx.size})`);
          
          if (isOptimized) {
            successes.push(`Optimized index: ${idx.indexname}`);
          }
        });
      }
    }
    
    // Check for duplicate indexes
    const duplicateCheck = await executeSQL(`
      SELECT 
        tablename,
        array_agg(indexname) as duplicate_indexes
      FROM pg_indexes
      WHERE schemaname = 'public'
      GROUP BY tablename, indexdef
      HAVING COUNT(*) > 1;
    `);
    
    if (duplicateCheck.length > 0) {
      console.log('\n⚠️ DUPLICATE INDEXES DETECTED:');
      duplicateCheck.forEach(dup => {
        console.log(`   Table ${dup.tablename}: ${dup.duplicate_indexes}`);
        issues.push(`Duplicate indexes on ${dup.tablename}`);
      });
    }
    
  } catch (error) {
    console.log('   ❌ ERROR: ' + error.message);
    issues.push('Failed to analyze indexes: ' + error.message);
  }
  
  // ========================================
  // 2. RLS POLICY DEEP DIVE
  // ========================================
  console.log('\n2️⃣ RLS POLICY FORENSICS:');
  console.log('-'.repeat(40));
  
  try {
    const rlsPolicies = await executeSQL(`
      SELECT 
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual,
        with_check
      FROM pg_policies
      WHERE schemaname = 'public'
      AND tablename IN ('domains', 'scraped_pages', 'website_content', 'page_embeddings')
      ORDER BY tablename, policyname;
    `);
    
    console.log(`\n📊 Total RLS policies: ${rlsPolicies.length}\n`);
    
    rlsPolicies.forEach(policy => {
      // Check if policy is optimized (uses subquery pattern)
      const hasSubquery = policy.qual && policy.qual.includes('SELECT');
      const hasAuthUid = policy.qual && policy.qual.includes('auth.uid()');
      const isOptimized = hasSubquery && hasAuthUid;
      
      const icon = isOptimized ? '✅' : '❌';
      console.log(`${icon} ${policy.tablename}.${policy.policyname}`);
      console.log(`   Type: ${policy.cmd}, Permissive: ${policy.permissive}`);
      console.log(`   Optimized: ${isOptimized ? 'YES (uses subquery)' : 'NO (direct auth.uid() call)'}`);
      
      if (!isOptimized) {
        issues.push(`Unoptimized RLS: ${policy.tablename}.${policy.policyname}`);
      }
      
      // Show the actual qual for debugging
      if (policy.qual) {
        const qualPreview = policy.qual.substring(0, 100);
        console.log(`   Qual: ${qualPreview}...`);
      }
      console.log('');
    });
    
  } catch (error) {
    console.log('   ❌ ERROR: ' + error.message);
    issues.push('Failed to analyze RLS policies: ' + error.message);
  }
  
  // ========================================
  // 3. FUNCTION INVESTIGATION
  // ========================================
  console.log('\n3️⃣ FUNCTION STATUS CHECK:');
  console.log('-'.repeat(40));
  
  try {
    const functions = await executeSQL(`
      SELECT 
        proname,
        pronargs as arg_count,
        prosecdef as security_definer,
        provolatile as volatility,
        proconfig,
        obj_description(oid, 'pg_proc') as description
      FROM pg_proc
      WHERE pronamespace = 'public'::regnamespace
      AND proname IN (
        'bulk_upsert_scraped_pages',
        'bulk_insert_embeddings',
        'search_embeddings',
        'search_embeddings_optimized',
        'search_text_content',
        'search_content_optimized',
        'get_user_domain_ids'
      )
      ORDER BY proname;
    `);
    
    console.log(`\n📊 Functions found: ${functions.length}\n`);
    
    const expectedFunctions = [
      'bulk_upsert_scraped_pages',
      'bulk_insert_embeddings',
      'search_embeddings',
      'search_embeddings_optimized',
      'search_text_content',
      'search_content_optimized'
    ];
    
    expectedFunctions.forEach(fname => {
      const func = functions.find(f => f.proname === fname);
      if (func) {
        const hasSearchPath = func.proconfig && func.proconfig.includes('search_path');
        const icon = hasSearchPath ? '✅' : '⚠️';
        console.log(`${icon} ${fname}: EXISTS`);
        console.log(`   Security Definer: ${func.security_definer}`);
        console.log(`   Search Path Set: ${hasSearchPath ? 'YES' : 'NO'}`);
        successes.push(`Function exists: ${fname}`);
      } else {
        console.log(`❌ ${fname}: MISSING`);
        issues.push(`Missing function: ${fname}`);
      }
    });
    
  } catch (error) {
    console.log('   ❌ ERROR: ' + error.message);
    issues.push('Failed to check functions: ' + error.message);
  }
  
  // ========================================
  // 4. PERFORMANCE METRICS
  // ========================================
  console.log('\n4️⃣ PERFORMANCE METRICS:');
  console.log('-'.repeat(40));
  
  try {
    // Check table statistics
    const tableStats = await executeSQL(`
      SELECT 
        schemaname,
        tablename,
        n_live_tup as live_rows,
        n_dead_tup as dead_rows,
        last_vacuum,
        last_autovacuum,
        last_analyze,
        last_autoanalyze
      FROM pg_stat_user_tables
      WHERE schemaname = 'public'
      AND tablename IN ('scraped_pages', 'page_embeddings', 'domains')
      ORDER BY tablename;
    `);
    
    console.log('\n📊 Table Statistics:');
    tableStats.forEach(stat => {
      console.log(`\n   ${stat.tablename}:`);
      console.log(`     Live rows: ${stat.live_rows}`);
      console.log(`     Dead rows: ${stat.dead_rows}`);
      console.log(`     Last analyze: ${stat.last_analyze || stat.last_autoanalyze || 'NEVER'}`);
      
      if (!stat.last_analyze && !stat.last_autoanalyze) {
        issues.push(`Table ${stat.tablename} never analyzed`);
      }
    });
    
  } catch (error) {
    console.log('   ❌ ERROR: ' + error.message);
  }
  
  // ========================================
  // 5. FULL-TEXT SEARCH CHECK
  // ========================================
  console.log('\n5️⃣ FULL-TEXT SEARCH STATUS:');
  console.log('-'.repeat(40));
  
  try {
    const ftsCheck = await executeSQL(`
      SELECT 
        column_name,
        data_type,
        is_generated
      FROM information_schema.columns
      WHERE table_name = 'scraped_pages'
      AND column_name LIKE '%vector%';
    `);
    
    if (ftsCheck.length > 0) {
      console.log('✅ Full-text search column exists:');
      ftsCheck.forEach(col => {
        console.log(`   ${col.column_name} (${col.data_type}, Generated: ${col.is_generated})`);
      });
      successes.push('Full-text search enabled');
    } else {
      console.log('❌ No full-text search column found');
      issues.push('Full-text search not configured');
    }
    
    // Check GIN index
    const ginCheck = await executeSQL(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'scraped_pages'
      AND indexdef LIKE '%GIN%';
    `);
    
    if (ginCheck.length > 0) {
      console.log('✅ GIN index for full-text search exists');
      successes.push('GIN index present');
    } else {
      console.log('❌ No GIN index found');
      issues.push('GIN index missing');
    }
    
  } catch (error) {
    console.log('   ❌ ERROR: ' + error.message);
  }
  
  // ========================================
  // FINAL DIAGNOSIS
  // ========================================
  console.log('\n' + '='.repeat(70));
  console.log('🔬 FORENSIC DIAGNOSIS');
  console.log('='.repeat(70));
  
  const totalChecks = successes.length + issues.length;
  const successRate = totalChecks > 0 ? ((successes.length / totalChecks) * 100).toFixed(1) : 0;
  
  console.log(`\n📊 OPTIMIZATION SCORE: ${successRate}%`);
  console.log(`   ✅ Successes: ${successes.length}`);
  console.log(`   ❌ Issues: ${issues.length}`);
  
  if (issues.length > 0) {
    console.log('\n🚨 CRITICAL ISSUES FOUND:');
    issues.forEach((issue, i) => {
      console.log(`   ${i + 1}. ${issue}`);
    });
    
    console.log('\n🔧 ROOT CAUSES:');
    console.log('   1. RLS policies not using optimized subquery pattern');
    console.log('   2. Some migrations may have failed silently');
    console.log('   3. Missing critical indexes on foreign keys');
    console.log('   4. Functions may not be properly configured');
    
    console.log('\n💡 RECOMMENDED FIXES:');
    console.log('   1. Re-run RLS optimization migration');
    console.log('   2. Apply missing indexes manually');
    console.log('   3. Verify all functions have proper search_path');
    console.log('   4. Run ANALYZE on all tables');
  } else {
    console.log('\n✅ All optimizations appear to be working correctly!');
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('Investigation complete at:', new Date().toISOString());
}

// Run investigation
forensicInvestigation().catch(console.error);