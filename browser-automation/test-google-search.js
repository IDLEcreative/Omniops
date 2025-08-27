const { chromium } = require('playwright');

async function searchGoogleForCats() {
  console.log('🔍 Google Search Test: Looking for CATS! 🐱\n');
  
  // Launch browser in visible mode
  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000, // Slow down by 1 second so you can see each action
  });
  
  try {
    // Create a new page
    const page = await browser.newPage();
    
    // Set a nice viewport size
    await page.setViewportSize({ width: 1280, height: 720 });
    
    console.log('1️⃣ Navigating to Google...');
    await page.goto('https://www.google.com');
    
    console.log('2️⃣ Waiting for search box...');
    // Wait for and find the search input
    // Google's search box usually has name="q"
    await page.waitForSelector('input[name="q"]', { timeout: 5000 });
    
    console.log('3️⃣ Clicking on search box...');
    await page.click('input[name="q"]');
    
    console.log('4️⃣ Typing "cats" slowly...');
    // Type slowly so you can see it
    await page.type('input[name="q"]', 'cats', { delay: 200 });
    
    console.log('5️⃣ Waiting a moment...');
    await page.waitForTimeout(1000);
    
    console.log('6️⃣ Pressing Enter to search...');
    await page.press('input[name="q"]', 'Enter');
    
    console.log('7️⃣ Waiting for search results...');
    // Wait for results to load
    await page.waitForSelector('#search', { timeout: 10000 });
    
    console.log('8️⃣ Search results loaded! Taking screenshot...');
    await page.screenshot({ path: 'google-cats-search.png' });
    
    // Count how many results we got
    const resultCount = await page.evaluate(() => {
      const results = document.querySelectorAll('#search .g');
      return results.length;
    });
    
    console.log(`\n✅ Found approximately ${resultCount} search results for "cats"`);
    
    // Highlight the search results
    console.log('9️⃣ Highlighting search results in blue...');
    await page.evaluate(() => {
      const results = document.querySelectorAll('#search .g');
      results.forEach(result => {
        result.style.border = '2px solid blue';
        result.style.backgroundColor = 'rgba(0, 0, 255, 0.1)';
        result.style.padding = '10px';
        result.style.margin = '5px';
      });
    });
    
    console.log('🔟 Scrolling through results...');
    // Scroll down slowly
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollBy(0, 300));
      await page.waitForTimeout(1000);
    }
    
    console.log('\n🎉 Demo complete! The browser will close in 5 seconds...');
    console.log('📸 Screenshot saved as: google-cats-search.png');
    
    // Keep browser open for 5 more seconds so you can see
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nNote: If Google blocked the search, they might have detected automation.');
    console.log('This is common with Google - they have strong automation detection.');
  } finally {
    await browser.close();
    console.log('\n👋 Browser closed!');
  }
}

// Run the test
console.log('================================');
console.log('GOOGLE SEARCH AUTOMATION TEST');
console.log('================================\n');
console.log('This will:');
console.log('  1. Open a visible Chrome browser');
console.log('  2. Navigate to Google');
console.log('  3. Type "cats" in the search box');
console.log('  4. Press Enter to search');
console.log('  5. Highlight the search results');
console.log('  6. Take a screenshot\n');

console.log('Starting in 3 seconds...\n');

setTimeout(() => {
  searchGoogleForCats().catch(console.error);
}, 3000);