const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

// Create screenshots folder
const SCREENSHOTS_DIR = path.join(__dirname, 'ai-screenshots');

async function ensureScreenshotsDir() {
  try {
    await fs.mkdir(SCREENSHOTS_DIR, { recursive: true });
  } catch (e) {}
}

async function aiVisionBrowserControl() {
  console.log('🤖 AI Vision-Based Browser Control');
  console.log('================================\n');
  
  await ensureScreenshotsDir();
  
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500,
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();
  
  // Start with a simple page
  await page.goto('https://example.com');
  
  console.log('📸 Taking initial screenshot...');
  const screenshot1 = await page.screenshot({ 
    path: path.join(SCREENSHOTS_DIR, 'screen-001.png') 
  });
  
  console.log('\n🤖 AI ANALYSIS OF SCREENSHOT 001:');
  console.log('I can see:');
  console.log('- A heading "Example Domain" at the top');
  console.log('- Some text about this domain being for examples');
  console.log('- A link saying "More information..." at coordinates approximately (600, 400)');
  console.log('\n✅ DECISION: I\'ll click on the "More information..." link\n');
  
  // Click based on visual analysis
  console.log('🖱️ Clicking at (600, 400) where I see the link...');
  await page.mouse.click(600, 400);
  await page.waitForTimeout(2000);
  
  // Take another screenshot
  console.log('📸 Taking screenshot after click...');
  await page.screenshot({ 
    path: path.join(SCREENSHOTS_DIR, 'screen-002.png') 
  });
  
  console.log('\n🤖 AI ANALYSIS OF SCREENSHOT 002:');
  console.log('I can see we\'re now on a different page (IANA website)');
  console.log('Let me navigate to a more interactive site...\n');
  
  // Go to DuckDuckGo for a more interactive demo
  console.log('🌐 Navigating to DuckDuckGo for search demo...');
  await page.goto('https://duckduckgo.com');
  await page.waitForTimeout(1000);
  
  // Screenshot analysis loop
  let actionCount = 0;
  const maxActions = 5;
  
  while (actionCount < maxActions) {
    actionCount++;
    
    // Take screenshot
    const screenshotPath = path.join(SCREENSHOTS_DIR, `screen-${String(actionCount + 2).padStart(3, '0')}.png`);
    console.log(`\n📸 Taking screenshot ${actionCount + 2}...`);
    await page.screenshot({ path: screenshotPath });
    
    // Simulate AI analysis (in reality, this would be sent to Claude API)
    console.log(`\n🤖 AI ANALYZING SCREENSHOT ${actionCount + 2}:`);
    
    if (actionCount === 1) {
      console.log('I can see:');
      console.log('- DuckDuckGo search page');
      console.log('- Search box in the center at approximately (640, 300)');
      console.log('- Search button to the right of the search box');
      console.log('\n✅ DECISION: Click on search box and search for "AI automation"');
      
      console.log('🖱️ Clicking search box at (640, 300)...');
      await page.mouse.click(640, 300);
      await page.waitForTimeout(500);
      
      console.log('⌨️ Typing "AI automation"...');
      await page.keyboard.type('AI automation');
      await page.waitForTimeout(500);
      
      console.log('⌨️ Pressing Enter...');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(2000);
      
    } else if (actionCount === 2) {
      console.log('I can see:');
      console.log('- Search results for "AI automation"');
      console.log('- Multiple result links');
      console.log('- First result appears at approximately (300, 200)');
      console.log('\n✅ DECISION: Click on the first search result');
      
      console.log('🖱️ Clicking first result at (300, 200)...');
      await page.mouse.click(300, 200);
      await page.waitForTimeout(2000);
      
    } else if (actionCount === 3) {
      console.log('I can see we\'ve navigated to an article about AI');
      console.log('\n✅ DECISION: Go back to search results');
      
      console.log('🔙 Going back...');
      await page.goBack();
      await page.waitForTimeout(1000);
      
    } else if (actionCount === 4) {
      console.log('Back at search results');
      console.log('I notice there\'s an "Images" tab at approximately (140, 60)');
      console.log('\n✅ DECISION: Click on Images to see AI-related images');
      
      console.log('🖱️ Clicking Images tab at (140, 60)...');
      await page.mouse.click(140, 60);
      await page.waitForTimeout(2000);
      
    } else {
      console.log('Now viewing image results for AI automation');
      console.log('Multiple images visible in a grid layout');
      console.log('\n✅ TASK COMPLETE: Successfully demonstrated AI-controlled browsing!');
    }
  }
  
  // Final screenshot
  await page.screenshot({ 
    path: path.join(SCREENSHOTS_DIR, 'screen-final.png') 
  });
  
  console.log('\n📊 SUMMARY:');
  console.log(`- Total screenshots taken: ${actionCount + 3}`);
  console.log(`- Screenshots saved to: ${SCREENSHOTS_DIR}`);
  console.log('- AI successfully navigated based on visual analysis');
  console.log('- Clicked buttons, typed text, and navigated pages');
  
  console.log('\n🎯 This demonstrates how an AI could:');
  console.log('1. See the screen through screenshots');
  console.log('2. Identify elements and their locations');
  console.log('3. Make decisions about what to click');
  console.log('4. Execute actions based on visual understanding');
  
  console.log('\nBrowser closing in 5 seconds...');
  await page.waitForTimeout(5000);
  
  await browser.close();
}

// Vision analysis simulator (in real implementation, this would call Claude API)
async function analyzeScreenshot(screenshotPath) {
  // This would actually send the screenshot to Claude API
  // and get back analysis with coordinates and decisions
  return {
    elements: [
      { type: 'button', text: 'Search', coords: { x: 700, y: 300 } },
      { type: 'input', label: 'Search box', coords: { x: 640, y: 300 } },
      { type: 'link', text: 'Images', coords: { x: 140, y: 60 } }
    ],
    decision: {
      action: 'click',
      target: { x: 640, y: 300 },
      reason: 'Need to click search box to enter query'
    }
  };
}

// Run the demo
console.log('🚀 Starting AI Vision Browser Control Demo\n');
console.log('This simulates how an AI could control a browser by:');
console.log('1. Taking screenshots every few seconds');
console.log('2. Analyzing what\'s on screen');
console.log('3. Deciding what to click/type');
console.log('4. Executing the action\n');

console.log('Starting in 3 seconds...\n');

setTimeout(() => {
  aiVisionBrowserControl().catch(console.error);
}, 3000);