const ClaudeBrowserController = require('./claude-browser-controller');

async function main() {
  const browser = new ClaudeBrowserController();
  await browser.initialize();
  
  // Navigate to a starting page
  await browser.goto('https://www.example.com');
  
  // Take initial screenshot
  await browser.takeScreenshot('initial.png');
  
  // Get current state
  const state = await browser.getCurrentState();
  console.log('\nCurrent browser state:', state);
  
  // Get clickable elements
  const elements = await browser.getElementsInfo();
  console.log('\nClickable elements found:', elements.length);
  
  // Example: Click on "More information" link if found
  const moreInfoLink = elements.find(el => el.text.includes('More information'));
  if (moreInfoLink) {
    console.log('\nFound "More information" link at:', moreInfoLink);
    await browser.click(moreInfoLink.x, moreInfoLink.y);
    await browser.waitFor(2000);
    await browser.takeScreenshot('after-click.png');
  }
  
  // Keep browser open
  console.log('\nBrowser is ready for Claude\'s commands!');
}

main().catch(console.error);