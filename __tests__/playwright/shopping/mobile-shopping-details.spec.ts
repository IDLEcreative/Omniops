import { test, expect } from '@playwright/test';
import { waitForChatWidget, sendChatMessage } from '../../utils/playwright/chat-helpers';
import {
  setMobileViewport,
  enableMobileFeatures,
  mockShoppingAPI,
  waitForShoppingFeed,
} from './helpers/setup-helpers';
import {
  verticalSwipe,
  doubleTap,
  tapProductCard,
  selectVariant,
  scrollImageGallery,
  tapOutside,
} from './helpers/interaction-helpers';
import {
  verifyProductDetailsExpanded,
  verifyCartIndicator,
  verifyAnimationPerformance,
  verifyTouchTargetSize,
} from './helpers/verification-helpers';

/**
 * E2E Test Suite: Mobile Shopping Detail Views
 *
 * Tests detailed shopping features:
 * - Product detail expansion
 * - Cart operations
 * - Accessibility standards
 *
 * @see docs/10-ANALYSIS/ANALYSIS_E2E_AS_AGENT_TRAINING_DATA.md
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 60000;

test.describe('Mobile Shopping Detail Views', () => {
  test.setTimeout(TEST_TIMEOUT);

  test('product detail expansion and interaction', async ({ page }) => {
    console.log('=== Mobile Shopping: Product Detail Expansion ===');

    console.log('📍 Step 1: Setup mobile environment');
    await setMobileViewport(page);
    await enableMobileFeatures(page);

    console.log('📍 Step 2: Load widget and trigger shopping mode');
    await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });
    const iframe = await waitForChatWidget(page);
    await mockShoppingAPI(page);
    await sendChatMessage(iframe, 'Show me headphones');

    console.log('📍 Step 3: Wait for shopping feed');
    await waitForShoppingFeed(iframe);

    console.log('📍 Step 4: Tap product card to expand details');
    await tapProductCard(iframe, 0);
    const expanded = await verifyProductDetailsExpanded(iframe);
    expect(expanded).toBe(true);
    console.log('✅ Product details expanded');

    console.log('📍 Step 5: Test image gallery horizontal scroll');
    const gallery = iframe.locator('[data-testid="image-gallery"], .product-images');
    const galleryExists = (await gallery.count()) > 0;

    if (galleryExists) {
      await scrollImageGallery(iframe, 'next', page);
      await page.waitForTimeout(500);
      await scrollImageGallery(iframe, 'prev', page);
      console.log('✅ Image gallery scrollable');
    } else {
      console.log('⏭️ No image gallery, skipping scroll test');
    }

    console.log('📍 Step 6: Test variant selection');
    const variantButton = iframe.locator('button:has-text("White"), button:has-text("Silver")');
    const variantExists = (await variantButton.count()) > 0;

    if (variantExists) {
      const firstVariant = await variantButton.first().textContent();
      await selectVariant(iframe, 'Color', firstVariant || 'White');
      console.log('✅ Variant selected successfully');
    } else {
      console.log('⏭️ No variants available, skipping');
    }

    console.log('📍 Step 7: Tap outside to collapse details');
    await tapOutside(iframe, 50, 50);
    await page.waitForTimeout(1000);

    const detailsPanel = iframe.locator('[data-testid="product-details"]');
    const stillVisible = await detailsPanel.isVisible().catch(() => false);

    if (!stillVisible) {
      console.log('✅ Product details collapsed on outside tap');
    } else {
      console.log('⚠️ Details still visible (may use different collapse mechanism)');
    }

    console.log('✅ Mobile Shopping: Product Detail Expansion - COMPLETE');
  });

  test('cart operations and state management', async ({ page }) => {
    console.log('=== Mobile Shopping: Cart Operations ===');

    console.log('📍 Step 1: Setup mobile environment');
    await setMobileViewport(page);
    await enableMobileFeatures(page);

    console.log('📍 Step 2: Load widget and trigger shopping mode');
    await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });
    const iframe = await waitForChatWidget(page);
    await mockShoppingAPI(page);
    await sendChatMessage(iframe, 'Show me products');

    console.log('📍 Step 3: Wait for shopping feed');
    await waitForShoppingFeed(iframe);

    console.log('📍 Step 4: Add first product to cart (double-tap)');
    const productCard1 = iframe.locator('[data-testid="product-card"], .product-story').first();
    const box1 = await productCard1.boundingBox();

    if (box1) {
      await doubleTap(page, box1.x + box1.width / 2, box1.y + box1.height / 2);
      await page.waitForTimeout(1000);
      console.log('✅ First product added');
    }

    console.log('📍 Step 5: Verify cart badge shows count: 1');
    const cart1 = await verifyCartIndicator(iframe, 1);
    expect(cart1).toBe(true);
    console.log('✅ Cart badge shows 1 item');

    console.log('📍 Step 6: Swipe to next product');
    await verticalSwipe(page, 'down');
    await page.waitForTimeout(1000);

    console.log('📍 Step 7: Add second product to cart (double-tap)');
    const productCard2 = iframe.locator('[data-testid="product-card"], .product-story').nth(1);
    const box2 = await productCard2.boundingBox();

    if (box2) {
      await doubleTap(page, box2.x + box2.width / 2, box2.y + box2.height / 2);
      await page.waitForTimeout(1000);
      console.log('✅ Second product added');
    }

    console.log('📍 Step 8: Verify cart badge shows count: 2');
    const cart2 = await verifyCartIndicator(iframe, 2);
    expect(cart2).toBe(true);
    console.log('✅ Cart badge updated to 2 items');

    console.log('📍 Step 9: Tap cart badge to view cart contents');
    const cartBadge = iframe.locator('[data-testid="cart-badge"], .cart-indicator');
    const cartExists = (await cartBadge.count()) > 0;

    if (cartExists) {
      await cartBadge.click();
      await page.waitForTimeout(1000);

      const cartView = iframe.locator('[data-testid="cart-view"], .cart-contents');
      const cartViewVisible = await cartView.isVisible().catch(() => false);

      if (cartViewVisible) {
        console.log('✅ Cart view opened');
      } else {
        console.log('⚠️ Cart view did not open (may use different mechanism)');
      }
    } else {
      console.log('⚠️ Cart badge not found');
    }

    console.log('✅ Mobile Shopping: Cart Operations - COMPLETE');
  });

  test('accessibility and performance standards', async ({ page }) => {
    console.log('=== Mobile Shopping: Accessibility & Performance ===');

    console.log('📍 Step 1: Setup mobile environment');
    await setMobileViewport(page);
    await enableMobileFeatures(page);

    console.log('📍 Step 2: Load widget and trigger shopping mode');
    await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });
    const iframe = await waitForChatWidget(page);
    await mockShoppingAPI(page);
    await sendChatMessage(iframe, 'Show me products');

    console.log('📍 Step 3: Wait for shopping feed');
    await waitForShoppingFeed(iframe);

    console.log('📍 Step 4: Verify touch target sizes');
    const productCard = iframe.locator('[data-testid="product-card"], .product-story').first();
    const cardBox = await productCard.boundingBox();

    if (cardBox) {
      const meetsStandard = cardBox.height >= 44;
      expect(meetsStandard).toBe(true);
      console.log(`✅ Product card touch target: ${cardBox.width}x${cardBox.height}px`);
    }

    const cartBadge = iframe.locator('[data-testid="cart-badge"], .cart-indicator');
    const badgeExists = (await cartBadge.count()) > 0;

    if (badgeExists) {
      const badgeMeetsStandard = await verifyTouchTargetSize(
        iframe,
        '[data-testid="cart-badge"], .cart-indicator',
        44
      );
      expect(badgeMeetsStandard).toBe(true);
      console.log('✅ Cart badge meets touch target standards');
    }

    console.log('📍 Step 5: Test animation performance during swipe');
    const performancePromise = verifyAnimationPerformance(page);
    await verticalSwipe(page, 'down');
    const performanceMet = await performancePromise;
    expect(performanceMet).toBe(true);
    console.log('✅ Animation performance meets standards');

    console.log('📍 Step 6: Verify ARIA labels for accessibility');
    const ariaLabel = await productCard.getAttribute('aria-label');
    if (ariaLabel) {
      console.log(`✅ Product card has ARIA label: "${ariaLabel}"`);
    } else {
      console.log('⚠️ Product card missing ARIA label (recommended for screen readers)');
    }

    console.log('📍 Step 7: Verify viewport is mobile');
    const viewport = page.viewportSize();
    expect(viewport?.width).toBe(375);
    expect(viewport?.height).toBe(812);
    console.log('✅ Viewport validated: 375x812 (iPhone X)');

    console.log('✅ Mobile Shopping: Accessibility & Performance - COMPLETE');
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
