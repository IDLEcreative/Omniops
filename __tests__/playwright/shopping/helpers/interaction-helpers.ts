import { Page, FrameLocator, expect } from '@playwright/test';

/**
 * Interaction Helper Functions for Mobile Shopping Tests
 * Handles gestures, taps, swipes, and product interactions
 */

/**
 * Perform vertical swipe gesture (up/down)
 */
export async function verticalSwipe(
  page: Page,
  direction: 'up' | 'down'
): Promise<void> {
  console.log(`📍 Performing vertical swipe (${direction})...`);

  const startY = direction === 'up' ? 600 : 200;
  const endY = direction === 'up' ? 200 : 600;

  // Simulate swipe with touchscreen drag
  await page.mouse.move(200, startY);
  await page.mouse.down();
  await page.mouse.move(200, endY);
  await page.mouse.up();
  await page.waitForTimeout(500); // Wait for animation

  console.log(`✅ Swipe ${direction} completed`);
}

/**
 * Perform horizontal swipe gesture (left/right)
 */
export async function horizontalSwipe(
  page: Page,
  direction: 'left' | 'right'
): Promise<void> {
  console.log(`📍 Performing horizontal swipe (${direction})...`);

  const startX = direction === 'left' ? 300 : 50;
  const endX = direction === 'left' ? 50 : 300;

  // Simulate swipe with mouse drag
  await page.mouse.move(startX, 400);
  await page.mouse.down();
  await page.mouse.move(endX, 400);
  await page.mouse.up();
  await page.waitForTimeout(500); // Wait for animation

  console.log(`✅ Swipe ${direction} completed`);
}

/**
 * Perform double-tap gesture at specific coordinates
 */
export async function doubleTap(
  page: Page,
  x: number = 200,
  y: number = 400
): Promise<void> {
  console.log(`📍 Performing double-tap at (${x}, ${y})...`);

  // Use mouse click for double-tap simulation
  await page.mouse.click(x, y);
  await page.waitForTimeout(100);
  await page.mouse.click(x, y);

  console.log('✅ Double-tap completed');
}

/**
 * Tap on product card to expand details
 */
export async function tapProductCard(
  iframe: FrameLocator,
  index: number = 0
): Promise<void> {
  console.log(`📍 Tapping product card #${index}...`);

  const productCard = iframe
    .locator('[data-testid="product-card"], .product-story')
    .nth(index);
  await productCard.click();

  console.log('✅ Product card tapped');
}

/**
 * Select product variant (e.g., color, size)
 */
export async function selectVariant(
  iframe: FrameLocator,
  variantName: string,
  option: string
): Promise<void> {
  console.log(`📍 Selecting variant: ${variantName} = ${option}...`);

  const variantButton = iframe.locator(
    `button:has-text("${option}"), [data-variant="${variantName}"][data-option="${option}"]`
  );
  await variantButton.click();

  console.log(`✅ Variant selected: ${option}`);
}

/**
 * Scroll image gallery horizontally
 */
export async function scrollImageGallery(
  iframe: FrameLocator,
  direction: 'next' | 'prev',
  page: Page
): Promise<void> {
  console.log(`📍 Scrolling image gallery: ${direction}...`);

  const gallery = iframe.locator('[data-testid="image-gallery"], .product-images');
  const currentScroll = await gallery.evaluate((el) => el.scrollLeft);

  if (direction === 'next') {
    await gallery.evaluate((el) => {
      el.scrollBy({ left: 300, behavior: 'smooth' });
    });
  } else {
    await gallery.evaluate((el) => {
      el.scrollBy({ left: -300, behavior: 'smooth' });
    });
  }

  await page.waitForTimeout(300); // Wait for scroll animation

  const newScroll = await gallery.evaluate((el) => el.scrollLeft);
  const scrolled = newScroll !== currentScroll;

  if (scrolled) {
    console.log(`✅ Gallery scrolled ${direction}`);
  } else {
    console.log(`⚠️ Gallery did not scroll ${direction}`);
  }
}

/**
 * Tap outside element to close expanded view
 */
export async function tapOutside(iframe: FrameLocator, x: number = 50, y: number = 50): Promise<void> {
  console.log(`📍 Tapping outside at (${x}, ${y}) to close...`);

  // Find the backdrop or tap at coordinates
  const backdrop = iframe.locator('[data-testid="backdrop"], .backdrop');
  const backdropExists = await backdrop.count();

  if (backdropExists > 0) {
    await backdrop.click();
  } else {
    // Tap at coordinates
    await iframe.locator('body').click({ position: { x, y } });
  }

  console.log('✅ Tapped outside');
}
