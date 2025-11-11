import { chromium, firefox, webkit } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import { API_BASE_URL } from './config';
import { log, logInfo, logSuccess, logWarning, logError } from './logger';
import { saveResults } from './results';

export async function runPlaywrightVerification() {
  log('🔍 Playwright Setup Verification');
  const results = {
    system: { platform: process.platform, nodeVersion: process.version },
    browsers: {} as Record<string, any>,
    dependencies: {} as Record<string, string | undefined>,
    issues: [] as Array<{ type: string; message: string; recommendation: string }>,
    recommendations: [] as string[],
    webScraping: {} as any,
    summary: {} as any
  };

  await checkDependencies(results);
  await checkBrowsers(results);
  await checkConfiguration(results);
  await testWebScraping(results);
  await generateSummary(results);
  await saveResults(results);
}

async function checkDependencies(results: any) {
  logInfo('\n📋 Checking dependencies...');
  try {
    const packageJson = JSON.parse(await fs.readFile('./package.json', 'utf-8'));
    results.dependencies.playwright = packageJson.dependencies?.playwright || packageJson.devDependencies?.playwright;
    results.dependencies.crawlee = packageJson.dependencies?.['@crawlee/playwright'];
    logSuccess('package.json dependencies loaded');
  } catch (error: any) {
    logWarning(`Could not read package.json: ${error.message}`);
  }
}

async function checkBrowsers(results: any) {
  logInfo('\n🌐 Checking browser installations...');
  const browsers = [
    { name: 'chromium', launcher: chromium },
    { name: 'firefox', launcher: firefox },
    { name: 'webkit', launcher: webkit }
  ];

  for (const { name, launcher } of browsers) {
    try {
      const browser = await launcher.launch({ headless: true, timeout: 10000 });
      const version = await browser.version();
      await browser.close();
      logSuccess(`Browser ${name} v${version} works`);
      results.browsers[name] = { installed: true, version, functional: true };
    } catch (error: any) {
      logError(`Browser ${name} failed: ${error.message}`);
      results.browsers[name] = { installed: false, error: error.message };
      results.issues.push({
        type: 'ERROR',
        message: `${name} browser not installed`,
        recommendation: `Run "npx playwright install ${name}"`
      });
    }
  }
}

async function checkConfiguration(results: any) {
  logInfo('\n⚙️ Checking configuration...');
  try {
    const config = await import(path.join(process.cwd(), 'playwright.config.js'));
    results.configuration = config.default || config;
    logSuccess('playwright.config.js loaded');
  } catch (error: any) {
    logError(`Configuration error: ${error.message}`);
    results.issues.push({
      type: 'ERROR',
      message: 'playwright.config.js missing or invalid',
      recommendation: 'Check configuration file syntax'
    });
  }
}

async function testWebScraping(results: any) {
  logInfo('\n🕷️ Testing web scraping...');
  const workingBrowser = Object.entries(results.browsers).find(([_, info]) => info.functional);
  if (!workingBrowser) {
    logWarning('No working browser available for scraping tests');
    return;
  }

  const [browserName] = workingBrowser;
  const launcher = { chromium, firefox, webkit }[browserName];
  const browser = await launcher.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('data:text/html,<h1>Playwright Works</h1>');
  const text = await page.textContent('h1');
  await browser.close();

  const success = text === 'Playwright Works';
  results.webScraping = { tested: true, browser: browserName, success };
  log(success ? '✅ Web scraping test passed' : '⚠️ Web scraping test failed', success ? 'green' : 'yellow');
}

async function generateSummary(results: any) {
  const workingBrowsers = Object.values(results.browsers).filter((info: any) => info.functional).length;
  const criticalIssues = results.issues.filter((issue: any) => issue.type === 'CRITICAL').length;
  const webScrapingReady = results.webScraping?.success;

  results.summary = {
    status: workingBrowsers > 0 && criticalIssues === 0 && webScrapingReady ? 'READY' : 'NEEDS_ATTENTION',
    workingBrowsers,
    totalBrowsers: Object.keys(results.browsers).length,
    criticalIssues
  };

  if (results.summary.status === 'READY') {
    results.recommendations.push('Playwright is ready for web scraping.');
  } else {
    results.recommendations.push('Resolve errors listed above before running scraping jobs.');
  }

  logInfo('\n📋 Summary:');
  log(`  Status: ${results.summary.status}`);
  log(`  Working browsers: ${workingBrowsers}/${results.summary.totalBrowsers}`);
  log(`  Issues found: ${results.issues.length}`);
}
