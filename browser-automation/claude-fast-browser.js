const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

class ClaudeFastBrowser {
  constructor() {
    this.browser = null;
    this.page = null;
    this.screenshotsDir = path.join(__dirname, 'claude-fast-screenshots');
  }

  async init() {
    await fs.mkdir(this.screenshotsDir, { recursive: true });
    
    this.browser = await chromium.launch({
      headless: false,
      // Remove slowMo for speed!
    });
    
    this.page = await this.browser.newPage({
      viewport: { width: 1280, height: 720 }
    });
    
    // Inject helper functions into every page
    await this.page.addInitScript(() => {
      window.claudeHelpers = {
        getClickableElements: () => {
          const elements = [];
          document.querySelectorAll('a, button, input, textarea, select, [role="button"], [onclick]').forEach((el, index) => {
            const rect = el.getBoundingClientRect();
            const isVisible = rect.width > 0 && rect.height > 0 && 
                            rect.top >= 0 && rect.left >= 0 &&
                            rect.bottom <= window.innerHeight && 
                            rect.right <= window.innerWidth;
            
            if (isVisible) {
              elements.push({
                index,
                tag: el.tagName.toLowerCase(),
                text: (el.textContent || '').trim().substring(0, 50),
                value: el.value || '',
                placeholder: el.placeholder || '',
                href: el.href || '',
                id: el.id || '',
                class: el.className || '',
                rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
                center: { x: rect.x + rect.width/2, y: rect.y + rect.height/2 }
              });
            }
          });
          return elements;
        },
        highlightElement: (index) => {
          const el = document.querySelectorAll('a, button, input, textarea, select, [role="button"], [onclick]')[index];
          if (el) {
            el.style.outline = '3px solid red';
            el.style.outlineOffset = '2px';
            setTimeout(() => {
              el.style.outline = '';
              el.style.outlineOffset = '';
            }, 1000);
          }
        }
      };
    });
    
    console.log('⚡ Fast browser ready!');
    return this;
  }

  // FAST: Get page structure without screenshot
  async scan() {
    const start = Date.now();
    
    const [elements, url, title] = await Promise.all([
      this.page.evaluate(() => window.claudeHelpers.getClickableElements()),
      this.page.url(),
      this.page.title()
    ]);
    
    console.log(`\n📊 Page scan (${Date.now() - start}ms):`);
    console.log(`URL: ${url}`);
    console.log(`Title: ${title}`);
    console.log(`Found ${elements.length} clickable elements\n`);
    
    // Show first 10 elements
    elements.slice(0, 10).forEach((el, i) => {
      const label = el.text || el.placeholder || el.value || el.href || `${el.tag}#${el.id}`;
      console.log(`[${i}] ${el.tag} - "${label}"`);
    });
    
    return elements;
  }

  // FAST: Take low-res screenshot
  async screenshot(quality = 50) {
    const filename = `fast-${Date.now()}.jpg`;
    await this.page.screenshot({ 
      path: path.join(this.screenshotsDir, filename),
      type: 'jpeg',
      quality, // Low quality for speed
      fullPage: false
    });
    console.log(`📸 Screenshot: ${filename} (quality: ${quality}%)`);
    return filename;
  }

  // FAST: Click by element index from scan
  async clickIndex(index) {
    await this.page.evaluate((idx) => {
      const elements = document.querySelectorAll('a, button, input, textarea, select, [role="button"], [onclick]');
      if (elements[idx]) {
        window.claudeHelpers.highlightElement(idx);
        elements[idx].click();
      }
    }, index);
    console.log(`✅ Clicked element [${index}]`);
  }

  // FAST: Type in currently focused element
  async type(text) {
    await this.page.keyboard.type(text, { delay: 0 }); // No delay!
    console.log(`⌨️ Typed: "${text}"`);
  }

  // FAST: Press key
  async key(key) {
    await this.page.keyboard.press(key);
    console.log(`⌨️ Key: ${key}`);
  }

  // FAST: Navigate
  async go(url) {
    console.log(`🌐 Go to: ${url}`);
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
  }

  // FAST: Find and click by text
  async click(text) {
    try {
      // Try multiple strategies in parallel
      await Promise.race([
        this.page.click(`text="${text}"`, { timeout: 2000 }),
        this.page.click(`*:has-text("${text}")`, { timeout: 2000 }),
        this.page.click(`[aria-label*="${text}" i]`, { timeout: 2000 })
      ]);
      console.log(`✅ Clicked: "${text}"`);
    } catch {
      console.log(`❌ Couldn't find: "${text}"`);
    }
  }

  // FAST: Fill input by placeholder or label
  async fill(label, value) {
    try {
      await Promise.race([
        this.page.fill(`input[placeholder*="${label}" i]`, value, { timeout: 1000 }),
        this.page.fill(`input[aria-label*="${label}" i]`, value, { timeout: 1000 }),
        this.page.fill(`input:near(:text("${label}"))`, value, { timeout: 1000 })
      ]);
      console.log(`✅ Filled: "${label}" = "${value}"`);
    } catch {
      console.log(`❌ Couldn't find input: "${label}"`);
    }
  }

  // FAST: Wait for navigation
  async wait() {
    await this.page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  }

  // ULTRA FAST: Execute a series of commands
  async execute(commands) {
    console.log('\n⚡ Executing batch commands...');
    for (const cmd of commands) {
      const [action, ...args] = cmd.split(':');
      
      switch(action) {
        case 'go': await this.go(args.join(':')); break;
        case 'click': await this.click(args.join(':')); break;
        case 'type': await this.type(args.join(':')); break;
        case 'fill': 
          const [label, ...val] = args.join(':').split('=');
          await this.fill(label, val.join('='));
          break;
        case 'key': await this.key(args[0]); break;
        case 'wait': await this.wait(); break;
        case 'scan': await this.scan(); break;
        case 'shot': await this.screenshot(); break;
      }
    }
  }

  async close() {
    if (this.browser) await this.browser.close();
  }
}

// Test it
async function demo() {
  const browser = new ClaudeFastBrowser();
  await browser.init();
  
  // Example: Search on DuckDuckGo FAST
  console.log('\n🚀 FAST Browser Demo\n');
  
  await browser.go('https://duckduckgo.com');
  await browser.scan(); // See what's clickable
  await browser.screenshot(30); // Low quality screenshot
  
  // Fast search
  await browser.fill('Search', 'AI automation');
  await browser.key('Enter');
  await browser.wait();
  
  await browser.scan(); // See results
  await browser.screenshot(30);
  
  console.log('\n✅ Fast browser demo complete!');
  console.log('This browser is ready for rapid Claude control!');
  
  // Keep alive
  return browser;
}

// Export
module.exports = ClaudeFastBrowser;

// Run if called directly
if (require.main === module) {
  demo().catch(console.error);
}