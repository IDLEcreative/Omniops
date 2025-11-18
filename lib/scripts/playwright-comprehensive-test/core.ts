import { chromium, firefox, webkit, type Browser } from 'playwright';
import fs from 'fs/promises';
import path from 'node:path';

export interface TestResults {
  browsers: Record<string, any>;
  scraping: Record<string, any>;
  performance: any;
  errors: Array<{ phase: string; error: string; stack?: string }>;
  summary?: any;
}

export class PlaywrightTester {
  private results: TestResults;
  private startTime: number;
  private scrapingConfig: any;

  constructor(scrapingConfig?: any) {
    this.results = {
      browsers: {},
      scraping: {},
      performance: {},
      errors: []
    };
    this.startTime = Date.now();
    this.scrapingConfig = scrapingConfig;
  }

  async runAllTests(): Promise<TestResults> {
    console.log('='.repeat(50));

    try {
      await this.testBrowserLaunching();
      await this.testBasicScraping();
      await this.testAdvancedScraping();
      await this.testPerformanceOptimizations();
      await this.testStealthFeatures();
      await this.generateReport();
    } catch (error: any) {
      this.results.errors.push({
        phase: 'main',
        error: error.message,
        stack: error.stack
      });
      console.error('❌ Test suite failed:', error.message);
    }

    return this.results;
  }

  async testBrowserLaunching(): Promise<void> {
    console.log('-'.repeat(30));

    const browsers = [
      { name: 'chromium', launcher: chromium },
      { name: 'firefox', launcher: firefox },
      { name: 'webkit', launcher: webkit }
    ];

    for (const { name, launcher } of browsers) {

      const browserResult = {
        headless: false,
        headed: false,
        version: null as string | null,
        launchTime: null as number | null,
        error: null as string | null
      };

      try {
        const startTime = Date.now();
        const browser = await launcher.launch({
          headless: true,
          ...(this.scrapingConfig?.browsers?.[name] || {})
        });

        browserResult.version = await browser.version();
        browserResult.launchTime = Date.now() - startTime;
        browserResult.headless = true;

        await browser.close();
      } catch (error: any) {
        browserResult.error = error.message;
      }

      try {
        const browser = await launcher.launch({
          headless: false,
          ...(this.scrapingConfig?.browsers?.[name] || {})
        });
        browserResult.headed = true;
        await browser.close();
      } catch (error) {
        console.log(`  ❌ Headed: ${(error as Error).message}`);
      }

      this.results.browsers[name] = browserResult;
    }
  }

  async testBasicScraping(): Promise<void> {
    console.log('-'.repeat(30));

    const browser = await chromium.launch({ headless: true });

    const testCases = [
      {
        name: 'Static HTML',
        url: 'data:text/html,<html><head><title>Test Page</title></head><body><h1>Hello World</h1></body></html>',
        tests: [{ selector: 'title', expected: 'Test Page' }]
      }
    ];

    for (const testCase of testCases) {

      try {
        const page = await browser.newPage();
        await page.goto(testCase.url);

        const testResult = { passed: 0, failed: 0, results: [] as any[] };

        for (const test of testCase.tests) {
          try {
            const actual = await page.textContent(test.selector);
            const passed = actual === test.expected;
            testResult.results.push({ selector: test.selector, passed });
            if (passed) testResult.passed++; else testResult.failed++;
          } catch (error: any) {
            testResult.failed++;
            testResult.results.push({ selector: test.selector, error: error.message, passed: false });
          }
        }

        await page.close();
        this.results.scraping[testCase.name] = testResult;

      } catch (error: any) {
        this.results.scraping[testCase.name] = { error: error.message };
      }
    }

    await browser.close();
  }

  async testAdvancedScraping(): Promise<void> {
    console.log('-'.repeat(30));

    const browser = await chromium.launch({
      headless: true,
      ...(this.scrapingConfig?.browsers?.chromium || {})
    });

    try {
      const page = await browser.newPage();

      await page.goto('data:text/html,<html><body><div id="test"></div><script>document.getElementById("test").textContent = "JS Works";</script></body></html>');
      const jsResult = await page.textContent('#test');

      const evalResult = await page.evaluate(() => ({
        url: window.location.href,
        timestamp: Date.now()
      }));

      await page.close();

      this.results.scraping.advanced = {
        javascript: jsResult === 'JS Works',
        pageEvaluation: evalResult && evalResult.timestamp
      };


    } catch (error: any) {
      this.results.scraping.advanced = { error: error.message };
    }

    await browser.close();
  }

  async testPerformanceOptimizations(): Promise<void> {
    console.log('-'.repeat(30));

    const testUrl = 'data:text/html,<html><head><title>Perf Test</title></head><body><h1>Performance Test</h1></body></html>';

    const standardStart = Date.now();
    const standardBrowser = await chromium.launch({ headless: true });
    const standardPage = await standardBrowser.newPage();
    await standardPage.goto(testUrl);
    await standardPage.textContent('h1');
    await standardBrowser.close();
    const standardTime = Date.now() - standardStart;

    const optimizedStart = Date.now();
    const optimizedBrowser = await chromium.launch({
      headless: true,
      ...(this.scrapingConfig?.browsers?.chromium || {})
    });
    const optimizedPage = await optimizedBrowser.newPage();
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

  }

  async testStealthFeatures(): Promise<void> {
    console.log('-'.repeat(30));

    const browser = await chromium.launch({
      headless: true,
      ...(this.scrapingConfig?.browsers?.chromium || {})
    });

    try {
      const page = await browser.newPage();
      const userAgent = await page.evaluate(() => navigator.userAgent);
      const webdriverTest = await page.evaluate(() => ({
        webdriver: navigator.webdriver
      }));
      const viewport = page.viewportSize();

      this.results.scraping.stealth = {
        userAgentSet: userAgent.includes('Chrome') || userAgent.includes('Firefox'),
        webdriverHidden: webdriverTest.webdriver === undefined,
        viewportSet: viewport && viewport.width > 0
      };


      await page.close();
    } catch (error: any) {
      this.results.scraping.stealth = { error: error.message };
    }

    await browser.close();
  }

  async generateReport(): Promise<void> {
    console.log('-'.repeat(30));

    const totalTime = Date.now() - this.startTime;
    this.results.summary = {
      totalTime,
      timestamp: new Date().toISOString(),
      browsersWorking: Object.values(this.results.browsers).filter((b: any) => b.headless).length,
      scrapingTests: Object.keys(this.results.scraping).length,
      errors: this.results.errors.length
    };

    await fs.mkdir('./test-results', { recursive: true });
    await fs.writeFile(
      './test-results/playwright-comprehensive-test.json',
      JSON.stringify(this.results, null, 2)
    );

    console.log(`  ⏱️  Duration: ${Math.round(totalTime / 1000)}s`);
  }

  getResults(): TestResults {
    return this.results;
  }
}
