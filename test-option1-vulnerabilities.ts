#!/usr/bin/env npx tsx

/**
 * Focused Vulnerability Testing for Option 1 Implementation
 * Based on initial edge case findings
 */

import fetch from 'node-fetch';

const API_URL = 'http://localhost:3000/api/chat-intelligent';

// Color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

async function makeRequest(message: string, config?: any) {
  const body = {
    message,
    session_id: `vuln-test-${Date.now()}`,
    domain: 'thompsonseparts.co.uk',
    ...config
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    const data = await response.json();
    return { status: response.status, data, raw: await response.text().catch(() => '') };
  } catch (error: any) {
    return { status: 'error', error: error.message, data: null };
  }
}

async function testGetProductOverviewVulnerabilities() {
  console.log(`${colors.blue}=== getProductOverview() Vulnerability Analysis ===${colors.reset}\n`);

  // Issue 1: Empty query handling
  console.log(`${colors.yellow}1. Empty Query Handling in getProductOverview${colors.reset}`);
  console.log('   Testing: Empty string passed to overview function');
  
  const emptyTest = await makeRequest('');
  console.log(`   Result: Status ${emptyTest.status}`);
  
  if (emptyTest.status === 400) {
    console.log(`   ${colors.green}✓ Empty query properly validated at API level${colors.reset}`);
  } else {
    console.log(`   ${colors.red}✗ Empty query not properly handled${colors.reset}`);
  }

  // Issue 2: SQL Injection in ILIKE
  console.log(`\n${colors.yellow}2. SQL Injection via ILIKE Pattern${colors.reset}`);
  console.log('   Testing: Malicious patterns in search keyword');
  
  const sqlPatterns = [
    "%' OR domain_id IS NOT NULL --",
    "pump%' UNION SELECT * FROM customer_configs --",
    "'; UPDATE scraped_pages SET title='HACKED' WHERE '1'='1",
    "\\'; DROP TABLE page_embeddings; --"
  ];

  for (const pattern of sqlPatterns) {
    const result = await makeRequest(pattern);
    const responseText = JSON.stringify(result.data);
    
    if (responseText.includes('syntax') || responseText.includes('error') || result.status === 500) {
      console.log(`   ${colors.red}✗ SQL Injection vulnerability with: ${pattern.substring(0, 30)}${colors.reset}`);
      console.log(`     Error leaked: ${responseText.substring(0, 100)}`);
    } else {
      console.log(`   ${colors.green}✓ Pattern safely handled: ${pattern.substring(0, 30)}${colors.reset}`);
    }
  }

  // Issue 3: Domain Cache Bypass
  console.log(`\n${colors.yellow}3. Domain Cache Security${colors.reset}`);
  console.log('   Testing: Domain normalization bypass attempts');
  
  const domainBypassTests = [
    { domain: 'thompsonseparts.co.uk', expected: 'normal' },
    { domain: 'THOMPSONSEPARTS.CO.UK', expected: 'should normalize' },
    { domain: 'thompsonseparts.co.uk.evil.com', expected: 'subdomain attack' },
    { domain: 'thompsonseparts.co.uk@evil.com', expected: 'username attack' },
    { domain: 'thompsonseparts.co.uk#fragment', expected: 'fragment attack' },
    { domain: '../thompsonseparts.co.uk', expected: 'path traversal' }
  ];

  for (const test of domainBypassTests) {
    const result = await makeRequest('test product', { domain: test.domain });
    console.log(`   ${test.expected}: ${test.domain}`);
    console.log(`     Status: ${result.status}, Sources: ${result.data?.sources?.length || 0}`);
    
    // Check if results are from the wrong domain
    const sources = result.data?.sources || [];
    const wrongDomain = sources.some((s: any) => 
      s.url && !s.url.includes('thompsonseparts')
    );
    
    if (wrongDomain) {
      console.log(`     ${colors.red}✗ Cross-domain data leakage detected!${colors.reset}`);
    }
  }

  // Issue 4: Race Condition in Overview
  console.log(`\n${colors.yellow}4. Race Condition Between Overview and Search${colors.reset}`);
  console.log('   Testing: Concurrent modification scenario');
  
  // Fire multiple requests simultaneously
  const racePromises = Array(5).fill(0).map((_, i) => 
    makeRequest(`race condition test ${i}`)
  );
  
  const raceResults = await Promise.all(racePromises);
  const totals = raceResults.map(r => {
    const match = r.data?.message?.match(/(\d+)\s+total/i);
    return match ? parseInt(match[1]) : null;
  }).filter(t => t !== null);
  
  const allSame = totals.every(t => t === totals[0]);
  if (!allSame) {
    console.log(`   ${colors.red}✗ Inconsistent totals detected: ${totals.join(', ')}${colors.reset}`);
    console.log('   This indicates a race condition in data fetching');
  } else {
    console.log(`   ${colors.green}✓ Consistent totals across concurrent requests${colors.reset}`);
  }

  // Issue 5: Memory Exhaustion via allIds
  console.log(`\n${colors.yellow}5. Memory Exhaustion via Large Result Sets${colors.reset}`);
  console.log('   Testing: Request for maximum products');
  
  const memStart = process.memoryUsage().heapUsed;
  const largeResult = await makeRequest('', { // Empty query returns ALL products
    config: { ai: { maxSearchIterations: 5 } }
  });
  const memEnd = process.memoryUsage().heapUsed;
  const memDelta = (memEnd - memStart) / 1024 / 1024; // MB
  
  console.log(`   Memory delta: ${memDelta.toFixed(2)} MB`);
  console.log(`   Response size: ${JSON.stringify(largeResult.data).length} bytes`);
  
  if (memDelta > 100) {
    console.log(`   ${colors.red}✗ Excessive memory usage detected (>100MB)${colors.reset}`);
  } else {
    console.log(`   ${colors.green}✓ Memory usage within bounds${colors.reset}`);
  }

  // Issue 6: Null/Undefined Handling
  console.log(`\n${colors.yellow}6. Null/Undefined in Critical Paths${colors.reset}`);
  console.log('   Testing: What happens when getProductOverview returns null');
  
  // Test with a domain that doesn't exist
  const nullDomainResult = await makeRequest('test', { 
    domain: 'absolutely-nonexistent-domain-xyz.com' 
  });
  
  if (nullDomainResult.status === 500) {
    console.log(`   ${colors.red}✗ Crashes when overview returns null${colors.reset}`);
    console.log(`     Error: ${nullDomainResult.data?.error}`);
  } else if (nullDomainResult.data?.message) {
    const hasTotal = nullDomainResult.data.message.includes('total');
    if (!hasTotal) {
      console.log(`   ${colors.green}✓ Gracefully handles null overview${colors.reset}`);
    } else {
      console.log(`   ${colors.yellow}⚠ Claims to have totals for non-existent domain${colors.reset}`);
    }
  }

  // Issue 7: Timeout Bypass
  console.log(`\n${colors.yellow}7. Timeout Enforcement${colors.reset}`);
  console.log('   Testing: Can timeouts be bypassed?');
  
  const startTime = Date.now();
  const timeoutTest = await makeRequest('show me all products with detailed specifications', {
    config: {
      ai: {
        searchTimeout: 100, // 100ms - should timeout immediately
        maxSearchIterations: 5
      }
    }
  });
  const elapsed = Date.now() - startTime;
  
  console.log(`   Configured timeout: 100ms`);
  console.log(`   Actual execution: ${elapsed}ms`);
  
  if (elapsed > 5000) {
    console.log(`   ${colors.red}✗ Timeout not properly enforced (took ${elapsed}ms)${colors.reset}`);
  } else {
    console.log(`   ${colors.green}✓ Timeout properly enforced${colors.reset}`);
  }

  // Issue 8: Data Type Confusion
  console.log(`\n${colors.yellow}8. Data Type Confusion in Overview${colors.reset}`);
  console.log('   Testing: Type coercion vulnerabilities');
  
  const typeConfusionTests = [
    { query: '0', name: 'Zero string' },
    { query: 'null', name: 'Null string' },
    { query: 'undefined', name: 'Undefined string' },
    { query: 'NaN', name: 'NaN string' },
    { query: '[]', name: 'Array string' },
    { query: '{}', name: 'Object string' },
    { query: 'true', name: 'Boolean string' }
  ];

  for (const test of typeConfusionTests) {
    const result = await makeRequest(test.query);
    if (result.status === 500) {
      console.log(`   ${colors.red}✗ Type confusion with "${test.query}": ${test.name}${colors.reset}`);
    } else {
      console.log(`   ${colors.green}✓ Handled "${test.query}" correctly${colors.reset}`);
    }
  }
}

async function testParallelProcessingVulnerabilities() {
  console.log(`\n${colors.blue}=== Parallel Processing Vulnerabilities ===${colors.reset}\n`);

  // Issue 9: Promise.race Timeout Vulnerability
  console.log(`${colors.yellow}9. Promise.race Timeout Handling${colors.reset}`);
  console.log('   Testing: What happens when overview times out but search succeeds');
  
  // This could cause partial data if not handled correctly
  const complexQuery = 'pump filter valve seal gasket bearing motor gear belt chain';
  const result = await makeRequest(complexQuery);
  
  if (result.data?.message) {
    const hasOverviewData = result.data.message.includes('Categories:') || 
                           result.data.message.includes('total');
    console.log(`   Has overview data: ${hasOverviewData}`);
    
    if (!hasOverviewData && result.data?.sources?.length > 0) {
      console.log(`   ${colors.yellow}⚠ Overview timed out but search continued${colors.reset}`);
      console.log('   This could lead to incomplete metadata');
    }
  }

  // Issue 10: Deduplication Logic Flaw
  console.log(`\n${colors.yellow}10. URL Deduplication Vulnerability${colors.reset}`);
  console.log('   Testing: Can duplicate URLs bypass deduplication?');
  
  const dupTest = await makeRequest('test');
  const sources = dupTest.data?.sources || [];
  const urls = sources.map((s: any) => s.url);
  const uniqueUrls = new Set(urls);
  
  if (urls.length !== uniqueUrls.size) {
    console.log(`   ${colors.red}✗ Duplicate URLs found in results${colors.reset}`);
    console.log(`     Total: ${urls.length}, Unique: ${uniqueUrls.size}`);
  } else {
    console.log(`   ${colors.green}✓ No duplicate URLs${colors.reset}`);
  }
}

async function testSecurityVulnerabilities() {
  console.log(`\n${colors.blue}=== Security Vulnerability Deep Dive ===${colors.reset}\n`);

  // Issue 11: Information Disclosure
  console.log(`${colors.yellow}11. Information Disclosure via Error Messages${colors.reset}`);
  
  const errorTriggers = [
    { config: { ai: { maxSearchIterations: 999 } }, name: 'Invalid config' },
    { domain: 'http://[invalid]/', name: 'Invalid URL format' },
    { session_id: '../../etc/passwd', name: 'Path traversal in session' }
  ];

  for (const trigger of errorTriggers) {
    const result = await makeRequest('test', trigger);
    const responseText = JSON.stringify(result.data);
    
    // Check for sensitive information leakage
    const sensitivePatterns = [
      'supabase',
      'postgresql',
      'database',
      'OPENAI',
      'env',
      'config',
      'password',
      'key',
      'secret'
    ];
    
    const leaked = sensitivePatterns.filter(pattern => 
      responseText.toLowerCase().includes(pattern.toLowerCase())
    );
    
    if (leaked.length > 0) {
      console.log(`   ${colors.red}✗ Sensitive info leaked with ${trigger.name}: ${leaked.join(', ')}${colors.reset}`);
    } else {
      console.log(`   ${colors.green}✓ No sensitive info leaked with ${trigger.name}${colors.reset}`);
    }
  }

  // Issue 12: Cross-Site Scripting (XSS) in Response
  console.log(`\n${colors.yellow}12. XSS in AI Response${colors.reset}`);
  
  const xssPayloads = [
    '<img src=x onerror=alert(1)>',
    '<script>alert("XSS")</script>',
    'javascript:alert(1)',
    '<iframe src="javascript:alert(1)">',
    '"><script>alert(String.fromCharCode(88,83,83))</script>'
  ];

  for (const payload of xssPayloads) {
    const result = await makeRequest(payload);
    const responseText = result.data?.message || '';
    
    if (responseText.includes(payload) || responseText.includes('<script>')) {
      console.log(`   ${colors.red}✗ XSS payload reflected: ${payload.substring(0, 30)}${colors.reset}`);
    } else {
      console.log(`   ${colors.green}✓ XSS payload sanitized: ${payload.substring(0, 30)}${colors.reset}`);
    }
  }
}

async function generateReport(vulnerabilities: string[]) {
  console.log(`\n${colors.magenta}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.magenta}=== VULNERABILITY REPORT ===${colors.reset}`);
  console.log(`${colors.magenta}${'='.repeat(60)}${colors.reset}\n`);

  if (vulnerabilities.length === 0) {
    console.log(`${colors.green}No critical vulnerabilities found!${colors.reset}`);
  } else {
    console.log(`${colors.red}Found ${vulnerabilities.length} potential vulnerabilities:${colors.reset}\n`);
    vulnerabilities.forEach((vuln, i) => {
      console.log(`${colors.red}${i + 1}. ${vuln}${colors.reset}`);
    });
  }

  console.log(`\n${colors.yellow}=== RECOMMENDATIONS ===${colors.reset}\n`);
  console.log('1. Add input sanitization for SQL patterns in getProductOverview');
  console.log('2. Implement proper null checking when overview returns null');
  console.log('3. Add stricter domain validation and normalization');
  console.log('4. Enforce timeout limits at multiple levels');
  console.log('5. Implement response size limits to prevent memory exhaustion');
  console.log('6. Add rate limiting per session, not just per domain');
  console.log('7. Sanitize error messages to prevent information disclosure');
  console.log('8. Ensure XSS protection in all response paths');
}

async function main() {
  console.log(`${colors.magenta}OPTION 1 - FORENSIC VULNERABILITY ANALYSIS${colors.reset}\n`);
  
  const vulnerabilities: string[] = [];
  
  try {
    // Verify API is running
    const health = await makeRequest('health check');
    if (health.status === 'error') {
      console.error('API is not responding. Please ensure server is running.');
      process.exit(1);
    }

    // Run vulnerability tests
    await testGetProductOverviewVulnerabilities();
    await testParallelProcessingVulnerabilities();
    await testSecurityVulnerabilities();

    // Generate final report
    await generateReport(vulnerabilities);

  } catch (error) {
    console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  }
}

main().catch(console.error);