#!/usr/bin/env node

import https from 'node:https';

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

async function checkDomains() {
  console.log('🔍 Checking which domains have embeddings...\n');
  
  try {
    // Check domains with embeddings
    const result = await executeSQL(`
      SELECT DISTINCT 
        d.domain,
        d.id as domain_id,
        COUNT(DISTINCT sp.id) as page_count,
        COUNT(DISTINCT pe.id) as embedding_count
      FROM domains d
      LEFT JOIN scraped_pages sp ON sp.domain_id = d.id
      LEFT JOIN page_embeddings pe ON pe.page_id = sp.id
      GROUP BY d.domain, d.id
      ORDER BY embedding_count DESC, page_count DESC
    `);
    
    console.log('📊 Domains with content:\n');
    console.log('Domain | Pages | Embeddings');
    console.log('-------|-------|------------');
    
    if (result && result.length > 0) {
      result.forEach(row => {
        console.log(`${row.domain} | ${row.page_count} | ${row.embedding_count}`);
      });
      
      const domainsWithEmbeddings = result.filter(r => r.embedding_count > 0);
      console.log(`\n✅ ${domainsWithEmbeddings.length} domains have embeddings for RAG`);
      
      if (domainsWithEmbeddings.length > 0) {
        console.log('\n💡 Domains with working RAG:');
        domainsWithEmbeddings.forEach(d => {
          console.log(`   - ${d.domain} (${d.embedding_count} embeddings)`);
        });
      }
    } else {
      console.log('No domains found in database');
    }
    
  } catch (error) {
    console.error('❌ Error checking domains:', error.message);
  }
}

checkDomains();