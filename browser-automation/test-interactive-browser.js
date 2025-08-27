const { chromium } = require('playwright');

async function interactiveBrowserTest() {
  console.log('🖱️ Interactive Browser Test - Clicking on Cat Images! 🐱\n');
  
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500,
  });
  
  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
    });
    const page = await context.newPage();
    
    console.log('1️⃣ Going to DuckDuckGo and searching for cats...');
    await page.goto('https://duckduckgo.com');
    await page.fill('#searchbox_input', 'cats');
    await page.press('#searchbox_input', 'Enter');
    
    console.log('2️⃣ Waiting for search results...');
    await page.waitForSelector('[data-testid="result"]', { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // Based on the screenshot, I can see there's an "Images" section with cat photos
    console.log('3️⃣ Looking for cat images section...');
    
    try {
      // Try to find and click on the first cat image
      console.log('4️⃣ Clicking on the British Shorthair cat image (first one)...');
      
      // The images appear to be in a specific section
      const firstCatImage = await page.locator('img[alt*="British Cat"]').first();
      if (await firstCatImage.isVisible()) {
        await firstCatImage.click();
        console.log('✅ Clicked on British Shorthair cat!');
        await page.waitForTimeout(2000);
        
        // Try to go back
        await page.goBack();
        await page.waitForTimeout(1000);
      }
    } catch (e) {
      console.log('Could not click first image, trying alternative approach...');
    }
    
    // Try clicking on "Images" link at the top
    console.log('5️⃣ Clicking on Images tab to see more cats...');
    try {
      await page.click('text=Images');
      await page.waitForTimeout(2000);
      console.log('✅ Switched to images view!');
      
      // In images view, click on different cats
      console.log('6️⃣ Clicking on various cat images...');
      
      // Click on first few images
      const images = await page.locator('img[src*="thumb"]').all();
      for (let i = 0; i < Math.min(3, images.length); i++) {
        console.log(`   Clicking cat image #${i + 1}...`);
        await images[i].click();
        await page.waitForTimeout(1500);
        
        // Try to close modal if it opens
        const closeButton = page.locator('button:has-text("Close"), [aria-label="Close"]');
        if (await closeButton.isVisible()) {
          await closeButton.click();
        } else {
          // Click elsewhere to close
          await page.click('body', { position: { x: 50, y: 50 } });
        }
        await page.waitForTimeout(500);
      }
      
    } catch (e) {
      console.log('Could not navigate to images');
    }
    
    // Demonstrate clicking at specific coordinates
    console.log('\n7️⃣ Demonstrating coordinate-based clicking...');
    console.log('   Clicking at specific positions on the page:');
    
    // Click on different areas based on the screenshot layout
    const clickPositions = [
      { x: 163, y: 350, name: 'First cat image area' },
      { x: 336, y: 350, name: 'Second cat image area' },
      { x: 500, y: 350, name: 'Third cat image area' },
    ];
    
    for (const pos of clickPositions) {
      console.log(`   Clicking at (${pos.x}, ${pos.y}) - ${pos.name}`);
      await page.mouse.click(pos.x, pos.y);
      await page.waitForTimeout(1000);
    }
    
    // Demonstrate hovering
    console.log('\n8️⃣ Hovering over elements to show tooltips...');
    await page.mouse.move(163, 350);
    await page.waitForTimeout(1000);
    await page.mouse.move(336, 350);
    await page.waitForTimeout(1000);
    
    console.log('\n9️⃣ Taking final screenshot...');
    await page.screenshot({ path: 'interactive-browser-final.png' });
    
    console.log('\n🎉 Interactive demo complete!');
    console.log('The browser will close in 5 seconds...');
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
console.log('INTERACTIVE BROWSER AUTOMATION');
console.log('================================\n');
console.log('This will demonstrate:');
console.log('  • Clicking on specific images');
console.log('  • Clicking at exact coordinates');
console.log('  • Hovering over elements');
console.log('  • Navigating between pages');
console.log('  • Taking screenshots\n');

console.log('Starting in 3 seconds...\n');

setTimeout(() => {
  interactiveBrowserTest().catch(console.error);
}, 3000);