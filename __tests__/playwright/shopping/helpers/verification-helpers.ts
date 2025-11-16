import { Page, FrameLocator, expect } from '@playwright/test';

/**
 * Verification Helper Functions for Mobile Shopping Tests
 * Handles validation, analytics tracking, and accessibility checks
 */

/**
 * Verify product details expanded
 */
export async function verifyProductDetailsExpanded(iframe: FrameLocator): Promise<boolean> {
  console.log('📍 Verifying product details expanded...');

  try {
    const detailsPanel = iframe.locator(
      '[data-testid="product-details"], .product-details-expanded'
    );
    await detailsPanel.waitFor({ state: 'visible', timeout: 3000 });
    console.log('✅ Product details expanded');
    return true;
  } catch {
    console.log('⚠️ Product details not expanded');
    return false;
  }
}

/**
 * Verify cart indicator appeared
 */
export async function verifyCartIndicator(
  iframe: FrameLocator,
  expectedCount?: number
): Promise<boolean> {
  console.log('📍 Verifying cart indicator...');

  try {
    const cartBadge = iframe.locator(
      '[data-testid="cart-badge"], .cart-indicator, .cart-count'
    );
    await cartBadge.waitFor({ state: 'visible', timeout: 3000 });

    if (expectedCount !== undefined) {
      const count = await cartBadge.textContent();
      const actualCount = parseInt(count || '0', 10);
      expect(actualCount).toBe(expectedCount);
      console.log(`✅ Cart indicator shows ${actualCount} item(s)`);
    } else {
      console.log('✅ Cart indicator visible');
    }

    return true;
  } catch {
    console.log('⚠️ Cart indicator not found');
    return false;
  }
}

/**
 * Verify smooth animation (60fps check)
 * Measures frame rate during transition
 */
export async function verifyAnimationPerformance(page: Page): Promise<boolean> {
  console.log('📍 Measuring animation performance...');

  // Start performance measurement
  const metrics = await page.evaluate(() => {
    return new Promise((resolve) => {
      let frames = 0;
      const startTime = performance.now();
      const duration = 1000; // Measure for 1 second

      function measureFPS() {
        frames++;
        const elapsed = performance.now() - startTime;

        if (elapsed < duration) {
          requestAnimationFrame(measureFPS);
        } else {
          const fps = (frames / elapsed) * 1000;
          resolve({ fps, frames, elapsed });
        }
      }

      requestAnimationFrame(measureFPS);
    });
  });

  const fps = (metrics as { fps: number; frames: number; elapsed: number }).fps;
  console.log(`📊 Animation FPS: ${fps.toFixed(1)}`);

  // Target: 60fps, allow some variance (55+)
  const isSmooth = fps >= 55;
  if (isSmooth) {
    console.log('✅ Animation performance acceptable (≥55fps)');
  } else {
    console.log(`⚠️ Animation performance below target: ${fps.toFixed(1)}fps`);
  }

  return isSmooth;
}

/**
 * Verify touch target size meets accessibility standards
 * iOS minimum: 44x44 pixels
 */
export async function verifyTouchTargetSize(
  iframe: FrameLocator,
  selector: string,
  minSize: number = 44
): Promise<boolean> {
  console.log(`📍 Verifying touch target size for: ${selector}...`);

  const element = iframe.locator(selector).first();
  const box = await element.boundingBox();

  if (!box) {
    console.log('⚠️ Element not found or not visible');
    return false;
  }

  const meetsStandard = box.width >= minSize && box.height >= minSize;

  if (meetsStandard) {
    console.log(`✅ Touch target size OK: ${box.width}x${box.height}px (min: ${minSize}px)`);
  } else {
    console.log(
      `⚠️ Touch target too small: ${box.width}x${box.height}px (min: ${minSize}px)`
    );
  }

  return meetsStandard;
}

/**
 * Verify shopping feed to chat transition
 */
export async function verifyTransitionToChat(iframe: FrameLocator): Promise<boolean> {
  console.log('📍 Verifying transition back to chat...');

  try {
    const chatInput = iframe.locator('input[type="text"], textarea').first();
    await chatInput.waitFor({ state: 'visible', timeout: 3000 });
    console.log('✅ Transitioned back to chat mode');
    return true;
  } catch {
    console.log('⚠️ Did not transition to chat mode');
    return false;
  }
}

/**
 * Track analytics event
 */
export async function captureAnalyticsEvent(
  page: Page,
  eventName: string
): Promise<boolean> {
  console.log(`📊 Listening for analytics event: ${eventName}...`);

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      console.log(`⚠️ Analytics event not captured: ${eventName}`);
      resolve(false);
    }, 5000);

    // Listen for postMessage analytics events
    page.on('console', (msg) => {
      if (msg.text().includes(eventName)) {
        clearTimeout(timeout);
        console.log(`✅ Analytics event captured: ${eventName}`);
        resolve(true);
      }
    });

    // Also check for network requests
    page.on('request', (request) => {
      if (request.url().includes('analytics') && request.postData()?.includes(eventName)) {
        clearTimeout(timeout);
        console.log(`✅ Analytics event tracked: ${eventName}`);
        resolve(true);
      }
    });
  });
}
