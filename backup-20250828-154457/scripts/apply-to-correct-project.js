#!/usr/bin/env node
const https = require('https');
const fs = require('fs');
const path = require('path');

// YOUR project credentials
const SUPABASE_URL = 'birugqyuqhiahxvxeyqg.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpcnVncXl1cWhpYWh4dnhleXFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTc4NzE2NCwiZXhwIjoyMDcxMzYzMTY0fQ.5bw0QlkRgv_PA7iHrpWixvC31d7WZ5VYSR2JZnhsw8s';

// Read the SQL file
const sqlContent = fs.readFileSync(
  path.join(__dirname, 'create-customer-tables.sql'),
  'utf8'
);

// Function to execute SQL via Supabase Management API
async function executeSql(sql) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query: sql });
    
    const options = {
      hostname: SUPABASE_URL,
      port: 443,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201 || res.statusCode === 204) {
          resolve({ success: true, data: responseData });
        } else {
          // RPC might not exist, but that's okay - we'll use direct table creation
          resolve({ success: false, status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

// Function to test if a table exists
async function tableExists(tableName) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: SUPABASE_URL,
      port: 443,
      path: `/rest/v1/${tableName}?select=*&limit=1`,
      method: 'HEAD',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
      }
    };

    const req = https.request(options, (res) => {
      resolve(res.statusCode === 200 || res.statusCode === 206);
    });

    req.on('error', () => resolve(false));
    req.end();
  });
}

async function main() {
  console.log('Setting up customer tables in YOUR Supabase project...');
  console.log('Project: birugqyuqhiahxvxeyqg');
  console.log('');

  // Since RPC might not work, let's use the Supabase Dashboard approach
  console.log('⚠️  IMPORTANT: Direct SQL execution via API is limited.');
  console.log('');
  console.log('Please run the SQL manually in your Supabase Dashboard:');
  console.log('');
  console.log('1. Go to: https://supabase.com/dashboard/project/birugqyuqhiahxvxeyqg/sql/new');
  console.log('2. Copy the SQL from: scripts/create-customer-tables.sql');
  console.log('3. Paste it in the SQL editor');
  console.log('4. Click "Run" to execute');
  console.log('');
  console.log('Checking current table status...');
  console.log('');

  const tables = [
    'conversations',
    'messages',
    'customer_configs',
    'customer_verifications',
    'customer_access_logs',
    'customer_data_cache'
  ];

  for (const table of tables) {
    const exists = await tableExists(table);
    console.log(`${exists ? '✓' : '✗'} Table ${table}: ${exists ? 'EXISTS' : 'NOT FOUND'}`);
  }

  console.log('\n-------------------------------------------');
  console.log('After running the SQL in the dashboard, all tables should show as EXISTS.');
}

main().catch(console.error);