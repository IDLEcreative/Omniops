import { chromium } from 'playwright';

async function debugWidget() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console messages
  const consoleMessages: string[] = [];
  page.on('console', (msg) => {
    const text = msg.text();
    consoleMessages.push(text);

    // Log important messages immediately
    if (text.includes('postMessage') ||
        text.includes('referrer') ||
        text.includes('origin') ||
        text.includes('useParentCommunication')) {
      console.log(`[CONSOLE] ${text}`);
    }
  });

  // Capture page errors
  page.on('pageerror', (error) => {
    console.log(`[PAGE ERROR] ${error.message}`);
  });

  console.log('📍 Navigating to test page...');
  await page.goto('http://localhost:3000/test-simple.html');

  console.log('⏳ Waiting for widget to initialize...');
  await page.waitForTimeout(3000);

  // Check iframe state
  console.log('\n📊 Checking iframe state...');
  const iframeInfo = await page.evaluate(() => {
    const iframe = document.getElementById('chat-widget-iframe');
    if (!iframe) return { found: false };

    return {
      found: true,
      display: iframe.style.display,
      pointerEvents: iframe.style.pointerEvents,
      width: iframe.style.width,
      height: iframe.style.height,
      dataReady: iframe.hasAttribute('data-ready'),
      position: iframe.style.position,
      bottom: iframe.style.bottom,
      right: iframe.style.right,
    };
  });

  console.log('\n[IFRAME STATE]');
  console.log(JSON.stringify(iframeInfo, null, 2));

  // Try to access iframe's document.referrer
  console.log('\n📍 Checking iframe internals...');
  try {
    const iframeReferrer = await page.evaluate(() => {
      const iframe = document.getElementById('chat-widget-iframe') as HTMLIFrameElement;
      if (!iframe || !iframe.contentWindow) return 'No iframe found';

      try {
        // This might fail due to cross-origin
        return iframe.contentDocument?.referrer || 'Cannot access (cross-origin?)';
      } catch (e) {
        return `Error: ${e instanceof Error ? e.message : String(e)}`;
      }
    });
    console.log(`Iframe document.referrer: ${iframeReferrer}`);
  } catch (e) {
    console.log(`Cannot access iframe internals: ${e instanceof Error ? e.message : String(e)}`);
  }

  // Check for postMessage errors in the log
  console.log('\n🔍 Searching console messages for postMessage errors...');
  const postMessageErrors = consoleMessages.filter(msg =>
    msg.includes('postMessage') && msg.includes('origin')
  );

  if (postMessageErrors.length > 0) {
    console.log(`❌ Found ${postMessageErrors.length} postMessage errors:`);
    postMessageErrors.slice(0, 5).forEach(msg => console.log(`   ${msg}`));
  } else {
    console.log('✅ No postMessage errors found');
  }

  // Check for useParentCommunication debug logs
  console.log('\n🔍 Searching for useParentCommunication debug logs...');
  const debugLogs = consoleMessages.filter(msg =>
    msg.includes('[useParentCommunication]')
  );

  if (debugLogs.length > 0) {
    console.log(`✅ Found ${debugLogs.length} debug logs:`);
    debugLogs.forEach(msg => console.log(`   ${msg}`));
  } else {
    console.log('❌ No useParentCommunication debug logs found (widget bundle may not be rebuilt)');
  }

  console.log('\n⏸️  Press Ctrl+C to close browser...');

  // Keep browser open for manual inspection
  await page.waitForTimeout(300000); // 5 minutes

  await browser.close();
}

debugWidget().catch(console.error);
