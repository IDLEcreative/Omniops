const { PlaywrightCrawler } = require('crawlee');

async function testVisibleBrowser() {
  console.log('🌐 Starting VISIBLE browser test...\n');
  console.log('You should see a browser window open!\n');
  
  const crawler = new PlaywrightCrawler({
    maxRequestsPerCrawl: 5,
    maxConcurrency: 1, // One browser at a time so you can watch
    
    launchContext: {
      launchOptions: {
        headless: false, // THIS MAKES IT VISIBLE! 🎯
        slowMo: 500, // Slow down actions by 500ms so you can see them
        devtools: false, // Set to true if you want dev tools open
      },
    },
    
    browserPoolOptions: {
      useFingerprints: false, // Disable for testing
    },
    
    preNavigationHooks: [
      async ({ page }) => {
        // Set viewport to a nice visible size
        await page.setViewportSize({ width: 1280, height: 720 });
        
        // Show console logs from the page
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
      },
    ],
    
    requestHandler: async ({ page, request, enqueueLinks }) => {
      console.log(`\n📍 Navigating to: ${request.url}`);
      
      // Wait a bit so you can see the page
      await page.waitForTimeout(2000);
      
      // Highlight the main content area
      try {
        await page.evaluate(() => {
          const mainContent = document.querySelector('main, article, [role="main"], .content');
          if (mainContent) {
            mainContent.style.border = '3px solid red';
            mainContent.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
          }
        });
        console.log('✨ Highlighted main content in red');
      } catch (e) {
        console.log('Could not highlight content');
      }
      
      // Scroll down the page slowly
      console.log('📜 Scrolling down...');
      await page.evaluate(async () => {
        for (let i = 0; i < 5; i++) {
          window.scrollBy(0, 200);
          await new Promise(r => setTimeout(r, 500));
        }
      });
      
      // Take a screenshot
      const screenshotPath = `screenshot-${Date.now()}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: false });
      console.log(`📸 Screenshot saved: ${screenshotPath}`);
      
      // Extract some info
      const title = await page.title();
      const url = page.url();
      console.log(`📄 Page title: "${title}"`);
      console.log(`🔗 Current URL: ${url}`);
      
      // Count links on the page
      const linkCount = await page.evaluate(() => document.querySelectorAll('a').length);
      console.log(`🔢 Found ${linkCount} links on the page`);
      
      // Wait before going to next page
      console.log('⏳ Waiting 3 seconds before next page...');
      await page.waitForTimeout(3000);
      
      // Only enqueue a few links
      if (request.loadedUrl === request.url) {
        await enqueueLinks({
          limit: 2,
          transformRequestFunction: (req) => {
            // Only follow same-domain links
            const baseUrl = new URL(request.url);
            const newUrl = new URL(req.url);
            return baseUrl.hostname === newUrl.hostname ? req : false;
          },
        });
      }
    },
    
    failedRequestHandler: ({ request, error }) => {
      console.error(`❌ Failed to load ${request.url}: ${error.message}`);
    },
  });
  
  console.log('🚀 Starting crawl...\n');
  console.log('👀 WATCH THE BROWSER WINDOW!\n');
  
  // Start with a simple website
  await crawler.run(['https://example.com']);
  
  console.log('\n✅ Browser test completed!');
  console.log('The browser windows should have closed automatically.');
}

// Run the test
console.log('================================');
console.log('VISIBLE BROWSER TEST');
console.log('================================\n');
console.log('This will open a real browser window that you can see!');
console.log('The browser will:');
console.log('  1. Navigate to pages');
console.log('  2. Highlight content areas in red');
console.log('  3. Scroll down slowly');
console.log('  4. Take screenshots');
console.log('  5. Show you what it\'s doing\n');

console.log('Starting in 3 seconds...\n');

setTimeout(() => {
  testVisibleBrowser().catch(console.error);
}, 3000);