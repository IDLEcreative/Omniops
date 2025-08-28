#!/usr/bin/env node

/**
 * Playwright Setup Verification Script
 * Verifies all Playwright dependencies and configurations for web scraping
 */

const { chromium, firefox, webkit } = require('playwright');
const fs = require('fs/promises');
const path = require('path');
const { spawn } = require('child_process');
const { scrapingConfig } = require('./playwright.config.js');

class PlaywrightSetupVerifier {
  constructor() {
    this.results = {
      system: {},
      browsers: {},
      dependencies: {},
      configuration: {},
      webScraping: {},
      issues: [],
      recommendations: []
    };
  }

  async verify() {
    console.log('🔍 Playwright Setup Verification');
    console.log('='.repeat(40));
    
    try {
      await this.checkSystemDependencies();
      await this.checkBrowserInstallations();
      await this.verifyConfiguration();
      await this.testWebScrapingCapabilities();
      await this.generateReport();
      
      return this.results;
    } catch (error) {
      console.error('❌ Verification failed:', error.message);
      this.results.issues.push({
        type: 'CRITICAL',
        message: `Verification failed: ${error.message}`,
        recommendation: 'Check the error details and ensure Playwright is properly installed'
      });
      return this.results;
    }
  }

  async checkSystemDependencies() {
    console.log('\n📋 Checking System Dependencies...');
    
    // Check Node.js version
    const nodeVersion = process.version;
    console.log(`  Node.js: ${nodeVersion}`);
    this.results.system.nodeVersion = nodeVersion;
    
    // Check if running on macOS (which we are)
    const platform = process.platform;
    const arch = process.arch;
    console.log(`  Platform: ${platform} ${arch}`);
    this.results.system.platform = platform;
    this.results.system.architecture = arch;
    
    // Check npm/package.json
    try {
      const packageJson = JSON.parse(await fs.readFile('./package.json', 'utf-8'));
      const playwrightVersion = packageJson.dependencies?.playwright || packageJson.devDependencies?.playwright;
      const crawleeVersion = packageJson.dependencies?.['@crawlee/playwright'];
      
      console.log(`  Playwright: ${playwrightVersion || 'Not found in package.json'}`);
      console.log(`  Crawlee: ${crawleeVersion || 'Not found in package.json'}`);
      
      this.results.dependencies.playwright = playwrightVersion;
      this.results.dependencies.crawlee = crawleeVersion;
    } catch (error) {
      console.log(`  ⚠️  Could not read package.json: ${error.message}`);
      this.results.issues.push({
        type: 'WARNING',
        message: 'Could not verify package.json dependencies',
        recommendation: 'Ensure package.json exists and contains Playwright dependencies'
      });
    }
    
    // Check for existing test directories
    const testDirs = ['./test-results', './__tests__', './browser-automation'];
    for (const dir of testDirs) {
      try {
        await fs.access(dir);
        console.log(`  ✅ ${dir} exists`);
      } catch {
        console.log(`  📁 ${dir} not found (will be created if needed)`);
      }
    }
  }

  async checkBrowserInstallations() {
    console.log('\n🌐 Checking Browser Installations...');
    
    const browsers = [
      { name: 'chromium', launcher: chromium },
      { name: 'firefox', launcher: firefox },
      { name: 'webkit', launcher: webkit }
    ];
    
    for (const { name, launcher } of browsers) {
      console.log(`  Testing ${name}...`);
      
      try {
        const browser = await launcher.launch({ 
          headless: true,
          timeout: 10000 // 10 second timeout
        });
        
        const version = await browser.version();
        const context = await browser.newContext();
        const page = await context.newPage();
        await page.goto('data:text/html,<h1>Test</h1>');
        const title = await page.textContent('h1');
        
        await browser.close();
        
        const success = title === 'Test';
        this.results.browsers[name] = {
          installed: true,
          version,
          functional: success,
          error: null
        };
        
        console.log(`    ✅ Version ${version} - ${success ? 'Functional' : 'Issues detected'}`);
        
      } catch (error) {
        this.results.browsers[name] = {
          installed: false,
          version: null,
          functional: false,
          error: error.message
        };
        
        console.log(`    ❌ Failed: ${error.message}`);
        
        if (error.message.includes('browserType.launch')) {
          this.results.issues.push({
            type: 'ERROR',
            message: `${name} browser not properly installed`,
            recommendation: `Run "npx playwright install ${name}" to install the browser`
          });
        }
      }
    }
  }

  async verifyConfiguration() {
    console.log('\n⚙️ Verifying Configuration...');
    
    // Check if config file exists and is valid
    try {
      const config = require('./playwright.config.js');
      console.log('  ✅ playwright.config.js found and valid');
      
      this.results.configuration.configFile = true;
      this.results.configuration.scrapingConfig = !!config.scrapingConfig;
      this.results.configuration.browsers = Object.keys(config.scrapingConfig?.browsers || {});
      
      console.log(`  ✅ Scraping config: ${config.scrapingConfig ? 'Present' : 'Missing'}`);
      console.log(`  ✅ Configured browsers: ${this.results.configuration.browsers.join(', ')}`);
      
    } catch (error) {
      console.log(`  ❌ Configuration error: ${error.message}`);
      this.results.configuration.configFile = false;
      this.results.issues.push({
        type: 'ERROR',
        message: 'Playwright configuration file is invalid',
        recommendation: 'Check playwright.config.js for syntax errors'
      });
    }
    
    // Check browser context pool
    try {
      const BrowserContextPool = require('./lib/browser-context-pool.ts');
      console.log('  ✅ Browser context pool available');
      this.results.configuration.contextPool = true;
    } catch (error) {
      console.log('  ⚠️  Browser context pool not available');
      this.results.configuration.contextPool = false;
    }
  }

  async testWebScrapingCapabilities() {
    console.log('\n🕷️ Testing Web Scraping Capabilities...');
    
    const testCases = [
      {
        name: 'Basic HTML Parsing',
        test: async (page) => {
          await page.goto('data:text/html,<html><body><h1>Hello</h1><p>World</p></body></html>');
          const h1 = await page.textContent('h1');
          const p = await page.textContent('p');
          return h1 === 'Hello' && p === 'World';
        }
      },
      {
        name: 'JavaScript Execution',
        test: async (page) => {
          await page.goto('data:text/html,<html><body><div id="test"></div><script>document.getElementById("test").textContent = "JS Works";</script></body></html>');
          await page.waitForFunction(() => document.getElementById('test').textContent === 'JS Works');
          const content = await page.textContent('#test');
          return content === 'JS Works';
        }
      },
      {
        name: 'Form Interaction',
        test: async (page) => {
          await page.goto('data:text/html,<html><body><input type="text" id="input"><button onclick="document.getElementById(\'result\').textContent = document.getElementById(\'input\').value">Click</button><div id="result"></div></body></html>');
          await page.fill('#input', 'test');
          await page.click('button');
          const result = await page.textContent('#result');
          return result === 'test';
        }
      },
      {
        name: 'Multiple Elements',
        test: async (page) => {
          await page.goto('data:text/html,<html><body><ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul></body></html>');
          const items = await page.$$eval('li', els => els.map(el => el.textContent));
          return items.length === 3 && items.includes('Item 1') && items.includes('Item 2') && items.includes('Item 3');
        }
      }
    ];
    
    // Use the best available browser
    const workingBrowser = Object.entries(this.results.browsers).find(([_, result]) => result.functional);
    
    if (!workingBrowser) {
      console.log('  ❌ No working browser found for testing');
      this.results.webScraping.tested = false;
      this.results.issues.push({
        type: 'CRITICAL',
        message: 'No functional browser available for web scraping',
        recommendation: 'Install browsers using "npx playwright install"'
      });
      return;
    }
    
    const [browserName] = workingBrowser;
    const launcher = { chromium, firefox, webkit }[browserName];
    
    console.log(`  Using ${browserName} for testing...`);
    
    const browser = await launcher.launch({ headless: true });
    const results = {};
    
    for (const testCase of testCases) {
      console.log(`    Testing ${testCase.name}...`);
      
      try {
        const page = await browser.newPage();
        const result = await testCase.test(page);
        await page.close();
        
        results[testCase.name] = result;
        console.log(`      ${result ? '✅' : '❌'} ${testCase.name}`);
        
      } catch (error) {
        results[testCase.name] = false;
        console.log(`      ❌ ${testCase.name}: ${error.message}`);
      }
    }
    
    await browser.close();
    
    this.results.webScraping = {
      tested: true,
      browser: browserName,
      results,
      passed: Object.values(results).filter(r => r === true).length,
      total: Object.keys(results).length
    };
    
    console.log(`  📊 Web scraping tests: ${this.results.webScraping.passed}/${this.results.webScraping.total} passed`);
  }

  async generateReport() {
    console.log('\n📋 Generating Verification Report...');
    
    // Create test-results directory
    await fs.mkdir('./test-results', { recursive: true });
    
    // Calculate overall status
    const workingBrowsers = Object.values(this.results.browsers).filter(b => b.functional).length;
    const criticalIssues = this.results.issues.filter(i => i.type === 'CRITICAL').length;
    const webScrapingWorking = this.results.webScraping.tested && 
      this.results.webScraping.passed === this.results.webScraping.total;
    
    const overallStatus = workingBrowsers > 0 && criticalIssues === 0 && webScrapingWorking 
      ? 'READY' : 'NEEDS_ATTENTION';
    
    this.results.summary = {
      status: overallStatus,
      workingBrowsers,
      totalBrowsers: Object.keys(this.results.browsers).length,
      criticalIssues,
      totalIssues: this.results.issues.length,
      webScrapingReady: webScrapingWorking,
      timestamp: new Date().toISOString()
    };
    
    // Add recommendations if needed
    if (overallStatus === 'NEEDS_ATTENTION') {
      if (workingBrowsers === 0) {
        this.results.recommendations.push('Install Playwright browsers: npx playwright install');
      }
      if (criticalIssues > 0) {
        this.results.recommendations.push('Resolve critical issues listed in the issues section');
      }
      if (!webScrapingWorking) {
        this.results.recommendations.push('Fix web scraping functionality issues');
      }
    } else {
      this.results.recommendations.push('Playwright is ready for web scraping!');
      this.results.recommendations.push('Consider running the comprehensive test: node playwright-comprehensive-test.js');
    }
    
    // Save detailed results
    await fs.writeFile(
      './test-results/playwright-setup-verification.json',
      JSON.stringify(this.results, null, 2)
    );
    
    // Create markdown report
    const markdownReport = this.generateMarkdownReport();
    await fs.writeFile('./test-results/playwright-setup-report.md', markdownReport);
    
    console.log('  📄 Detailed results: ./test-results/playwright-setup-verification.json');
    console.log('  📋 Summary report: ./test-results/playwright-setup-report.md');
    
    // Console summary
    console.log(`\n🎯 Verification Summary:`);
    console.log(`  Status: ${overallStatus === 'READY' ? '🟢 READY' : '🟡 NEEDS ATTENTION'}`);
    console.log(`  Browsers: ${workingBrowsers}/${this.results.summary.totalBrowsers} working`);
    console.log(`  Issues: ${criticalIssues} critical, ${this.results.summary.totalIssues} total`);
    console.log(`  Web Scraping: ${webScrapingWorking ? '✅ Ready' : '❌ Issues detected'}`);
    
    if (this.results.recommendations.length > 0) {
      console.log(`\n💡 Recommendations:`);
      this.results.recommendations.forEach(rec => console.log(`  • ${rec}`));
    }
  }

  generateMarkdownReport() {
    const { summary, system, browsers, webScraping, issues } = this.results;
    
    return `# Playwright Setup Verification Report

**Status:** ${summary.status === 'READY' ? '🟢 READY FOR WEB SCRAPING' : '🟡 NEEDS ATTENTION'}  
**Generated:** ${summary.timestamp}  
**Working Browsers:** ${summary.workingBrowsers}/${summary.totalBrowsers}  
**Issues:** ${summary.criticalIssues} critical, ${summary.totalIssues} total

## System Information

- **Platform:** ${system.platform} ${system.architecture}
- **Node.js:** ${system.nodeVersion}
- **Playwright:** ${this.results.dependencies.playwright || 'N/A'}
- **Crawlee:** ${this.results.dependencies.crawlee || 'N/A'}

## Browser Status

${Object.entries(browsers).map(([name, info]) => 
  `- **${name.toUpperCase()}:** ${info.functional ? '✅' : '❌'} ${info.functional ? `v${info.version}` : info.error}`
).join('\n')}

## Web Scraping Capabilities

${webScraping.tested ? `
**Test Results:** ${webScraping.passed}/${webScraping.total} tests passed using ${webScraping.browser}

${Object.entries(webScraping.results).map(([test, passed]) => 
  `- ${passed ? '✅' : '❌'} ${test}`
).join('\n')}
` : '❌ Web scraping tests could not be completed'}

## Issues Found

${issues.length === 0 ? '✅ No issues detected' : 
  issues.map(issue => `- **${issue.type}:** ${issue.message}\n  *Recommendation: ${issue.recommendation}*`).join('\n\n')
}

## Recommendations

${this.results.recommendations.map(rec => `- ${rec}`).join('\n')}

---
*Generated by Playwright Setup Verifier*
`;
  }
}

// Run verification if called directly
if (require.main === module) {
  const verifier = new PlaywrightSetupVerifier();
  verifier.verify()
    .then((results) => {
      const success = results.summary.status === 'READY';
      console.log(success ? '\n🎉 Playwright is ready for web scraping!' : '\n⚠️ Some issues need to be resolved');
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Verification failed:', error);
      process.exit(1);
    });
}

module.exports = { PlaywrightSetupVerifier };