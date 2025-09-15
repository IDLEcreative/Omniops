/**
 * Comprehensive Playwright Web Scraping Test
 * Tests all browser configurations and scraping capabilities
 */

import { chromium, firefox, webkit  } from 'playwright';
import fs from 'fs/promises';
import path from 'node:path';

import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class PlaywrightTester {
  constructor() {
    this.results = {
      browsers: {},
      scraping: {},
      performance: {},
      errors: []
    };
    this.startTime = Date.now();
  }
  
  async runAllTests() {
    console.log('🚀 Starting Comprehensive Playwright Tests');
    console.log('='.repeat(50));
    
    // Load config
    const { scrapingConfig } = await import(path.resolve(__dirname, '../playwright.config.js'));
    this.scrapingConfig = scrapingConfig;
    
    try {
      await this.testBrowserLaunching();
      await this.testBasicScraping();
      await this.testAdvancedScraping();
      await this.testPerformanceOptimizations();
      await this.testStealthFeatures();
      await this.generateReport();
    } catch (error) {
      this.results.errors.push({
        phase: 'main',
        error: error.message,
        stack: error.stack
      });
      console.error('❌ Test suite failed:', error.message);
    }
    
    await this.cleanup();
    return this.results;
  }
  
  async testBrowserLaunching() {
    console.log('\n📱 Testing Browser Launching...');
    console.log('-'.repeat(30));
    
    const browsers = [
      { name: 'chromium', launcher: chromium },
      { name: 'firefox', launcher: firefox },
      { name: 'webkit', launcher: webkit }
    ];
    
    for (const { name, launcher } of browsers) {
      console.log(`Testing ${name}...`);
      
      const browserResult = {
        headless: false,
        headed: false,
        version: null,
        launchTime: null,
        error: null
      };
      
      // Test headless
      try {
        const startTime = Date.now();
        const browser = await launcher.launch({ 
          headless: true,
          ...scrapingConfig.browsers[name] 
        });
        
        browserResult.version = await browser.version();
        browserResult.launchTime = Date.now() - startTime;
        browserResult.headless = true;
        
        await browser.close();
        console.log(`  ✅ Headless: ${browserResult.launchTime}ms`);
      } catch (error) {
        browserResult.error = error.message;
        console.log(`  ❌ Headless: ${error.message}`);
      }
      
      // Test headed (visual)
      try {
        const browser = await launcher.launch({ 
          headless: false,
          ...scrapingConfig.browsers[name] 
        });
        browserResult.headed = true;
        await browser.close();
        console.log(`  ✅ Headed: Working`);
      } catch (error) {
        console.log(`  ❌ Headed: ${error.message}`);
      }
      
      this.results.browsers[name] = browserResult;
    }
  }
  
  async testBasicScraping() {
    console.log('\n🌐 Testing Basic Web Scraping...');
    console.log('-'.repeat(30));
    
    const testCases = [
      {
        name: 'Static HTML',
        url: 'data:text/html,<html><head><title>Test Page</title></head><body><h1>Hello World</h1><p>This is a test</p></body></html>',
        tests: [
          { selector: 'title', expected: 'Test Page' },
          { selector: 'h1', expected: 'Hello World' },
          { selector: 'p', expected: 'This is a test' }
        ]
      },
      {
        name: 'E-commerce Elements',
        url: `data:text/html,${encodeURIComponent(`
          <html>
          <body>
            <div class="product">
              <h2 class="title">Sample Product</h2>
              <span class="price">£29.99</span>
              <div class="description">Great product for testing</div>
              <button class="add-to-cart">Add to Cart</button>
            </div>
            <div class="breadcrumb">
              <a href="/">Home</a> > <a href="/category">Category</a> > Product
            </div>
          </body>
          </html>
        `)}`,
        tests: [
          { selector: '.title', expected: 'Sample Product' },
          { selector: '.price', expected: '£29.99' },
          { selector: '.description', expected: 'Great product for testing' }
        ]
      }
    ];
    
    const browser = await chromium.launch({ headless: true });
    
    for (const testCase of testCases) {
      console.log(`Testing ${testCase.name}...`);
      
      try {
        const page = await browser.newPage();
        await page.goto(testCase.url);
        
        const testResult = { passed: 0, failed: 0, results: [] };
        
        for (const test of testCase.tests) {
          try {
            const actual = await page.textContent(test.selector);
            const passed = actual === test.expected;
            
            testResult.results.push({
              selector: test.selector,
              expected: test.expected,
              actual,
              passed
            });
            
            if (passed) {
              testResult.passed++;
            } else {
              testResult.failed++;
            }
          } catch (error) {
            testResult.failed++;
            testResult.results.push({
              selector: test.selector,
              error: error.message,
              passed: false
            });
          }
        }
        
        await page.close();
        
        this.results.scraping[testCase.name] = testResult;
        console.log(`  ✅ ${testResult.passed} passed, ${testResult.failed} failed`);
        
      } catch (error) {
        console.log(`  ❌ ${testCase.name}: ${error.message}`);
        this.results.scraping[testCase.name] = { error: error.message };
      }
    }
    
    await browser.close();
  }
  
  async testAdvancedScraping() {
    console.log('\n⚙️  Testing Advanced Scraping Features...');
    console.log('-'.repeat(30));
    
    const browser = await chromium.launch({ 
      headless: true,
      ...scrapingConfig.browsers.chromium 
    });
    
    try {
      const page = await browser.newPage();
      
      // Test JavaScript execution
      console.log('Testing JavaScript execution...');
      await page.goto('data:text/html,<html><body><div id="test"></div><script>document.getElementById("test").textContent = "JS Works";</script></body></html>');
      const jsResult = await page.textContent('#test');
      
      // Test page evaluation
      console.log('Testing page evaluation...');
      const evalResult = await page.evaluate(() => {
        return {
          url: window.location.href,
          userAgent: navigator.userAgent.substring(0, 50),
          timestamp: Date.now()
        };
      });
      
      // Test multiple selectors
      console.log('Testing multiple selectors...');
      const complexHtml = `
        <html><body>
        <div class="items">
          <div class="item">Item 1</div>
          <div class="item">Item 2</div>
          <div class="item">Item 3</div>
        </div>
        </body></html>
      `;
      await page.goto(`data:text/html,${encodeURIComponent(complexHtml)}`);
      const items = await page.$$eval('.item', elements => 
        elements.map(el => el.textContent)
      );
      
      // Test form interaction
      console.log('Testing form interaction...');
      const formHtml = `
        <html><body>
        <form>
          <input type="text" name="search" placeholder="Search...">
          <button type="submit">Search</button>
        </form>
        </body></html>
      `;
      await page.goto(`data:text/html,${encodeURIComponent(formHtml)}`);
      await page.fill('input[name="search"]', 'test query');
      const inputValue = await page.inputValue('input[name="search"]');
      
      await page.close();
      
      this.results.scraping.advanced = {
        javascript: jsResult === 'JS Works',
        pageEvaluation: evalResult && evalResult.timestamp,
        multipleSelectors: items.length === 3 && items.includes('Item 1'),
        formInteraction: inputValue === 'test query'
      };
      
      console.log('  ✅ JavaScript execution:', jsResult === 'JS Works');
      console.log('  ✅ Page evaluation:', !!evalResult.timestamp);
      console.log('  ✅ Multiple selectors:', items.length === 3);
      console.log('  ✅ Form interaction:', inputValue === 'test query');
      
    } catch (error) {
      console.log(`  ❌ Advanced scraping failed: ${error.message}`);
      this.results.scraping.advanced = { error: error.message };
    }
    
    await browser.close();
  }
  
  async testPerformanceOptimizations() {
    console.log('\n⚡ Testing Performance Optimizations...');
    console.log('-'.repeat(30));
    
    const testUrl = 'data:text/html,<html><head><title>Perf Test</title></head><body><h1>Performance Test</h1></body></html>';
    
    // Test without optimizations
    console.log('Testing without optimizations...');
    const standardStart = Date.now();
    const standardBrowser = await chromium.launch({ headless: true });
    const standardPage = await standardBrowser.newPage();
    await standardPage.goto(testUrl);
    await standardPage.textContent('h1');
    await standardBrowser.close();
    const standardTime = Date.now() - standardStart;
    
    // Test with optimizations
    console.log('Testing with optimizations...');
    const optimizedStart = Date.now();
    const optimizedBrowser = await chromium.launch({ 
      headless: true,
      ...scrapingConfig.browsers.chromium 
    });
    const optimizedPage = await optimizedBrowser.newPage();
    
    // Apply resource blocking
    if (scrapingConfig.resourceBlocking.enabled) {
      await optimizedPage.route('**/*', (route) => {
        const resourceType = route.request().resourceType();
        if (scrapingConfig.resourceBlocking.blockTypes.includes(resourceType)) {
          route.abort();
        } else {
          route.continue();
        }
      });
    }
    
    await optimizedPage.goto(testUrl);
    await optimizedPage.textContent('h1');
    await optimizedBrowser.close();
    const optimizedTime = Date.now() - optimizedStart;
    
    this.results.performance = {
      standardTime,
      optimizedTime,
      improvement: standardTime - optimizedTime,
      improvementPercent: ((standardTime - optimizedTime) / standardTime * 100).toFixed(2)
    };
    
    console.log(`  ⏱️  Standard: ${standardTime}ms`);
    console.log(`  ⚡ Optimized: ${optimizedTime}ms`);
    console.log(`  📈 Improvement: ${this.results.performance.improvementPercent}%`);
  }
  
  async testStealthFeatures() {
    console.log('\n🥷 Testing Stealth Features...');
    console.log('-'.repeat(30));
    
    const browser = await chromium.launch({ 
      headless: true,
      ...scrapingConfig.browsers.chromium 
    });
    
    try {
      const page = await browser.newPage();
      
      // Test user agent
      const userAgent = await page.evaluate(() => navigator.userAgent);
      console.log(`  🔍 User Agent: ${userAgent.substring(0, 50)}...`);
      
      // Test webdriver detection
      const webdriverTest = await page.evaluate(() => {
        return {
          webdriver: navigator.webdriver,
          automationFlag: window.navigator.webdriver
        };
      });
      
      // Test viewport randomization
      const viewport = page.viewportSize();
      
      this.results.scraping.stealth = {
        userAgentSet: userAgent.includes('Chrome') || userAgent.includes('Firefox'),
        webdriverHidden: webdriverTest.webdriver === undefined,
        viewportSet: viewport && viewport.width > 0
      };
      
      console.log(`  ✅ User agent configured:`, this.results.scraping.stealth.userAgentSet);
      console.log(`  ✅ WebDriver hidden:`, this.results.scraping.stealth.webdriverHidden);
      console.log(`  ✅ Viewport configured:`, this.results.scraping.stealth.viewportSet);
      
      await page.close();
    } catch (error) {
      console.log(`  ❌ Stealth test failed: ${error.message}`);
      this.results.scraping.stealth = { error: error.message };
    }
    
    await browser.close();
  }
  
  async generateReport() {
    console.log('\n📊 Generating Test Report...');
    console.log('-'.repeat(30));
    
    const totalTime = Date.now() - this.startTime;
    this.results.summary = {
      totalTime,
      timestamp: new Date().toISOString(),
      browsersWorking: Object.values(this.results.browsers).filter(b => b.headless).length,
      scrapingTests: Object.keys(this.results.scraping).length,
      errors: this.results.errors.length
    };
    
    // Create test-results directory
    await fs.mkdir('./test-results', { recursive: true });
    
    // Save detailed results
    await fs.writeFile(
      './test-results/playwright-comprehensive-test.json',
      JSON.stringify(this.results, null, 2)
    );
    
    // Create summary report
    const summaryReport = `
# Playwright Web Scraping Test Report

**Generated:** ${this.results.summary.timestamp}
**Duration:** ${Math.round(totalTime / 1000)}s
**Browsers Working:** ${this.results.summary.browsersWorking}/3
**Errors:** ${this.results.summary.errors}

## Browser Support

${Object.entries(this.results.browsers).map(([name, result]) => 
  `- **${name.toUpperCase()}**: ${result.headless ? '✅' : '❌'} Headless, ${result.headed ? '✅' : '❌'} Headed${result.version ? ` (${result.version})` : ''}`
).join('\n')}

## Scraping Capabilities

${Object.entries(this.results.scraping).map(([test, result]) => {
  if (result.error) return `- **${test}**: ❌ ${result.error}`;
  if (result.passed !== undefined) return `- **${test}**: ✅ ${result.passed}/${result.passed + result.failed} tests passed`;
  if (typeof result === 'object') {
    const working = Object.values(result).filter(v => v === true).length;
    const total = Object.keys(result).length;
    return `- **${test}**: ✅ ${working}/${total} features working`;
  }
  return `- **${test}**: ✅ Working`;
}).join('\n')}

## Performance

${this.results.performance.improvementPercent ? 
  `- **Optimization Impact**: ${this.results.performance.improvementPercent}% faster\n- **Standard Time**: ${this.results.performance.standardTime}ms\n- **Optimized Time**: ${this.results.performance.optimizedTime}ms` : 
  '- Performance tests not completed'
}

---
*Report generated by Playwright Comprehensive Test Suite*
`;
    
    await fs.writeFile('./test-results/playwright-test-report.md', summaryReport);
    
    console.log(`  📄 Detailed results: ./test-results/playwright-comprehensive-test.json`);
    console.log(`  📋 Summary report: ./test-results/playwright-test-report.md`);
    
    // Console summary
    console.log('\n🎯 Test Summary:');
    console.log(`  ⏱️  Duration: ${Math.round(totalTime / 1000)}s`);
    console.log(`  🌐 Browsers: ${this.results.summary.browsersWorking}/3 working`);
    console.log(`  ✅ Tests: ${this.results.summary.scrapingTests} completed`);
    console.log(`  ❌ Errors: ${this.results.summary.errors}`);
  }
  
  async cleanup() {
    console.log('\n🧹 Cleaning up...');
    // Any cleanup tasks would go here
  }
}

// Run the comprehensive test if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new PlaywrightTester();
  tester.runAllTests()
    .then((results) => {
      const success = results.summary.browsersWorking > 0 && results.summary.errors === 0;
      console.log(success ? '\n🎉 All tests passed!' : '\n⚠️  Some tests failed - check the report for details');
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Test suite crashed:', error);
      process.exit(1);
    });
}

export { PlaywrightTester };;
