const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

// Global browser instance that stays open
let browser = null;
let page = null;
let context = null;

async function startBrowser() {
  console.log('🌐 Starting Claude\'s Live Browser...\n');
  
  browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized']
  });
  
  context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  page = await context.newPage();
  
  console.log('✅ Browser is ready and waiting for Claude\'s commands!');
  console.log('The browser will stay open for Claude to control.\n');
  
  // Keep process alive
  process.stdin.resume();
  
  // Handle cleanup
  process.on('SIGINT', async () => {
    console.log('\nClosing browser...');
    if (browser) await browser.close();
    process.exit(0);
  });
}

// Start the browser
startBrowser().catch(console.error);