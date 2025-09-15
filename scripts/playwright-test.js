import { chromium, firefox, webkit  } from 'playwright';

async function testPlaywrightBrowsers() {
  console.log('🚀 Testing Playwright Browser Dependencies\n');
  console.log('=====================================\n');
  
  const results = {
    chromium: { headless: false, headed: false, error: null },
    firefox: { headless: false, headed: false, error: null },
    webkit: { headless: false, headed: false, error: null }
  };
  
  // Test each browser type
  const browsers = [
    { name: 'chromium', launcher: chromium },
    { name: 'firefox', launcher: firefox },
    { name: 'webkit', launcher: webkit }
  ];
  
  for (const { name, launcher } of browsers) {
    console.log(`Testing ${name.toUpperCase()}:`);
    
    // Test headless mode
    try {
      console.log(`  ├── Testing headless mode...`);
      const browser = await launcher.launch({ headless: true });
      const page = await browser.newPage();
      await page.goto('data:text/html,<h1>Test Page</h1>');
      const title = await page.evaluate(() => document.querySelector('h1')?.textContent);
      await browser.close();
      
      if (title === 'Test Page') {
        results[name].headless = true;
        console.log(`  ├── ✅ Headless mode: WORKING`);
      } else {
        console.log(`  ├── ❌ Headless mode: FAILED (title mismatch)`);
      }
    } catch (error) {
      results[name].error = error.message;
      console.log(`  ├── ❌ Headless mode: FAILED (${error.message})`);
    }
    
    // Test headed mode (only on macOS for this test)
    try {
      console.log(`  ├── Testing headed mode...`);
      const browser = await launcher.launch({ headless: false });
      const page = await browser.newPage();
      await page.goto('data:text/html,<h1>Test Page</h1>');
      const title = await page.evaluate(() => document.querySelector('h1')?.textContent);
      await browser.close();
      
      if (title === 'Test Page') {
        results[name].headed = true;
        console.log(`  └── ✅ Headed mode: WORKING`);
      } else {
        console.log(`  └── ❌ Headed mode: FAILED (title mismatch)`);
      }
    } catch (error) {
      console.log(`  └── ❌ Headed mode: FAILED (${error.message})`);
    }
    
    console.log('');
  }
  
  // Summary
  console.log('📊 SUMMARY:');
  console.log('===========');
  for (const [browser, result] of Object.entries(results)) {
    const headlessStatus = result.headless ? '✅' : '❌';
    const headedStatus = result.headed ? '✅' : '❌';
    console.log(`${browser.toUpperCase()}:`);
    console.log(`  Headless: ${headlessStatus}`);
    console.log(`  Headed:   ${headedStatus}`);
    if (result.error) {
      console.log(`  Error: ${result.error}`);
    }
    console.log('');
  }
  
  // Overall status
  const allWorking = Object.values(results).every(r => r.headless && r.headed);
  if (allWorking) {
    console.log('🎉 ALL BROWSERS ARE WORKING CORRECTLY!');
  } else {
    console.log('⚠️  Some browser configurations need attention.');
  }
  
  return results;
}

async function testBasicWebScraping() {
  console.log('\n🌐 Testing Basic Web Scraping Functionality');
  console.log('==========================================\n');
  
  try {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    console.log('1. Creating test HTML page...');
    const testHtml = `
      <!DOCTYPE html>
      <html>
      <head><title>Test Page</title></head>
      <body>
        <h1>Scraping Test</h1>
        <p id="content">This is test content for scraping.</p>
        <div class="items">
          <div class="item">Item 1</div>
          <div class="item">Item 2</div>
          <div class="item">Item 3</div>
        </div>
      </body>
      </html>
    `;
    
    await page.goto(`data:text/html,${encodeURIComponent(testHtml)}`);
    
    console.log('2. Testing element selection...');
    const title = await page.textContent('h1');
    const content = await page.textContent('#content');
    const items = await page.$$eval('.item', elements => 
      elements.map(el => el.textContent)
    );
    
    console.log(`   Title: "${title}"`);
    console.log(`   Content: "${content}"`);
    console.log(`   Items: [${items.join(', ')}]`);
    
    console.log('3. Testing JavaScript execution...');
    const result = await page.evaluate(() => {
      const items = document.querySelectorAll('.item');
      return {
        itemCount: items.length,
        bodyText: document.body.textContent.trim().replace(/\s+/g, ' ')
      };
    });
    
    console.log(`   Item count: ${result.itemCount}`);
    console.log(`   Body text: "${result.bodyText}"`);
    
    await browser.close();
    
    console.log('\n✅ Web scraping test completed successfully!');
    return true;
  } catch (error) {
    console.log(`\n❌ Web scraping test failed: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  const browserResults = await testPlaywrightBrowsers();
  const scrapingResult = await testBasicWebScraping();
  
  console.log('\n' + '='.repeat(50));
  console.log('🏁 FINAL RESULTS');
  console.log('='.repeat(50));
  
  const workingBrowsers = Object.entries(browserResults)
    .filter(([_, result]) => result.headless && result.headed)
    .map(([name, _]) => name);
  
  console.log(`Working browsers: ${workingBrowsers.length}/3`);
  console.log(`Web scraping: ${scrapingResult ? 'Working' : 'Failed'}`);
  
  if (workingBrowsers.length > 0 && scrapingResult) {
    console.log('\n🎉 Playwright is ready for web scraping!');
    console.log(`Recommended browser: ${workingBrowsers[0]}`);
  } else {
    console.log('\n⚠️  Issues detected. Please check the errors above.');
  }
}

// Run the tests
runAllTests().catch(console.error);