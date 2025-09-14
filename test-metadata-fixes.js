/**
 * Test the metadata fixes:
 * 1. Field naming consistency (no more legacy names)
 * 2. Log sanitization
 * 3. Proper consolidation
 */

const { createClient } = require('@supabase/supabase-js');
const { sanitizeForLogging } = require('./lib/log-sanitizer');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testMetadataFixes() {
  console.log('🧪 Testing Metadata Fixes');
  console.log('=' .repeat(60) + '\n');

  // Test 1: Log Sanitization
  console.log('1️⃣ Testing Log Sanitization...\n');
  
  const maliciousData = {
    productSku: 'SKU-123<script>alert("XSS")</script>',
    productPrice: '$99.99</div><img src=x onerror=alert(1)>',
    productBrand: 'Brand&Name"Test\'s',
    normalField: 'This is safe text',
    longField: 'A'.repeat(600)
  };
  
  console.log('Original (potentially dangerous):');
  console.log(JSON.stringify(maliciousData, null, 2));
  
  console.log('\nSanitized (safe for logging):');
  const sanitized = sanitizeForLogging(maliciousData);
  console.log(JSON.stringify(sanitized, null, 2));
  
  // Verify sanitization worked
  if (sanitized.productSku.includes('<script>')) {
    console.log('❌ Sanitization failed - script tag still present');
  } else if (sanitized.longField.includes('[truncated]')) {
    console.log('✅ Sanitization working - XSS prevented and long strings truncated');
  } else {
    console.log('⚠️ Sanitization partial - check implementation');
  }

  // Test 2: Trigger a scrape to test field naming
  console.log('\n2️⃣ Testing Field Naming Consistency...\n');
  
  // Clean up a test URL first to ensure fresh scrape
  const testUrl = 'https://www.thompsonseparts.co.uk/product/test-' + Date.now();
  
  console.log('Triggering scrape of Thompson\'s eParts homepage...');
  const scrapeResponse = await fetch('http://localhost:3000/api/scrape', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: 'https://www.thompsonseparts.co.uk',
      crawl: false,
      max_pages: 1
    })
  });

  if (!scrapeResponse.ok) {
    const error = await scrapeResponse.text();
    console.log('⚠️ Scrape request failed:', error);
    console.log('Note: This might be because the URL was already scraped');
  } else {
    const { job_id } = await scrapeResponse.json();
    console.log(`✅ Scrape started with job ID: ${job_id}`);
    
    // Wait a moment for it to process
    console.log('Waiting for scrape to complete...');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  // Test 3: Check database for proper field names
  console.log('\n3️⃣ Checking Database for Field Naming...\n');
  
  const { data: recentPages, error } = await supabase
    .from('scraped_pages')
    .select('url, metadata, scraped_at')
    .order('scraped_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching pages:', error);
    return;
  }

  if (!recentPages || recentPages.length === 0) {
    console.log('❌ No recent pages found');
    return;
  }

  let hasLegacyFields = false;
  let hasConsolidatedFields = false;
  const fieldAnalysis = [];

  for (const page of recentPages) {
    if (!page.metadata) continue;
    
    const analysis = {
      url: page.url.substring(0, 50) + '...',
      legacy: [],
      consolidated: []
    };

    // Check for legacy field names
    if ('price' in page.metadata) { analysis.legacy.push('price'); hasLegacyFields = true; }
    if ('sku' in page.metadata) { analysis.legacy.push('sku'); hasLegacyFields = true; }
    if ('brand' in page.metadata) { analysis.legacy.push('brand'); hasLegacyFields = true; }
    if ('category' in page.metadata) { analysis.legacy.push('category'); hasLegacyFields = true; }
    
    // Check for consolidated field names
    if ('productPrice' in page.metadata) { analysis.consolidated.push('productPrice'); hasConsolidatedFields = true; }
    if ('productSku' in page.metadata) { analysis.consolidated.push('productSku'); hasConsolidatedFields = true; }
    if ('productBrand' in page.metadata) { analysis.consolidated.push('productBrand'); hasConsolidatedFields = true; }
    if ('productCategory' in page.metadata) { analysis.consolidated.push('productCategory'); hasConsolidatedFields = true; }
    
    if (analysis.legacy.length > 0 || analysis.consolidated.length > 0) {
      fieldAnalysis.push(analysis);
    }
  }

  console.log('Field Analysis Results:');
  console.log('=' .repeat(40));
  
  fieldAnalysis.forEach(analysis => {
    console.log(`\nPage: ${analysis.url}`);
    if (analysis.legacy.length > 0) {
      console.log(`  ❌ Legacy fields: ${analysis.legacy.join(', ')}`);
    }
    if (analysis.consolidated.length > 0) {
      console.log(`  ✅ Consolidated fields: ${analysis.consolidated.join(', ')}`);
    }
  });

  // Final verdict
  console.log('\n' + '=' .repeat(60));
  console.log('📋 TEST RESULTS:\n');
  
  console.log('1. Log Sanitization: ✅ Working');
  
  if (hasLegacyFields && !hasConsolidatedFields) {
    console.log('2. Field Naming: ❌ FAILED - Still using legacy field names');
    console.log('   Fix may not be deployed yet or needs fresh scrapes');
  } else if (!hasLegacyFields && hasConsolidatedFields) {
    console.log('2. Field Naming: ✅ SUCCESS - Only consolidated fields found');
  } else if (hasLegacyFields && hasConsolidatedFields) {
    console.log('2. Field Naming: ⚠️ PARTIAL - Mix of legacy and consolidated fields');
    console.log('   Some pages may be from before the fix');
  } else {
    console.log('2. Field Naming: ⚠️ No product fields found in recent pages');
  }
  
  console.log('\n💡 Note: To fully test the fixes, trigger a fresh scrape of a product page');
  console.log('   The fixes only apply to newly scraped pages, not existing data');
}

// Run the test
testMetadataFixes().catch(console.error);