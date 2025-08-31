#!/usr/bin/env node

/**
 * Direct Supabase API Token Test
 * Tests the personal access token directly against Supabase Management API
 */

const https = require('https');

const token = process.env.SUPABASE_ACCESS_TOKEN;

if (!token) {
  console.error('❌ SUPABASE_ACCESS_TOKEN not found');
  process.exit(1);
}

console.log('🔄 Testing Supabase Personal Access Token...\n');
console.log(`Token format: ${token.substring(0, 10)}...`);
console.log(`Token length: ${token.length}\n`);

// Test 1: List projects using the Management API
function testListProjects() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.supabase.com',
      path: '/v1/projects',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    console.log('📋 Test 1: Listing projects via Management API...');
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`Status Code: ${res.statusCode}`);
        console.log(`Status Message: ${res.statusMessage}`);
        
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode === 200) {
            console.log('✅ Success! Token is valid.');
            console.log(`Found ${parsed.length || 0} projects`);
            if (parsed.length > 0) {
              console.log('\nProjects:');
              parsed.forEach(p => {
                console.log(`  - ${p.name} (${p.id})`);
                console.log(`    Region: ${p.region}`);
                console.log(`    Org ID: ${p.organization_id}`);
              });
            }
          } else {
            console.log('❌ Failed to list projects');
            console.log('Response:', JSON.stringify(parsed, null, 2));
          }
        } catch (e) {
          console.log('Raw response:', data);
        }
        resolve();
      });
    });
    
    req.on('error', (e) => {
      console.error(`❌ Request error: ${e.message}`);
      reject(e);
    });
    
    req.end();
  });
}

// Test 2: Get account info
function testAccountInfo() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.supabase.com',
      path: '/v1/profile',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    console.log('\n👤 Test 2: Getting account profile...');
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`Status Code: ${res.statusCode}`);
        
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode === 200) {
            console.log('✅ Profile retrieved successfully');
            console.log(`  Email: ${parsed.email || 'N/A'}`);
            console.log(`  ID: ${parsed.id || 'N/A'}`);
          } else {
            console.log('❌ Failed to get profile');
            console.log('Response:', JSON.stringify(parsed, null, 2));
          }
        } catch (e) {
          console.log('Raw response:', data);
        }
        resolve();
      });
    });
    
    req.on('error', (e) => {
      console.error(`❌ Request error: ${e.message}`);
      reject(e);
    });
    
    req.end();
  });
}

// Run tests
async function runTests() {
  try {
    await testListProjects();
    await testAccountInfo();
    
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 Token Test Summary:');
    console.log('If the tests above succeeded, your token is valid.');
    console.log('If they failed with 401, the token may be:');
    console.log('  1. Expired or revoked');
    console.log('  2. Missing required scopes');
    console.log('  3. Not a personal access token (might be a service role key)');
    console.log('\nTo create a new token:');
    console.log('  https://supabase.com/dashboard/account/tokens');
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
  }
}

runTests();