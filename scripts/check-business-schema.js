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

async function checkBusinessSchema() {
  console.log('📊 Checking Business Table Schemas\n');
  console.log('=' .repeat(60));
  
  // Check businesses table columns
  const businessColsSql = `
    SELECT 
      column_name, 
      data_type,
      is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'businesses'
    ORDER BY ordinal_position;
  `;
  
  console.log('\n📋 businesses table columns:');
  try {
    const cols = await executeSQL(businessColsSql);
    cols.forEach(c => {
      console.log(`   • ${c.column_name} (${c.data_type}) ${c.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
    });
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  
  // Check for user/auth related columns
  const authColsSql = `
    SELECT 
      table_name,
      column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name IN ('businesses', 'business_configs', 'business_usage')
    AND (column_name LIKE '%user%' OR column_name LIKE '%owner%' OR column_name LIKE '%auth%')
    ORDER BY table_name, column_name;
  `;
  
  console.log('\n🔐 User/Auth related columns:');
  try {
    const authCols = await executeSQL(authColsSql);
    if (authCols.length > 0) {
      authCols.forEach(c => {
        console.log(`   • ${c.table_name}.${c.column_name}`);
      });
    } else {
      console.log('   ❌ No user/owner/auth columns found');
    }
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  
  // Check existing RLS policies on business tables
  const policiesSql = `
    SELECT 
      tablename,
      policyname,
      permissive,
      roles,
      cmd,
      qual
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename IN ('businesses', 'business_configs', 'business_usage', 
                      'customer_verifications', 'customer_access_logs', 'customer_data_cache')
    ORDER BY tablename, policyname;
  `;
  
  console.log('\n📜 Current RLS policies on business tables:');
  try {
    const policies = await executeSQL(policiesSql);
    if (policies.length > 0) {
      let currentTable = '';
      policies.forEach(p => {
        if (p.tablename !== currentTable) {
          currentTable = p.tablename;
          console.log(`\n   ${p.tablename}:`);
        }
        console.log(`     • ${p.policyname} (${p.cmd})`);
        // Show first 100 chars of the policy
        const qualPreview = p.qual ? p.qual.substring(0, 100) + (p.qual.length > 100 ? '...' : '') : '';
        console.log(`       Policy: ${qualPreview}`);
      });
    } else {
      console.log('   No policies found on business tables');
    }
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  
  // Check if these tables have any relationship to domains or users
  const relationshipSql = `
    SELECT 
      tc.table_name as child_table,
      kcu.column_name as fk_column,
      ccu.table_name AS parent_table,
      ccu.column_name AS parent_column
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
    AND (tc.table_name IN ('businesses', 'business_configs', 'business_usage')
         OR ccu.table_name IN ('businesses', 'business_configs', 'business_usage'))
    ORDER BY tc.table_name;
  `;
  
  console.log('\n🔗 Foreign key relationships:');
  try {
    const relationships = await executeSQL(relationshipSql);
    if (relationships.length > 0) {
      relationships.forEach(r => {
        console.log(`   • ${r.child_table}.${r.fk_column} → ${r.parent_table}.${r.parent_column}`);
      });
    } else {
      console.log('   No foreign key relationships found');
    }
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
}

checkBusinessSchema().catch(console.error);