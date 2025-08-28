#!/usr/bin/env node

/**
 * Scraper Diagnostics Tool
 * Helps diagnose and fix scraper initialization issues
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

console.log('========================================');
console.log('     SCRAPER DIAGNOSTICS TOOL v1.0     ');
console.log('========================================\n');

const issues = [];
const warnings = [];
const successes = [];

// Check Node.js version
console.log('1. Checking Node.js version...');
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
if (majorVersion >= 18) {
  successes.push(`✓ Node.js version ${nodeVersion} is supported`);
} else {
  issues.push(`✗ Node.js version ${nodeVersion} is too old. Required: v18 or higher`);
}

// Check required environment variables
console.log('\n2. Checking environment variables...');
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'OPENAI_API_KEY'
];

const optionalEnvVars = [
  'REDIS_URL',
  'ENCRYPTION_KEY',
  'WOOCOMMERCE_URL',
  'WOOCOMMERCE_CONSUMER_KEY',
  'WOOCOMMERCE_CONSUMER_SECRET'
];

for (const envVar of requiredEnvVars) {
  if (process.env[envVar]) {
    successes.push(`✓ ${envVar} is set`);
  } else {
    issues.push(`✗ REQUIRED: ${envVar} is not set`);
  }
}

for (const envVar of optionalEnvVars) {
  if (process.env[envVar]) {
    successes.push(`✓ ${envVar} is set (optional)`);
  } else {
    warnings.push(`⚠ Optional: ${envVar} is not set`);
  }
}

// Check if .env files exist
console.log('\n3. Checking .env files...');
const envFiles = ['.env', '.env.local'];
for (const envFile of envFiles) {
  const envPath = path.join(process.cwd(), envFile);
  if (fs.existsSync(envPath)) {
    successes.push(`✓ ${envFile} exists`);
    
    // Read and check for required variables
    try {
      const envContent = fs.readFileSync(envPath, 'utf8');
      for (const envVar of requiredEnvVars) {
        if (!envContent.includes(envVar)) {
          warnings.push(`⚠ ${envVar} not found in ${envFile}`);
        }
      }
    } catch (error) {
      warnings.push(`⚠ Could not read ${envFile}: ${error.message}`);
    }
  } else {
    warnings.push(`⚠ ${envFile} does not exist`);
  }
}

// Check Redis connection
console.log('\n4. Checking Redis connection...');
const checkRedis = () => {
  return new Promise((resolve) => {
    const redis = spawn('redis-cli', ['ping']);
    let output = '';
    
    redis.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    redis.on('close', (code) => {
      if (code === 0 && output.trim() === 'PONG') {
        successes.push('✓ Redis is running and responding');
        resolve(true);
      } else {
        issues.push('✗ Redis is not running or not responding');
        resolve(false);
      }
    });
    
    redis.on('error', () => {
      warnings.push('⚠ redis-cli not found. Please install Redis');
      resolve(false);
    });
  });
};

// Check required npm packages
console.log('\n5. Checking required npm packages...');
const checkPackages = () => {
  const packageJson = require('./package.json');
  const requiredPackages = [
    '@crawlee/playwright',
    'playwright',
    'ioredis',
    '@supabase/supabase-js',
    'openai',
    'cheerio',
    'jsdom'
  ];
  
  for (const pkg of requiredPackages) {
    if (packageJson.dependencies && packageJson.dependencies[pkg]) {
      successes.push(`✓ Package ${pkg} is listed in dependencies`);
    } else {
      issues.push(`✗ Package ${pkg} is missing from dependencies`);
    }
  }
  
  // Check if node_modules exists
  if (fs.existsSync(path.join(process.cwd(), 'node_modules'))) {
    // Check if packages are actually installed
    for (const pkg of requiredPackages) {
      const pkgPath = path.join(process.cwd(), 'node_modules', pkg);
      if (fs.existsSync(pkgPath)) {
        successes.push(`✓ Package ${pkg} is installed`);
      } else {
        issues.push(`✗ Package ${pkg} is not installed. Run: npm install`);
      }
    }
  } else {
    issues.push('✗ node_modules directory not found. Run: npm install');
  }
};

// Check worker files
console.log('\n6. Checking worker files...');
const workerFiles = [
  'lib/scraper-worker.js',
  'lib/scraper-worker-standalone.js',
  'lib/scraper-api.ts'
];

for (const file of workerFiles) {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    successes.push(`✓ ${file} exists (${stats.size} bytes)`);
  } else {
    issues.push(`✗ ${file} is missing`);
  }
}

// Main diagnostic function
async function runDiagnostics() {
  await checkRedis();
  checkPackages();
  
  // Print summary
  console.log('\n========================================');
  console.log('           DIAGNOSTIC SUMMARY           ');
  console.log('========================================\n');
  
  if (successes.length > 0) {
    console.log('✅ WORKING CORRECTLY:');
    successes.forEach(s => console.log('   ' + s));
  }
  
  if (warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    warnings.forEach(w => console.log('   ' + w));
  }
  
  if (issues.length > 0) {
    console.log('\n❌ ISSUES FOUND:');
    issues.forEach(i => console.log('   ' + i));
    
    console.log('\n📋 RECOMMENDED ACTIONS:');
    console.log('   1. Copy .env.example to .env and configure required variables');
    console.log('   2. Set up Supabase project and add credentials');
    console.log('   3. Get OpenAI API key from https://platform.openai.com');
    console.log('   4. Ensure Redis is running: redis-server');
    console.log('   5. Run: npm install');
    
    console.log('\n🔧 QUICK FIX - Use standalone mode:');
    console.log('   The scraper can work without Supabase/OpenAI using:');
    console.log('   node lib/scraper-worker-standalone.js <jobId> <url> <maxPages> true memoryEfficient false');
  } else {
    console.log('\n✅ All checks passed! The scraper should work correctly.');
    console.log('\n🚀 TEST THE SCRAPER:');
    console.log('   node lib/scraper-worker.js test_job https://example.com 5 true memoryEfficient false');
    console.log('\n   OR use standalone mode (no Supabase/OpenAI required):');
    console.log('   node lib/scraper-worker-standalone.js test_job https://example.com 5 true memoryEfficient false');
  }
  
  console.log('\n========================================\n');
}

// Run diagnostics
runDiagnostics().catch(console.error);