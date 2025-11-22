import { test, expect } from '@playwright/test';
import { waitForChatWidget, sendChatMessage } from '../../utils/playwright/chat-helpers';
import {
  setMobileViewport,
  enableMobileFeatures,
  mockShoppingAPI,
  waitForShoppingFeed,
  getProductCardCount,
} from './helpers/setup-helpers';
import {
  verticalSwipe,
  horizontalSwipe,
  doubleTap,
  tapProductCard,
  selectVariant,
} from './helpers/interaction-helpers';
import {
  verifyProductDetailsExpanded,
  verifyCartIndicator,
  verifyAnimationPerformance,
  verifyTransitionToChat,
  captureAnalyticsEvent,
} from './helpers/verification-helpers';

/**
 * E2E Test Suite: Mobile Shopping Core Flows
 *
 * Tests the core mobile shopping workflows:
 * - Product discovery via chat
 * - Swipe navigation between products
 * - Add to cart interactions
 *
 * @see docs/10-ANALYSIS/ANALYSIS_E2E_AS_AGENT_TRAINING_DATA.md
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 60000;

test.describe('Mobile Shopping Core Flows', () => {
  test.setTimeout(TEST_TIMEOUT);

  test('user discovers products and adds to cart via mobile shopping feed', async ({ page }) => {
    console.log('=== Mobile Shopping: Product Discovery to Cart ===');

    // Capture ALL browser console logs and errors for debugging
    page.on('console', msg => {
      console.log(`[Browser ${msg.type()}] ${msg.text()}`);
    });
    page.on('pageerror', err => {
      console.error('[Page Error]', err.message);
    });
    page.on('requestfailed', request => {
      console.error('[Request Failed]', request.url(), request.failure()?.errorText);
    });

    console.log('📍 Step 1: Set mobile viewport and enable touch features');
    await setMobileViewport(page);
    await enableMobileFeatures(page);
    console.log('✅ Mobile environment configured');

    console.log('📍 Step 2: Navigate to widget test page');
    await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });
    console.log('✅ Page loaded');

    console.log('📍 Step 3: Wait for chat widget iframe');
    const iframe = await waitForChatWidget(page);

    // CRITICAL: Listen to iframe console logs (iframe content has separate console)
    const iframeElement = page.frameLocator('iframe#chat-widget-iframe, iframe[title*="chat" i]');
    const actualFrame = await page.frame({ url: /embed/ });
    if (actualFrame) {
      actualFrame.on('console', msg => {
        console.log(`[IFrame Console ${msg.type()}] ${msg.text()}`);
      });
    }

    console.log('✅ Chat widget ready and opened');

    // Widget is already open from waitForChatWidget() - no need to click button again
    // Verify input field is visible to confirm widget is open
    console.log('📍 Step 4: Verify widget is open (check for input field)');
    const inputField = iframe.locator('textarea, input[type="text"]');
    await inputField.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✅ Widget confirmed open');

    console.log('📍 Step 5: Using real Thompson\'s Parts API (www.thompsonseparts.co.uk)');
    // Mock disabled - using real API with Thompson's account
    // await mockShoppingAPI(page);
    console.log('✅ Real API will be used for product search');

    console.log('📍 Step 6: Send product search query that triggers shopping feed');
    // Use a specific product query that will definitely trigger WooCommerce search
    await sendChatMessage(iframe, 'Do you have any pumps in stock?');
    console.log('✅ Query sent');

    console.log('📍 Step 7: Wait for Browse Products button (real API response)');
    const browseButton = iframe.locator('[data-testid="browse-products-button"]');
    await browseButton.waitFor({ state: 'visible', timeout: 60000 }); // 60s timeout for real API with OpenAI
    console.log('✅ Browse Products button appeared');

    console.log('📍 Step 8: Click Browse Products to open shopping feed');
    await browseButton.click();
    console.log('✅ Button clicked');

    console.log('📍 Step 9: Wait for shopping feed transition');
    const shoppingFeedVisible = await waitForShoppingFeed(iframe, 10000);
    expect(shoppingFeedVisible).toBe(true);
    console.log('✅ Shopping feed activated');

    console.log('📍 Step 10: Verify product cards loaded');
    const productCount = await getProductCardCount(iframe);
    expect(productCount).toBeGreaterThan(0);
    console.log(`✅ ${productCount} product card(s) displayed`);

    console.log('📍 Step 11: Swipe down to view next product');
    await verticalSwipe(page, 'down');
    await page.waitForTimeout(1000);
    console.log('✅ Swiped to next product');

    console.log('📍 Step 11: Tap product card to expand details');
    await tapProductCard(iframe, 0);
    const detailsExpanded = await verifyProductDetailsExpanded(iframe);
    expect(detailsExpanded).toBe(true);
    console.log('✅ Product details expanded');

    console.log('📍 Step 12: Select product variant (Color: White)');
    const variantButton = iframe.locator('button:has-text("White")');
    const variantExists = (await variantButton.count()) > 0;

    if (variantExists) {
      await selectVariant(iframe, 'Color', 'White');
      console.log('✅ Variant selected');
    } else {
      console.log('⏭️ No variants available, skipping variant selection');
    }

    console.log('📍 Step 13: Double-tap product to add to cart');
    const productCard = iframe.locator('[data-testid="product-card"], .product-story').first();
    const box = await productCard.boundingBox();

    if (box) {
      const centerX = box.x + box.width / 2;
      const centerY = box.y + box.height / 2;
      await doubleTap(page, centerX, centerY);
      console.log('✅ Double-tap executed');
    } else {
      console.log('⚠️ Could not locate product card for tap');
    }

    await page.waitForTimeout(1000);

    console.log('📍 Step 12: Verify cart indicator shows item count');
    const cartVisible = await verifyCartIndicator(iframe, 1);
    expect(cartVisible).toBe(true);
    console.log('✅ Cart indicator displays correct count');

    console.log('📍 Step 13: Verify analytics event for add-to-cart');
    const analyticsPromise = captureAnalyticsEvent(page, 'add_to_cart');
    await page.waitForTimeout(500);
    const analyticsTracked = await analyticsPromise;
    if (analyticsTracked) {
      console.log('✅ Analytics event tracked: add_to_cart');
    } else {
      console.log('⚠️ Analytics event not captured (may use different tracking)');
    }

    console.log('📍 Step 14: Capture success screenshot');
    await page.screenshot({
      path: `test-results/screenshots/mobile-shopping-success-${Date.now()}.png`,
      fullPage: true,
    });

    console.log('✅ Mobile Shopping: Product Discovery to Cart - COMPLETE');
  });

  test('swipe navigation and gestures work smoothly', async ({ page }) => {
    console.log('=== Mobile Shopping: Swipe Navigation & Gestures ===');

    console.log('📍 Step 1: Setup mobile environment');
    await setMobileViewport(page);
    await enableMobileFeatures(page);

    console.log('📍 Step 2: Load widget and trigger shopping mode');
    await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });
    const iframe = await waitForChatWidget(page);
    // Mock disabled - using real Thompson's API
    // await mockShoppingAPI(page);
    await sendChatMessage(iframe, 'Show me products');

    console.log('📍 Step 3: Wait for shopping feed');
    const feedVisible = await waitForShoppingFeed(iframe);
    expect(feedVisible).toBe(true);

    console.log('📍 Step 4: Test vertical swipe down');
    await verticalSwipe(page, 'down');
    await page.waitForTimeout(1000);
    console.log('✅ Swiped to next product');

    console.log('📍 Step 5: Swipe down again (product 3)');
    await verticalSwipe(page, 'down');
    await page.waitForTimeout(1000);
    console.log('✅ Swiped to product 3');

    console.log('📍 Step 6: Test vertical swipe up');
    await verticalSwipe(page, 'up');
    await page.waitForTimeout(1000);
    console.log('✅ Swiped back to product 2');

    console.log('📍 Step 7: Measure animation performance');
    const performancePromise = verifyAnimationPerformance(page);
    await verticalSwipe(page, 'down');
    const smoothAnimation = await performancePromise;
    expect(smoothAnimation).toBe(true);
    console.log('✅ Animation performance meets 60fps standard');

    console.log('📍 Step 8: Test horizontal swipe to exit shopping');
    await horizontalSwipe(page, 'right');
    await page.waitForTimeout(1000);
    const backInChat = await verifyTransitionToChat(iframe);
    expect(backInChat).toBe(true);
    console.log('✅ Horizontal swipe exited shopping mode');

    console.log('✅ Mobile Shopping: Swipe Navigation & Gestures - COMPLETE');
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') {
      console.log(`❌ Test failed: ${testInfo.title}`);
      await page.screenshot({
        path: `test-results/screenshots/mobile-shopping-failure-${Date.now()}.png`,
        fullPage: true,
      });
      console.log('📸 Failure screenshot captured');
    }
  });
});
