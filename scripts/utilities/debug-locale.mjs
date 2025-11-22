import { chromium } from '@playwright/test';

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext({
  locale: 'es-ES',
  extraHTTPHeaders: {
    'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
  }
});

const page = await context.newPage();

// Capture console logs
page.on('console', msg => {
  const type = msg.type();
  console.log(`[BROWSER ${type}]:`, msg.text());
});

// Capture errors
page.on('pageerror', error => {
  console.log('[PAGE ERROR]:', error.message);
});

console.log('Loading page...');
await page.goto('http://localhost:3000/test-widget', { waitUntil: 'networkidle' });

console.log('Waiting 5 seconds for widget to load...');
await page.waitForTimeout(5000);

// Check if iframe exists
const iframeExists = await page.locator('iframe#chat-widget-iframe').count();
console.log('Iframe count:', iframeExists);

// Check localStorage
const stored = await page.evaluate(() => localStorage.getItem('omniops_ui_language'));
console.log('Stored language:', stored);

// Check navigator.language
const navLang = await page.evaluate(() => navigator.language);
console.log('Navigator language:', navLang);

await page.waitForTimeout(5000);
await browser.close();
