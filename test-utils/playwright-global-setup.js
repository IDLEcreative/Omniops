/**
 * Playwright Global Setup
 * Initializes the test environment and prepares browsers
 */

import { chromium, firefox, webkit } from 'playwright';
import fs from 'fs/promises';
import path from 'path';

async function globalSetup() {
  console.log('🚀 Playwright Global Setup Starting...');
  
  // Create test directories
  const testDirs = [
    './test-results',
    './test-results/screenshots',
    './test-results/videos',
    './test-results/traces',
    './__tests__/playwright'
  ];
  
  for (const dir of testDirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
      console.log(`✅ Created directory: ${dir}`);
    } catch (error) {
      console.warn(`⚠️  Could not create directory ${dir}:`, error.message);
    }
  }
  
  // Verify browser installations
  console.log('🔍 Verifying browser installations...');
  
  const browsers = [
    { name: 'Chromium', launcher: chromium },
    { name: 'Firefox', launcher: firefox },
    { name: 'WebKit', launcher: webkit }
  ];
  
  const results = {};
  
  for (const { name, launcher } of browsers) {
    try {
      const browser = await launcher.launch({ headless: true });
      const version = await browser.version();
      await browser.close();
      results[name.toLowerCase()] = { available: true, version };
      console.log(`✅ ${name}: Available (${version})`);
    } catch (error) {
      results[name.toLowerCase()] = { available: false, error: error.message };
      console.error(`❌ ${name}: Not available (${error.message})`);
    }
  }
  
  // Save browser availability info
  await fs.writeFile(
    './test-results/browser-availability.json',
    JSON.stringify(results, null, 2)
  );
  
  // Test basic functionality
  console.log('🧪 Testing basic Playwright functionality...');
  try {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('data:text/html,<h1>Test</h1>');
    const title = await page.textContent('h1');
    await browser.close();
    
    if (title === 'Test') {
      console.log('✅ Basic functionality test passed');
    } else {
      throw new Error('Basic functionality test failed');
    }
  } catch (error) {
    console.error('❌ Basic functionality test failed:', error.message);
    throw error;
  }
  
  console.log('🎉 Playwright Global Setup Complete!');
  
  // Store setup timestamp
  await fs.writeFile(
    './test-results/setup-timestamp.txt',
    new Date().toISOString()
  );
}

export default globalSetup;