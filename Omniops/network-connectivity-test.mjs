#!/usr/bin/env node

/**
 * Comprehensive Network Connectivity Test for Crawler
 * Tests all aspects of network access including DNS, HTTP, Playwright, and anti-bot detection
 */

import { chromium } from 'playwright';
import https from 'https';
import http from 'http';
import dns from 'dns';
import { promisify } from 'util';
import fs from 'fs/promises';
import { performance } from 'perf_hooks';

const TARGET_SITE = 'https://www.thompsonseparts.co.uk';
const TARGET_HOST = 'www.thompsonseparts.co.uk';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.cyan}${colors.bold}🔍 ${msg}${colors.reset}`),
};

const testResults = {
  timestamp: new Date().toISOString(),
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0,
  }
};

function addTestResult(testName, status, message, details = null) {
  const result = {
    name: testName,
    status, // 'pass', 'fail', 'warning'
    message,
    details,
    timestamp: new Date().toISOString()
  };
  
  testResults.tests.push(result);
  testResults.summary.total++;
  
  if (status === 'pass') {
    testResults.summary.passed++;
    log.success(`${testName}: ${message}`);
  } else if (status === 'fail') {
    testResults.summary.failed++;
    log.error(`${testName}: ${message}`);
  } else if (status === 'warning') {
    testResults.summary.warnings++;
    log.warning(`${testName}: ${message}`);
  }
  
  if (details) {
    console.log(`   ${colors.cyan}Details:${colors.reset} ${JSON.stringify(details, null, 2)}`);
  }
}

async function testDNSResolution() {
  log.section('Testing DNS Resolution');
  
  const lookupAsync = promisify(dns.lookup);
  const resolveAsync = promisify(dns.resolve4);
  
  try {
    const startTime = performance.now();
    const result = await lookupAsync(TARGET_HOST);
    const endTime = performance.now();
    
    addTestResult(
      'DNS Lookup',
      'pass',
      `Resolved ${TARGET_HOST} to ${result.address}`,
      {
        ip: result.address,
        family: result.family,
        resolutionTime: `${(endTime - startTime).toFixed(2)}ms`
      }
    );
    
    // Additional DNS record check
    try {
      const records = await resolveAsync(TARGET_HOST);
      addTestResult(
        'DNS A Records',
        'pass',
        `Found ${records.length} A record(s)`,
        { records }
      );
    } catch (error) {
      addTestResult(
        'DNS A Records',
        'warning',
        'Could not retrieve A records',
        { error: error.message }
      );
    }
    
  } catch (error) {
    addTestResult(
      'DNS Lookup',
      'fail',
      `DNS resolution failed: ${error.message}`,
      { error: error.code, dns_servers: dns.getServers() }
    );
  }
}

async function testBasicHttpConnectivity() {
  log.section('Testing Basic HTTP Connectivity');
  
  return new Promise((resolve) => {
    const startTime = performance.now();
    const request = https.get(TARGET_SITE, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NetworkTestBot/1.0)'
      }
    }, (response) => {
      const endTime = performance.now();
      
      let data = '';
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        addTestResult(
          'HTTP Request',
          'pass',
          `HTTP ${response.statusCode} response received`,
          {
            statusCode: response.statusCode,
            headers: response.headers,
            responseTime: `${(endTime - startTime).toFixed(2)}ms`,
            contentLength: data.length,
            contentType: response.headers['content-type']
          }
        );
        resolve(true);
      });
    });
    
    request.on('timeout', () => {
      request.destroy();
      addTestResult(
        'HTTP Request',
        'fail',
        'Request timeout (30s)',
        { timeout: '30000ms' }
      );
      resolve(false);
    });
    
    request.on('error', (error) => {
      addTestResult(
        'HTTP Request',
        'fail',
        `HTTP request failed: ${error.message}`,
        { error: error.code, errno: error.errno }
      );
      resolve(false);
    });
  });
}

async function testPlaywrightBrowserLaunch() {
  log.section('Testing Playwright Browser Launch');
  
  let browser = null;
  try {
    const startTime = performance.now();
    browser = await chromium.launch({ 
      headless: true,
      timeout: 30000 
    });
    const endTime = performance.now();
    
    addTestResult(
      'Browser Launch',
      'pass',
      'Chromium browser launched successfully',
      {
        version: await browser.version(),
        launchTime: `${(endTime - startTime).toFixed(2)}ms`
      }
    );
    
    return browser;
  } catch (error) {
    addTestResult(
      'Browser Launch',
      'fail',
      `Failed to launch browser: ${error.message}`,
      { error: error.message }
    );
    return null;
  }
}

async function testPlaywrightNavigation(browser) {
  log.section('Testing Playwright Navigation');
  
  if (!browser) {
    addTestResult(
      'Navigation Test',
      'fail',
      'Cannot test navigation - browser not available',
      { reason: 'Browser launch failed' }
    );
    return;
  }
  
  let page = null;
  try {
    page = await browser.newPage({
      userAgent: 'Mozilla/5.0 (compatible; TestBot/1.0)'
    });
    
    const startTime = performance.now();
    const response = await page.goto(TARGET_SITE, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    const endTime = performance.now();
    
    if (response) {
      const title = await page.title();
      const url = page.url();
      
      addTestResult(
        'Page Navigation',
        'pass',
        `Successfully navigated to ${TARGET_SITE}`,
        {
          finalUrl: url,
          statusCode: response.status(),
          title: title,
          navigationTime: `${(endTime - startTime).toFixed(2)}ms`,
          headers: await response.allHeaders()
        }
      );
      
      // Test if we can extract basic content
      try {
        const h1Text = await page.textContent('h1');
        const bodyText = await page.textContent('body');
        
        addTestResult(
          'Content Extraction',
          'pass',
          'Successfully extracted page content',
          {
            h1: h1Text?.substring(0, 100),
            bodyLength: bodyText?.length || 0,
            contentPreview: bodyText?.substring(0, 200)
          }
        );
      } catch (error) {
        addTestResult(
          'Content Extraction',
          'warning',
          'Could not extract content',
          { error: error.message }
        );
      }
      
    } else {
      addTestResult(
        'Page Navigation',
        'fail',
        'Navigation returned no response',
        { targetUrl: TARGET_SITE }
      );
    }
    
  } catch (error) {
    addTestResult(
      'Page Navigation',
      'fail',
      `Navigation failed: ${error.message}`,
      { 
        error: error.message,
        name: error.name,
        targetUrl: TARGET_SITE
      }
    );
  } finally {
    if (page) {
      try {
        await page.close();
      } catch (e) {
        // Ignore close errors
      }
    }
  }
}

async function testAntiBotMeasures(browser) {
  log.section('Testing for Anti-Bot Measures');
  
  if (!browser) {
    addTestResult(
      'Anti-Bot Detection',
      'fail',
      'Cannot test anti-bot measures - browser not available',
      { reason: 'Browser launch failed' }
    );
    return;
  }
  
  let page = null;
  try {
    page = await browser.newPage();
    
    // Test with different user agents
    const userAgents = [
      'Mozilla/5.0 (compatible; bot/1.0)', // Obviously a bot
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36', // Regular browser
      'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' // Well-known bot
    ];
    
    for (const userAgent of userAgents) {
      try {
        // Close the current page and create a new one with the user agent
        if (page) {
          await page.close();
        }
        page = await browser.newPage({
          userAgent: userAgent
        });
        
        const response = await page.goto(TARGET_SITE, {
          waitUntil: 'domcontentloaded',
          timeout: 15000
        });
        
        if (response) {
          const status = response.status();
          const title = await page.title();
          
          if (status === 200 && !title.toLowerCase().includes('block')) {
            addTestResult(
              'User Agent Test',
              'pass',
              `Accepted user agent: ${userAgent.substring(0, 50)}...`,
              { userAgent, status, title }
            );
          } else {
            addTestResult(
              'User Agent Test',
              'warning',
              `Potential blocking detected for user agent`,
              { userAgent, status, title }
            );
          }
        }
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        addTestResult(
          'User Agent Test',
          'warning',
          `Failed with user agent: ${userAgent.substring(0, 30)}...`,
          { userAgent, error: error.message }
        );
      }
    }
    
    // Check for common bot detection indicators
    try {
      // Create a fresh page for detection checks
      if (page) {
        await page.close();
      }
      page = await browser.newPage({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      });
      
      await page.goto(TARGET_SITE, { waitUntil: 'domcontentloaded' });
      
      const botDetectionIndicators = await page.evaluate(() => {
        const indicators = {
          cloudflareChallenge: !!document.querySelector('[data-cf-challenge]'),
          captcha: !!document.querySelector('[class*="captcha"], [id*="captcha"]'),
          blockingMessage: !!document.querySelector('[class*="block"], [id*="block"]'),
          accessDenied: document.title.toLowerCase().includes('access denied') || 
                        document.body.innerText.toLowerCase().includes('access denied'),
          jsChallenge: !!document.querySelector('script[src*="challenge"]')
        };
        
        return indicators;
      });
      
      const detected = Object.values(botDetectionIndicators).some(Boolean);
      if (detected) {
        addTestResult(
          'Bot Detection Check',
          'warning',
          'Potential anti-bot measures detected',
          botDetectionIndicators
        );
      } else {
        addTestResult(
          'Bot Detection Check',
          'pass',
          'No obvious anti-bot measures detected',
          botDetectionIndicators
        );
      }
      
    } catch (error) {
      addTestResult(
        'Bot Detection Check',
        'warning',
        'Could not check for anti-bot measures',
        { error: error.message }
      );
    }
    
  } finally {
    if (page) {
      try {
        await page.close();
      } catch (e) {
        // Ignore close errors
      }
    }
  }
}

async function testNetworkConfiguration() {
  log.section('Testing Network Configuration');
  
  // Check environment variables for proxy settings
  const proxyVars = ['HTTP_PROXY', 'HTTPS_PROXY', 'http_proxy', 'https_proxy', 'NO_PROXY', 'no_proxy'];
  const proxyConfig = {};
  
  proxyVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      proxyConfig[varName] = value;
    }
  });
  
  if (Object.keys(proxyConfig).length > 0) {
    addTestResult(
      'Proxy Configuration',
      'warning',
      'Proxy environment variables detected',
      proxyConfig
    );
  } else {
    addTestResult(
      'Proxy Configuration',
      'pass',
      'No proxy configuration detected in environment',
      { checked: proxyVars }
    );
  }
  
  // Check DNS servers
  const dnsServers = dns.getServers();
  addTestResult(
    'DNS Servers',
    'pass',
    `Using ${dnsServers.length} DNS server(s)`,
    { servers: dnsServers }
  );
  
  // Test internet connectivity with known good sites
  const testSites = ['https://google.com', 'https://github.com'];
  for (const testSite of testSites) {
    try {
      const startTime = performance.now();
      const response = await fetch(testSite, {
        method: 'HEAD',
        timeout: 10000
      });
      const endTime = performance.now();
      
      if (response.ok) {
        addTestResult(
          'Connectivity Test',
          'pass',
          `Successfully connected to ${testSite}`,
          { 
            site: testSite,
            status: response.status,
            responseTime: `${(endTime - startTime).toFixed(2)}ms`
          }
        );
      }
    } catch (error) {
      addTestResult(
        'Connectivity Test',
        'warning',
        `Failed to connect to ${testSite}`,
        { site: testSite, error: error.message }
      );
    }
  }
}

async function testCrawlerCompatibility() {
  log.section('Testing Crawler Compatibility');
  
  // Test if required modules are available
  const requiredModules = ['playwright', 'crawlee'];
  
  for (const moduleName of requiredModules) {
    try {
      const moduleInfo = await import(moduleName);
      addTestResult(
        'Module Check',
        'pass',
        `${moduleName} module is available`,
        { module: moduleName }
      );
    } catch (error) {
      addTestResult(
        'Module Check',
        'fail',
        `${moduleName} module is not available`,
        { module: moduleName, error: error.message }
      );
    }
  }
  
  // Check system resources
  const memUsage = process.memoryUsage();
  addTestResult(
    'System Resources',
    'pass',
    'System resource check completed',
    {
      memory: {
        used: `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`,
        total: `${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`
      },
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    }
  );
}

async function runAllTests() {
  console.log(`${colors.bold}${colors.cyan}🌐 Network Connectivity Test for Crawler${colors.reset}`);
  console.log('━'.repeat(60));
  console.log(`Target Site: ${TARGET_SITE}`);
  console.log(`Test Started: ${new Date().toISOString()}`);
  console.log('━'.repeat(60));
  
  let browser = null;
  
  try {
    // Run all tests
    await testDNSResolution();
    await testBasicHttpConnectivity();
    await testNetworkConfiguration();
    await testCrawlerCompatibility();
    
    browser = await testPlaywrightBrowserLaunch();
    await testPlaywrightNavigation(browser);
    await testAntiBotMeasures(browser);
    
  } catch (error) {
    log.error(`Unexpected error during testing: ${error.message}`);
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        // Ignore close errors
      }
    }
  }
  
  // Generate final report
  console.log('\n' + '━'.repeat(60));
  console.log(`${colors.bold}${colors.cyan}📊 Test Results Summary${colors.reset}`);
  console.log('━'.repeat(60));
  
  const { total, passed, failed, warnings } = testResults.summary;
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
  
  console.log(`Total Tests: ${total}`);
  console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
  console.log(`${colors.yellow}Warnings: ${warnings}${colors.reset}`);
  console.log(`Pass Rate: ${passRate}%`);
  
  // Save detailed results
  const resultsFile = './network-test-results.json';
  await fs.writeFile(resultsFile, JSON.stringify(testResults, null, 2));
  console.log(`\n📄 Detailed results saved to: ${resultsFile}`);
  
  // Generate recommendations
  generateRecommendations();
  
  return testResults;
}

function generateRecommendations() {
  console.log('\n' + '━'.repeat(60));
  console.log(`${colors.bold}${colors.cyan}💡 Recommendations${colors.reset}`);
  console.log('━'.repeat(60));
  
  const failedTests = testResults.tests.filter(t => t.status === 'fail');
  const warningTests = testResults.tests.filter(t => t.status === 'warning');
  
  if (failedTests.length === 0 && warningTests.length === 0) {
    console.log(`${colors.green}✅ All tests passed! Your crawler should work correctly.${colors.reset}`);
    return;
  }
  
  // DNS issues
  if (failedTests.some(t => t.name.includes('DNS'))) {
    console.log(`${colors.red}🔧 DNS Issues Detected:${colors.reset}`);
    console.log('   - Check your internet connection');
    console.log('   - Verify DNS server configuration');
    console.log('   - Try using public DNS servers (8.8.8.8, 1.1.1.1)');
    console.log('   - Check if the domain is accessible from your location');
  }
  
  // HTTP connectivity issues
  if (failedTests.some(t => t.name.includes('HTTP'))) {
    console.log(`${colors.red}🔧 HTTP Connectivity Issues:${colors.reset}`);
    console.log('   - Check firewall settings');
    console.log('   - Verify proxy configuration');
    console.log('   - Test with different network connection');
    console.log('   - Check if HTTPS certificates are valid');
  }
  
  // Browser launch issues
  if (failedTests.some(t => t.name.includes('Browser Launch'))) {
    console.log(`${colors.red}🔧 Browser Launch Issues:${colors.reset}`);
    console.log('   - Install required dependencies: npx playwright install');
    console.log('   - Check system compatibility for Playwright');
    console.log('   - Ensure sufficient system resources');
    console.log('   - Try running with different browser engines');
  }
  
  // Navigation issues
  if (failedTests.some(t => t.name.includes('Navigation'))) {
    console.log(`${colors.red}🔧 Navigation Issues:${colors.reset}`);
    console.log('   - Increase timeout values in crawler configuration');
    console.log('   - Use stealth mode to avoid detection');
    console.log('   - Try different user agents');
    console.log('   - Implement retry mechanisms with exponential backoff');
  }
  
  // Anti-bot warnings
  if (warningTests.some(t => t.name.includes('Bot Detection') || t.name.includes('User Agent'))) {
    console.log(`${colors.yellow}⚠️ Anti-Bot Measures Detected:${colors.reset}`);
    console.log('   - Use stealth browser configuration');
    console.log('   - Implement random delays between requests');
    console.log('   - Rotate user agents regularly');
    console.log('   - Consider using proxy rotation');
    console.log('   - Respect robots.txt and implement proper rate limiting');
    console.log('   - Contact site owner if legitimate crawling is needed');
  }
  
  // Proxy warnings
  if (warningTests.some(t => t.name.includes('Proxy'))) {
    console.log(`${colors.yellow}⚠️ Proxy Configuration Detected:${colors.reset}`);
    console.log('   - Ensure proxy settings are correct for the target site');
    console.log('   - Configure crawler to use proxy settings');
    console.log('   - Test without proxy if possible');
  }
  
  // Module issues
  if (failedTests.some(t => t.name.includes('Module'))) {
    console.log(`${colors.red}🔧 Missing Dependencies:${colors.reset}`);
    console.log('   - Run: npm install playwright crawlee');
    console.log('   - Install browser binaries: npx playwright install');
    console.log('   - Check Node.js version compatibility');
  }
}

// Run the tests
runAllTests().catch(error => {
  console.error('Test runner failed:', error);
  process.exit(1);
});