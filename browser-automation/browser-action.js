const { chromium } = require('playwright');

async function performAction(action, data = {}) {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // If there's already a BBC page open, use it
  const pages = await browser.contexts()[0].pages();
  const bbcPage = pages.find(p => p.url().includes('bbc.com'));
  
  if (bbcPage) {
    console.log('Found existing BBC page');
    
    // Take screenshot first
    await bbcPage.screenshot({ path: 'current-view.png' });
    
    switch(action) {
      case 'click':
        console.log(`Clicking at ${data.x}, ${data.y}`);
        await bbcPage.mouse.click(data.x, data.y);
        break;
        
      case 'type':
        console.log(`Typing: ${data.text}`);
        await bbcPage.keyboard.type(data.text);
        break;
        
      case 'enter':
        console.log('Pressing Enter');
        await bbcPage.keyboard.press('Enter');
        break;
        
      case 'scroll':
        console.log(`Scrolling down ${data.pixels || 300}px`);
        await bbcPage.evaluate((px) => window.scrollBy(0, px), data.pixels || 300);
        break;
    }
    
    // Wait and take another screenshot
    await bbcPage.waitForTimeout(1000);
    await bbcPage.screenshot({ path: 'after-action.png' });
    console.log('Action completed!');
  }
}

// Get action from command line
const [action, ...args] = process.argv.slice(2);

if (action === 'click') {
  performAction('click', { x: parseInt(args[0]), y: parseInt(args[1]) });
} else if (action === 'type') {
  performAction('type', { text: args.join(' ') });
} else if (action === 'enter') {
  performAction('enter');
} else if (action === 'scroll') {
  performAction('scroll', { pixels: parseInt(args[0]) || 300 });
}