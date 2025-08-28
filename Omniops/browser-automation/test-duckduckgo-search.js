const { chromium } = require('playwright');

async function searchDuckDuckGoForCats() {
  console.log('🦆 DuckDuckGo Search Test: Looking for CATS! 🐱\n');
  console.log('(Using DuckDuckGo because it\'s more automation-friendly than Google)\n');
  
  // Launch browser in visible mode
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500, // Slow down by 500ms so you can see each action
    args: ['--start-maximized'],
  });
  
  try {
    // Create a new page with a real-looking context
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    const page = await context.newPage();
    
    console.log('1️⃣ Navigating to DuckDuckGo...');
    await page.goto('https://duckduckgo.com');
    
    console.log('2️⃣ Waiting for search box...');
    await page.waitForSelector('#searchbox_input', { timeout: 5000 });
    
    console.log('3️⃣ Clicking on search box...');
    await page.click('#searchbox_input');
    
    console.log('4️⃣ Typing "cats" letter by letter...');
    // Type slowly so you can see it
    for (const letter of 'cats') {
      await page.type('#searchbox_input', letter, { delay: 200 });
    }
    
    console.log('5️⃣ Waiting a moment...');
    await page.waitForTimeout(1000);
    
    console.log('6️⃣ Pressing Enter to search...');
    await page.press('#searchbox_input', 'Enter');
    
    console.log('7️⃣ Waiting for search results...');
    // Wait for results to load
    await page.waitForSelector('[data-testid="result"]', { timeout: 10000 });
    
    console.log('8️⃣ Search results loaded! Taking screenshot...');
    await page.screenshot({ path: 'duckduckgo-cats-search.png' });
    
    // Count how many results we got
    const resultCount = await page.evaluate(() => {
      const results = document.querySelectorAll('[data-testid="result"]');
      return results.length;
    });
    
    console.log(`\n✅ Found ${resultCount} search results for "cats" on the page`);
    
    // Highlight the search results
    console.log('9️⃣ Highlighting search results with cat emojis...');
    await page.evaluate(() => {
      const results = document.querySelectorAll('[data-testid="result"]');
      results.forEach((result, index) => {
        result.style.border = '3px solid orange';
        result.style.backgroundColor = 'rgba(255, 165, 0, 0.1)';
        result.style.padding = '10px';
        result.style.margin = '5px';
        result.style.borderRadius = '10px';
        
        // Add a cat emoji to each result
        const emoji = document.createElement('span');
        emoji.textContent = '🐱 ';
        emoji.style.fontSize = '24px';
        result.insertBefore(emoji, result.firstChild);
      });
    });
    
    console.log('🔟 Scrolling through results slowly...');
    // Scroll down slowly to show more results
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollBy(0, 400));
      await page.waitForTimeout(1000);
    }
    
    // Fun bonus: click on Images tab
    console.log('\n🖼️ BONUS: Clicking on Images tab...');
    try {
      await page.click('a[data-zci-link="images"]', { timeout: 3000 });
      await page.waitForTimeout(2000);
      console.log('📸 Taking screenshot of cat images...');
      await page.screenshot({ path: 'duckduckgo-cats-images.png' });
    } catch {
      console.log('Could not find images tab');
    }
    
    console.log('\n🎉 Demo complete! The browser will close in 5 seconds...');
    console.log('📸 Screenshots saved as:');
    console.log('   - duckduckgo-cats-search.png');
    console.log('   - duckduckgo-cats-images.png');
    
    // Keep browser open for 5 more seconds so you can see
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
    console.log('\n👋 Browser closed!');
  }
}

// Run the test
console.log('================================');
console.log('DUCKDUCKGO SEARCH AUTOMATION');
console.log('================================\n');
console.log('This will:');
console.log('  1. Open a visible Chrome browser');
console.log('  2. Navigate to DuckDuckGo');
console.log('  3. Type "cats" in the search box');
console.log('  4. Press Enter to search');
console.log('  5. Highlight results with cat emojis 🐱');
console.log('  6. Show cat images');
console.log('  7. Take screenshots\n');

console.log('Starting in 3 seconds...\n');

setTimeout(() => {
  searchDuckDuckGoForCats().catch(console.error);
}, 3000);