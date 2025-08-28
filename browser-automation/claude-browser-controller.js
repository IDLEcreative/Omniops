const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

class ClaudeBrowserController {
  constructor() {
    this.browser = null;
    this.page = null;
    this.context = null;
    this.screenshotCount = 0;
    this.screenshotsDir = path.join(__dirname, 'claude-browser-screenshots');
  }

  async initialize() {
    // Create screenshots directory
    await fs.mkdir(this.screenshotsDir, { recursive: true });
    
    // Launch browser in visible mode
    this.browser = await chromium.launch({
      headless: false,
      slowMo: 300, // Slow enough to see actions
    });
    
    this.context = await this.browser.newContext({
      viewport: { width: 1280, height: 720 }
    });
    
    this.page = await this.context.newPage();
    
    console.log('✅ Browser initialized and ready for Claude control!');
    return this;
  }

  async takeScreenshot(name = null) {
    this.screenshotCount++;
    const filename = name || `screenshot-${Date.now()}.png`;
    const filepath = path.join(this.screenshotsDir, filename);
    await this.page.screenshot({ path: filepath });
    console.log(`📸 Screenshot saved: ${filename}`);
    return filepath;
  }

  async getCurrentState() {
    const screenshot = await this.takeScreenshot('current-state.png');
    const url = this.page.url();
    const title = await this.page.title();
    
    return {
      screenshot,
      url,
      title,
      timestamp: new Date().toISOString()
    };
  }

  // Navigation methods
  async goto(url) {
    console.log(`🌐 Navigating to: ${url}`);
    await this.page.goto(url);
    await this.page.waitForLoadState('domcontentloaded');
  }

  async click(x, y) {
    console.log(`🖱️ Clicking at (${x}, ${y})`);
    await this.page.mouse.click(x, y);
  }

  async type(text) {
    console.log(`⌨️ Typing: "${text}"`);
    await this.page.keyboard.type(text);
  }

  async press(key) {
    console.log(`⌨️ Pressing: ${key}`);
    await this.page.keyboard.press(key);
  }

  async scrollDown(pixels = 300) {
    console.log(`📜 Scrolling down ${pixels}px`);
    await this.page.evaluate((px) => window.scrollBy(0, px), pixels);
  }

  async waitFor(ms) {
    console.log(`⏳ Waiting ${ms}ms...`);
    await this.page.waitForTimeout(ms);
  }

  async findAndClick(text) {
    console.log(`🔍 Looking for and clicking: "${text}"`);
    await this.page.click(`text="${text}"`);
  }

  async getElementsInfo() {
    return await this.page.evaluate(() => {
      const elements = [];
      
      // Find clickable elements
      document.querySelectorAll('a, button, input, [role="button"]').forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          elements.push({
            type: el.tagName.toLowerCase(),
            text: el.textContent?.trim() || el.value || el.placeholder || '',
            x: Math.round(rect.x + rect.width / 2),
            y: Math.round(rect.y + rect.height / 2),
            width: rect.width,
            height: rect.height
          });
        }
      });
      
      return elements;
    });
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      console.log('👋 Browser closed');
    }
  }
}

// Export for use
module.exports = ClaudeBrowserController;

// If run directly, start an interactive session
if (require.main === module) {
  console.log('🤖 Claude Browser Controller - Interactive Mode');
  console.log('===========================================\n');
  console.log('This browser is now under Claude\'s control!');
  console.log('Claude can see screenshots and control the browser.');
  console.log('Screenshots are saved to:', path.join(__dirname, 'claude-browser-screenshots'));
  console.log('\nInitializing browser...\n');
  
  const controller = new ClaudeBrowserController();
  controller.initialize().then(async () => {
    console.log('\n✅ Browser is ready!');
    console.log('\nClaude can now:');
    console.log('- See what\'s on screen (screenshots)');
    console.log('- Click anywhere on the page');
    console.log('- Type text');
    console.log('- Navigate to URLs');
    console.log('- Analyze page elements\n');
    
    // Keep the process alive
    process.stdin.resume();
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n\nShutting down...');
      await controller.close();
      process.exit(0);
    });
  });
}